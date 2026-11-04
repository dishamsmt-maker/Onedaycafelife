import { describe, expect, it } from 'vitest';
import { createCafeStore, submitCafeOrder, advanceCafeOrder, payCafeOrder, refundAndCancelCafeOrder } from '../cafe-os/orderCore';

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
    expect(advanceCafeOrder(accepted.store, catalog, accepted.order.id, 'preparing')).toBe(accepted.store);
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
});
