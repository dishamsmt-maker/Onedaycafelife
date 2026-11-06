import { describe, expect, it } from 'vitest';
import {
  advanceCafeOrder, closeCafeDay, createCafeStore, payCafeOrder,
  recordCafeOrderCost, refundAndCancelCafeOrder, submitCafeOrder,
  type CafeCatalogItem,
} from './orderCore';

const menu: CafeCatalogItem[] = [
  { id: 'halal-tea', enabled: true, priceSatang: 4500, recipe: { tea: 2, milk: 1 } },
];

describe('one-day Café OS vertical slice (isolated from game state)', () => {
  it('T3 QR -> KDS -> preparation -> serving -> payment -> stock -> closeout', () => {
    const initial = createCafeStore({ tea: 4, milk: 2 });
    const request = { requestId: 't3-first', tableId: 'T3', itemId: 'halal-tea', quantity: 1 };
    const submitted = submitCafeOrder(initial, menu, request);
    expect(submitted.accepted).toBe(true);
    const retry = submitCafeOrder(submitted.store, menu, request);
    expect(retry.reason).toBe('duplicate-retry');
    expect(retry.store.orders).toHaveLength(1);

    const other = submitCafeOrder(submitted.store, menu, {
      requestId: 't4-second', tableId: 'T4', itemId: 'halal-tea', quantity: 2,
    });
    expect(other.accepted).toBe(false);
    expect(other.reason).toBe('out-of-stock');

    const preparing = advanceCafeOrder(submitted.store, menu, submitted.order.id, 'preparing');
    expect(preparing.stock).toEqual({ tea: 2, milk: 1 });
    expect(advanceCafeOrder(preparing, menu, submitted.order.id, 'preparing')).toBe(preparing);
    const costed = recordCafeOrderCost(preparing, menu, submitted.order.id, { tea: 300, milk: 500 });
    const ready = advanceCafeOrder(costed, menu, submitted.order.id, 'ready');
    const served = advanceCafeOrder(ready, menu, submitted.order.id, 'served');
    expect(closeCafeDay(served).readyToClose).toBe(false);
    const paid = payCafeOrder(served, submitted.order.id);
    expect(payCafeOrder(paid, submitted.order.id)).toBe(paid);
    const close = closeCafeDay(paid);
    expect(close.readyToClose).toBe(true);
    expect(close.orderCount).toBe(1);
    expect(close.netSalesSatang).toBe(4500);
    expect(close.ingredientCostSatang).toBe(1100);
    expect(close.grossMarginSatang).toBe(3400);
    expect(paid.stock).toEqual({ tea: 2, milk: 1 });
    expect(initial.stock).toEqual({ tea: 4, milk: 2 });
  });

  it('a paid prepared order requires a refund and preserves consumed stock as waste', () => {
    const submitted = submitCafeOrder(createCafeStore({ tea: 2, milk: 1 }), menu,
      { requestId: 'cancel-t3', tableId: 'T3', itemId: 'halal-tea', quantity: 1 });
    const preparing = advanceCafeOrder(submitted.store, menu, submitted.order.id, 'preparing');
    const costed = recordCafeOrderCost(preparing, menu, submitted.order.id, { tea: 300, milk: 500 });
    const paid = payCafeOrder(costed, submitted.order.id);
    expect(advanceCafeOrder(paid, menu, submitted.order.id, 'cancelled')).toBe(paid);
    const refunded = refundAndCancelCafeOrder(paid, submitted.order.id);
    expect(refundAndCancelCafeOrder(refunded, submitted.order.id)).toBe(refunded);
    expect(refunded.stock).toEqual({ tea: 0, milk: 0 });
    expect(refunded.wasteCostSatang).toBe(1100);
    const close = closeCafeDay(refunded);
    expect(close.readyToClose).toBe(true);
    expect(close.netSalesSatang).toBe(0);
    expect(close.refundsSatang).toBe(4500);
  });
});
