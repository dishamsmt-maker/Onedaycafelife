import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { dispatchDemoStaffTask } from './demoStaffDispatch';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

const catalog = DEMO_HALAL_MENU;
const item = catalog[0];
const costs = Object.fromEntries(Object.keys(item.recipe).map(key => [key, 100]));

describe('shared-state T3 staff dispatch acceptance', () => {
  it('advances customer, kitchen, staff and manager projections through a paid closeout', () => {
    const opening = startDemoDay(createDemoStock());
    const ordered = applyDemoAction(opening, catalog, {
      actor: 'customer', type: 'order', requestId: 'full-day-t3', tableId: 't3',
      itemId: item.id, quantity: 1,
    });
    expect(ordered.events.map(e => e.action)).toEqual(['ordered']);
    expect(demoDayViews(ordered).manager.queueCounts.kitchen).toBe(1);
    const orderId = ordered.store.orders[0].id;
    expect(demoDayViews(ordered).customer[0].status).toBe('queued');

    const prepareTask = demoDayViews(ordered).staff.tasks[0];
    expect(prepareTask).toMatchObject({ orderId, tableId: 't3', assignee: 'Na', action: 'prepare' });
    const preparing = dispatchDemoStaffTask(ordered, catalog, prepareTask, costs);
    expect(demoDayViews(preparing).customer[0].status).toBe('preparing');
    const ready = dispatchDemoStaffTask(preparing, catalog, demoDayViews(preparing).staff.tasks[0]);
    expect(demoDayViews(ready).manager.queueCounts).toEqual({ kitchen: 0, service: 1, payment: 0 });
    const serveTask = demoDayViews(ready).staff.tasks[0];
    expect(serveTask).toMatchObject({ orderId, assignee: 'Ken', action: 'serve' });
    const served = dispatchDemoStaffTask(ready, catalog, serveTask);
    expect(demoDayViews(served).manager.queueCounts).toEqual({ kitchen: 0, service: 0, payment: 1 });
    expect(demoDayViews(served).staff.tasks).toEqual([]);

    const paid = applyDemoAction(served, catalog, { actor: 'manager', type: 'pay', orderId });
    expect(demoDayViews(paid).manager.cashSatang).toBeGreaterThan(0);
    expect(demoDayViews(paid).manager.queueCounts.payment).toBe(0);
    const closed = applyDemoAction(paid, catalog, { actor: 'manager', type: 'close' });
    expect(closed.closed).toBe(true);
    expect(closed.events.map(e => e.action)).toEqual([
      'ordered', 'preparing', 'ready', 'served', 'paid', 'closed',
    ]);
    expect(closed.events.map(e => e.sequence)).toEqual([1, 2, 3, 4, 5, 6]);
    expect(dispatchDemoStaffTask(closed, catalog, serveTask)).toBe(closed);
    expect(applyDemoAction(closed, catalog, {
      actor: 'customer', type: 'order', requestId: 'after-close',
      tableId: 't3', itemId: item.id, quantity: 1,
    })).toBe(closed);
    expect(opening.events).toEqual([]);
    expect(opening.store.orders).toEqual([]);
  });
});
