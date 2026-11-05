import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';
import { closeCafeDay, reconcileCafeCash } from './orderCore';

describe('demo day cancellation after production', () => {
  it('records waste once, never restores consumed stock, and closes without phantom revenue', () => {
    let day = startDemoDay(createDemoStock(1));
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'waste-t3',
      tableId: 't3', itemId: 'congee-chicken', quantity: 1,
    });
    const orderId = day.store.orders[0].id;
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId,
      costs: { congee: 500, chicken: 1000 },
    });
    expect(day.store.orders[0].stockConsumed).toBe(true);
    expect(day.store.stock.chicken).toBe(0);
    const cost = day.store.orders[0].consumedCostSatang;
    expect(cost).toBeDefined();

    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'cancel', orderId,
    });
    expect(day.store.orders[0].status).toBe('cancelled');
    expect(day.store.stock.chicken).toBe(0);
    expect(day.store.wasteCostSatang).toBe(cost);
    expect(day.store.cashSatang).toBe(0);
    expect(reconcileCafeCash(day.store).balanced).toBe(true);
    expect(demoDayViews(day).kitchen).toHaveLength(0);

    const retryCancel = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'cancel', orderId,
    });
    expect(retryCancel).toBe(day);
    const retryPay = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'manager', type: 'pay', orderId,
    });
    expect(retryPay).toBe(day);
    const report = closeCafeDay(day.store);
    expect(report.readyToClose).toBe(true);
    expect(report.wasteCostSatang).toBe(cost);
    expect(report.netSalesSatang).toBe(0);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' });
    expect(day.closed).toBe(true);
  });
});
