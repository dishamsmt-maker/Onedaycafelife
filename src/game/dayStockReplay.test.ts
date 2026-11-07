import { describe, expect, it } from 'vitest';
import { replayGameDayWithStock } from './dayStockReplay';

const recipes = { tea: { waterMl: 200, teaG: 10 } };
const order = (id: string, tableId = 'T3') => ({
  id: 'order-' + id, type: 'ordered' as const, orderId: id, tableId, itemId: 'tea', totalSatang: 4500,
});
describe('isolated game day stock replay', () => {
  it('consumes ingredients once when Na starts preparation, not on ordering or payment', () => {
    const events = [order('o1'), { id: 'prep', type: 'preparing' as const, orderId: 'o1' },
      { id: 'prep', type: 'preparing' as const, orderId: 'o1' },
      { id: 'ready', type: 'ready' as const, orderId: 'o1' },
      { id: 'serve', type: 'served' as const, orderId: 'o1' },
      { id: 'pay', type: 'paid' as const, orderId: 'o1' }];
    const initial = Object.freeze({ waterMl: 250, teaG: 12 });
    const result = replayGameDayWithStock(events, initial, recipes);
    expect(result.remaining).toEqual({ waterMl: 50, teaG: 2 });
    expect(result.consumed).toEqual({ waterMl: 200, teaG: 10 });
    expect(result.day.revenueSatang).toBe(4500);
    expect(result.rejectedEventIds).toEqual(['prep']);
    expect(initial.waterMl).toBe(250);
    expect(replayGameDayWithStock(events, initial, recipes)).toEqual(result);
  });
  it('rejects out of stock preparation without changing state or counting revenue', () => {
    const result = replayGameDayWithStock([order('o1'),
      { id: 'prep', type: 'preparing', orderId: 'o1' }], { waterMl: 100, teaG: 20 }, recipes);
    expect(result.rejectedEventIds).toEqual(['prep']);
    expect(result.remaining).toEqual({ waterMl: 100, teaG: 20 });
    expect(result.day.orders[0].status).toBe('queued');
  });
  it('cancels before preparation without waste; cancellation after preparation records waste', () => {
    const result = replayGameDayWithStock([order('o1'),
      { id: 'cancel1', type: 'cancelled', orderId: 'o1' },
      order('o2'), { id: 'prep2', type: 'preparing', orderId: 'o2' },
      { id: 'cancel2', type: 'cancelled', orderId: 'o2' }],
      { waterMl: 400, teaG: 20 }, recipes);
    expect(result.waste).toEqual({ waterMl: 200, teaG: 10 });
    expect(result.remaining).toEqual({ waterMl: 200, teaG: 10 });
    expect(result.day.revenueSatang).toBe(0);
  });
  it('rejects unknown menu items and invalid stock inputs', () => {
    expect(replayGameDayWithStock([{ ...order('o1'), itemId: 'unknown' }],
      { waterMl: 200, teaG: 10 }, recipes).rejectedEventIds).toEqual(['order-o1']);
    expect(() => replayGameDayWithStock([], { waterMl: -1 }, recipes)).toThrow();
    expect(() => replayGameDayWithStock([], { waterMl: 100 }, { free: { waterMl: 0 } })).toThrow();
    expect(() => replayGameDayWithStock([], { waterMl: 100 }, { free: {} })).toThrow();
    expect(() => replayGameDayWithStock([], { waterMl: 100 }, { tea: { waterMl: 1 } })).not.toThrow();
  });
});
