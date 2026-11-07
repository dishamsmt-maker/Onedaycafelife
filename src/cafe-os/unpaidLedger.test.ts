import { describe, expect, it } from 'vitest';
import { closeCafeDay, createCafeStore, submitCafeOrder } from './orderCore';

const catalog = [{ id: 'tea', priceSatang: 3500, recipe: {}, enabled: true }];
function snapshot() {
  const initial = createCafeStore({});
  return submitCafeOrder(initial, catalog, { requestId: 'req-1', tableId: 'T3', itemId: 'tea', quantity: 1 }).store;
}
describe('unpaid imported ledger guard', () => {
  it('rejects a phantom paid amount with no payment journal', () => {
    const store = snapshot();
    store.orders[0].paidSatang = 3500;
    expect(closeCafeDay(store).cashBalanced).toBe(false);
  });
  it('rejects a refund marker on an unpaid order', () => {
    const store = snapshot();
    store.orders[0].refundedSatang = 0;
    expect(closeCafeDay(store).cashBalanced).toBe(false);
  });
  it('accepts the untouched unpaid ledger for reconciliation', () => {
    expect(closeCafeDay(snapshot()).cashBalanced).toBe(true);
  });
});
