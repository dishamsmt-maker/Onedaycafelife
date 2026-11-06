import { describe, expect, it } from 'vitest';
import { closeCafeDay, createCafeStore, reconcileCafeCash, type CafeOrder } from './orderCore';

const cancelled = (id: string, requestId: string): CafeOrder => ({
  id, requestId, tableId: 'T3', itemId: 'tea', quantity: 1,
  unitPriceSatang: 3000, status: 'cancelled', paidSatang: 0, stockConsumed: false,
});

describe('imported request identity integrity', () => {
  it('rejects distinct order IDs sharing the same request ID', () => {
    const store = createCafeStore({});
    store.orders = [cancelled('cafe-one', 'same'), cancelled('cafe-two', 'same')];
    expect(reconcileCafeCash(store).balanced).toBe(false);
    expect(closeCafeDay(store).readyToClose).toBe(false);
  });
  it('rejects blank imported request IDs', () => {
    const store = createCafeStore({});
    store.orders = [cancelled('cafe-one', '  ')];
    expect(reconcileCafeCash(store).balanced).toBe(false);
    expect(closeCafeDay(store).readyToClose).toBe(false);
  });
  it('keeps a valid empty day closable', () => {
    const store = createCafeStore({});
    expect(closeCafeDay(store).readyToClose).toBe(true);
  });
});
