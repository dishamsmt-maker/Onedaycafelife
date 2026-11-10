import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { createGameplayNpcTaskAdapter } from './gameplayNpcTaskAdapter';

describe('game-only NPC staff adapter', () => {
  it('accepts only assigned tasks and prevents replay while sharing the same session', () => {
    const session = createGameplayDemoSession();
    const npc = createGameplayNpcTaskAdapter(session);
    expect(npc.pendingFor('Na')).toHaveLength(0);
    expect(session.dispatch({
      mode: 'customer', type: 'order', requestId: 'npc-t3-1',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    })).toBe(true);
    const order = session.getDay().store.orders[0];
    expect(npc.complete('Ken', order.id, 'prepare')).toBe(false);
    expect(npc.pendingFor('Na').some(t => t.orderId === order.id && t.action === 'prepare')).toBe(true);
    expect(npc.complete('Na', order.id, 'prepare')).toBe(true);
    expect(npc.complete('Na', order.id, 'prepare')).toBe(false);
    const afterPrepare = session.getSnapshot();
    expect(afterPrepare.manager.stock).toEqual(session.getSnapshot().manager.stock);
    // Continue with the next real task exposed by the shared simulation.
    for (let i = 0; i < 3; i++) {
      const task = session.getSnapshot().staff.tasks.find(t => t.orderId === order.id);
      if (!task) break;
      expect(npc.complete(task.assignee, task.orderId, task.action)).toBe(true);
    }
    expect(session.getDay().store.orders.find(o => o.id === order.id)?.status).toBe('served');
    expect(session.dispatch({ mode: 'manager', type: 'pay', orderId: order.id })).toBe(true);
    expect(session.getSnapshot().manager.cashSatang).toBeGreaterThan(0);
  });
});
