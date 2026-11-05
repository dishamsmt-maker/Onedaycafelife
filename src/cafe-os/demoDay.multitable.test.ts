import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';
import { reconcileCafeCash } from './orderCore';

describe('five-table demo-day shared-state regression', () => {
  it('keeps reservations, kitchen work, cash and close synchronized across tables', () => {
    let day = startDemoDay({ ...createDemoStock(), chicken: 2 });
    for (const tableId of ['t1', 't2']) {
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'customer', type: 'order', requestId: 'multi-' + tableId,
        tableId, itemId: 'congee-chicken', quantity: 1,
      });
    }
    const beforeRejected = day;
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'multi-t3',
      tableId: 't3', itemId: 'congee-chicken', quantity: 1,
    });
    expect(day).toBe(beforeRejected);
    expect(day.store.orders).toHaveLength(2);
    expect(demoDayViews(day).kitchen).toHaveLength(2);
    expect(day.store.stock.chicken).toBe(2);
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' })).toBe(day);

    for (const order of [...day.store.orders]) {
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'Na', type: 'prepare', orderId: order.id,
        costs: { congee: 500, chicken: 1000 },
      });
      day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'ready', orderId: order.id });
      day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Ken', type: 'serve', orderId: order.id });
      day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId: order.id });
    }
    expect(day.store.stock.chicken).toBe(0);
    expect(day.store.cashSatang).toBe(9000);
    expect(reconcileCafeCash(day.store).balanced).toBe(true);
    expect(demoDayViews(day).manager.close.readyToClose).toBe(true);
    expect(day.events.map(event => event.sequence)).toEqual(Array.from({ length: day.events.length }, (_, i) => i + 1));
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' });
    expect(day.closed).toBe(true);
    expect(demoDayViews(day).manager.closed).toBe(true);
  });
});
