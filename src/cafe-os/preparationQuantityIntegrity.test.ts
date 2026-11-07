import { describe, expect, it } from 'vitest';
import { advanceCafeOrder, createCafeStore, submitCafeOrder, type CafeCatalogItem } from './orderCore';

const menu: CafeCatalogItem[] = [
  { id: 'halal-tea', enabled: true, priceSatang: 4500, recipe: { tea: 2 } },
];

describe('imported order preparation integrity', () => {
  const queued = () => {
    const placed = submitCafeOrder(createCafeStore({ tea: 4 }), menu, {
      requestId: 't3-import', tableId: 'T3', itemId: 'halal-tea', quantity: 1,
    });
    expect(placed.accepted).toBe(true);
    return placed;
  };

  it.each([0, -1, 1.5, Number.NaN, Number.POSITIVE_INFINITY])(
    'rejects an imported quantity of %s without consuming inventory', quantity => {
      const placed = queued();
      const imported = { ...placed.store, orders: [{ ...placed.order, quantity }] };
      expect(advanceCafeOrder(imported, menu, placed.order.id, 'preparing')).toBe(imported);
      expect(imported.stock.tea).toBe(4);
      expect(imported.orders[0].status).toBe('queued');
    },
  );

  it('rejects a malformed recipe ingredient identifier', () => {
    const placed = queued();
    const imported = { ...placed.store, orders: [{
      ...placed.order, recipeSnapshot: { ' ': 1 },
    }] };
    expect(advanceCafeOrder(imported, menu, placed.order.id, 'preparing')).toBe(imported);
    expect(imported.stock.tea).toBe(4);
  });

  it('still deducts valid stock exactly once', () => {
    const placed = queued();
    const preparing = advanceCafeOrder(placed.store, menu, placed.order.id, 'preparing');
    expect(preparing.stock.tea).toBe(2);
    expect(advanceCafeOrder(preparing, menu, placed.order.id, 'preparing')).toBe(preparing);
  });
});
