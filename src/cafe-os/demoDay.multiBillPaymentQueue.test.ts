import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('manager payment queue with two bills at one table', () => {
  it('counts only unpaid served orders and prevents double collection', () => {
    let day = startDemoDay(createDemoStock());
    const ids: string[] = [];
    for (let i = 1; i <= 2; i++) {
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'customer', type: 'order', requestId: `t3-bill-${i}`,
        tableId: 't3', itemId: 'congee-chicken', quantity: 1,
      });
      const id = day.store.orders[day.store.orders.length - 1].id;
      ids.push(id);
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'Na', type: 'prepare', orderId: id, costs: { congee: 500, chicken: 1000 },
      });
      day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'ready', orderId: id });
      day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Ken', type: 'serve', orderId: id });
    }
    expect(new Set(ids).size).toBe(2);
    expect(demoDayViews(day).manager.queueCounts.payment).toBe(2);
    const beforeCash = day.store.cashSatang;
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId: ids[0] });
    const afterFirst = day.store.cashSatang;
    expect(afterFirst).toBeGreaterThan(beforeCash);
    expect(demoDayViews(day).manager.queueCounts.payment).toBe(1);
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId: ids[0] })).toBe(day);
    expect(day.store.cashSatang).toBe(afterFirst);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId: ids[1] });
    expect(demoDayViews(day).manager.queueCounts.payment).toBe(0);
    expect(day.store.cashSatang).toBe(afterFirst + (afterFirst - beforeCash));
    expect(demoDayViews(day).manager.close.readyToClose).toBe(true);
  });
});
