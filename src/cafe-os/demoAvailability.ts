import type { CafeCatalogItem, CafeStore } from './orderCore';

/** Read-only QR availability hint; submitCafeOrder remains the final authority. */
export function demoMenuAvailable(store: CafeStore, catalog: readonly CafeCatalogItem[], item: CafeCatalogItem, quantity = 1): boolean {
  if (!item.enabled || !Number.isSafeInteger(quantity) || quantity <= 0 ||
    !Number.isSafeInteger(item.priceSatang) || item.priceSatang < 0 ||
    !Number.isSafeInteger(item.priceSatang * quantity)) return false;
  const queued = store.orders.filter(o => o.status === 'queued' && !o.stockConsumed);
  // Fail closed for legacy queued orders whose reservations cannot be resolved.
  const reservations = queued.map(o => ({
    quantity: o.quantity,
    recipe: o.recipeSnapshot ?? catalog.find(m => m.id === o.itemId)?.recipe,
  }));
  if (reservations.some(r => !r.recipe || !Number.isSafeInteger(r.quantity) || r.quantity <= 0 ||
    Object.entries(r.recipe).some(([id, units]) => !id.trim() || !Number.isFinite(units) || units < 0 ||
      !Number.isFinite(units * r.quantity)))) return false;
  return Object.entries(item.recipe).every(([id, units]) => {
    if (!id.trim() || !Number.isFinite(units) || units < 0) return false;
    const reserved = reservations.reduce((total, r) => total + (r.recipe?.[id] ?? 0) * r.quantity, 0);
    const onHand = store.stock[id];
    return Number.isFinite(onHand) && onHand >= 0 && Number.isFinite(reserved) &&
      Number.isFinite(units * quantity) && onHand - reserved >= units * quantity;
  });
}
