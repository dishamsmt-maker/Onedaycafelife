import { describe, expect, it } from 'vitest';
import { replayGameDayWithStock } from './dayStockReplay';
import { closeGameDay } from './dayCloseReport';
import type { DayEvent } from './dayEventProjection';

const order = (id: string, tableId: string, eventId: string): DayEvent => ({
  id: eventId, type: 'ordered', orderId: id, tableId,
  itemId: 'halal-tea', totalSatang: 4500,
});
const step = (id: string, type: 'preparing' | 'ready' | 'served' | 'paid', eventId: string): DayEvent =>
  ({ id: eventId, type, orderId: id });

describe('game-only multi-table inventory and end-of-day invariants', () => {
  it('prevents overselling when two tables compete for the final serving', () => {
    const events: DayEvent[] = [
      order('o1', 'T1', 'e1'), order('o2', 'T2', 'e2'),
      step('o1', 'preparing', 'e3'), step('o2', 'preparing', 'e4'),
      step('o1', 'ready', 'e5'), step('o1', 'served', 'e6'),
      step('o1', 'paid', 'e7'),
    ];
    const snapshot = replayGameDayWithStock(events, { teaLeaves: 10, milkMl: 100 }, {
      'halal-tea': { teaLeaves: 10, milkMl: 100 },
    });
    expect(snapshot.rejectedEventIds).toEqual(['e4']);
    expect(snapshot.day.orders.map(o => o.status)).toEqual(['paid', 'queued']);
    expect(snapshot.remaining).toEqual({ teaLeaves: 0, milkMl: 0 });
    expect(snapshot.consumed).toEqual({ teaLeaves: 10, milkMl: 100 });
    expect(snapshot.day.revenueSatang).toBe(4500);
    expect(closeGameDay(snapshot)).toMatchObject({
      paidOrders: 1, outstandingOrders: 1, revenueSatang: 4500, balanced: true,
    });
  });

  it('rejects rapid duplicate order and preparation without double charging or consuming', () => {
    const events: DayEvent[] = [
      order('o3', 'T3', 'tap1'), order('o4', 'T3', 'tap2'),
      step('o3', 'preparing', 'prep1'), step('o3', 'preparing', 'prep2'),
      step('o3', 'ready', 'ready'), step('o3', 'served', 'served'),
      step('o3', 'paid', 'pay1'), step('o3', 'paid', 'pay2'),
    ];
    const snapshot = replayGameDayWithStock(events, { teaLeaves: 30 }, {
      'halal-tea': { teaLeaves: 10 },
    });
    expect(snapshot.rejectedEventIds).toEqual(['tap2', 'prep2', 'pay2']);
    expect(snapshot.remaining.teaLeaves).toBe(20);
    expect(snapshot.day.orders).toHaveLength(1);
    expect(snapshot.day.revenueSatang).toBe(4500);
    expect(closeGameDay(snapshot)).toMatchObject({
      paidOrders: 1, outstandingOrders: 0, rejectedEvents: 3, balanced: true,
    });
  });
});
