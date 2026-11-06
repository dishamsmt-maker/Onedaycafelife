import { describe, expect, it } from 'vitest';
import { closeCafeDay, createCafeStore } from './orderCore';

describe('daily close numeric boundaries', () => {
  it('does not publish an unsafe gross margin from imported/corrupted accounting state', () => {
    const store = createCafeStore({ flour: 1 });
    store.orders.push({
      id: 'cafe-legacy', requestId: 'legacy', tableId: 'T1', itemId: 'food',
      quantity: 1, unitPriceSatang: 0, status: 'cancelled',
      paidSatang: 0, stockConsumed: true,
      consumedCostSatang: Number.MAX_SAFE_INTEGER,
    });
    store.wasteCostSatang = Number.MAX_SAFE_INTEGER;
    // A negative balance is invalid imported data, but must never yield a
    // plausible closeout or silently rounded gross-margin figure.
    store.cashEvents.push({ id: 'refund-cafe-legacy', orderId: 'cafe-legacy', type: 'refund', amountSatang: 1 });
    store.cashSatang = -1;
    const report = closeCafeDay(store);
    expect(report.readyToClose).toBe(false);
    expect(report.grossMarginSatang).toBeNull();
  });
});
