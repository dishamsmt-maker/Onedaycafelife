import { describe, expect, it } from 'vitest';
import { advanceCafeOrder, closeCafeDay, createCafeStore, payCafeOrder, recordCafeOrderCost, submitCafeOrder } from './orderCore';

const menu = [{ id: 'halal-tea', enabled: true, priceSatang: 4500, recipe: { tea: 1 } }];
function settled() {
  const submitted = submitCafeOrder(createCafeStore({ tea: 2 }), menu, {
    requestId: 't3-cost-check', tableId: 'T3', itemId: 'halal-tea', quantity: 1,
  });
  const preparing = advanceCafeOrder(submitted.store, menu, submitted.order.id, 'preparing');
  const costed = recordCafeOrderCost(preparing, menu, submitted.order.id, { tea: 300 });
  const ready = advanceCafeOrder(costed, menu, submitted.order.id, 'ready');
  return payCafeOrder(advanceCafeOrder(ready, menu, submitted.order.id, 'served'), submitted.order.id);
}
describe('imported ingredient cost integrity', () => {
  it('closes an ordinary settled order', () => {
    expect(closeCafeDay(settled()).readyToClose).toBe(true);
  });
  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects malformed consumed cost %s', invalid => {
      const store = settled();
      store.orders[0].consumedCostSatang = invalid;
      expect(closeCafeDay(store).readyToClose).toBe(false);
    },
  );
  it.each([-1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects malformed aggregate waste cost %s', invalid => {
      const store = settled();
      store.wasteCostSatang = invalid;
      expect(closeCafeDay(store).readyToClose).toBe(false);
    },
  );
  it('rejects a cost attached to an unprepared order', () => {
    const store = settled();
    store.orders[0].stockConsumed = false;
    expect(closeCafeDay(store).readyToClose).toBe(false);
  });
});
