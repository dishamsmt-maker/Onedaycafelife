/**
 * Game-only day event projection. Never import Café OS store, payments or stock:
 * demo events and balances must not mutate real-shop accounting.
 */
export type DayEvent =
  | { id: string; type: 'ordered'; orderId: string; tableId: string; itemId: string; totalSatang: number }
  | { id: string; type: 'preparing' | 'ready' | 'served' | 'paid'; orderId: string }
  | { id: string; type: 'cancelled'; orderId: string };
export type GameOrderStatus = 'queued' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled';
export interface GameOrder {
  id: string; tableId: string; itemId: string; totalSatang: number; status: GameOrderStatus;
}
export interface GameDay {
  seenEventIds: string[];
  orders: GameOrder[];
  revenueSatang: number;
}
export const emptyGameDay = (): GameDay => ({ seenEventIds: [], orders: [], revenueSatang: 0 });
const nextStatus: Record<GameOrderStatus, readonly GameOrderStatus[]> = {
  queued: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'],
  ready: ['served', 'cancelled'], served: ['paid'], paid: [], cancelled: [],
};
/** Reject invalid/out-of-order/replayed events without mutating previous state. */
export function applyGameDayEvent(day: GameDay, event: DayEvent): GameDay {
  if (!event.id.trim() || day.seenEventIds.includes(event.id) || !event.orderId.trim()) return day;
  if (event.type === 'ordered') {
    if (!event.tableId.trim() || !event.itemId.trim() ||
      !Number.isSafeInteger(event.totalSatang) || event.totalSatang < 0 ||
      day.orders.some(o => o.id === event.orderId)) return day;
    return { ...day, seenEventIds: [...day.seenEventIds, event.id],
      orders: [...day.orders, { id: event.orderId, tableId: event.tableId,
        itemId: event.itemId, totalSatang: event.totalSatang, status: 'queued' }] };
  }
  const order = day.orders.find(o => o.id === event.orderId);
  if (!order || !nextStatus[order.status].includes(event.type)) return day;
  const revenue = event.type === 'paid' ? day.revenueSatang + order.totalSatang : day.revenueSatang;
  if (!Number.isSafeInteger(revenue)) return day;
  return { seenEventIds: [...day.seenEventIds, event.id],
    orders: day.orders.map(o => o.id === event.orderId ? { ...o, status: event.type } : o),
    revenueSatang: revenue };
}
/** All three roles read one immutable simulation snapshot. */
export function projectGameDay(day: GameDay) {
  return {
    customer: day.orders.map(o => ({ orderId: o.id, tableId: o.tableId, status: o.status })),
    kitchen: day.orders.filter(o => o.status === 'queued' || o.status === 'preparing')
      .map(o => ({ orderId: o.id, itemId: o.itemId, status: o.status })),
    waiter: day.orders.filter(o => o.status === 'ready')
      .map(o => ({ orderId: o.id, tableId: o.tableId })),
    manager: { revenueSatang: day.revenueSatang,
      openOrders: day.orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length },
  };
}
