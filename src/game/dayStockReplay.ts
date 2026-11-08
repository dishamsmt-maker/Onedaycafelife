import { applyGameDayEvent, emptyGameDay, type DayEvent, type GameDay } from './dayEventProjection';

/** Game-only ingredient consumption, derived from accepted preparation events.
 * Never connects to the real Café OS inventory or financial ledger.
 * Quantities are integer base units (e.g. ml, grams, pieces).
 */
export type GameRecipe = Readonly<Record<string, number>>;
export type GameRecipes = Readonly<Record<string, GameRecipe>>;
export type GameStock = Readonly<Record<string, number>>;
export interface StockReplay {
  day: GameDay;
  remaining: Record<string, number>;
  consumed: Record<string, number>;
  waste: Record<string, number>;
  acceptedEventIds: string[];
  rejectedEventIds: string[];
}
function validQuantities(values: GameStock): boolean {
  return Object.values(values).every(v => Number.isSafeInteger(v) && v >= 0);
}
export function replayGameDayWithStock(
  events: readonly DayEvent[], initialStock: GameStock, recipes: GameRecipes,
): StockReplay {
  if (!validQuantities(initialStock) ||
      !Object.values(recipes).every(recipe => validQuantities(recipe) && Object.values(recipe).some(quantity => quantity > 0))) {
    throw new Error('Invalid game stock or recipe');
  }
  let day = emptyGameDay();
  const remaining = { ...initialStock };
  const consumed: Record<string, number> = {};
  const waste: Record<string, number> = {};
  const acceptedEventIds: string[] = [];
  const rejectedEventIds: string[] = [];
  for (const event of events) {
    const before = day.orders.find(o => o.id === event.orderId);
    const next = applyGameDayEvent(day, event);
    if (next === day) { rejectedEventIds.push(event.id); continue; }
    if (event.type === 'ordered' && !recipes[event.itemId]) {
      rejectedEventIds.push(event.id); continue;
    }
    if (event.type === 'preparing') {
      const recipe = before && recipes[before.itemId];
      if (!recipe || Object.entries(recipe).filter(([, quantity]) => quantity > 0).some(([ingredient, quantity]) =>
        !Number.isSafeInteger(remaining[ingredient]) || remaining[ingredient] < quantity ||
        !Number.isSafeInteger((consumed[ingredient] ?? 0) + quantity))) {
        rejectedEventIds.push(event.id); continue;
      }
      for (const [ingredient, quantity] of Object.entries(recipe).filter(([, quantity]) => quantity > 0)) {
        remaining[ingredient] -= quantity;
        consumed[ingredient] = (consumed[ingredient] ?? 0) + quantity;
      }
    }
    if (event.type === 'cancelled' && before && before.status !== 'queued') {
      if (Object.entries(recipes[before.itemId]).filter(([, quantity]) => quantity > 0).some(([ingredient, quantity]) =>
        !Number.isSafeInteger((waste[ingredient] ?? 0) + quantity))) {
        rejectedEventIds.push(event.id); continue;
      }
      for (const [ingredient, quantity] of Object.entries(recipes[before.itemId]).filter(([, quantity]) => quantity > 0)) {
        waste[ingredient] = (waste[ingredient] ?? 0) + quantity;
      }
    }
    day = next;
    acceptedEventIds.push(event.id);
  }
  return { day, remaining, consumed, waste, acceptedEventIds, rejectedEventIds };
}
