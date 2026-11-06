import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('demo day rejects invalid transitions atomically', () => {
  it('does not consume stock or emit events when preparation costs are incomplete', () => {
    const initial = startDemoDay(createDemoStock(3));
    const queued = applyDemoAction(initial, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'atomic-t03',
      tableId: 't3', itemId: 'congee-chicken', quantity: 1,
    });
    expect(queued).not.toBe(initial);
    const orderId = queued.store.orders[0].id;
    const beforeStock = { ...queued.store.stock };
    const prematureReady = applyDemoAction(queued, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'ready', orderId,
    });
    expect(prematureReady).toBe(queued);
    const prematureServe = applyDemoAction(queued, DEMO_HALAL_MENU, {
      actor: 'Ken', type: 'serve', orderId,
    });
    expect(prematureServe).toBe(queued);
    const missingCosts = applyDemoAction(queued, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId, costs: {},
    });
    expect(missingCosts).toBe(queued);
    expect(queued.store.stock).toEqual(beforeStock);
    expect(queued.events.map(e => e.action)).toEqual(['ordered']);
    expect(demoDayViews(queued).kitchen[0].status).toBe('queued');
    expect(demoDayViews(queued).manager.cashSatang).toBe(0);
  });

  it('rejects an early close without appending a closed event', () => {
    const queued = applyDemoAction(startDemoDay(createDemoStock(3)), DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'open-t03',
      tableId: 't3', itemId: 'congee-chicken', quantity: 1,
    });
    const rejected = applyDemoAction(queued, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'close',
    });
    expect(rejected).toBe(queued);
    expect(rejected.closed).toBe(false);
    expect(rejected.events).toHaveLength(1);
  });
});
