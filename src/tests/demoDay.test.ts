import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from '../cafe-os/demoDay';

const catalog = [{ id: 'halal-porridge', priceSatang: 4500, recipe: { rice: 2 }, enabled: true }];
describe('one-day isolated shared event stream', () => {
  it('customer T3 → Na kitchen → Ken serve → manager cash and stock', () => {
    const start = startDemoDay({ rice: 10 });
    const ordered = applyDemoAction(start, catalog, {
      actor: 'customer', type: 'order', requestId: 'qr-t3-1',
      tableId: 'T3', itemId: 'halal-porridge', quantity: 2,
    });
    expect(demoDayViews(ordered).kitchen).toHaveLength(1);
    const retry = applyDemoAction(ordered, catalog, {
      actor: 'customer', type: 'order', requestId: 'qr-t3-1',
      tableId: 'T3', itemId: 'halal-porridge', quantity: 2,
    });
    expect(retry).toBe(ordered);
    const id = ordered.store.orders[0].id;
    const preparing = applyDemoAction(ordered, catalog, { actor: 'Na', type: 'prepare', orderId: id, costs: { rice: 350 } });
    expect(preparing.store.stock.rice).toBe(6);
    const ready = applyDemoAction(preparing, catalog, { actor: 'Na', type: 'ready', orderId: id });
    expect(demoDayViews(ready).service).toHaveLength(1);
    const served = applyDemoAction(ready, catalog, { actor: 'Ken', type: 'serve', orderId: id });
    const paid = applyDemoAction(served, catalog, { actor: 'manager', type: 'pay', orderId: id });
    expect(demoDayViews(paid).manager.cashSatang).toBe(9000);
    expect(demoDayViews(paid).manager.close.readyToClose).toBe(true);
    expect(paid.events.map(e => e.action)).toEqual(['ordered', 'preparing', 'ready', 'served', 'paid']);
    expect(start.store.orders).toHaveLength(0);
    expect(applyDemoAction(paid, catalog, { actor: 'manager', type: 'pay', orderId: id })).toBe(paid);
  });
  it('does not emit an event or consume stock for sold-out or missing-cost preparation', () => {
    const ordered = applyDemoAction(startDemoDay({ rice: 1 }), catalog, {
      actor: 'customer', type: 'order', requestId: 'qr-2',
      tableId: 'T3', itemId: 'halal-porridge', quantity: 2,
    });
    expect(ordered.store.orders).toHaveLength(0);
    expect(ordered.events).toHaveLength(0);
    expect(ordered.store.stock.rice).toBe(1);
    const accepted = applyDemoAction(startDemoDay({ rice: 10 }), catalog, {
      actor: 'customer', type: 'order', requestId: 'qr-3',
      tableId: 'T3', itemId: 'halal-porridge', quantity: 2,
    });
    const id = accepted.store.orders[0].id;
    expect(applyDemoAction(accepted, catalog, { actor: 'Na', type: 'prepare', orderId: id, costs: {} })).toBe(accepted);
    expect(accepted.events.map(e => e.action)).toEqual(['ordered']);
    expect(accepted.store.stock.rice).toBe(10);
  });
});
