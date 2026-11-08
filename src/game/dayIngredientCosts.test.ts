import { describe, expect, it } from 'vitest';
import { replayGameDayWithStock } from './dayStockReplay';
import { summarizeGameIngredientCosts } from './dayIngredientCosts';
import type { DayEvent } from './dayEventProjection';

const events: DayEvent[] = [
  { id: 'order-a', type: 'ordered', orderId: 'a', tableId: 'T3', itemId: 'tea', totalSatang: 4500 },
  { id: 'prep-a', type: 'preparing', orderId: 'a' },
  { id: 'ready-a', type: 'ready', orderId: 'a' },
  { id: 'cancel-a', type: 'cancelled', orderId: 'a' },
  { id: 'order-b', type: 'ordered', orderId: 'b', tableId: 'T3', itemId: 'tea', totalSatang: 4500 },
  { id: 'prep-b', type: 'preparing', orderId: 'b' },
  { id: 'ready-b', type: 'ready', orderId: 'b' },
  { id: 'serve-b', type: 'served', orderId: 'b' },
  { id: 'pay-b', type: 'paid', orderId: 'b' },
];

describe('game-only ingredient costing', () => {
  const replay = replayGameDayWithStock(events, { teaG: 20 }, { tea: { teaG: 10 } });
  it('counts prepared cancellation as waste cost but not revenue', () => {
    expect(summarizeGameIngredientCosts(replay, { teaG: 30 })).toEqual({
      revenueSatang: 4500,
      ingredientCostSatang: 600,
      wasteCostSatang: 300,
      grossMarginSatang: 3900,
      missingCostIngredients: [],
      complete: true,
    });
  });
  it('flags missing unit costs instead of treating unknown costs as zero', () => {
    expect(summarizeGameIngredientCosts(replay, {})).toMatchObject({
      complete: false, missingCostIngredients: ['teaG'],
    });
  });
  it('rejects corrupt replay quantities, waste, and revenue before computing margins', () => {
    expect(() => summarizeGameIngredientCosts({
      ...replay, consumed: { teaG: -1 },
    }, { teaG: 30 })).toThrow('Invalid game ingredient quantity');
    expect(() => summarizeGameIngredientCosts({
      ...replay, waste: { teaG: Number.NaN },
    }, { teaG: 30 })).toThrow('Invalid game ingredient quantity');
    expect(() => summarizeGameIngredientCosts({
      ...replay, waste: { teaG: 21 },
    }, { teaG: 30 })).toThrow('Game waste exceeds consumed stock');
    expect(() => summarizeGameIngredientCosts({
      ...replay, waste: { other: 1 },
    }, { teaG: 30 })).toThrow('Game waste exceeds consumed stock');
    expect(() => summarizeGameIngredientCosts({
      ...replay, day: { ...replay.day, revenueSatang: -1 },
    }, { teaG: 30 })).toThrow('Invalid game revenue');
  });
  it('ignores zero-use ingredient entries when checking missing costs', () => {
    expect(summarizeGameIngredientCosts({
      ...replay, consumed: { ...replay.consumed, optionalSyrupMl: 0 },
    }, { teaG: 30 })).toMatchObject({
      complete: true, missingCostIngredients: [], ingredientCostSatang: 600,
    });
  });
  it('allows recipes with zero-quantity optional ingredients without stock entries', () => {
    const zeroRecipeReplay = replayGameDayWithStock(events, { teaG: 20 }, {
      tea: { teaG: 10, optionalSyrupMl: 0 },
    });
    expect(zeroRecipeReplay.rejectedEventIds).toEqual([]);
    expect(zeroRecipeReplay.remaining).toEqual({ teaG: 0 });
    expect(zeroRecipeReplay.consumed).toEqual({ teaG: 20 });
    expect(zeroRecipeReplay.waste).toEqual({ teaG: 10 });
  });
  it('rejects invalid or overflowing costs', () => {
    expect(() => summarizeGameIngredientCosts(replay, { teaG: -1 })).toThrow();
    expect(() => summarizeGameIngredientCosts(replay, { teaG: Number.MAX_SAFE_INTEGER })).toThrow();
  });
});
