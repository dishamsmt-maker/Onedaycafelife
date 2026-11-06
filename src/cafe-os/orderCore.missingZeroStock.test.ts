import { describe, expect, it } from 'vitest';
import { advanceCafeOrder, createCafeStore, submitCafeOrder, type CafeCatalogItem } from './orderCore';

describe('preparation stock integrity', () => {
  const catalog: CafeCatalogItem[] = [{
    id: 'tea', priceSatang: 3500, enabled: true, recipe: { ice: 0 },
  }];

  it('does not create NaN inventory when a zero-quantity ingredient key is missing', () => {
    // Imported/legacy queued state may be incomplete even when QR validation is strict.
    const queued = submitCafeOrder(createCafeStore({ ice: 0 }), catalog, {
      requestId: 'zero-ice', tableId: 'T03', itemId: 'tea', quantity: 1,
    });
    expect(queued.accepted).toBe(true);
    const incomplete = { ...queued.store, stock: {} };
    const next = advanceCafeOrder(incomplete, catalog, queued.order.id, 'preparing');
    expect(next).toBe(incomplete);
    expect(next.orders[0].status).toBe('queued');
    expect(next.stock).toEqual({});
  });

  it('still permits a valid zero-quantity ingredient when stock is explicitly present', () => {
    const queued = submitCafeOrder(createCafeStore({ ice: 0 }), catalog, {
      requestId: 'valid-zero-ice', tableId: 'T03', itemId: 'tea', quantity: 1,
    });
    expect(queued.accepted).toBe(true);
    const next = advanceCafeOrder(queued.store, catalog, queued.order.id, 'preparing');
    expect(next.orders[0].status).toBe('preparing');
    expect(next.stock.ice).toBe(0);
    expect(Number.isFinite(next.stock.ice)).toBe(true);
  });
});
