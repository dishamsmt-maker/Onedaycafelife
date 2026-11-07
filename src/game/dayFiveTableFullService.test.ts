import { describe, expect, it } from 'vitest';
import { replayGameDayWithStock } from './dayStockReplay';
import { closeGameDay } from './dayCloseReport';
import { projectGameDay, type DayEvent } from './dayEventProjection';

describe('five-table full-service game day', () => {
  it('serves and pays all five tables exactly once and allows a table to reopen', () => {
    const events: DayEvent[] = [];
    for (let table = 1; table <= 5; table++) {
      const orderId = `order-${table}`;
      events.push({ id: `order-event-${table}`, type: 'ordered', orderId, tableId: `T${table}`, itemId: 'tea', totalSatang: 4500 });
      events.push({ id: `prepare-${table}`, type: 'preparing', orderId });
      events.push({ id: `ready-${table}`, type: 'ready', orderId });
      events.push({ id: `serve-${table}`, type: 'served', orderId });
      events.push({ id: `pay-${table}`, type: 'paid', orderId });
    }
    // A new customer may use T3 after the previous order is paid.
    events.push({ id: 'reopen-t3', type: 'ordered', orderId: 'order-6', tableId: 'T3', itemId: 'tea', totalSatang: 4500 });
    events.push({ id: 'prepare-6', type: 'preparing', orderId: 'order-6' });
    events.push({ id: 'ready-6', type: 'ready', orderId: 'order-6' });
    events.push({ id: 'serve-6', type: 'served', orderId: 'order-6' });
    events.push({ id: 'pay-6', type: 'paid', orderId: 'order-6' });
    // A duplicate payment with a new event ID still cannot add revenue.
    events.push({ id: 'double-charge', type: 'paid', orderId: 'order-6' });
    const replay = replayGameDayWithStock(events, { waterMl: 1200, teaG: 60 }, { tea: { waterMl: 200, teaG: 10 } });
    const report = closeGameDay(replay);
    expect(replay.rejectedEventIds).toEqual(['double-charge']);
    expect(replay.remaining).toEqual({ waterMl: 0, teaG: 0 });
    expect(report.consumed).toEqual({ waterMl: 1200, teaG: 60 });
    expect(report.paidOrders).toBe(6);
    expect(report.outstandingOrders).toBe(0);
    expect(report.revenueSatang).toBe(27000);
    expect(report.balanced).toBe(true);
    expect(projectGameDay(replay.day).manager).toEqual({ revenueSatang: 27000, openOrders: 0 });
  });

  it('rejects preparation when stock runs out, preserving the unpaid kitchen queue', () => {
    const events: DayEvent[] = [
      { id: 'order-t1', type: 'ordered', orderId: 'a', tableId: 'T1', itemId: 'tea', totalSatang: 4500 },
      { id: 'order-t2', type: 'ordered', orderId: 'b', tableId: 'T2', itemId: 'tea', totalSatang: 4500 },
      { id: 'prep-t1', type: 'preparing', orderId: 'a' },
      { id: 'prep-t2', type: 'preparing', orderId: 'b' },
    ];
    const replay = replayGameDayWithStock(events, { teaG: 10 }, { tea: { teaG: 10 } });
    expect(replay.rejectedEventIds).toEqual(['prep-t2']);
    expect(replay.remaining.teaG).toBe(0);
    expect(projectGameDay(replay.day).kitchen).toContainEqual({ orderId: 'b', itemId: 'tea', status: 'queued' });
    expect(closeGameDay(replay).revenueSatang).toBe(0);
  });
});
