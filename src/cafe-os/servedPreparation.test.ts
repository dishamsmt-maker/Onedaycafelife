import { describe, expect, it } from 'vitest';
import { advanceCafeOrder, closeCafeDay, createCafeStore, payCafeOrder, recordCafeOrderCost, submitCafeOrder } from './orderCore';

const menu = [{ id: 'tea', enabled: true, priceSatang: 4500, recipe: { tea: 1 } }];

describe('closeout preparation integrity', () => {
  it('rejects imported served-but-unprepared orders even when the cash journal balances', () => {
    const submitted = submitCafeOrder(createCafeStore({ tea: 2 }), menu,
      { requestId: 't3-preparation', tableId: 'T3', itemId: 'tea', quantity: 1 });
    const paid = payCafeOrder(submitted.store, submitted.order.id);
    const imported = { ...paid, orders: paid.orders.map(o => ({
      ...o, status: 'served' as const, stockConsumed: false,
    })) };
    const report = closeCafeDay(imported);
    expect(report.cashBalanced).toBe(true);
    expect(report.unpreparedServedOrderIds).toEqual([submitted.order.id]);
    expect(report.readyToClose).toBe(false);
    expect(imported.stock.tea).toBe(2);
  });

  it('allows a properly prepared, costed, served and paid order to close', () => {
    const submitted = submitCafeOrder(createCafeStore({ tea: 2 }), menu,
      { requestId: 't3-valid', tableId: 'T3', itemId: 'tea', quantity: 1 });
    const preparing = advanceCafeOrder(submitted.store, menu, submitted.order.id, 'preparing');
    const costed = recordCafeOrderCost(preparing, menu, submitted.order.id, { tea: 300 });
    const ready = advanceCafeOrder(costed, menu, submitted.order.id, 'ready');
    const served = advanceCafeOrder(ready, menu, submitted.order.id, 'served');
    const paid = payCafeOrder(served, submitted.order.id);
    const report = closeCafeDay(paid);
    expect(report.unpreparedServedOrderIds).toEqual([]);
    expect(report.readyToClose).toBe(true);
  });
});
