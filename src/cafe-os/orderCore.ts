/**
 * Café OS prototype boundary. This module NEVER imports game state or writes
 * to the simulator's IndexedDB. Persistence/authentication are separate work.
 */
export type CafeOrderStatus = 'queued' | 'preparing' | 'ready' | 'served' | 'cancelled';
export interface CafeCatalogItem {
  id: string;
  priceSatang: number;
  recipe: Record<string, number>;
  enabled: boolean;
}
export interface CafeOrder {
  id: string;
  requestId: string;
  tableId: string;
  itemId: string;
  quantity: number;
  unitPriceSatang: number;
  status: CafeOrderStatus;
  paidSatang: number;
  stockConsumed: boolean;
}
export interface CafeStore {
  orders: CafeOrder[];
  stock: Record<string, number>;
  cashSatang: number;
}
export type CafeResult = { store: CafeStore; order: CafeOrder; accepted: boolean; reason?: string };
const copy = (store: CafeStore): CafeStore => ({
  orders: store.orders.map(order => ({ ...order })),
  stock: { ...store.stock },
  cashSatang: store.cashSatang,
});
const validId = (s: string) => typeof s === 'string' && s.trim().length > 0;
export function createCafeStore(stock: Record<string, number>): CafeStore {
  if (Object.values(stock).some(n => !Number.isFinite(n) || n < 0)) throw new Error('invalid stock');
  return { orders: [], stock: { ...stock }, cashSatang: 0 };
}
export function submitCafeOrder(
  store: CafeStore, catalog: readonly CafeCatalogItem[],
  request: { requestId: string; tableId: string; itemId: string; quantity: number },
): CafeResult {
  const existing = store.orders.find(o => o.requestId === request.requestId);
  if (existing) {
    const same = existing.tableId === request.tableId && existing.itemId === request.itemId && existing.quantity === request.quantity;
    return { store, order: existing, accepted: same, reason: same ? 'duplicate-retry' : 'request-id-conflict' };
  }
  const item = catalog.find(i => i.id === request.itemId);
  if (!validId(request.requestId) || !validId(request.tableId) || !item?.enabled ||
    !Number.isSafeInteger(request.quantity) || request.quantity <= 0 ||
    !Number.isSafeInteger(item.priceSatang) || item.priceSatang < 0 ||
    !Number.isSafeInteger(item.priceSatang * request.quantity) ||
    Object.entries(item.recipe).some(([id, amount]) => !validId(id) || !Number.isFinite(amount) || amount < 0)) {
    return { store, order: undefined as never, accepted: false, reason: 'invalid-order' };
  }
  const next = copy(store);
  const order: CafeOrder = { id: 'cafe-' + request.requestId, ...request,
    unitPriceSatang: item.priceSatang, status: 'queued', paidSatang: 0, stockConsumed: false };
  next.orders.push(order);
  return { store: next, order, accepted: true };
}
export function advanceCafeOrder(
  store: CafeStore, catalog: readonly CafeCatalogItem[], orderId: string,
  nextStatus: CafeOrderStatus,
): CafeStore {
  const old = store.orders.find(o => o.id === orderId);
  if (!old || old.status === nextStatus) return store;
  const allowed: Record<CafeOrderStatus, CafeOrderStatus[]> = {
    queued: ['preparing', 'cancelled'], preparing: ['ready', 'cancelled'],
    ready: ['served', 'cancelled'], served: [], cancelled: [],
  };
  if (!allowed[old.status].includes(nextStatus)) return store;
  const next = copy(store);
  const order = next.orders.find(o => o.id === orderId)!;
  if (nextStatus === 'preparing' && !order.stockConsumed) {
    const item = catalog.find(i => i.id === order.itemId);
    if (!item) return store;
    const needs = Object.entries(item.recipe).map(([id, n]) => [id, n * order.quantity] as const);
    if (needs.some(([id, n]) => !Number.isFinite(n) || n < 0 || (next.stock[id] ?? 0) < n)) return store;
    for (const [id, n] of needs) next.stock[id] -= n;
    order.stockConsumed = true;
  }
  order.status = nextStatus;
  return next;
}
export function payCafeOrder(store: CafeStore, orderId: string): CafeStore {
  const old = store.orders.find(o => o.id === orderId);
  if (!old || old.status === 'cancelled' || old.paidSatang > 0) return store;
  const amount = old.quantity * old.unitPriceSatang;
  if (!Number.isSafeInteger(amount) || amount < 0) return store;
  const next = copy(store);
  next.orders.find(o => o.id === orderId)!.paidSatang = amount;
  next.cashSatang += amount;
  return next;
}
