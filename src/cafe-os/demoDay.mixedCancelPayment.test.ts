import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';
import { reconcileCafeCash } from './orderCore';

describe('mixed cancellation and payment at the same demo table', () => {
  it('keeps cancelled prepared food as waste and reconciles only the paid bill', () => {
    let day = startDemoDay(createDemoStock());
    const place = (requestId: string) => {
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'customer', type: 'order', requestId, tableId: 't3',
        itemId: 'congee-chicken', quantity: 1,
      });
      return day.store.orders[day.store.orders.length - 1].id;
    };
    const cancelledId = place('t3-cancel-prepared');
    const paidId = place('t3-keep-bill');
    const prepare = (orderId: string) => {
      day = applyDemoAction(day, DEMO_HALAL_MENU, {
        actor: 'Na', type: 'prepare', orderId,
        costs: { congee: 500, chicken: 1000 },
      });
    };
    prepare(cancelledId);
    const cancelledCost = day.store.orders.find(o => o.id === cancelledId)!.consumedCostSatang!;
    expect(cancelledCost).toBeGreaterThan(0);
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'cancel', orderId: cancelledId,
    });
    expect(day.store.wasteCostSatang).toBe(cancelledCost);
    expect(applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'cancel', orderId: cancelledId,
    })).toBe(day);

    prepare(paidId);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'ready', orderId: paidId });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Ken', type: 'serve', orderId: paidId });
    expect(demoDayViews(day).manager.queueCounts.payment).toBe(1);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId: paidId });
    const paidAmount = day.store.orders.find(o => o.id === paidId)!.paidSatang;
    expect(day.store.cashSatang).toBe(paidAmount);
    expect(day.store.cashEvents).toHaveLength(1);
    expect(reconcileCafeCash(day.store)).toEqual({ expectedSatang: paidAmount, balanced: true });
    expect(demoDayViews(day).manager.queueCounts.payment).toBe(0);
    expect(demoDayViews(day).manager.close.readyToClose).toBe(true);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' });
    expect(day.closed).toBe(true);
    expect(day.events.at(-1)?.action).toBe('closed');
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId: cancelledId })).toBe(day);
  });
});
