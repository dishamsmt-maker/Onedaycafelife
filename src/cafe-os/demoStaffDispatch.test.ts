import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { dispatchDemoStaffTask } from './demoStaffDispatch';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('staff task dispatcher', () => {
  it('runs Na and Ken tasks from the shared day and rejects stale taps', () => {
    const item = DEMO_HALAL_MENU[0];
    let day = startDemoDay(createDemoStock());
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'dispatch-t3',
      tableId: 't3', itemId: item.id, quantity: 1,
    });
    const costs = Object.fromEntries(Object.keys(item.recipe).map(k => [k, 100]));
    const prepare = demoDayViews(day).staff.tasks[0];
    expect(dispatchDemoStaffTask(day, DEMO_HALAL_MENU, prepare)).toBe(day);
    day = dispatchDemoStaffTask(day, DEMO_HALAL_MENU, prepare, costs);
    expect(day.events.at(-1)?.action).toBe('preparing');
    expect(dispatchDemoStaffTask(day, DEMO_HALAL_MENU, prepare, costs)).toBe(day);
    const ready = demoDayViews(day).staff.tasks[0];
    day = dispatchDemoStaffTask(day, DEMO_HALAL_MENU, ready);
    expect(day.events.at(-1)?.action).toBe('ready');
    const serve = demoDayViews(day).staff.tasks[0];
    expect(dispatchDemoStaffTask(day, DEMO_HALAL_MENU, { ...serve, assignee: 'Na' })).toBe(day);
    day = dispatchDemoStaffTask(day, DEMO_HALAL_MENU, serve);
    expect(day.events.at(-1)?.action).toBe('served');
    expect(demoDayViews(day).staff.tasks).toEqual([]);
    expect(demoDayViews(day).manager.queueCounts.payment).toBe(1);
    expect(dispatchDemoStaffTask(day, DEMO_HALAL_MENU, serve)).toBe(day);
  });
});
