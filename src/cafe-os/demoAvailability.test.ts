import { describe, expect, it } from 'vitest';
import { createCafeStore, submitCafeOrder, advanceCafeOrder } from './orderCore';
import { DEMO_HALAL_MENU, createDemoStock } from './demoCatalog';
import { demoMenuAvailable } from './demoAvailability';

const chicken = DEMO_HALAL_MENU.find(m => m.id === 'congee-chicken')!;

describe('demo QR availability matches queued reservations', () => {
  it('hides a sold-out item while stock is reserved, then restores after cancellation', () => {
    const initial = createCafeStore({ ...createDemoStock(), chicken: 1 });
    expect(demoMenuAvailable(initial, DEMO_HALAL_MENU, chicken)).toBe(true);
    const accepted = submitCafeOrder(initial, DEMO_HALAL_MENU, {
      requestId: 'reserve-1', tableId: 't3', itemId: chicken.id, quantity: 1,
    });
    expect(accepted.accepted).toBe(true);
    expect(accepted.store.stock.chicken).toBe(1); // queued reservation, not yet deducted
    expect(demoMenuAvailable(accepted.store, DEMO_HALAL_MENU, chicken)).toBe(false);
    const cancelled = advanceCafeOrder(accepted.store, DEMO_HALAL_MENU, accepted.order.id, 'cancelled');
    expect(demoMenuAvailable(cancelled, DEMO_HALAL_MENU, chicken)).toBe(true);
  });
  it('does not count consumed reservations twice after preparation', () => {
    const initial = createCafeStore({ ...createDemoStock(), chicken: 2 });
    const accepted = submitCafeOrder(initial, DEMO_HALAL_MENU, {
      requestId: 'reserve-2', tableId: 't3', itemId: chicken.id, quantity: 1,
    });
    const preparing = advanceCafeOrder(accepted.store, DEMO_HALAL_MENU, accepted.order.id, 'preparing');
    expect(preparing.stock.chicken).toBe(1);
    expect(demoMenuAvailable(preparing, DEMO_HALAL_MENU, chicken)).toBe(true);
  });
  it('keeps QR availability aligned with the core for invalid prices', () => {
    const store = createCafeStore(createDemoStock());
    for (const priceSatang of [-1, 1.5, Number.MAX_SAFE_INTEGER]) {
      const invalid = { ...chicken, priceSatang };
      expect(demoMenuAvailable(store, [invalid], invalid, 2)).toBe(false);
      expect(submitCafeOrder(store, [invalid], {
        requestId: 'bad-price-' + priceSatang, tableId: 't3', itemId: invalid.id, quantity: 2,
      }).accepted).toBe(false);
    }
  });
  it('reserves shared ingredients across different menu items', () => {
    const stock = createDemoStock();
    stock.chicken = 1;
    const initial = createCafeStore(stock);
    const accepted = submitCafeOrder(initial, DEMO_HALAL_MENU, {
      requestId: 'cross-menu', tableId: 't3', itemId: chicken.id, quantity: 1,
    });
    expect(accepted.accepted).toBe(true);
    const porridge = DEMO_HALAL_MENU.find(m => m.id === 'rice-porridge-chicken')!;
    expect(demoMenuAvailable(accepted.store, DEMO_HALAL_MENU, porridge)).toBe(false);
    expect(submitCafeOrder(accepted.store, DEMO_HALAL_MENU, {
      requestId: 'cross-menu-2', tableId: 't4', itemId: porridge.id, quantity: 1,
    }).accepted).toBe(false);
  });
  it('does not advertise missing or stale catalog entries as orderable', () => {
    const store = createCafeStore(createDemoStock());
    const missing = { ...chicken, id: 'removed-item' };
    const stale = { ...chicken, priceSatang: 0 };
    expect(demoMenuAvailable(store, DEMO_HALAL_MENU, missing)).toBe(false);
    expect(demoMenuAvailable(store, DEMO_HALAL_MENU, stale)).toBe(false);
    expect(submitCafeOrder(store, DEMO_HALAL_MENU, {
      requestId: 'removed-item', tableId: 't3', itemId: missing.id, quantity: 1,
    }).accepted).toBe(false);
    // A stale UI object cannot override the catalog's actual price.
    const accepted = submitCafeOrder(store, DEMO_HALAL_MENU, {
      requestId: 'canonical-price', tableId: 't3', itemId: stale.id, quantity: 1,
    });
    expect(accepted.accepted).toBe(true);
    expect(accepted.order.unitPriceSatang).toBe(chicken.priceSatang);
  });
  it('fails closed on unknown queued legacy recipes', () => {
    const store = createCafeStore(createDemoStock());
    store.orders.push({ id: 'legacy', requestId: 'legacy', tableId: 't2', itemId: 'missing-menu',
      quantity: 1, unitPriceSatang: 1, status: 'queued', paidSatang: 0, stockConsumed: false });
    expect(demoMenuAvailable(store, DEMO_HALAL_MENU, chicken)).toBe(false);
  });
});
