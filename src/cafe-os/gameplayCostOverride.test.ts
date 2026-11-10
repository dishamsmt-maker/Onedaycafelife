import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';

describe('gameplay preparation cost boundary', () => {
  it('ignores a zero-cost override from a scene interaction', () => {
    const session = createGameplayDemoSession();
    expect(session.dispatch({
      mode: 'customer', type: 'order', requestId: 'cost-override-t3',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    })).toBe(true);
    const orderId = session.getDay().store.orders[0].id;
    expect(session.dispatch({
      mode: 'staff', type: 'task', orderId, assignee: 'Na',
      action: 'prepare', costs: { rice: 0, chicken: 0, broth: 0 },
    })).toBe(true);
    const order = session.getDay().store.orders[0];
    expect(order.stockConsumed).toBe(true);
    expect(order.consumedCostSatang).toBe(1900);
    expect(session.dispatch({
      mode: 'staff', type: 'task', orderId, assignee: 'Na',
      action: 'prepare', costs: { rice: 0 },
    })).toBe(false);
    expect(session.getDay().store.orders[0].consumedCostSatang).toBe(1900);
  });
});
