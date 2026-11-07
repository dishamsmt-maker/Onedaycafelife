import { describe, expect, it } from 'vitest';
import { replayGameDayWithStock } from './dayStockReplay';
import type { DayEvent } from './dayEventProjection';

describe('game inventory safe integer boundaries', () => {
  it('rejects a second preparation when remaining stock cannot cover it', () => {
    const events: DayEvent[] = [
      { id: 'o1', type: 'ordered', orderId: 'one', tableId: 'T1', itemId: 'tea', totalSatang: 4500 },
      { id: 'o2', type: 'ordered', orderId: 'two', tableId: 'T2', itemId: 'tea', totalSatang: 4500 },
      { id: 'p1', type: 'preparing', orderId: 'one' },
      { id: 'p2', type: 'preparing', orderId: 'two' },
    ];
    const result = replayGameDayWithStock(events, { tea: Number.MAX_SAFE_INTEGER }, {
      tea: { tea: Number.MAX_SAFE_INTEGER },
    });
    expect(result.remaining.tea).toBe(0);
    expect(result.consumed.tea).toBe(Number.MAX_SAFE_INTEGER);
    expect(result.rejectedEventIds).toContain('p2');
    expect(result.day.orders.find(o => o.id === 'two')?.status).toBe('queued');
  });

  it('keeps consumption and waste in safe integer range after cancellation', () => {
    const events: DayEvent[] = [
      { id: 'o1', type: 'ordered', orderId: 'one', tableId: 'T3', itemId: 'tea', totalSatang: 4500 },
      { id: 'p1', type: 'preparing', orderId: 'one' },
      { id: 'c1', type: 'cancelled', orderId: 'one' },
    ];
    const result = replayGameDayWithStock(events, { tea: Number.MAX_SAFE_INTEGER }, {
      tea: { tea: Number.MAX_SAFE_INTEGER },
    });
    expect(result.consumed.tea).toBe(Number.MAX_SAFE_INTEGER);
    expect(result.waste.tea).toBe(Number.MAX_SAFE_INTEGER);
    expect(result.rejectedEventIds).toEqual([]);
  });
});
