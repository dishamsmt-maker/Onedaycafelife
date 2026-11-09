import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('five-table manager dashboard derived from one simulation state', () => {
  it('tracks kitchen, service and payment queues without a second mutable queue', () => {
    const item = DEMO_HALAL_MENU[0];
    let day = startDemoDay(createDemoStock());
    const order = (tableId: string) => ({
      actor: 'customer' as const, type: 'order' as const,
      tableId, requestId: 'request-' + tableId, itemId: item.id, quantity: 1,
    });
    day = applyDemoAction(day, DEMO_HALAL_MENU, order('t3'));
    day = applyDemoAction(day, DEMO_HALAL_MENU, order('t4'));
    const [first, second] = day.store.orders;
    expect(demoDayViews(day).manager.queueCounts).toEqual({ kitchen: 2, service: 0, payment: 0 });
    const costs = Object.fromEntries(Object.keys(item.recipe).map(key => [key, 100]));
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'prepare', orderId: first.id, costs });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'ready', orderId: first.id });
    expect(demoDayViews(day).manager.queueCounts).toEqual({ kitchen: 1, service: 1, payment: 0 });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Ken', type: 'serve', orderId: first.id });
    expect(demoDayViews(day).manager.queueCounts).toEqual({ kitchen: 1, service: 0, payment: 1 });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId: first.id });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'cancel', orderId: second.id });
    const manager = demoDayViews(day).manager;
    expect(manager.queueCounts).toEqual({ kitchen: 0, service: 0, payment: 0 });
    expect(manager.tables).toHaveLength(5);
    expect(manager.tables.find(t => t.tableId === 't3')?.orders[0].status).toBe('paid');
    expect(manager.tables.find(t => t.tableId === 't4')?.orders[0].status).toBe('cancelled');
    expect(manager.tables.find(t => t.tableId === 't5')?.orders).toEqual([]);
    manager.tables[2].orders[0].status = 'queued';
    expect(day.store.orders[0].status).toBe('paid');
  });
});
