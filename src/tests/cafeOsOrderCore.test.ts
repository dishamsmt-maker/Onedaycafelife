import { describe, expect, it } from 'vitest';
import { createCafeStore, submitCafeOrder, advanceCafeOrder, payCafeOrder, refundAndCancelCafeOrder, reconcileCafeCash, recordCafeOrderCost, closeCafeDay } from '../cafe-os/orderCore';

const catalog = [{ id: 'halal-porridge', priceSatang: 4500, recipe: { rice: 2 }, enabled: true }];
const request = { requestId: 'qr-t3-001', tableId: 't3', itemId: 'halal-porridge', quantity: 2 };

describe('Café OS isolated order pipeline', () => {
  it('accepts a QR retry only once and rejects reuse with different content', () => {
    const initial = createCafeStore({ rice: 10 });
    const first = submitCafeOrder(initial, catalog, request);
    expect(first.accepted).toBe(true);
    expect(initial.orders).toHaveLength(0);
    const retry = submitCafeOrder(first.store, catalog, request);
    expect(retry.accepted).toBe(true);
    expect(retry.reason).toBe('duplicate-retry');
    expect(retry.store.orders).toHaveLength(1);
    expect(submitCafeOrder(first.store, catalog, { ...request, quantity: 3 }).reason).toBe('request-id-conflict');
  });

  it('moves QR → KDS → serve, deducting ingredients and payment once', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const id = accepted.order.id;
    const preparing = advanceCafeOrder(accepted.store, catalog, id, 'preparing');
    expect(preparing.stock.rice).toBe(6);
    expect(accepted.store.stock.rice).toBe(10);
    expect(advanceCafeOrder(preparing, catalog, id, 'preparing')).toBe(preparing);
    const ready = advanceCafeOrder(preparing, catalog, id, 'ready');
    const served = advanceCafeOrder(ready, catalog, id, 'served');
    const paid = payCafeOrder(served, id);
    expect(paid.cashSatang).toBe(9000);
    expect(payCafeOrder(paid, id)).toBe(paid);
    expect(paid.orders[0].status).toBe('served');
  });

  it('rejects sold-out production without mutating stock or status', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 3 }), catalog, request);
    expect(accepted.accepted).toBe(false);
    expect(accepted.reason).toBe('out-of-stock');
    expect(accepted.store.orders).toHaveLength(0);
    expect(accepted.store.stock.rice).toBe(3);
  });

  it('rejects invalid QR and prevents cancelled order payment', () => {
    const initial = createCafeStore({ rice: 10 });
    expect(submitCafeOrder(initial, catalog, { ...request, quantity: -1 }).accepted).toBe(false);
    const accepted = submitCafeOrder(initial, catalog, request);
    const cancelled = advanceCafeOrder(accepted.store, catalog, accepted.order.id, 'cancelled');
    expect(payCafeOrder(cancelled, accepted.order.id)).toBe(cancelled);
    expect(cancelled.cashSatang).toBe(0);
  });
  it('records a zero-price payment exactly once', () => {
    const freeCatalog = [{ id: 'water', priceSatang: 0, recipe: {}, enabled: true }];
    const accepted = submitCafeOrder(createCafeStore({}), freeCatalog, { ...request, itemId: 'water' });
    const paid = payCafeOrder(accepted.store, accepted.order.id);
    expect(paid.orders[0].paymentRecorded).toBe(true);
    expect(paid.cashSatang).toBe(0);
    expect(payCafeOrder(paid, accepted.order.id)).toBe(paid);
  });

  it('blocks cancellation of paid orders pending an explicit refund flow', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const paid = payCafeOrder(accepted.store, accepted.order.id);
    expect(advanceCafeOrder(paid, catalog, accepted.order.id, 'cancelled')).toBe(paid);
    expect(paid.cashSatang).toBe(9000);
  });
  it('refunds paid queued order once and blocks later payment', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const paid = payCafeOrder(accepted.store, accepted.order.id);
    const refunded = refundAndCancelCafeOrder(paid, accepted.order.id);
    expect(refunded.cashSatang).toBe(0);
    expect(refunded.orders[0].refundedSatang).toBe(9000);
    expect(refunded.orders[0].status).toBe('cancelled');
    expect(refundAndCancelCafeOrder(refunded, accepted.order.id)).toBe(refunded);
    expect(payCafeOrder(refunded, accepted.order.id)).toBe(refunded);
  });

  it('does not return already consumed ingredients after cancellation', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const preparing = advanceCafeOrder(accepted.store, catalog, accepted.order.id, 'preparing');
    const paid = payCafeOrder(preparing, accepted.order.id);
    const refunded = refundAndCancelCafeOrder(paid, accepted.order.id);
    expect(refunded.stock.rice).toBe(6);
    expect(refunded.cashSatang).toBe(0);
  });
  it('reconciles payment and refund journals and detects tampering', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const paid = payCafeOrder(accepted.store, accepted.order.id);
    expect(paid.cashEvents).toEqual([{ id: 'payment-' + accepted.order.id, orderId: accepted.order.id, type: 'payment', amountSatang: 9000 }]);
    expect(reconcileCafeCash(paid)).toEqual({ expectedSatang: 9000, balanced: true });
    const refunded = refundAndCancelCafeOrder(paid, accepted.order.id);
    expect(refunded.cashEvents).toHaveLength(2);
    expect(reconcileCafeCash(refunded)).toEqual({ expectedSatang: 0, balanced: true });
    expect(reconcileCafeCash({ ...refunded, cashSatang: 100 }).balanced).toBe(false);
  });
  it('records actual ingredient cost once and treats cancelled preparation as waste', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const preparing = advanceCafeOrder(accepted.store, catalog, accepted.order.id, 'preparing');
    const costed = recordCafeOrderCost(preparing, catalog, accepted.order.id, { rice: 350 });
    expect(costed.orders[0].consumedCostSatang).toBe(1400);
    expect(recordCafeOrderCost(costed, catalog, accepted.order.id, { rice: 350 })).toBe(costed);
    const cancelled = refundAndCancelCafeOrder(costed, accepted.order.id);
    expect(cancelled.wasteCostSatang).toBe(1400);
    expect(cancelled.stock.rice).toBe(6);
    expect(refundAndCancelCafeOrder(cancelled, accepted.order.id)).toBe(cancelled);
  });

  it('refuses to invent cost when ingredient pricing is absent', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const preparing = advanceCafeOrder(accepted.store, catalog, accepted.order.id, 'preparing');
    expect(recordCafeOrderCost(preparing, catalog, accepted.order.id, {})).toBe(preparing);
  });
  it('closes a balanced day with known COGS and reports net margin', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const preparing = advanceCafeOrder(accepted.store, catalog, accepted.order.id, 'preparing');
    const costed = recordCafeOrderCost(preparing, catalog, accepted.order.id, { rice: 350 });
    const served = advanceCafeOrder(advanceCafeOrder(costed, catalog, accepted.order.id, 'ready'), catalog, accepted.order.id, 'served');
    const paid = payCafeOrder(served, accepted.order.id);
    const report = closeCafeDay(paid);
    expect(report.readyToClose).toBe(true);
    expect(report.netSalesSatang).toBe(9000);
    expect(report.ingredientCostSatang).toBe(1400);
    expect(report.grossMarginSatang).toBe(7600);
    expect(report.wasteCostSatang).toBe(0);
  });

  it('flags missing ingredient costs and cash mismatches', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const preparing = advanceCafeOrder(accepted.store, catalog, accepted.order.id, 'preparing');
    const paid = payCafeOrder(preparing, accepted.order.id);
    expect(closeCafeDay(paid).readyToClose).toBe(false);
    expect(closeCafeDay(paid).grossMarginSatang).toBeNull();
    const costed = recordCafeOrderCost(paid, catalog, accepted.order.id, { rice: 350 });
    expect(closeCafeDay({ ...costed, cashSatang: 0 }).readyToClose).toBe(false);
  });
  it('blocks closing while orders are open or served but unpaid', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const open = closeCafeDay(accepted.store);
    expect(open.readyToClose).toBe(false);
    expect(open.openOrderIds).toEqual([accepted.order.id]);
    const preparing = advanceCafeOrder(accepted.store, catalog, accepted.order.id, 'preparing');
    const costed = recordCafeOrderCost(preparing, catalog, accepted.order.id, { rice: 350 });
    const served = advanceCafeOrder(advanceCafeOrder(costed, catalog, accepted.order.id, 'ready'), catalog, accepted.order.id, 'served');
    expect(closeCafeDay(served).unpaidServedOrderIds).toEqual([accepted.order.id]);
    expect(closeCafeDay(served).readyToClose).toBe(false);
    expect(closeCafeDay(payCafeOrder(served, accepted.order.id)).readyToClose).toBe(true);
  });
  it('rejects balanced but forged journal events and missing payment entries', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const paid = payCafeOrder(accepted.store, accepted.order.id);
    expect(reconcileCafeCash(paid).balanced).toBe(true);
    const forged = { ...paid, cashEvents: paid.cashEvents.map(e => ({
      ...e, orderId: 'unrelated-order', id: e.type + '-unrelated-order',
    })) };
    expect(reconcileCafeCash(forged).balanced).toBe(false);
    expect(closeCafeDay(forged).readyToClose).toBe(false);
    expect(reconcileCafeCash({ ...paid, cashEvents: [] }).balanced).toBe(false);
    const wrongAmount = { ...paid, orders: paid.orders.map(o => ({ ...o, paidSatang: 1 })) };
    expect(reconcileCafeCash(wrongAmount).balanced).toBe(false);
  });
  it('uses accepted recipe snapshot even when the catalog changes later', () => {
    const initial = createCafeStore({ rice: 10, chicken: 10 });
    const accepted = submitCafeOrder(initial, catalog, request);
    const changedCatalog = [{ id: 'halal-porridge', priceSatang: 9000, recipe: { chicken: 8 }, enabled: true }];
    const preparing = advanceCafeOrder(accepted.store, changedCatalog, accepted.order.id, 'preparing');
    expect(preparing.stock.rice).toBe(6);
    expect(preparing.stock.chicken).toBe(10);
    const costed = recordCafeOrderCost(preparing, changedCatalog, accepted.order.id, { rice: 350 });
    expect(costed.orders[0].consumedCostSatang).toBe(1400);
    expect(accepted.store.orders[0].recipeSnapshot).toEqual({ rice: 2 });
  });
  it('does not expose mutable recipe snapshots through submit or retry results', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    accepted.order.recipeSnapshot!.rice = 999;
    expect(accepted.store.orders[0].recipeSnapshot!.rice).toBe(2);
    const retry = submitCafeOrder(accepted.store, catalog, request);
    retry.order.recipeSnapshot!.rice = 999;
    expect(accepted.store.orders[0].recipeSnapshot!.rice).toBe(2);
    const preparing = advanceCafeOrder(accepted.store, catalog, accepted.store.orders[0].id, 'preparing');
    expect(preparing.stock.rice).toBe(6);
  });

  it('rejects overflowing ingredient requirements before accepting the order', () => {
    const hugeCatalog = [{ id: 'huge', priceSatang: 1, recipe: { rice: Number.MAX_VALUE }, enabled: true }];
    const accepted = submitCafeOrder(createCafeStore({ rice: Number.MAX_VALUE }), hugeCatalog,
      { requestId: 'huge-1', tableId: 't1', itemId: 'huge', quantity: 2 });
    expect(accepted.accepted).toBe(false);
  });
  it('refuses to prepare when persisted stock is non-finite', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const corrupted = { ...accepted.store, stock: { rice: Number.NaN } };
    expect(advanceCafeOrder(corrupted, catalog, accepted.order.id, 'preparing')).toBe(corrupted);
    expect(corrupted.orders[0].status).toBe('queued');
  });

  it('rejects a derived order ID collision even when the request ID differs', () => {
    const initial = createCafeStore({ rice: 10 });
    const poisoned = { ...initial, orders: [{
      id: 'cafe-qr-t3-001', requestId: 'legacy-id', tableId: 't1',
      itemId: 'halal-porridge', quantity: 1, unitPriceSatang: 4500,
      status: 'queued' as const, paidSatang: 0, stockConsumed: false,
    }] };
    const result = submitCafeOrder(poisoned, catalog, request);
    expect(result.accepted).toBe(false);
    expect(result.reason).toBe('order-id-conflict');
    expect(result.store).toBe(poisoned);
  });

  it('rejects a stock subtraction that overflows to a non-finite result', () => {
    const tinyCatalog = [{ id: 'extreme', priceSatang: 1,
      recipe: { rice: Number.MAX_VALUE }, enabled: true }];
    const initial = createCafeStore({ rice: Number.MAX_VALUE });
    const accepted = submitCafeOrder(initial, tinyCatalog,
      { requestId: 'extreme-1', tableId: 't1', itemId: 'extreme', quantity: 2 });
    expect(accepted.accepted).toBe(false);
    expect(initial.stock.rice).toBe(Number.MAX_VALUE);
  });

  it('refuses day close on corrupted inventory despite a balanced payment journal', () => {
    const accepted = submitCafeOrder(createCafeStore({ rice: 10 }), catalog, request);
    const preparing = advanceCafeOrder(accepted.store, catalog, accepted.order.id, 'preparing');
    const costed = recordCafeOrderCost(preparing, catalog, accepted.order.id, { rice: 350 });
    const served = advanceCafeOrder(advanceCafeOrder(costed, catalog, accepted.order.id, 'ready'), catalog, accepted.order.id, 'served');
    const paid = payCafeOrder(served, accepted.order.id);
    expect(closeCafeDay(paid).readyToClose).toBe(true);
    for (const corrupt of [Number.NaN, Number.POSITIVE_INFINITY, -1]) {
      const report = closeCafeDay({ ...paid, stock: { rice: corrupt } });
      expect(report.cashBalanced).toBe(true);
      expect(report.invalidStockIds).toEqual(['rice']);
      expect(report.readyToClose).toBe(false);
    }
    expect(closeCafeDay({ ...paid, stock: { rice: 0.5 } }).readyToClose).toBe(true);
  });

});
