import { describe, expect, it } from 'vitest';
import { closeCafeDay, createCafeStore, payCafeOrder, reconcileCafeCash, refundAndCancelCafeOrder, submitCafeOrder } from './orderCore';

describe('cancelled paid order cash reconciliation integrity', () => {
  const catalog = [{ id: 'drink', priceSatang: 5000, recipe: { water: 1 }, enabled: true }];
  for (const priceSatang of [0, 5000]) {
    it('rejects a cancelled paid order missing its refund journal, price=' + priceSatang, () => {
      const menu = [{ ...catalog[0], priceSatang }];
      const placed = submitCafeOrder(createCafeStore({ water: 3 }), menu, {
        requestId: 'T03-' + priceSatang, tableId: 'T03', itemId: 'drink', quantity: 1,
      });
      expect(placed.accepted).toBe(true);
      const paid = payCafeOrder(placed.store, placed.order.id);
      expect(reconcileCafeCash(paid).balanced).toBe(true);
      // Simulate an imported/partially persisted cancellation that skipped refund.
      const corrupt = { ...paid, orders: paid.orders.map(o => ({ ...o, status: 'cancelled' as const })) };
      expect(reconcileCafeCash(corrupt).balanced).toBe(false);
      expect(closeCafeDay(corrupt).readyToClose).toBe(false);
      const refunded = refundAndCancelCafeOrder(paid, placed.order.id);
      expect(reconcileCafeCash(refunded).balanced).toBe(true);
      expect(closeCafeDay(refunded).readyToClose).toBe(true);
    });
  }
});
