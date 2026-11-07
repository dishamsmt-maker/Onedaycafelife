import { describe, expect, it } from 'vitest';
import { closeGameDay } from './dayCloseReport';
import { replayGameDayWithStock } from './dayStockReplay';
import type { DayEvent } from './dayEventProjection';

const events: DayEvent[] = [
  { id: 'order', type: 'ordered', orderId: 'o1', tableId: 'T3', itemId: 'tea', totalSatang: 4500 },
  { id: 'prep', type: 'preparing', orderId: 'o1' },
  { id: 'ready', type: 'ready', orderId: 'o1' },
  { id: 'served', type: 'served', orderId: 'o1' },
  { id: 'paid', type: 'paid', orderId: 'o1' },
];

describe('day close stock invariants', () => {
  it('accepts stock consumption from an ordinary replay', () => {
    const snapshot = replayGameDayWithStock(events, { tea: 20 }, { tea: { tea: 10 } });
    expect(closeGameDay(snapshot).balanced).toBe(true);
  });
  it('flags missing stock, negative usage, and unsafe totals', () => {
    const snapshot = replayGameDayWithStock(events, { tea: 20 }, { tea: { tea: 10 } });
    expect(closeGameDay({ ...snapshot, remaining: {} }).balanced).toBe(false);
    expect(closeGameDay({ ...snapshot, consumed: { tea: -1 } }).balanced).toBe(false);
    expect(closeGameDay({ ...snapshot, consumed: { tea: Number.MAX_SAFE_INTEGER } }).balanced).toBe(false);
  });
});
