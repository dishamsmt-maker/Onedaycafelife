import { describe, expect, it } from 'vitest';
import { closeCafeDay, createCafeStore, reconcileCafeCash, type CafeOrder } from './orderCore';

const cancelledOrder = (id: string): CafeOrder => ({
  id, requestId: id, tableId: 'T3', itemId: 'tea', quantity: 1,
  unitPriceSatang: 3000, status: 'cancelled', paidSatang: 0,
  stockConsumed: false,
});

describe('imported order identity integrity', () => {
  it('rejects duplicate order IDs even with no cash journal entries', () => {
    const store = createCafeStore({});
    store.orders = [cancelledOrder('cafe-1'), cancelledOrder('cafe-1')];
    expect(reconcileCafeCash(store).balanced).toBe(false);
    expect(closeCafeDay(store).readyToClose).toBe(false);
  });
  it('rejects blank order IDs instead of reporting a balanced day', () => {
    const store = createCafeStore({});
    store.orders = [cancelledOrder('  ')];
    expect(reconcileCafeCash(store).balanced).toBe(false);
    expect(closeCafeDay(store).readyToClose).toBe(false);
  });
  it('preserves valid empty-day closeout behavior', () => {
    const store = createCafeStore({});
    expect(reconcileCafeCash(store).balanced).toBe(true);
    expect(closeCafeDay(store).readyToClose).toBe(true);
  });
});
