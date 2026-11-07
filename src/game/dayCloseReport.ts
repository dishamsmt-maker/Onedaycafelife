import type { StockReplay } from './dayStockReplay';

/** Game-only end-of-day summary. No real POS or inventory data is accessed. */
export interface GameDayClose {
  revenueSatang: number;
  paidOrders: number;
  cancelledOrders: number;
  outstandingOrders: number;
  consumed: Record<string, number>;
  waste: Record<string, number>;
  remaining: Record<string, number>;
  rejectedEvents: number;
  balanced: boolean;
}

export function closeGameDay(replay: StockReplay): GameDayClose {
  const orders = replay.day.orders;
  const paid = orders.filter(order => order.status === 'paid');
  const cancelled = orders.filter(order => order.status === 'cancelled');
  const outstanding = orders.length - paid.length - cancelled.length;
  const expectedRevenue = paid.reduce((sum, order) => sum + order.totalSatang, 0);
  const balanced = Number.isSafeInteger(expectedRevenue) &&
    expectedRevenue === replay.day.revenueSatang &&
    Object.values(replay.remaining).every(v => Number.isSafeInteger(v) && v >= 0) &&
    Object.entries(replay.waste).every(([key, value]) =>
      Number.isSafeInteger(value) && value >= 0 && value <= (replay.consumed[key] ?? 0));
  return {
    revenueSatang: replay.day.revenueSatang,
    paidOrders: paid.length,
    cancelledOrders: cancelled.length,
    outstandingOrders: outstanding,
    consumed: { ...replay.consumed },
    waste: { ...replay.waste },
    remaining: { ...replay.remaining },
    rejectedEvents: replay.rejectedEventIds.length,
    balanced,
  };
}
