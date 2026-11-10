import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';

describe('3D staff preparation uses game-only recipe costs', () => {
  it('prepares an accepted order without passing costs from the scene', () => {
    const session = createGameplayDemoSession();
    expect(session.dispatch({
      mode: 'customer', type: 'order', requestId: 'npc-cost-t3',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    })).toBe(true);
    const orderId = session.getDay().store.orders[0].id;
    expect(session.dispatch({
      mode: 'staff', type: 'task', orderId, assignee: 'Na', action: 'prepare',
    })).toBe(true);
    const order = session.getDay().store.orders[0];
    expect(order.status).toBe('preparing');
    expect(order.stockConsumed).toBe(true);
    expect(order.consumedCostSatang).toBe(1900);
    expect(session.dispatch({
      mode: 'staff', type: 'task', orderId, assignee: 'Na', action: 'prepare',
    })).toBe(false);
    expect(session.getDay().store.orders[0].consumedCostSatang).toBe(1900);
  });
});
