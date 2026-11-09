import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('staff task projection from canonical demo state', () => {
  it('moves a table-three task from Na to Ken and clears it after serving', () => {
    const item = DEMO_HALAL_MENU[0];
    let day = startDemoDay(createDemoStock());
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'staff-task-t3',
      tableId: 't3', itemId: item.id, quantity: 1,
    });
    const orderId = day.store.orders[0].id;
    expect(demoDayViews(day).staff.tasks).toEqual([
      { orderId, tableId: 't3', assignee: 'Na', action: 'prepare' },
    ]);
    const costs = Object.fromEntries(Object.keys(item.recipe).map(key => [key, 100]));
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'prepare', orderId, costs });
    expect(demoDayViews(day).staff.tasks[0]).toMatchObject({ assignee: 'Na', action: 'ready' });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'ready', orderId });
    expect(demoDayViews(day).staff.tasks[0]).toMatchObject({ assignee: 'Ken', action: 'serve' });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Ken', type: 'serve', orderId });
    expect(demoDayViews(day).staff.tasks).toEqual([]);
    expect(demoDayViews(day).manager.queueCounts.payment).toBe(1);
  });

  it('does not retain staff tasks after a queued order is cancelled', () => {
    const item = DEMO_HALAL_MENU[0];
    let day = startDemoDay(createDemoStock());
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'cancel-staff-task',
      tableId: 't4', itemId: item.id, quantity: 1,
    });
    const orderId = day.store.orders[0].id;
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'cancel', orderId });
    expect(demoDayViews(day).staff.tasks).toEqual([]);
  });
});
