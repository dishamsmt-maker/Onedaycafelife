import { describe, expect, it } from 'vitest';
import { replayGameDayWithStock } from './dayStockReplay';
import { closeGameDay } from './dayCloseReport';
import { projectGameDay, type DayEvent } from './dayEventProjection';

describe('five-table game-only day close vertical slice', () => {
  it('shares T3 kitchen/waiter/manager state, rejects duplicates and closes balanced', () => {
    const events: DayEvent[] = [];
    for (let i = 1; i <= 5; i++) {
      events.push({ id: `order-${i}`, type: 'ordered', orderId: `o${i}`, tableId: `T${i}`, itemId: 'tea', totalSatang: 4500 });
    }
    // Repeated tap must not create another active order for the same table.
    events.push({ id: 'repeat-t3', type: 'ordered', orderId: 'duplicate', tableId: 'T3', itemId: 'tea', totalSatang: 4500 });
    events.push({ id: 'prep-t3', type: 'preparing', orderId: 'o3' });
    const stock = { waterMl: 1000, teaG: 50 };
    const recipes = { tea: { waterMl: 200, teaG: 10 } };
    const kitchen = replayGameDayWithStock(events, stock, recipes);
    expect(projectGameDay(kitchen.day).kitchen).toContainEqual({ orderId: 'o3', itemId: 'tea', status: 'preparing' });
    expect(kitchen.remaining).toEqual({ waterMl: 800, teaG: 40 });
    events.push({ id: 'ready-t3', type: 'ready', orderId: 'o3' });
    const waiter = replayGameDayWithStock(events, stock, recipes);
    expect(projectGameDay(waiter.day).waiter).toContainEqual({ orderId: 'o3', tableId: 'T3' });
    events.push({ id: 'served-t3', type: 'served', orderId: 'o3' });
    events.push({ id: 'paid-t3', type: 'paid', orderId: 'o3' });
    events.push({ id: 'paid-again', type: 'paid', orderId: 'o3' });
    // Four other orders cancel before preparation, without consuming ingredients.
    for (const i of [1, 2, 4, 5]) events.push({ id: `cancel-${i}`, type: 'cancelled', orderId: `o${i}` });
    const result = replayGameDayWithStock(events, stock, recipes);
    const report = closeGameDay(result);
    expect(result.rejectedEventIds).toEqual(['repeat-t3', 'paid-again']);
    expect(projectGameDay(result.day).manager).toEqual({ revenueSatang: 4500, openOrders: 0 });
    expect(report.paidOrders).toBe(1);
    expect(report.cancelledOrders).toBe(4);
    expect(report.outstandingOrders).toBe(0);
    expect(report.revenueSatang).toBe(4500);
    expect(report.consumed).toEqual({ waterMl: 200, teaG: 10 });
    expect(report.waste).toEqual({});
    expect(report.balanced).toBe(true);
  });
});
