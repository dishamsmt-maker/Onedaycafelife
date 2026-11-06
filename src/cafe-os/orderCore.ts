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
  paymentRecorded?: boolean;
  refundedSatang?: number;
  stockConsumed: boolean;
  consumedCostSatang?: number;
  /** Recipe frozen when the order is accepted, preventing catalog edits changing stock usage. */
  recipeSnapshot?: Record<string, number>;
}
export interface CafeCashEvent {
  id: string;
  orderId: string;
  type: 'payment' | 'refund';
  amountSatang: number;
}
export interface CafeStore {
  cashEvents: CafeCashEvent[];
  orders: CafeOrder[];
  stock: Record<string, number>;
  cashSatang: number;
  wasteCostSatang: number;
}
export type CafeResult = { store: CafeStore; order: CafeOrder; accepted: boolean; reason?: string };
const copy = (store: CafeStore): CafeStore => ({
  orders: store.orders.map(order => ({ ...order, recipeSnapshot: order.recipeSnapshot ? { ...order.recipeSnapshot } : undefined })),
  stock: { ...store.stock },
  cashEvents: (store.cashEvents ?? []).map(e => ({ ...e })),
  cashSatang: store.cashSatang,
  wasteCostSatang: store.wasteCostSatang ?? 0,
});
const validId = (s: string) => typeof s === 'string' && s.trim().length > 0;
export function createCafeStore(stock: Record<string, number>): CafeStore {
  if (Object.entries(stock).some(([id, n]) => !validId(id) || !Number.isFinite(n) || n < 0)) throw new Error('invalid stock');
  return { orders: [], stock: { ...stock }, cashEvents: [], cashSatang: 0, wasteCostSatang: 0 };
}
export function submitCafeOrder(
  store: CafeStore, catalog: readonly CafeCatalogItem[],
  request: { requestId: string; tableId: string; itemId: string; quantity: number },
): CafeResult {
  const existing = store.orders.find(o => o.requestId === request.requestId);
  if (existing) {
    const same = existing.tableId === request.tableId && existing.itemId === request.itemId && existing.quantity === request.quantity;
    return { store, order: { ...existing, recipeSnapshot: existing.recipeSnapshot ? { ...existing.recipeSnapshot } : undefined }, accepted: same, reason: same ? 'duplicate-retry' : 'request-id-conflict' };
  }
  const item = catalog.find(i => i.id === request.itemId);
  // A single request ID must map to one canonical order ID, including after retries.
  // Prevent collisions if legacy/imported state already contains the derived ID.
  if (store.orders.some(o => o.id === 'cafe-' + request.requestId)) {
    return { store, order: undefined as never, accepted: false, reason: 'order-id-conflict' };
  }
  if (!validId(request.requestId) || !validId(request.tableId) || !item?.enabled ||
    !Number.isSafeInteger(request.quantity) || request.quantity <= 0 ||
    !Number.isSafeInteger(item.priceSatang) || item.priceSatang < 0 ||
    !Number.isSafeInteger(item.priceSatang * request.quantity) ||
    Object.entries(item.recipe).some(([id, amount]) => !validId(id) || !Number.isFinite(amount) || amount < 0 || !Number.isFinite(amount * request.quantity))) {
    return { store, order: undefined as never, accepted: false, reason: 'invalid-order' };
  }
  // Reserve availability for queued orders without deducting physical stock
  // until preparation. This rejects sold-out QR requests and overselling.
  const recipe = item.recipe;
  const available = Object.entries(recipe).every(([ingredient, perItem]) => {
    const required = perItem * request.quantity;
    const committed = store.orders
      .filter(o => o.status === 'queued' && !o.stockConsumed)
      .reduce((sum, o) => {
        // Legacy queued orders may predate recipe snapshots. Never silently
        // treat their reservations as zero and oversell physical inventory.
        const reservedRecipe = o.recipeSnapshot ?? catalog.find(i => i.id === o.itemId)?.recipe;
        if (!reservedRecipe || !Number.isSafeInteger(o.quantity) || o.quantity <= 0) return NaN;
        const reserved = (reservedRecipe[ingredient] ?? 0) * o.quantity;
        return Number.isFinite(reserved) && reserved >= 0 ? sum + reserved : NaN;
      }, 0);
    const onHand = store.stock[ingredient];
    return Number.isFinite(onHand) && Number.isFinite(committed) &&
      Number.isFinite(required) && onHand >= 0 && onHand - committed >= required;
  });
  if (!available) return { store, order: undefined as never, accepted: false, reason: 'out-of-stock' };
  const next = copy(store);
  const order: CafeOrder = { id: 'cafe-' + request.requestId, ...request,
    unitPriceSatang: item.priceSatang, recipeSnapshot: { ...item.recipe }, status: 'queued', paidSatang: 0, paymentRecorded: false, stockConsumed: false };
  next.orders.push(order);
  // The response is a detached view: callers cannot mutate the stored recipe.
  return { store: next, order: { ...order, recipeSnapshot: { ...order.recipeSnapshot } }, accepted: true };
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
  // A paid order needs an explicit refund transaction before cancellation.
  if (nextStatus === 'cancelled' && (old.paymentRecorded || old.paidSatang > 0)) return store;
  if (!allowed[old.status].includes(nextStatus)) return store;
  const next = copy(store);
  const order = next.orders.find(o => o.id === orderId)!;
  if (nextStatus === 'preparing' && !order.stockConsumed) {
    const item = catalog.find(i => i.id === order.itemId);
    if (!item && !order.recipeSnapshot) return store;
    const needs = Object.entries(order.recipeSnapshot ?? item!.recipe).map(([id, n]) => [id, n * order.quantity] as const);
    if (needs.some(([id, n]) => !Number.isFinite(n) || n < 0 || !Number.isFinite(next.stock[id]) || next.stock[id] < n || !Number.isFinite(next.stock[id] - n))) return store;
    for (const [id, n] of needs) next.stock[id] -= n;
    order.stockConsumed = true;
  }
  if (nextStatus === 'cancelled' && order.stockConsumed) {
    const waste = next.wasteCostSatang + (order.consumedCostSatang ?? 0);
    if (!Number.isSafeInteger(waste)) return store;
    next.wasteCostSatang = waste;
  }
  order.status = nextStatus;
  return next;
}
export function payCafeOrder(store: CafeStore, orderId: string): CafeStore {
  const old = store.orders.find(o => o.id === orderId);
  if (!old || old.status === 'cancelled' || (old.paymentRecorded || old.paidSatang > 0)) return store;
  const amount = old.quantity * old.unitPriceSatang;
  if (!Number.isSafeInteger(amount) || amount < 0) return store;
  const next = copy(store);
  const paidOrder = next.orders.find(o => o.id === orderId)!;
  paidOrder.paidSatang = amount;
  paidOrder.paymentRecorded = true;
  if (!Number.isSafeInteger(next.cashSatang + amount)) return store;
  next.cashSatang += amount;
  next.cashEvents.push({ id: 'payment-' + orderId, orderId, type: 'payment', amountSatang: amount });
  return next;
}

/**
 * Explicit full refund and cancellation. Consumed ingredients remain consumed
 * (waste accounting is a separate follow-up). Retrying cannot refund twice.
 */
export function refundAndCancelCafeOrder(store: CafeStore, orderId: string): CafeStore {
  const old = store.orders.find(o => o.id === orderId);
  if (!old || old.status === 'served' || old.status === 'cancelled') return store;
  if (!old.paymentRecorded) return advanceCafeOrder(store, [], orderId, 'cancelled');
  if (old.refundedSatang !== undefined) return store;
  const next = copy(store);
  const order = next.orders.find(o => o.id === orderId)!;
  const amount = order.paidSatang;
  if (!Number.isSafeInteger(amount) || amount < 0 || !Number.isSafeInteger(next.cashSatang - amount)) return store;
  order.refundedSatang = amount;
  if (order.stockConsumed) {
    const waste = next.wasteCostSatang + (order.consumedCostSatang ?? 0);
    if (!Number.isSafeInteger(waste)) return store;
    next.wasteCostSatang = waste;
  }
  order.status = 'cancelled';
  next.cashSatang -= amount;
  next.cashEvents.push({ id: 'refund-' + orderId, orderId, type: 'refund', amountSatang: amount });
  return next;
}

/** Reconcile the cash balance against immutable-in-intent journal entries. */
export function reconcileCafeCash(store: CafeStore): { expectedSatang: number; balanced: boolean } {
  const events = store.cashEvents ?? [];
  const ids = new Set(events.map(e => e.id));
  const valid = ids.size === events.length && events.every(e => {
    const order = store.orders.find(o => o.id === e.orderId);
    if (!order || !Number.isSafeInteger(e.amountSatang) || e.amountSatang < 0 ||
      e.id !== e.type + '-' + e.orderId) return false;
    if (e.type === 'payment') return order.paymentRecorded === true &&
      order.paidSatang === e.amountSatang;
    return e.type === 'refund' && order.status === 'cancelled' &&
      order.refundedSatang === e.amountSatang && order.paidSatang === e.amountSatang;
  }) && store.orders.every(o => {
    const paymentCount = events.filter(e => e.orderId === o.id && e.type === 'payment').length;
    const refundCount = events.filter(e => e.orderId === o.id && e.type === 'refund').length;
    return paymentCount === (o.paymentRecorded ? 1 : 0) &&
      // A cancelled paid order must have a matching refund, including zero-value payments.
      (o.status !== 'cancelled' || !o.paymentRecorded || o.refundedSatang !== undefined) &&
      refundCount === (o.refundedSatang === undefined ? 0 : 1) &&
      (!o.paymentRecorded || o.paidSatang === o.quantity * o.unitPriceSatang);
  });
  const expectedSatang = events.reduce((sum, e) =>
    sum + (e.type === 'payment' ? e.amountSatang : -e.amountSatang), 0);
  return { expectedSatang, balanced: valid && Number.isSafeInteger(expectedSatang) && expectedSatang === store.cashSatang };
}

/**
 * Record ingredient cost at production time. Prices are satang per stock unit;
 * returns the unchanged state if an ingredient cost is missing or invalid.
 * This can be called only once after preparation, including on cancelled
 * orders for late cost reconciliation. Actual ingredient deduction remains in advanceCafeOrder.
 */
export function recordCafeOrderCost(
  store: CafeStore, catalog: readonly CafeCatalogItem[], orderId: string,
  unitCostSatang: Readonly<Record<string, number>>,
): CafeStore {
  const old = store.orders.find(o => o.id === orderId);
  if (!old || !old.stockConsumed || old.consumedCostSatang !== undefined) return store;
  const item = catalog.find(i => i.id === old.itemId);
  if (!item && !old.recipeSnapshot) return store;
  let cost = 0;
  for (const [id, quantity] of Object.entries(old.recipeSnapshot ?? item!.recipe)) {
    const unitCost = unitCostSatang[id];
    if (!Number.isSafeInteger(unitCost) || unitCost < 0) return store;
    cost += unitCost * quantity * old.quantity;
  }
  if (!Number.isSafeInteger(cost) || cost < 0) return store;
  const next = copy(store);
  next.orders.find(o => o.id === orderId)!.consumedCostSatang = cost;
  // A cancelled produced order is waste even when its cost arrives later.
  // The once-only cost guard prevents double counting on retries.
  if (old.status === 'cancelled') {
    if (!Number.isSafeInteger(next.wasteCostSatang + cost)) return store;
    next.wasteCostSatang += cost;
  }
  return next;
}

/**
 * Read-only end-of-day report. Unknown ingredient costs are surfaced rather
 * than silently treated as zero. This is a prototype accounting snapshot,
 * not a tax invoice or a substitute for verified payment settlement.
 */
export function closeCafeDay(store: CafeStore) {
  const reconciliation = reconcileCafeCash(store);
  const paymentsSatang = store.cashEvents.filter(e => e.type === 'payment').reduce((n, e) => n + e.amountSatang, 0);
  const refundsSatang = store.cashEvents.filter(e => e.type === 'refund').reduce((n, e) => n + e.amountSatang, 0);
  const produced = store.orders.filter(o => o.stockConsumed);
  const missingCostOrders = produced.filter(o => o.consumedCostSatang === undefined).map(o => o.id);
  const ingredientCostSatang = produced.reduce((n, o) => n + (o.consumedCostSatang ?? 0), 0);
  const wasteCostSatang = produced.filter(o => o.status === 'cancelled')
    .reduce((n, o) => n + (o.consumedCostSatang ?? 0), 0);
  const openOrderIds = store.orders.filter(o => o.status !== 'served' && o.status !== 'cancelled').map(o => o.id);
  const unpaidServedOrderIds = store.orders.filter(o => o.status === 'served' && !o.paymentRecorded).map(o => o.id);
  // Closing must reject corrupted inventory, even if the cash journal balances.
  // Fractional stock is valid for ingredients measured by weight or volume.
  const invalidStockIds = Object.entries(store.stock)
    .filter(([id, quantity]) => !validId(id) || !Number.isFinite(quantity) || quantity < 0)
    .map(([id]) => id);
  const netSalesSatang = paymentsSatang - refundsSatang;
  const grossMarginSatang = netSalesSatang - ingredientCostSatang;
  // A balanced cash journal alone does not guarantee a safely representable margin.
  const validNumbers = [paymentsSatang, refundsSatang, ingredientCostSatang, wasteCostSatang, netSalesSatang, grossMarginSatang]
    .every(Number.isSafeInteger);
  return {
    orderCount: store.orders.length,
    cancelledCount: store.orders.filter(o => o.status === 'cancelled').length,
    paymentsSatang, refundsSatang, netSalesSatang, ingredientCostSatang,
    wasteCostSatang, grossMarginSatang: missingCostOrders.length || !Number.isSafeInteger(grossMarginSatang) ? null : grossMarginSatang,
    missingCostOrders, openOrderIds, unpaidServedOrderIds, invalidStockIds,
    cashBalanced: reconciliation.balanced,
    readyToClose: reconciliation.balanced && validNumbers && openOrderIds.length === 0 && unpaidServedOrderIds.length === 0 && missingCostOrders.length === 0 && invalidStockIds.length === 0 &&
      wasteCostSatang === store.wasteCostSatang,
  };
}
