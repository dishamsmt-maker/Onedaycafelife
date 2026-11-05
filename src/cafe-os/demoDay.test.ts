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
    expect(day.closed).toBe(false);
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
    expect(day.closed).toBe(false);
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
  it('rejects payment before service without changing cash or event log', () => {
    let day = startDemoDay(createDemoStock());
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'pay-guard', tableId: 't3',
      itemId: 'congee-chicken', quantity: 1,
    });
    const orderId = day.store.orders[0].id;
    const before = day;
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId })).toBe(before);
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId, costs: { congee: 500, chicken: 1000 },
    });
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId })).toBe(day);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'ready', orderId });
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId })).toBe(day);
    expect(day.store.cashSatang).toBe(0);
    expect(day.store.cashEvents).toHaveLength(0);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Ken', type: 'serve', orderId });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId });
    expect(day.store.cashSatang).toBe(4500);
    expect(day.store.cashEvents).toHaveLength(1);
    expect(day.events.map(e => e.action)).toEqual(['ordered', 'preparing', 'ready', 'served', 'paid']);
  });

  it('closes only after payment and rejects further mutations or repeated close', () => {
    let day = startDemoDay(createDemoStock());
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'customer', type: 'order', requestId: 'close-day', tableId: 't3', itemId: 'congee-chicken', quantity: 1 });
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' })).toBe(day);
    const orderId = day.store.orders[0].id;
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'prepare', orderId, costs: { congee: 500, chicken: 1000 } });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'ready', orderId });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Ken', type: 'serve', orderId });
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' })).toBe(day);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId });
    const closed = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' });
    expect(closed.closed).toBe(true);
    expect(closed.events.at(-1)?.action).toBe('closed');
    expect(applyDemoAction(closed, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' })).toBe(closed);
    expect(applyDemoAction(closed, DEMO_HALAL_MENU, { actor: 'customer', type: 'order', requestId: 'late', tableId: 't1', itemId: 'congee-chicken', quantity: 1 })).toBe(closed);
    expect(closed.store.cashSatang).toBe(4500);
  });
});
