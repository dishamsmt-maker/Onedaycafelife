import {
  advanceCafeOrder, closeCafeDay, createCafeStore, payCafeOrder,
  recordCafeOrderCost, refundAndCancelCafeOrder, submitCafeOrder,
  type CafeCatalogItem, type CafeStore,
} from './orderCore';

/**
 * Game-only vertical slice: one event stream shared by customer, staff and
 * manager projections. Never persist this state in the real Café OS database.
 * The caller owns this instance and must not reuse it for real payments.
 */
export type DemoEvent = {
  sequence: number;
  actor: 'customer' | 'Na' | 'Ken' | 'manager';
  action: 'ordered' | 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled' | 'closed';
  orderId: string;
};
export interface DemoDay {
  store: CafeStore;
  events: DemoEvent[];
  closed: boolean;
}
export function startDemoDay(stock: Record<string, number>): DemoDay {
  return { store: createCafeStore(stock), events: [], closed: false };
}
export function applyDemoAction(
  day: DemoDay,
  catalog: readonly CafeCatalogItem[],
  action:
    | { actor: 'customer'; type: 'order'; requestId: string; tableId: string; itemId: string; quantity: number }
    | { actor: 'Na'; type: 'prepare'; orderId: string; costs: Readonly<Record<string, number>> }
    | { actor: 'Na'; type: 'ready'; orderId: string }
    | { actor: 'Ken'; type: 'serve'; orderId: string }
    | { actor: 'manager'; type: 'pay'; orderId: string }
    | { actor: 'manager'; type: 'cancel'; orderId: string }
    | { actor: 'manager'; type: 'close' },
): DemoDay {
  if (day.closed) return day;
  if (action.type === 'close') {
    if (!closeCafeDay(day.store).readyToClose) return day;
    return { ...day, closed: true, events: [...day.events, {
      sequence: day.events.length + 1, actor: 'manager', action: 'closed', orderId: '',
    }] };
  }
  let next = day.store;
  let orderId = '';
  let eventAction: DemoEvent['action'];
  if (action.type === 'order') {
    const result = submitCafeOrder(next, catalog, action);
    if (!result.accepted || result.reason === 'duplicate-retry') return day;
    next = result.store;
    orderId = result.order.id;
    eventAction = 'ordered';
  } else {
    orderId = action.orderId;
    if (action.type === 'prepare') {
      // Never begin production unless the ingredient costs are known.
      const order = next.orders.find(o => o.id === orderId && o.status === 'queued');
      const recipe = order?.recipeSnapshot ?? catalog.find(i => i.id === order?.itemId)?.recipe;
      if (!order || !recipe || Object.keys(recipe).some(k => !Number.isSafeInteger(action.costs[k]) || action.costs[k] < 0)) return day;
      next = advanceCafeOrder(next, catalog, orderId, 'preparing');
      if (next === day.store) return day;
      next = recordCafeOrderCost(next, catalog, orderId, action.costs);
      if (next.orders.find(o => o.id === orderId)?.consumedCostSatang === undefined) return day;
      eventAction = 'preparing';
    } else if (action.type === 'ready') {
      next = advanceCafeOrder(next, catalog, orderId, 'ready');
      eventAction = 'ready';
    } else if (action.type === 'serve') {
      next = advanceCafeOrder(next, catalog, orderId, 'served');
      eventAction = 'served';
    } else if (action.type === 'cancel') {
      next = refundAndCancelCafeOrder(next, orderId);
      eventAction = 'cancelled';
    } else {
      next = payCafeOrder(next, orderId);
      eventAction = 'paid';
    }
    if (next === day.store) return day;
  }
  return {
    store: next,
    events: [...day.events, { sequence: day.events.length + 1, actor: action.actor, action: eventAction, orderId }],
  };
}
export function demoDayViews(day: DemoDay) {
  return {
    customer: day.store.orders.map(o => ({ id: o.id, tableId: o.tableId, status: o.status })),
    kitchen: day.store.orders.filter(o => o.status === 'queued' || o.status === 'preparing'),
    service: day.store.orders.filter(o => o.status === 'ready'),
    manager: { cashSatang: day.store.cashSatang, stock: { ...day.store.stock }, close: closeCafeDay(day.store) },
  };
}
