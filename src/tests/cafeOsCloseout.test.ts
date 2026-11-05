import { describe, expect, it } from 'vitest';
import { createCafeStore, submitCafeOrder, payCafeOrder, refundAndCancelCafeOrder, advanceCafeOrder } from '../cafe-os/orderCore';
import { closeCafeDay } from '../cafe-os/closeout';

const catalog = [{ id: 'porridge', priceSatang: 4500, recipe: { rice: 2 }, enabled: true }];
describe('Café OS day-end reconciliation', () => {
  it('reconciles a sale and a refunded order without double counting', () => {
    let store = createCafeStore({ rice: 10 });
    const first = submitCafeOrder(store, catalog, { requestId: 'a', tableId: 't1', itemId: 'porridge', quantity: 1 });
    store = payCafeOrder(first.store, first.order.id);
    const second = submitCafeOrder(store, catalog, { requestId: 'b', tableId: 't2', itemId: 'porridge', quantity: 2 });
    store = payCafeOrder(second.store, second.order.id);
    store = refundAndCancelCafeOrder(store, second.order.id);
    const report = closeCafeDay(store);
    expect(report).toMatchObject({
      grossSalesSatang: 13500, refundsSatang: 9000, netSalesSatang: 4500,
      recordedCashSatang: 4500, discrepancySatang: 0,
      paidOrders: 2, refundedOrders: 1, cancelledOrders: 1,
    });
  });
  it('flags cash discrepancy and counts consumed cancelled meals as waste candidates', () => {
    let store = createCafeStore({ rice: 10 });
    const accepted = submitCafeOrder(store, catalog, { requestId: 'c', tableId: 't3', itemId: 'porridge', quantity: 1 });
    store = advanceCafeOrder(accepted.store, catalog, accepted.order.id, 'preparing');
    store = refundAndCancelCafeOrder(store, accepted.order.id);
    expect(closeCafeDay(store).consumedCancelledOrders).toBe(1);
    const tampered = { ...store, cashSatang: 100 };
    expect(closeCafeDay(tampered).discrepancySatang).toBe(100);
  });
});
