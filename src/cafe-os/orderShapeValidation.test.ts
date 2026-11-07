import { describe, expect, it } from 'vitest';
import { closeCafeDay, createCafeStore, payCafeOrder, submitCafeOrder } from './orderCore';

describe('imported order shape safety at closeout', () => {
  const catalog = [{ id: 'halal-tea', priceSatang: 4500, recipe: {}, enabled: true }];
  const makePaid = () => {
    const placed = submitCafeOrder(createCafeStore({}), catalog, {
      requestId: 'shape-t3', tableId: 'T3', itemId: 'halal-tea', quantity: 1,
    });
    return payCafeOrder(placed.store, placed.order.id);
  };

  it.each([
    ['zero quantity', { quantity: 0 }],
    ['fractional quantity', { quantity: 0.5 }],
    ['negative quantity', { quantity: -1 }],
    ['negative price', { unitPriceSatang: -4500 }],
    ['fractional price', { unitPriceSatang: 4500.5 }],
    ['unsafe total', { quantity: Number.MAX_SAFE_INTEGER }],
    ['blank table', { tableId: ' ' }],
    ['blank item', { itemId: '' }],
  ])('rejects %s even when the journal still matches', (_name, patch) => {
    const store = makePaid();
    const imported = {
      ...store,
      orders: store.orders.map(order => ({ ...order, ...patch })),
    };
    expect(closeCafeDay(imported).cashBalanced).toBe(false);
    expect(closeCafeDay(imported).readyToClose).toBe(false);
  });

  it('retains valid paid-order reconciliation', () => {
    const store = makePaid();
    expect(closeCafeDay(store).cashBalanced).toBe(true);
    // It is still open until prepared/served, regardless of cash balance.
    expect(closeCafeDay(store).readyToClose).toBe(false);
  });
});
