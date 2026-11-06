import { describe, expect, it } from 'vitest';
import { advanceCafeOrder, createCafeStore, payCafeOrder, refundAndCancelCafeOrder, submitCafeOrder } from './orderCore';

const menu = [{ id: 'tea', priceSatang: 100, recipe: { tea: 1 }, enabled: true }];

describe('cancellation waste accounting overflow guard', () => {
  for (const paid of [false, true]) {
    it(`rejects unsafe waste accumulation for ${paid ? 'refunded' : 'unpaid'} cancellation without mutating state`, () => {
      const initial = createCafeStore({ tea: 2 });
      const accepted = submitCafeOrder(initial, menu, { requestId: 'r1', tableId: 't1', itemId: 'tea', quantity: 1 });
      expect(accepted.accepted).toBe(true);
      const preparing = advanceCafeOrder(accepted.store, menu, accepted.order.id, 'preparing');
      const before = paid ? payCafeOrder(preparing, accepted.order.id) : preparing;
      const withLargeWaste = {
        ...before,
        wasteCostSatang: Number.MAX_SAFE_INTEGER,
        orders: before.orders.map(o => ({ ...o, consumedCostSatang: 1 })),
      };
      const after = paid
        ? refundAndCancelCafeOrder(withLargeWaste, accepted.order.id)
        : advanceCafeOrder(withLargeWaste, menu, accepted.order.id, 'cancelled');
      expect(after).toBe(withLargeWaste);
      expect(after.orders[0].status).toBe('preparing');
      expect(after.wasteCostSatang).toBe(Number.MAX_SAFE_INTEGER);
      expect(after.cashEvents).toEqual(withLargeWaste.cashEvents);
    });
  }
});
