import { describe, expect, it } from 'vitest';
import { auditDemoDay } from './demoDayAudit';
import { applyDemoAction, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';
import { dispatchDemoStaffTask } from './demoStaffDispatch';

describe('simulation event audit', () => {
  it('accepts a complete T3 order-to-closeout journey', () => {
    const catalog = DEMO_HALAL_MENU;
    let day = startDemoDay(createDemoStock());
    day = applyDemoAction(day, catalog, { actor: 'customer', type: 'order',
      requestId: 'audit-t3', tableId: 't3', itemId: catalog[0].id, quantity: 1 });
    const id = day.store.orders[0].id;
    const costs = Object.fromEntries(Object.keys(catalog[0].recipe).map(key => [key, 100]));
    day = dispatchDemoStaffTask(day, catalog, { orderId: id, assignee: 'Na', action: 'prepare' }, costs);
    day = dispatchDemoStaffTask(day, catalog, { orderId: id, assignee: 'Na', action: 'ready' });
    day = dispatchDemoStaffTask(day, catalog, { orderId: id, assignee: 'Ken', action: 'serve' });
    day = applyDemoAction(day, catalog, { actor: 'manager', type: 'pay', orderId: id });
    day = applyDemoAction(day, catalog, { actor: 'manager', type: 'close' });
    expect(auditDemoDay(day)).toMatchObject({ valid: true, issues: [], eventCount: 6, ordersObserved: 1, closed: true });
  });
  it('flags impossible handoffs and sequence gaps without mutating state', () => {
    const original = startDemoDay(createDemoStock());
    const tampered = { ...original, events: [
      { sequence: 2, actor: 'Ken' as const, action: 'served' as const, orderId: 'missing' },
    ] };
    const report = auditDemoDay(tampered);
    expect(report.valid).toBe(false);
    expect(report.issues).toContain('invalid event sequence at 1');
    expect(report.issues).toContain('invalid served transition for missing');
    expect(original.events).toEqual([]);
  });
});
