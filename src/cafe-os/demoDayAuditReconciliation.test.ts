import { describe, expect, it } from 'vitest';
import { auditDemoDay } from './demoDayAudit';
import { applyDemoAction, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('event audit reconciles store orders in both directions', () => {
  it('detects an order present in the store but missing from the event log', () => {
    const catalog = DEMO_HALAL_MENU;
    const ordered = applyDemoAction(startDemoDay(createDemoStock()), catalog, {
      actor: 'customer', type: 'order', requestId: 'orphan-t3',
      tableId: 't3', itemId: catalog[0].id, quantity: 1,
    });
    expect(ordered.store.orders).toHaveLength(1);
    const tampered = { ...ordered, events: [] };
    expect(auditDemoDay(tampered).issues).toContain(
      `order missing event history ${ordered.store.orders[0].id}`,
    );
    expect(ordered.events).toHaveLength(1);
  });

  it('detects duplicate order identifiers in the canonical store', () => {
    const catalog = DEMO_HALAL_MENU;
    const ordered = applyDemoAction(startDemoDay(createDemoStock()), catalog, {
      actor: 'customer', type: 'order', requestId: 'duplicate-t3',
      tableId: 't3', itemId: catalog[0].id, quantity: 1,
    });
    const order = ordered.store.orders[0];
    const tampered = {
      ...ordered,
      store: { ...ordered.store, orders: [...ordered.store.orders, { ...order }] },
    };
    expect(auditDemoDay(tampered).issues).toContain(`duplicate store order ${order.id}`);
    expect(ordered.store.orders).toHaveLength(1);
  });
});
