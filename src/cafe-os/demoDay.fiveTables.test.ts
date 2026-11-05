import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU, DEMO_TABLE_IDS } from './demoCatalog';
import { reconcileCafeCash } from './orderCore';

describe('five-table end-to-end demo day', () => {
  it('shares one event ledger across five tables and freezes all actions after closing', () => {
    let day = startDemoDay(createDemoStock(5));
    for (const tableId of DEMO_TABLE_IDS) {
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'customer', type: 'order', requestId: `qr-${tableId}`,
        tableId, itemId: 'congee-chicken', quantity: 1,
      });
    }
    expect(day.store.orders).toHaveLength(5);
    expect(demoDayViews(day).kitchen).toHaveLength(5);
    // The sixth order must be rejected because all five portions are reserved.
    const rejected = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'qr-extra',
      tableId: 't1', itemId: 'congee-chicken', quantity: 1,
    });
    expect(rejected).toBe(day);
    expect(day.store.stock.chicken).toBe(5);

    for (const order of [...day.store.orders]) {
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'Na', type: 'prepare', orderId: order.id,
        costs: { congee: 500, chicken: 1000 },
      });
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'Na', type: 'ready', orderId: order.id,
      });
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'Ken', type: 'serve', orderId: order.id,
      });
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'manager', type: 'pay', orderId: order.id,
      });
    }
    expect(day.store.stock.chicken).toBe(0);
    expect(day.store.cashSatang).toBe(22500);
    expect(reconcileCafeCash(day.store).balanced).toBe(true);
    expect(demoDayViews(day).kitchen).toHaveLength(0);
    expect(demoDayViews(day).service).toHaveLength(0);
    expect(day.events).toHaveLength(25);
    expect(day.events.map(e => e.sequence)).toEqual(
      Array.from({ length: 25 }, (_, index) => index + 1),
    );

    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' });
    expect(day.closed).toBe(true);
    expect(demoDayViews(day).manager.closed).toBe(true);
    expect(day.events).toHaveLength(26);
    expect(applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'late',
      tableId: 't2', itemId: 'iced-tea', quantity: 1,
    })).toBe(day);
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' })).toBe(day);
  });
});
