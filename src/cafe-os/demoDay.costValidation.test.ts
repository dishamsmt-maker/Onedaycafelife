import { describe, expect, it } from 'vitest';
import { applyDemoAction, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';
import { reconcileCafeCash } from './orderCore';

describe('demo day production cost validation', () => {
  it('rejects missing, negative, fractional and non-finite ingredient costs without changing state', () => {
    const initial = startDemoDay(createDemoStock(2));
    const queued = applyDemoAction(initial, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'cost-validation-t3',
      tableId: 't3', itemId: 'congee-chicken', quantity: 1,
    });
    expect(queued.store.orders).toHaveLength(1);
    const orderId = queued.store.orders[0].id;
    const invalidCosts: ReadonlyArray<Readonly<Record<string, number>>> = [
      { congee: 500 },
      { congee: -1, chicken: 1000 },
      { congee: 500.5, chicken: 1000 },
      { congee: 500, chicken: Number.NaN },
      { congee: 500, chicken: Number.POSITIVE_INFINITY },
    ];
    for (const costs of invalidCosts) {
      const result = applyDemoAction(queued, DEMO_HALAL_MENU, {
        actor: 'Na', type: 'prepare', orderId, costs,
      });
      expect(result).toBe(queued);
      expect(result.events).toHaveLength(1);
      expect(result.store.orders[0].status).toBe('queued');
      expect(result.store.orders[0].stockConsumed).toBe(false);
      expect(result.store.stock.chicken).toBe(2);
      expect(reconcileCafeCash(result.store).balanced).toBe(true);
    }
    const prepared = applyDemoAction(queued, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId, costs: { congee: 500, chicken: 1000 },
    });
    expect(prepared.events.map(event => event.action)).toEqual(['ordered', 'preparing']);
    expect(prepared.store.stock.chicken).toBe(1);
    expect(prepared.store.orders[0].stockConsumed).toBe(true);
    expect(reconcileCafeCash(prepared.store).balanced).toBe(true);
  });
});
