import { describe, expect, it } from 'vitest';
import { applyGameDayEvent, emptyGameDay, projectGameDay } from './dayEventProjection';

describe('three-role shared game day (never touches real Café OS)', () => {
  it('T3 order -> Na kitchen -> Ken serves -> manager revenue; retries do not double count', () => {
    const initial = emptyGameDay();
    const ordered = applyGameDayEvent(initial, {
      id: 'e1', type: 'ordered', orderId: 'o3', tableId: 'T3', itemId: 'halal-tea', totalSatang: 4500,
    });
    expect(projectGameDay(ordered).kitchen).toEqual([{ orderId: 'o3', itemId: 'halal-tea', status: 'queued' }]);
    expect(projectGameDay(ordered).customer[0].status).toBe('queued');
    const preparing = applyGameDayEvent(ordered, { id: 'e2', type: 'preparing', orderId: 'o3' });
    const ready = applyGameDayEvent(preparing, { id: 'e3', type: 'ready', orderId: 'o3' });
    expect(projectGameDay(ready).waiter).toEqual([{ orderId: 'o3', tableId: 'T3' }]);
    const served = applyGameDayEvent(ready, { id: 'e4', type: 'served', orderId: 'o3' });
    expect(projectGameDay(served).waiter).toEqual([]);
    const paid = applyGameDayEvent(served, { id: 'e5', type: 'paid', orderId: 'o3' });
    expect(projectGameDay(paid).manager).toEqual({ revenueSatang: 4500, openOrders: 0 });
    expect(projectGameDay(paid).customer[0].status).toBe('paid');
    expect(applyGameDayEvent(paid, { id: 'e5', type: 'paid', orderId: 'o3' })).toBe(paid);
    expect(applyGameDayEvent(paid, { id: 'e6', type: 'paid', orderId: 'o3' })).toBe(paid);
    expect(initial.orders).toEqual([]);
  });
  it('rejects out-of-order events and conflicting order IDs', () => {
    const day = applyGameDayEvent(emptyGameDay(), {
      id: 'a', type: 'ordered', orderId: 'o1', tableId: 'T1', itemId: 'tea', totalSatang: 100,
    });
    expect(applyGameDayEvent(day, { id: 'b', type: 'paid', orderId: 'o1' })).toBe(day);
    expect(applyGameDayEvent(day, {
      id: 'c', type: 'ordered', orderId: 'o1', tableId: 'T2', itemId: 'tea', totalSatang: 100,
    })).toBe(day);
    const cancelled = applyGameDayEvent(day, { id: 'd', type: 'cancelled', orderId: 'o1' });
    expect(projectGameDay(cancelled).manager).toEqual({ revenueSatang: 0, openOrders: 0 });
    expect(applyGameDayEvent(cancelled, { id: 'e', type: 'preparing', orderId: 'o1' })).toBe(cancelled);
  });
  it('accepts only five demo tables and one active order per table', () => {
    const initial = emptyGameDay();
    const first = applyGameDayEvent(initial, { id: 'a1', type: 'ordered', orderId: 'first', tableId: 'T3', itemId: 'tea', totalSatang: 4500 });
    expect(applyGameDayEvent(first, { id: 'a2', type: 'ordered', orderId: 'second', tableId: 'T3', itemId: 'tea', totalSatang: 4500 })).toBe(first);
    expect(applyGameDayEvent(first, { id: 'a3', type: 'ordered', orderId: 'third', tableId: 'T6', itemId: 'tea', totalSatang: 4500 })).toBe(first);
    expect(applyGameDayEvent(first, { id: 'a4', type: 'ordered', orderId: 'fourth', tableId: 'T0', itemId: 'tea', totalSatang: 4500 })).toBe(first);
    const other = applyGameDayEvent(first, { id: 'a5', type: 'ordered', orderId: 'other', tableId: 'T4', itemId: 'tea', totalSatang: 4500 });
    expect(other.orders).toHaveLength(2);
    const cancelled = applyGameDayEvent(other, { id: 'a6', type: 'cancelled', orderId: 'first' });
    const replacement = applyGameDayEvent(cancelled, { id: 'a7', type: 'ordered', orderId: 'replacement', tableId: 'T3', itemId: 'tea', totalSatang: 4500 });
    expect(replacement.orders).toHaveLength(3);
    expect(projectGameDay(replacement).manager.openOrders).toBe(2);
  });

});
