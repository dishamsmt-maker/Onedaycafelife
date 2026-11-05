import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('shared demo day projections', () => {
  it('runs table 3 from customer QR through Na, Ken and manager with one event stream', () => {
    const initial = createDemoStock();
    let day = startDemoDay(initial);
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 't3-first', tableId: 't3',
      itemId: 'congee-chicken', quantity: 1,
    });
    expect(demoDayViews(day).kitchen).toHaveLength(1);
    const retry = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 't3-first', tableId: 't3',
      itemId: 'congee-chicken', quantity: 1,
    });
    expect(retry).toBe(day);
    const orderId = day.store.orders[0].id;
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId, costs: { congee: 500, chicken: 1000 },
    });
    expect(day.store.stock.chicken).toBe(initial.chicken - 1);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'ready', orderId });
    expect(demoDayViews(day).service).toHaveLength(1);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Ken', type: 'serve', orderId });
    expect(demoDayViews(day).customer[0].status).toBe('served');
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId });
    expect(demoDayViews(day).manager.cashSatang).toBe(4500);
    expect(day.events.map(e => e.action)).toEqual(['ordered', 'preparing', 'ready', 'served', 'paid']);
    expect(day.events.map(e => e.sequence)).toEqual([1, 2, 3, 4, 5]);
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId })).toBe(day);
  });

  it('does not emit a kitchen event or consume stock when an ingredient is missing', () => {
    let day = startDemoDay({ ...createDemoStock(), chicken: 0 });
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'sold-out', tableId: 't3',
      itemId: 'congee-chicken', quantity: 1,
    });
    const before = day;
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId: day.store.orders[0].id,
      costs: { congee: 500, chicken: 1000 },
    });
    expect(day).toBe(before);
    expect(day.events).toHaveLength(1);
    expect(day.store.stock.chicken).toBe(0);
  });
  it('cancels a queued order once without payment or stock deduction', () => {
    let day = startDemoDay(createDemoStock());
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'cancel-queued', tableId: 't3',
      itemId: 'congee-chicken', quantity: 1,
    });
    const beforeStock = { ...day.store.stock };
    const orderId = day.store.orders[0].id;
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'cancel', orderId });
    expect(day.store.orders[0].status).toBe('cancelled');
    expect(day.store.stock).toEqual(beforeStock);
    expect(day.store.cashSatang).toBe(0);
    expect(day.events.map(e => e.action)).toEqual(['ordered', 'cancelled']);
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'cancel', orderId })).toBe(day);
    expect(demoDayViews(day).manager.close.readyToClose).toBe(true);
  });

  it('keeps consumed ingredients as waste when cancelling during preparation', () => {
    let day = startDemoDay(createDemoStock());
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'cancel-prep', tableId: 't3',
      itemId: 'congee-chicken', quantity: 1,
    });
    const orderId = day.store.orders[0].id;
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId, costs: { congee: 500, chicken: 1000 },
    });
    const stockAfterPreparation = { ...day.store.stock };
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'cancel', orderId });
    expect(day.store.stock).toEqual(stockAfterPreparation);
    expect(day.store.wasteCostSatang).toBe(1500);
    expect(day.store.cashSatang).toBe(0);
    expect(demoDayViews(day).manager.close.readyToClose).toBe(true);
  });
});
