import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('one-click T3 journey acceptance regression', () => {
  it('closes one isolated day with a single ordered→prepared→ready→served→paid→closed event stream', () => {
    const stock = createDemoStock();
    let day = startDemoDay(stock);
    const first = DEMO_HALAL_MENU[0];
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'journey-t3-1',
      tableId: 't3', itemId: first.id, quantity: 1,
    });
    expect(day.store.orders).toHaveLength(1);
    const order = day.store.orders[0];
    const costs = Object.fromEntries(Object.keys(order.recipeSnapshot ?? {}).map(k => [k, 100]));
    const transitions = [
      { actor: 'Na' as const, type: 'prepare' as const, orderId: order.id, costs },
      { actor: 'Na' as const, type: 'ready' as const, orderId: order.id },
      { actor: 'Ken' as const, type: 'serve' as const, orderId: order.id },
      { actor: 'manager' as const, type: 'pay' as const, orderId: order.id },
      { actor: 'manager' as const, type: 'close' as const },
    ];
    for (const action of transitions) {
      const next = applyDemoAction(day, DEMO_HALAL_MENU, action);
      expect(next, `transition ${action.type} must succeed`).not.toBe(day);
      day = next;
    }
    const views = demoDayViews(day);
    expect(day.closed).toBe(true);
    expect(views.kitchen).toHaveLength(0);
    expect(views.service).toHaveLength(0);
    expect(views.customer).toEqual([{ id: order.id, tableId: 't3', status: 'served' }]);
    expect(views.manager.cashSatang).toBe(first.priceSatang);
    expect(views.manager.close.readyToClose).toBe(true);
    expect(day.events.map(e => [e.actor, e.action])).toEqual([
      ['customer', 'ordered'], ['Na', 'preparing'], ['Na', 'ready'],
      ['Ken', 'served'], ['manager', 'paid'], ['manager', 'closed'],
    ]);
    expect(day.events.map(e => e.sequence)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' })).toBe(day);
    expect(applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'after-close',
      tableId: 't3', itemId: first.id, quantity: 1,
    })).toBe(day);
    expect(stock).toEqual(createDemoStock());
  });
});
