import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';
import { reconcileCafeCash } from './orderCore';

describe('demo day close and stock reservation safety', () => {
  it('refuses closing while a queued order remains and releases reservation on cancellation', () => {
    const initial = startDemoDay(createDemoStock(1));
    const queued = applyDemoAction(initial, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'table-3-first',
      tableId: 't3', itemId: 'congee-chicken', quantity: 1,
    });
    expect(queued.store.orders).toHaveLength(1);
    const blockedClose = applyDemoAction(queued, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'close',
    });
    expect(blockedClose).toBe(queued);
    expect(blockedClose.closed).toBe(false);
    expect(blockedClose.events).toHaveLength(1);

    const rejected = applyDemoAction(queued, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'table-4-first',
      tableId: 't4', itemId: 'congee-chicken', quantity: 1,
    });
    expect(rejected).toBe(queued);
    expect(rejected.store.stock.chicken).toBe(1);

    const cancelled = applyDemoAction(queued, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'cancel', orderId: queued.store.orders[0].id,
    });
    expect(cancelled.events.at(-1)?.action).toBe('cancelled');
    expect(cancelled.store.stock.chicken).toBe(1);
    const reordered = applyDemoAction(cancelled, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'table-4-retry',
      tableId: 't4', itemId: 'congee-chicken', quantity: 1,
    });
    expect(reordered.store.orders).toHaveLength(2);
    expect(demoDayViews(reordered).kitchen).toHaveLength(1);
    expect(reconcileCafeCash(reordered.store).balanced).toBe(true);
  });
});
