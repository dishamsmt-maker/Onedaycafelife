import { describe, expect, it } from 'vitest';
import {
  advanceCafeOrder, closeCafeDay, createCafeStore, recordCafeOrderCost,
  refundAndCancelCafeOrder, submitCafeOrder, payCafeOrder,
} from './orderCore';

describe('late cost reconciliation for cancelled produced orders', () => {
  const catalog = [{ id: 'porridge', priceSatang: 4500, recipe: { chicken: 2 }, enabled: true }];

  it('records missing production cost as waste once after unpaid cancellation', () => {
    const placed = submitCafeOrder(createCafeStore({ chicken: 4 }), catalog, {
      requestId: 'late-cost-T03', tableId: 'T03', itemId: 'porridge', quantity: 1,
    });
    const preparing = advanceCafeOrder(placed.store, catalog, placed.order.id, 'preparing');
    const cancelled = advanceCafeOrder(preparing, catalog, placed.order.id, 'cancelled');
    expect(closeCafeDay(cancelled).readyToClose).toBe(false);
    expect(cancelled.stock.chicken).toBe(2);
    const recorded = recordCafeOrderCost(cancelled, catalog, placed.order.id, { chicken: 300 });
    expect(recorded.orders[0].consumedCostSatang).toBe(600);
    expect(recorded.wasteCostSatang).toBe(600);
    expect(recordCafeOrderCost(recorded, catalog, placed.order.id, { chicken: 300 })).toBe(recorded);
    expect(closeCafeDay(recorded).readyToClose).toBe(true);
    expect(closeCafeDay(recorded).wasteCostSatang).toBe(600);
  });

  it('reconciles late cost after paid cancellation and rejects invalid cost without mutation', () => {
    const placed = submitCafeOrder(createCafeStore({ chicken: 4 }), catalog, {
      requestId: 'late-refund-T04', tableId: 'T04', itemId: 'porridge', quantity: 1,
    });
    const preparing = advanceCafeOrder(placed.store, catalog, placed.order.id, 'preparing');
    const paid = payCafeOrder(preparing, placed.order.id);
    const cancelled = refundAndCancelCafeOrder(paid, placed.order.id);
    expect(recordCafeOrderCost(cancelled, catalog, placed.order.id, { chicken: -1 })).toBe(cancelled);
    const recorded = recordCafeOrderCost(cancelled, catalog, placed.order.id, { chicken: 250 });
    expect(recorded.wasteCostSatang).toBe(500);
    expect(recorded.cashSatang).toBe(0);
    expect(closeCafeDay(recorded).readyToClose).toBe(true);
    expect(closeCafeDay(recorded).netSalesSatang).toBe(0);
  });
});
