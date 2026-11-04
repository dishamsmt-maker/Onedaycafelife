import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU, DEMO_TABLE_IDS, createDemoStock } from '../cafe-os/demoCatalog';
import { createCafeStore, submitCafeOrder, advanceCafeOrder, payCafeOrder, recordCafeOrderCost, closeCafeDay } from '../cafe-os/orderCore';

describe('eight-item halal demo vertical slice', () => {
  it('has eight distinct items, positive integer prices and five unique table identifiers', () => {
    expect(DEMO_HALAL_MENU).toHaveLength(8);
    expect(new Set(DEMO_HALAL_MENU.map(x => x.id)).size).toBe(8);
    expect(new Set(DEMO_TABLE_IDS).size).toBe(5);
    expect(DEMO_HALAL_MENU.every(x => x.enabled && x.priceSatang > 0 && Number.isSafeInteger(x.priceSatang))).toBe(true);
  });
  it('runs table 3 QR to kitchen, service, payment and close without touching game state', () => {
    const item = DEMO_HALAL_MENU[0];
    const initial = createCafeStore(createDemoStock());
    const submitted = submitCafeOrder(initial, DEMO_HALAL_MENU, {
      requestId: 'demo-day-t3-1', tableId: 't3', itemId: item.id, quantity: 1,
    });
    expect(submitted.accepted).toBe(true);
    const preparing = advanceCafeOrder(submitted.store, DEMO_HALAL_MENU, submitted.order.id, 'preparing');
    expect(preparing.stock.rice).toBe(19);
    const costs = Object.fromEntries(Object.keys(preparing.stock).map(id => [id, 100]));
    const costed = recordCafeOrderCost(preparing, DEMO_HALAL_MENU, submitted.order.id, costs);
    const ready = advanceCafeOrder(costed, DEMO_HALAL_MENU, submitted.order.id, 'ready');
    const served = advanceCafeOrder(ready, DEMO_HALAL_MENU, submitted.order.id, 'served');
    const paid = payCafeOrder(served, submitted.order.id);
    expect(closeCafeDay(paid).readyToClose).toBe(true);
    expect(closeCafeDay(paid).netSalesSatang).toBe(item.priceSatang);
    expect(initial.orders).toHaveLength(0);
  });
});
