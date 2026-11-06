import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU, DEMO_TABLE_IDS } from './demoCatalog';

/**
 * Exercise every demo menu item through the same state machine used by the
 * three game projections. This is simulation coverage, not a mobile UI test.
 */
describe('eight-item halal demo menu end-to-end', () => {
  it.each(DEMO_HALAL_MENU)('closes a paid day for $nameTh ($id)', item => {
    const initial = startDemoDay(createDemoStock(20));
    const ordered = applyDemoAction(initial, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'menu-' + item.id,
      tableId: DEMO_TABLE_IDS[2], itemId: item.id, quantity: 1,
    });
    expect(ordered.store.orders).toHaveLength(1);
    expect(ordered.events.map(e => e.action)).toEqual(['ordered']);
    const orderId = ordered.store.orders[0].id;
    expect(demoDayViews(ordered).kitchen).toHaveLength(1);
    const costs = Object.fromEntries(Object.keys(item.recipe).map(ingredient => [ingredient, 100]));
    const preparing = applyDemoAction(ordered, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId, costs,
    });
    expect(preparing.events.at(-1)?.action).toBe('preparing');
    const ready = applyDemoAction(preparing, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'ready', orderId,
    });
    expect(demoDayViews(ready).service).toHaveLength(1);
    const served = applyDemoAction(ready, DEMO_HALAL_MENU, {
      actor: 'Ken', type: 'serve', orderId,
    });
    expect(demoDayViews(served).service).toHaveLength(0);
    const paid = applyDemoAction(served, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'pay', orderId,
    });
    expect(demoDayViews(paid).manager.cashSatang).toBe(item.priceSatang);
    for (const [ingredient, units] of Object.entries(item.recipe)) {
      expect(paid.store.stock[ingredient]).toBe(20 - units);
    }
    const closed = applyDemoAction(paid, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' });
    expect(closed.closed).toBe(true);
    expect(closed.events.map(e => e.action)).toEqual([
      'ordered', 'preparing', 'ready', 'served', 'paid', 'closed',
    ]);
    expect(applyDemoAction(closed, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' })).toBe(closed);
    expect(initial.store.cashSatang).toBe(0);
  });
});
