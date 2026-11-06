import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('three-mode shared event stream and isolation', () => {
  it('projects the same T03 order to kitchen, service and manager without leaking mutable state', () => {
    const initial = startDemoDay(createDemoStock(2));
    const item = DEMO_HALAL_MENU.find(i => i.id === 'congee-chicken');
    expect(item).toBeDefined();
    const ordered = applyDemoAction(initial, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'shared-t3-1',
      tableId: 't3', itemId: 'congee-chicken', quantity: 1,
    });
    expect(ordered.events.map(e => e.action)).toEqual(['ordered']);
    expect(demoDayViews(ordered).kitchen).toHaveLength(1);
    expect(demoDayViews(ordered).customer[0].tableId).toBe('t3');
    const id = ordered.store.orders[0].id;
    const recipe = ordered.store.orders[0].recipeSnapshot ?? item!.recipe;
    const costs = Object.fromEntries(Object.keys(recipe).map(k => [k, 100]));
    const preparing = applyDemoAction(ordered, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId: id, costs,
    });
    expect(preparing.events.at(-1)?.action).toBe('preparing');
    expect(demoDayViews(preparing).kitchen[0].status).toBe('preparing');
    const ready = applyDemoAction(preparing, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'ready', orderId: id,
    });
    expect(demoDayViews(ready).service).toHaveLength(1);
    const served = applyDemoAction(ready, DEMO_HALAL_MENU, {
      actor: 'Ken', type: 'serve', orderId: id,
    });
    expect(demoDayViews(served).service).toHaveLength(0);
    const paid = applyDemoAction(served, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'pay', orderId: id,
    });
    expect(demoDayViews(paid).manager.cashSatang).toBe(item!.priceSatang);
    expect(demoDayViews(ordered).manager.cashSatang).toBe(0);
    expect(paid.events.map(e => e.actor)).toEqual(['customer', 'Na', 'Na', 'Ken', 'manager']);
    const duplicate = applyDemoAction(paid, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'pay', orderId: id,
    });
    expect(duplicate).toBe(paid);
    const closed = applyDemoAction(paid, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' });
    expect(closed.closed).toBe(true);
    expect(closed.events.at(-1)?.action).toBe('closed');
    expect(applyDemoAction(closed, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'after-close',
      tableId: 't4', itemId: 'congee-chicken', quantity: 1,
    })).toBe(closed);
    const view = demoDayViews(paid);
    view.manager.stock[Object.keys(view.manager.stock)[0]] = 999999;
    expect(paid.store.stock[Object.keys(view.manager.stock)[0]]).not.toBe(999999);
    expect(initial.store.orders).toHaveLength(0);
  });
});
