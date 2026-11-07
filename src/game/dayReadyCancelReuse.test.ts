import { describe, expect, it } from 'vitest';
import { replayGameDayWithStock } from './dayStockReplay';
import { closeGameDay } from './dayCloseReport';
import type { DayEvent } from './dayEventProjection';

describe('ready-order cancellation and table reuse (game only)', () => {
  it('counts prepared food as waste, never revenue, and allows a fresh T3 order', () => {
    const events: DayEvent[] = [
      { id: 'order-a', type: 'ordered', orderId: 'a', tableId: 'T3', itemId: 'tea', totalSatang: 4500 },
      { id: 'prepare-a', type: 'preparing', orderId: 'a' },
      { id: 'ready-a', type: 'ready', orderId: 'a' },
      { id: 'cancel-a', type: 'cancelled', orderId: 'a' },
      { id: 'late-serve', type: 'served', orderId: 'a' },
      { id: 'late-pay', type: 'paid', orderId: 'a' },
      { id: 'order-b', type: 'ordered', orderId: 'b', tableId: 'T3', itemId: 'tea', totalSatang: 4500 },
      { id: 'prepare-b', type: 'preparing', orderId: 'b' },
      { id: 'ready-b', type: 'ready', orderId: 'b' },
      { id: 'serve-b', type: 'served', orderId: 'b' },
      { id: 'pay-b', type: 'paid', orderId: 'b' },
    ];
    const replay = replayGameDayWithStock(events, { teaG: 20 }, { tea: { teaG: 10 } });
    expect(replay.rejectedEventIds).toEqual(['late-serve', 'late-pay']);
    expect(replay.remaining).toEqual({ teaG: 0 });
    expect(replay.consumed).toEqual({ teaG: 20 });
    expect(replay.waste).toEqual({ teaG: 10 });
    expect(replay.day.orders.map(order => order.status)).toEqual(['cancelled', 'paid']);
    expect(closeGameDay(replay)).toMatchObject({
      cancelledOrders: 1, paidOrders: 1, outstandingOrders: 0,
      revenueSatang: 4500, balanced: true,
    });
  });
});
