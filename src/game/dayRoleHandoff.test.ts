import { describe, expect, it } from 'vitest';
import { applyGameDayEvent, emptyGameDay, projectGameDay, type DayEvent } from './dayEventProjection';
import { replayGameDayWithStock } from './dayStockReplay';
import { closeGameDay } from './dayCloseReport';

describe('T3 customer to Na to Ken to manager shared simulation handoff', () => {
  const ordered: DayEvent = {
    id: 'qr-t3-1', type: 'ordered', orderId: 't3-1', tableId: 'T3',
    itemId: 'tea', totalSatang: 4500,
  };
  const preparing: DayEvent = { id: 'na-start', type: 'preparing', orderId: 't3-1' };
  const ready: DayEvent = { id: 'na-ready', type: 'ready', orderId: 't3-1' };
  const served: DayEvent = { id: 'ken-served', type: 'served', orderId: 't3-1' };
  const paid: DayEvent = { id: 'pos-paid', type: 'paid', orderId: 't3-1' };

  it('projects each role from the same accepted event sequence', () => {
    let day = applyGameDayEvent(emptyGameDay(), ordered);
    expect(projectGameDay(day).kitchen).toEqual([
      { orderId: 't3-1', itemId: 'tea', status: 'queued' },
    ]);
    expect(projectGameDay(day).manager).toEqual({ revenueSatang: 0, openOrders: 1 });
    day = applyGameDayEvent(day, preparing);
    expect(projectGameDay(day).kitchen[0].status).toBe('preparing');
    day = applyGameDayEvent(day, ready);
    expect(projectGameDay(day).kitchen).toEqual([]);
    expect(projectGameDay(day).waiter).toEqual([{ orderId: 't3-1', tableId: 'T3' }]);
    day = applyGameDayEvent(day, served);
    expect(projectGameDay(day).waiter).toEqual([]);
    expect(projectGameDay(day).customer[0].status).toBe('served');
    day = applyGameDayEvent(day, paid);
    expect(projectGameDay(day).manager).toEqual({ revenueSatang: 4500, openOrders: 0 });
    expect(projectGameDay(day).customer[0].status).toBe('paid');
    expect(applyGameDayEvent(day, { ...paid, id: 'second-pos-tap' })).toBe(day);
  });

  it('deducts stock only when Na starts preparation, never on QR or payment', () => {
    const stock = { teaG: 10, waterMl: 200 };
    const recipes = { tea: { teaG: 10, waterMl: 200 } };
    const beforePreparation = replayGameDayWithStock([ordered], stock, recipes);
    expect(beforePreparation.remaining).toEqual(stock);
    const afterPreparation = replayGameDayWithStock([ordered, preparing], stock, recipes);
    expect(afterPreparation.remaining).toEqual({ teaG: 0, waterMl: 0 });
    const completed = replayGameDayWithStock(
      [ordered, preparing, ready, served, paid, { ...paid, id: 'second-pos-tap' }],
      stock, recipes,
    );
    expect(completed.rejectedEventIds).toEqual(['second-pos-tap']);
    expect(completed.consumed).toEqual({ teaG: 10, waterMl: 200 });
    expect(closeGameDay(completed)).toMatchObject({
      paidOrders: 1, outstandingOrders: 0, revenueSatang: 4500, balanced: true,
    });
  });

  it('does not release consumed stock when an in-progress order is cancelled', () => {
    const replay = replayGameDayWithStock([
      ordered, preparing,
      { id: 'cancel-t3', type: 'cancelled', orderId: 't3-1' },
      paid,
    ], { teaG: 10 }, { tea: { teaG: 10 } });
    expect(replay.rejectedEventIds).toEqual(['pos-paid']);
    expect(replay.remaining.teaG).toBe(0);
    expect(replay.waste.teaG).toBe(10);
    expect(closeGameDay(replay)).toMatchObject({
      cancelledOrders: 1, revenueSatang: 0, outstandingOrders: 0, balanced: true,
    });
  });
});
