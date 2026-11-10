import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { createGameplayNpcArrivalController } from './gameplayNpcArrivalController';

describe('NPC coordinate-gated service cycle', () => {
  it('keeps T3 unchanged until each assigned NPC reaches the correct physical station', () => {
    const session = createGameplayDemoSession();
    const npc = createGameplayNpcArrivalController(session);
    const targets = {
      prepare: { station: 'kitchen', position: { x: 2, z: 3 }, radius: 0.5 },
      ready: { station: 'service-counter', position: { x: 4, z: 3 }, radius: 0.5 },
      serve: { station: 'customer-table', position: { x: 8, z: 6 }, radius: 0.5 },
    } as const;
    let notifications = 0;
    const unsubscribe = session.subscribe(() => { notifications += 1; });

    expect(session.dispatch({
      mode: 'customer', type: 'order', requestId: 'physical-cycle-t3',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    })).toBe(true);
    const orderId = session.getDay().store.orders[0].id;
    for (const action of ['prepare', 'ready', 'serve'] as const) {
      const task = session.getSnapshot().staff.tasks.find(t => t.orderId === orderId && t.action === action);
      expect(task).toBeDefined();
      if (!task) throw new Error('Missing assigned task for ' + action);
      const target = targets[action];
      const before = session.getDay();
      const notified = notifications;
      expect(npc.arriveAtPositionAndComplete(task.assignee, orderId, action,
        { x: target.position.x + 2, z: target.position.z }, target)).toBe(false);
      expect(npc.arriveAtPositionAndComplete(task.assignee, orderId, action,
        target.position, { ...target, station: action === 'serve' ? 'kitchen' : 'customer-table' })).toBe(false);
      expect(npc.arriveAtPositionAndComplete(task.assignee === 'Na' ? 'Ken' : 'Na',
        orderId, action, target.position, target)).toBe(false);
      expect(session.getDay()).toBe(before);
      expect(notifications).toBe(notified);
      expect(npc.arriveAtPositionAndComplete(task.assignee, orderId, action,
        target.position, target)).toBe(true);
      const after = session.getDay();
      expect(npc.arriveAtPositionAndComplete(task.assignee, orderId, action,
        target.position, target)).toBe(false);
      expect(session.getDay()).toBe(after);
    }
    expect(session.getDay().store.orders.find(o => o.id === orderId)?.status).toBe('served');
    expect(session.dispatch({ mode: 'manager', type: 'pay', orderId })).toBe(true);
    const paid = session.getDay();
    expect(session.getSnapshot().manager.cashSatang).toBeGreaterThan(0);
    expect(session.dispatch({ mode: 'manager', type: 'pay', orderId })).toBe(false);
    expect(session.getDay()).toBe(paid);
    unsubscribe();
  });
});
