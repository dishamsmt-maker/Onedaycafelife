import { describe, expect, it } from 'vitest';
import {
  advanceCafeOrder, closeCafeDay, createCafeStore, payCafeOrder,
  recordCafeOrderCost, reconcileCafeCash, refundAndCancelCafeOrder, submitCafeOrder,
  type CafeCatalogItem,
} from './orderCore';

const catalog: readonly CafeCatalogItem[] = [
  { id: 'congee', priceSatang: 4500, enabled: true, recipe: { rice: 2 } },
  { id: 'tea', priceSatang: 3000, enabled: true, recipe: { tea: 1 } },
];

describe('one-day café vertical slice (domain state shared by three views)', () => {
  it('takes table 3 QR order through KDS, preparation, service, payment and closing', () => {
    const initial = createCafeStore({ rice: 4, tea: 2 });
    const qr = { requestId: 't3-001', tableId: 'T03', itemId: 'congee', quantity: 1 };
    const accepted = submitCafeOrder(initial, catalog, qr);
    expect(accepted.accepted).toBe(true);
    const duplicate = submitCafeOrder(accepted.store, catalog, qr);
    expect(duplicate.accepted).toBe(true);
    expect(duplicate.reason).toBe('duplicate-retry');
    expect(duplicate.store).toBe(accepted.store);
    expect(accepted.store.orders).toHaveLength(1);

    const orderId = accepted.order.id;
    // Na sees the queued order; starting preparation consumes ingredients once.
    const preparing = advanceCafeOrder(accepted.store, catalog, orderId, 'preparing');
    expect(preparing.orders[0].status).toBe('preparing');
    expect(preparing.stock.rice).toBe(2);
    expect(advanceCafeOrder(preparing, catalog, orderId, 'preparing')).toBe(preparing);
    const costed = recordCafeOrderCost(preparing, catalog, orderId, { rice: 500 });
    expect(costed.orders[0].consumedCostSatang).toBe(1000);
    const ready = advanceCafeOrder(costed, catalog, orderId, 'ready');
    // Ken serves the same order; manager observes it from the same state.
    const served = advanceCafeOrder(ready, catalog, orderId, 'served');
    const paid = payCafeOrder(served, orderId);
    expect(payCafeOrder(paid, orderId)).toBe(paid);
    expect(paid.cashSatang).toBe(4500);
    expect(paid.cashEvents).toHaveLength(1);
    expect(reconcileCafeCash(paid).balanced).toBe(true);
    expect(closeCafeDay(paid)).toMatchObject({
      readyToClose: true, netSalesSatang: 4500,
      ingredientCostSatang: 1000, grossMarginSatang: 3500,
      wasteCostSatang: 0, openOrderIds: [],
    });
    // The starting state is never mutated by subsequent views.
    expect(initial.orders).toHaveLength(0);
    expect(initial.stock.rice).toBe(4);
  });

  it('blocks overselling and closes only after a cancelled paid order is refunded and costed', () => {
    const first = submitCafeOrder(createCafeStore({ rice: 2 }), catalog, {
      requestId: 't3-002', tableId: 'T03', itemId: 'congee', quantity: 1,
    });
    expect(first.accepted).toBe(true);
    const soldOut = submitCafeOrder(first.store, catalog, {
      requestId: 't4-001', tableId: 'T04', itemId: 'congee', quantity: 1,
    });
    expect(soldOut.accepted).toBe(false);
    expect(soldOut.reason).toBe('out-of-stock');
    const preparing = advanceCafeOrder(first.store, catalog, first.order.id, 'preparing');
    const paid = payCafeOrder(preparing, first.order.id);
    expect(advanceCafeOrder(paid, catalog, first.order.id, 'cancelled')).toBe(paid);
    const refunded = refundAndCancelCafeOrder(paid, first.order.id);
    expect(refundAndCancelCafeOrder(refunded, first.order.id)).toBe(refunded);
    expect(refunded.stock.rice).toBe(0);
    expect(refunded.cashSatang).toBe(0);
    expect(refunded.cashEvents).toHaveLength(2);
    expect(closeCafeDay(refunded).readyToClose).toBe(false);
    const costed = recordCafeOrderCost(refunded, catalog, first.order.id, { rice: 500 });
    expect(costed.wasteCostSatang).toBe(1000);
    expect(closeCafeDay(costed)).toMatchObject({
      readyToClose: true, netSalesSatang: 0,
      ingredientCostSatang: 1000, wasteCostSatang: 1000,
      grossMarginSatang: -1000,
    });
  });
});
