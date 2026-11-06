import { describe, expect, it } from 'vitest';
import { closeCafeDay, createCafeStore, payCafeOrder, reconcileCafeCash, submitCafeOrder, advanceCafeOrder } from './orderCore';

describe('zero-price promotional order payment', () => {
  it('records exactly one zero-value payment and closes with a balanced journal', () => {
    const catalog = [{ id: 'promo', priceSatang: 0, recipe: { water: 1 }, enabled: true }];
    const initial = createCafeStore({ water: 2 });
    const placed = submitCafeOrder(initial, catalog, { requestId: 'free-1', tableId: 'T03', itemId: 'promo', quantity: 1 });
    expect(placed.accepted).toBe(true);
    const preparing = advanceCafeOrder(placed.store, catalog, placed.order.id, 'preparing');
    const ready = advanceCafeOrder(preparing, catalog, placed.order.id, 'ready');
    const served = advanceCafeOrder(ready, catalog, placed.order.id, 'served');
    const paid = payCafeOrder(served, placed.order.id);
    const retry = payCafeOrder(paid, placed.order.id);
    expect(retry).toBe(paid);
    expect(paid.cashEvents).toEqual([{ id: 'payment-' + placed.order.id, orderId: placed.order.id, type: 'payment', amountSatang: 0 }]);
    expect(paid.orders[0].paymentRecorded).toBe(true);
    expect(reconcileCafeCash(paid).balanced).toBe(true);
    expect(closeCafeDay(paid).unpaidServedOrderIds).toEqual([]);
    expect(closeCafeDay(paid).readyToClose).toBe(false); // ingredient cost must still be recorded
  });
});
