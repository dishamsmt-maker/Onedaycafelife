import { describe, expect, it } from 'vitest';
import { createCafeStore, submitCafeOrder } from './orderCore';

describe('legacy reservation integrity with zero-ingredient catalog items', () => {
  it('blocks empty-recipe orders when an unresolved legacy queue exists', () => {
    const store = createCafeStore({});
    store.orders.push({
      id: 'cafe-old', requestId: 'old', tableId: 't1', itemId: 'deleted',
      quantity: 1, unitPriceSatang: 1000, status: 'queued',
      paidSatang: 0, stockConsumed: false,
    });
    const catalog = [{ id: 'complimentary', priceSatang: 0, enabled: true, recipe: {} }];
    const result = submitCafeOrder(store, catalog, {
      requestId: 'new', tableId: 't3', itemId: 'complimentary', quantity: 1,
    });
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('out-of-stock');
    expect(result.store).toBe(store);
    expect(store.orders).toHaveLength(1);
  });

  it('allows an empty-recipe order when existing reservations are resolvable', () => {
    const store = createCafeStore({});
    const catalog = [{ id: 'complimentary', priceSatang: 0, enabled: true, recipe: {} }];
    const result = submitCafeOrder(store, catalog, {
      requestId: 'new', tableId: 't3', itemId: 'complimentary', quantity: 1,
    });
    expect(result.accepted).toBe(true);
    expect(result.store.orders).toHaveLength(1);
  });
});
