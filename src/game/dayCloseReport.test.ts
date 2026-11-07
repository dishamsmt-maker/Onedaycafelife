import { describe, expect, it } from 'vitest';
import { replayGameDayWithStock } from './dayStockReplay';
import { closeGameDay } from './dayCloseReport';
import type { DayEvent } from './dayEventProjection';

const ordered = (id: string, tableId: string): DayEvent => ({
  id: 'order-' + id, type: 'ordered', orderId: id, tableId, itemId: 'tea', totalSatang: 4500,
});
const step = (id: string, type: 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled', orderId: string): DayEvent =>
  ({ id, type, orderId });
describe('game-only day close report', () => {
  it('reconciles one paid order, waste and an outstanding order', () => {
    const events: DayEvent[] = [
      ordered('a', 'T3'), step('prep-a', 'preparing', 'a'), step('ready-a', 'ready', 'a'),
      step('serve-a', 'served', 'a'), step('pay-a', 'paid', 'a'),
      ordered('b', 'T2'), step('prep-b', 'preparing', 'b'), step('cancel-b', 'cancelled', 'b'),
      ordered('c', 'T1'), step('invalid-pay', 'paid', 'c'),
    ];
    const replay = replayGameDayWithStock(events, { waterMl: 600 }, { tea: { waterMl: 200 } });
    const close = closeGameDay(replay);
    expect(close).toMatchObject({
      revenueSatang: 4500, paidOrders: 1, cancelledOrders: 1,
      outstandingOrders: 1, remaining: { waterMl: 200 },
      consumed: { waterMl: 400 }, waste: { waterMl: 200 },
      rejectedEvents: 1, balanced: true,
    });
    close.remaining.waterMl = 0;
    expect(replay.remaining.waterMl).toBe(200);
  });
  it('flags an inconsistent revenue ledger without silently correcting it', () => {
    const replay = replayGameDayWithStock([
      ordered('a', 'T3'), step('prep', 'preparing', 'a'), step('ready', 'ready', 'a'),
      step('serve', 'served', 'a'), step('pay', 'paid', 'a'),
    ], { waterMl: 200 }, { tea: { waterMl: 200 } });
    expect(closeGameDay({ ...replay, day: { ...replay.day, revenueSatang: 0 } }).balanced).toBe(false);
  });
});
