import { describe, expect, it } from 'vitest';
import { applyDemoAction, demoDayViews, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('manager payment queue follows actual unpaid orders', () => {
  it('drops from one to zero after payment without changing served status', () => {
    let day = startDemoDay(createDemoStock());
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'queue-payment-t3',
      tableId: 't3', itemId: 'congee-chicken', quantity: 1,
    });
    const orderId = day.store.orders[0].id;
    day = applyDemoAction(day, DEMO_HALAL_MENU, {
      actor: 'Na', type: 'prepare', orderId, costs: { congee: 500, chicken: 1000 },
    });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Na', type: 'ready', orderId });
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'Ken', type: 'serve', orderId });
    expect(demoDayViews(day).manager.queueCounts.payment).toBe(1);
    day = applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId });
    expect(day.store.orders[0].status).toBe('served');
    expect(day.store.orders[0].paymentRecorded).toBe(true);
    expect(demoDayViews(day).manager.queueCounts.payment).toBe(0);
    expect(demoDayViews(day).manager.close.readyToClose).toBe(true);
    expect(applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'pay', orderId })).toBe(day);
    expect(demoDayViews(day).manager.queueCounts.payment).toBe(0);
  });
});
