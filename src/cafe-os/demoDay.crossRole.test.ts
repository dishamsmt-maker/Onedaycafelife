import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';
import { reconcileCafeCash } from './orderCore';

describe('table three cross-role journey', () => {
  it('keeps one canonical order and ledger across customer, kitchen, service and manager', () => {
    let day = startDemoDay(createDemoStock());
    const orderAction = {
      actor: 'customer' as const, type: 'order' as const,
      requestId: 't3-qr-001', tableId: 't3',
      itemId: 'congee-chicken', quantity: 1,
    };
    day = applyDemoAction(day, DEMO_HALAL_MENU, orderAction);
    expect(day.store.orders).toHaveLength(1);
    const orderId = day.store.orders[0].id;
    expect(demoDayViews(day).customer).toEqual([
      { id: orderId, tableId: 't3', status: 'queued' },
    ]);
    expect(demoDayViews(day).kitchen.map(o => o.id)).toEqual([orderId]);

    // QR retry must not produce a second order or event.
    expect(applyDemoAction(day, DEMO_HALAL_MENU, orderAction)).toBe(day);
    expect(day.events).toHaveLength(1);
    // A reused request key with a different table must not hijack the order.
    expect(applyDemoAction(day, DEMO_HALAL_MENU, {
      ...orderAction, tableId: 't4',
    })).toBe(day);

    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId,
      costs: { congee: 500, chicken: 1000 },
    });
    expect(demoDayViews(day).kitchen[0].status).toBe('preparing');
    expect(day.store.stock.chicken).toBe(19);
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'ready', orderId,
    });
    expect(demoDayViews(day).kitchen).toHaveLength(0);
    expect(demoDayViews(day).service.map(o => o.id)).toEqual([orderId]);
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'Ken', type: 'serve', orderId,
    });
    expect(demoDayViews(day).customer[0].status).toBe('served');
    expect(demoDayViews(day).service).toHaveLength(0);
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'pay', orderId,
    });
    expect(day.store.cashSatang).toBe(4500);
    expect(demoDayViews(day).manager.cashSatang).toBe(4500);
    expect(reconcileCafeCash(day.store).balanced).toBe(true);
    expect(day.events.map(e => e.action)).toEqual([
      'ordered', 'preparing', 'ready', 'served', 'paid',
    ]);
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'close',
    });
    expect(day.closed).toBe(true);
    expect(day.events.at(-1)?.action).toBe('closed');
    expect(applyDemoAction(day, DEMO_HALAL_MENU, orderAction)).toBe(day);
  });
});
