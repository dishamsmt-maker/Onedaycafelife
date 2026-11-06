import { describe, expect, it } from 'vitest';
import { createCafeStore, submitCafeOrder } from './orderCore';

const catalog = [{ id: 'tea', priceSatang: 2500, enabled: true, recipe: { milk: 2 } }];

describe('legacy queued order stock reservations', () => {
  it('does not oversell when a queued order has no recipe snapshot', () => {
    const store = createCafeStore({ milk: 3 });
    store.orders.push({ id: 'cafe-old', requestId: 'old', tableId: 'T1', itemId: 'tea', quantity: 1,
      unitPriceSatang: 2500, status: 'queued', paidSatang: 0, stockConsumed: false });
    const result = submitCafeOrder(store, catalog, { requestId: 'new', tableId: 'T2', itemId: 'tea', quantity: 1 });
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('out-of-stock');
    expect(result.store).toBe(store);
    expect(store.orders).toHaveLength(1);
    expect(store.stock.milk).toBe(3);
  });

  it('rejects new reservations if legacy queued item has no recoverable recipe', () => {
    const store = createCafeStore({ milk: 10 });
    store.orders.push({ id: 'cafe-unknown', requestId: 'unknown', tableId: 'T1', itemId: 'deleted', quantity: 1,
      unitPriceSatang: 2500, status: 'queued', paidSatang: 0, stockConsumed: false });
    const result = submitCafeOrder(store, catalog, { requestId: 'new', tableId: 'T2', itemId: 'tea', quantity: 1 });
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('out-of-stock');
  });
});
