import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('demo day duplicate and cancellation invariants', () => {
  it('does not double-charge, reserve stock twice, or emit duplicate events on a retried QR request', () => {
    const first = DEMO_HALAL_MENU[0];
    const initial = startDemoDay(createDemoStock());
    const request = {
      actor: 'customer' as const, type: 'order' as const,
      requestId: 't3-retry-001', tableId: 't3', itemId: first.id, quantity: 1,
    };
    const ordered = applyDemoAction(initial, DEMO_HALAL_MENU, request);
    expect(ordered).not.toBe(initial);
    const retried = applyDemoAction(ordered, DEMO_HALAL_MENU, request);
    expect(retried).toBe(ordered);
    expect(retried.store.orders).toHaveLength(1);
    expect(retried.events.map(e => e.action)).toEqual(['ordered']);
    expect(demoDayViews(retried).manager.cashSatang).toBe(0);
  });

  it('cancels a queued order without cash, refuses a second cancellation, then closes the day', () => {
    const first = DEMO_HALAL_MENU[0];
    const initial = startDemoDay(createDemoStock());
    const ordered = applyDemoAction(initial, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 't3-cancel-001',
      tableId: 't3', itemId: first.id, quantity: 1,
    });
    const id = ordered.store.orders[0].id;
    const cancelled = applyDemoAction(ordered, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'cancel', orderId: id,
    });
    expect(cancelled).not.toBe(ordered);
    expect(applyDemoAction(cancelled, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'cancel', orderId: id,
    })).toBe(cancelled);
    expect(demoDayViews(cancelled).kitchen).toHaveLength(0);
    expect(demoDayViews(cancelled).service).toHaveLength(0);
    expect(demoDayViews(cancelled).manager.cashSatang).toBe(0);
    expect(cancelled.events.map(e => e.action)).toEqual(['ordered', 'cancelled']);
    const closed = applyDemoAction(cancelled, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'close',
    });
    expect(closed.closed).toBe(true);
    expect(closed.events.map(e => e.action)).toEqual(['ordered', 'cancelled', 'closed']);
  });
});
