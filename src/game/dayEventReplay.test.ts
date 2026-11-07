import { describe, expect, it } from 'vitest';
import { replayGameDay } from './dayEventReplay';
import { applyGameDayEvent, emptyGameDay, projectGameDay, type DayEvent } from './dayEventProjection';

describe('game-only event replay audit', () => {
  const events: DayEvent[] = [
    { id: 'order', type: 'ordered', orderId: 'o3', tableId: 'T3', itemId: 'halal-tea', totalSatang: 4500 },
    { id: 'premature-payment', type: 'paid', orderId: 'o3' },
    { id: 'prep', type: 'preparing', orderId: 'o3' },
    { id: 'ready', type: 'ready', orderId: 'o3' },
    { id: 'served', type: 'served', orderId: 'o3' },
    { id: 'payment', type: 'paid', orderId: 'o3' },
    { id: 'payment', type: 'paid', orderId: 'o3' },
  ];
  it('replays T3 kitchen/waiter/manager once and audits invalid actions', () => {
    const replay = replayGameDay(events);
    expect(replay.acceptedEventIds).toEqual(['order', 'prep', 'ready', 'served', 'payment']);
    expect(replay.rejectedEventIds).toEqual(['premature-payment', 'payment']);
    expect(projectGameDay(replay.day).manager).toEqual({ revenueSatang: 4500, openOrders: 0 });
    expect(projectGameDay(replay.day).customer[0].status).toBe('paid');
  });
  it('is deterministic and does not mutate input or real-store state', () => {
    const frozen = Object.freeze(events.map(e => Object.freeze({ ...e })));
    const first = replayGameDay(frozen);
    const second = replayGameDay(frozen);
    expect(first).toEqual(second);
    expect(emptyGameDay().revenueSatang).toBe(0);
    expect(first.day).toEqual(frozen.reduce((day, event) => applyGameDayEvent(day, event), emptyGameDay()));
  });
  it('rejects duplicate table orders until cancellation', () => {
    const replay = replayGameDay([
      { id: 'a', type: 'ordered', orderId: 'o1', tableId: 'T1', itemId: 'tea', totalSatang: 100 },
      { id: 'b', type: 'ordered', orderId: 'o2', tableId: 'T1', itemId: 'tea', totalSatang: 100 },
      { id: 'c', type: 'cancelled', orderId: 'o1' },
      { id: 'd', type: 'ordered', orderId: 'o2', tableId: 'T1', itemId: 'tea', totalSatang: 100 },
    ]);
    expect(replay.rejectedEventIds).toEqual(['b']);
    expect(replay.day.orders).toHaveLength(2);
  });
});
