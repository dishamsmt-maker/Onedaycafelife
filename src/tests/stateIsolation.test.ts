import { describe, expect, it } from 'vitest';
import { act, createGame } from '../game/engine';

describe('simulation state isolation', () => {
  it('does not share mutable QR retry IDs, bundle components, or order component IDs between states', () => {
    let before = createGame(20261104);
    before.phase = 'open';
    before = act(before, { type: 'visitor-seat', tableId: 't3' });
    expect(before.customers.length).toBeGreaterThan(0);
    before.customers[0].requestIds = ['initial'];
    const menu = before.menu[0];
    menu.components = [{ menuId: 'thai-tea', quantity: 1 }];
    before.orders.push({
      id: 'test-parent', customerId: 'test-customer', tableId: null,
      menuId: menu.id, status: 'waiting', createdAt: before.minute,
      cost: 0, price: 0, stockConsumed: false, paid: false,
      componentOrderIds: ['test-child'],
    });

    const after = act(before, { type: 'pause' });
    expect(after).not.toBe(before);
    expect(after.menu[0].components).toEqual([{ menuId: 'thai-tea', quantity: 1 }]);
    after.menu[0].components![0].quantity = 9;
    expect(before.menu[0].components![0].quantity).toBe(1);

    after.orders[0].componentOrderIds!.push('another-child');
    expect(before.orders[0].componentOrderIds).toEqual(['test-child']);

    if (before.customers[0]) {
      after.customers[0].requestIds!.push('retry');
      expect(before.customers[0].requestIds).toEqual(['initial']);
    }
  });
});
