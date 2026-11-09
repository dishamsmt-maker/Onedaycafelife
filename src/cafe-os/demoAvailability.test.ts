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
  it('fails closed on unknown queued legacy recipes', () => {
    const store = createCafeStore(createDemoStock());
    store.orders.push({ id: 'legacy', requestId: 'legacy', tableId: 't2', itemId: 'missing-menu',
      quantity: 1, unitPriceSatang: 1, status: 'queued', paidSatang: 0, stockConsumed: false });
    expect(demoMenuAvailable(store, DEMO_HALAL_MENU, chicken)).toBe(false);
  });
});
