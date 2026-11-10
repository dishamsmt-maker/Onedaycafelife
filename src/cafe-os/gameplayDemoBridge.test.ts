import { describe, expect, it } from 'vitest';
import { startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';
import { applyGameplayDemoInteraction, gameplayDemoSnapshot } from './gameplayDemoBridge';

describe('gameplay demo interaction bridge', () => {
  it('projects one customer order to staff and manager without duplicate retries', () => {
    let day = startDemoDay(createDemoStock());
    const order = { mode: 'customer' as const, type: 'order' as const,
      requestId: 'v2-t3-1', tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1 };
    day = applyGameplayDemoInteraction(day, DEMO_HALAL_MENU, order);
    expect(day.store.orders).toHaveLength(1);
    expect(gameplayDemoSnapshot(day).staff.tasks).toHaveLength(1);
    expect(gameplayDemoSnapshot(day).manager.tables.find(t => t.tableId === 'T3')?.orders).toHaveLength(1);
    const same = applyGameplayDemoInteraction(day, DEMO_HALAL_MENU, order);
    expect(same).toBe(day);
    expect(gameplayDemoSnapshot(same).eventSequence).toBe(1);
  });

  it('rejects forged and stale staff actions without changing the shared state', () => {
    let day = startDemoDay(createDemoStock());
    day = applyGameplayDemoInteraction(day, DEMO_HALAL_MENU, {
      mode: 'customer', type: 'order', requestId: 'v2-t3-2', tableId: 'T3',
      itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    });
    const task = gameplayDemoSnapshot(day).staff.tasks[0];
    expect(task.assignee).toBe('Na');
    const forged = applyGameplayDemoInteraction(day, DEMO_HALAL_MENU, {
      mode: 'staff', type: 'task', orderId: task.orderId, assignee: 'Ken', action: 'serve',
    });
    expect(forged).toBe(day);
    const cancelled = applyGameplayDemoInteraction(day, DEMO_HALAL_MENU, {
      mode: 'manager', type: 'cancel', orderId: task.orderId,
    });
    expect(gameplayDemoSnapshot(cancelled).staff.tasks).toHaveLength(0);
    expect(applyGameplayDemoInteraction(cancelled, DEMO_HALAL_MENU, {
      mode: 'staff', type: 'task', orderId: task.orderId, assignee: 'Na', action: 'prepare',
      costs: {},
    })).toBe(cancelled);
  });
});
