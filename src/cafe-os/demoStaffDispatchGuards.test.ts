import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { dispatchDemoStaffTask } from './demoStaffDispatch';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

const catalog = DEMO_HALAL_MENU;
const item = catalog[0];
const validCosts = Object.fromEntries(Object.keys(item.recipe).map(key => [key, 100]));

function orderAt(tableId: string, requestId: string) {
  const day = startDemoDay(createDemoStock());
  return applyDemoAction(day, catalog, {
    actor: 'customer', type: 'order', requestId, tableId, itemId: item.id, quantity: 1,
  });
}

describe('staff dispatcher safety regressions', () => {
  it('rejects tasks from cancelled orders without changing event log or stock', () => {
    const ordered = orderAt('t3', 'cancel-dispatch-t3');
    const task = demoDayViews(ordered).staff.tasks[0];
    const cancelled = applyDemoAction(ordered, catalog, {
      actor: 'manager', type: 'cancel', orderId: task.orderId,
    });
    expect(dispatchDemoStaffTask(cancelled, catalog, task, validCosts)).toBe(cancelled);
    expect(demoDayViews(cancelled).staff.tasks).toEqual([]);
  });

  it('does not advance a queued order with missing, negative or fractional costs', () => {
    const day = orderAt('t3', 'invalid-cost-dispatch');
    const task = demoDayViews(day).staff.tasks[0];
    const ingredient = Object.keys(item.recipe)[0];
    for (const costs of [
      undefined,
      { ...validCosts, [ingredient]: -1 },
      { ...validCosts, [ingredient]: 1.5 },
      { ...validCosts, [ingredient]: Number.NaN },
    ]) {
      expect(dispatchDemoStaffTask(day, catalog, task, costs)).toBe(day);
    }
    expect(demoDayViews(day).manager.queueCounts.kitchen).toBe(1);
  });

  it('rejects forged role/action combinations and stale tasks after preparation', () => {
    const day = orderAt('t3', 'forged-dispatch');
    const task = demoDayViews(day).staff.tasks[0];
    expect(dispatchDemoStaffTask(day, catalog, { ...task, assignee: 'Ken' }, validCosts)).toBe(day);
    expect(dispatchDemoStaffTask(day, catalog, { ...task, action: 'serve' }, validCosts)).toBe(day);
    const preparing = dispatchDemoStaffTask(day, catalog, task, validCosts);
    expect(preparing).not.toBe(day);
    expect(dispatchDemoStaffTask(preparing, catalog, task, validCosts)).toBe(preparing);
    expect(demoDayViews(preparing).staff.tasks[0].action).toBe('ready');
  });
});
