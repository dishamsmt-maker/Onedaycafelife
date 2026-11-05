import { describe, expect, it } from 'vitest';
import {
  advanceCafeOrder, closeCafeDay, createCafeStore, payCafeOrder,
  reconcileCafeCash, refundAndCancelCafeOrder, submitCafeOrder,
} from './orderCore';

describe('zero-value paid order cancellation', () => {
  it('refunds a recorded zero-value payment exactly once without duplicating cash events', () => {
    const catalog = [{ id: 'complimentary', priceSatang: 0, recipe: { water: 1 }, enabled: true }];
    const placed = submitCafeOrder(createCafeStore({ water: 2 }), catalog, {
      requestId: 'complimentary-T03', tableId: 'T03', itemId: 'complimentary', quantity: 1,
    });
    expect(placed.accepted).toBe(true);
    const paid = payCafeOrder(placed.store, placed.order.id);
    expect(paid.orders[0].paymentRecorded).toBe(true);
    expect(paid.cashEvents).toHaveLength(1);
    const cancelled = refundAndCancelCafeOrder(paid, placed.order.id);
    expect(cancelled.orders[0].status).toBe('cancelled');
    expect(cancelled.orders[0].refundedSatang).toBe(0);
    expect(cancelled.cashEvents).toEqual([
      { id: 'payment-' + placed.order.id, orderId: placed.order.id, type: 'payment', amountSatang: 0 },
      { id: 'refund-' + placed.order.id, orderId: placed.order.id, type: 'refund', amountSatang: 0 },
    ]);
    expect(refundAndCancelCafeOrder(cancelled, placed.order.id)).toBe(cancelled);
    expect(payCafeOrder(cancelled, placed.order.id)).toBe(cancelled);
    expect(cancelled.stock.water).toBe(2);
    expect(reconcileCafeCash(cancelled)).toEqual({ expectedSatang: 0, balanced: true });
    expect(closeCafeDay(cancelled).readyToClose).toBe(true);
  });

  it('keeps consumed stock and waste when a free order is cancelled after production', () => {
    const catalog = [{ id: 'complimentary', priceSatang: 0, recipe: { water: 1 }, enabled: true }];
    const placed = submitCafeOrder(createCafeStore({ water: 2 }), catalog, {
      requestId: 'free-after-production', tableId: 'T03', itemId: 'complimentary', quantity: 1,
    });
    const preparing = advanceCafeOrder(placed.store, catalog, placed.order.id, 'preparing');
    const paid = payCafeOrder(preparing, placed.order.id);
    const cancelled = refundAndCancelCafeOrder(paid, placed.order.id);
    expect(cancelled.stock.water).toBe(1);
    expect(cancelled.cashSatang).toBe(0);
    expect(cancelled.cashEvents).toHaveLength(2);
    expect(closeCafeDay(cancelled).readyToClose).toBe(false); // missing production cost
  });
});
