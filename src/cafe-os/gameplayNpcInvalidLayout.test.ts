import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { createLayoutBoundNpcArrivalController } from './gameplayNpcLayoutArrival';

describe('NPC layout arrival rejects invalid geometry', () => {
  it('does not complete preparation at a non-finite or zero-radius kitchen', () => {
    const session = createGameplayDemoSession();
    expect(session.dispatch({ mode: 'customer', type: 'order', requestId: 'invalid-kitchen',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1 })).toBe(true);
    const orderId = session.getDay().store.orders[0].id;
    const task = session.getSnapshot().staff.tasks.find(t => t.orderId === orderId && t.action === 'prepare');
    expect(task).toBeDefined();
    if (!task) throw new Error('Missing preparation task');
    const layout = {
      kitchen: { station: 'kitchen', position: { x: Number.NaN, z: 1 }, radius: 0 },
      serviceCounter: { station: 'service-counter', position: { x: 2, z: 1 }, radius: 0.5 },
      tables: { t3: { station: 'customer-table', position: { x: 9, z: 9 }, radius: 0.5 } },
    } as const;
    const npc = createLayoutBoundNpcArrivalController(session, layout);
    const before = session.getDay();
    expect(npc.arrive(task.assignee, orderId, 'prepare', { x: 1, z: 1 })).toBe(false);
    expect(session.getDay()).toBe(before);
    expect(session.getSnapshot().staff.tasks.some(t => t.orderId === orderId && t.action === 'prepare')).toBe(true);
  });

  it('rejects an absent table target without changing the session', () => {
    const session = createGameplayDemoSession();
    expect(session.dispatch({ mode: 'customer', type: 'order', requestId: 'missing-table',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1 })).toBe(true);
    const orderId = session.getDay().store.orders[0].id;
    const npc = createLayoutBoundNpcArrivalController(session, {
      kitchen: { station: 'kitchen', position: { x: 1, z: 1 }, radius: 0.5 },
      serviceCounter: { station: 'service-counter', position: { x: 2, z: 1 }, radius: 0.5 },
      tables: {},
    });
    const before = session.getDay();
    expect(npc.arrive('Ken', orderId, 'serve', { x: 9, z: 9 })).toBe(false);
    expect(session.getDay()).toBe(before);
  });
});
