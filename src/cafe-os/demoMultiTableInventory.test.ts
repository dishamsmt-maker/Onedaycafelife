import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('shared demo state: two tables competing for stock', () => {
  it('reserves the last portion, rejects overselling, and reconciles one paid and one cancelled order', () => {
    const item = DEMO_HALAL_MENU[0];
    let day = startDemoDay(createDemoStock(1));
    const order = (tableId: string, requestId: string) =>
      ({ actor: 'customer' as const, type: 'order' as const, tableId, requestId, itemId: item.id, quantity: 1 });
    day = applyDemoAction(day, DEMO_HALAL_MENU, order('t3', 'stock-t3'));
    expect(day.store.orders).toHaveLength(1);
    const blocked = applyDemoAction(day, DEMO_HALAL_MENU, order('t4', 'stock-t4'));
    expect(blocked).toBe(day);
    expect(demoDayViews(day).kitchen).toHaveLength(1);
    const id = day.store.orders[0].id;
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'cancel', orderId: id });
    expect(day.store.cashSatang).toBe(0);
    expect(day.store.stock).toEqual(createDemoStock(1));
    day = applyDemoAction(day, DEMO_HALAL_MENU, order('t4', 'stock-t4'));
    expect(day.store.orders).toHaveLength(2);
    const second = day.store.orders[1].id;
    const costs = Object.fromEntries(Object.keys(item.recipe).map(k => [k, 100]));
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'prepare', orderId: second, costs });
    expect(day.store.stock.rice).toBe(0);
    expect(demoDayViews(day).kitchen.map(o => o.id)).toEqual([second]);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'ready', orderId: second });
    expect(demoDayViews(day).service.map(o => o.id)).toEqual([second]);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Ken', type: 'serve', orderId: second });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId: second });
    const close = demoDayViews(day).manager.close;
    expect(close.readyToClose).toBe(true);
    expect(close.cancelledCount).toBe(1);
    expect(close.netSalesSatang).toBe(item.priceSatang);
    expect(close.ingredientCostSatang).toBe(300);
    expect(close.grossMarginSatang).toBe(item.priceSatang - 300);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' });
    expect(day.closed).toBe(true);
    expect(day.events.map(e => e.action)).toEqual([
      'ordered', 'cancelled', 'ordered', 'preparing', 'ready', 'served', 'paid', 'closed',
    ]);
    expect(day.events.map(e => e.sequence)).toEqual([1, 2, 3, 4, 5, 6, 7, 8]);
  });
});
