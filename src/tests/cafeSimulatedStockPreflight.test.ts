import { describe, expect, it } from 'vitest';
import { createCafeSimulatedStockPreflight } from '../cafe-os/simulatedStockPreflight';

// Entirely fictional fixtures. Not a ONE DAY menu, inventory or real recipe.
const stock = [
  { ingredientId: 'sample-rice', unit: 'g', onHand: 200 },
  { ingredientId: 'sample-chicken', unit: 'g', onHand: 200 },
  { ingredientId: 'sample-water', unit: 'ml', onHand: 500 },
  { ingredientId: 'sample-egg', unit: 'piece', onHand: 2 },
];
const recipes = [
  {
    menuId: 'sample-porridge',
    ingredients: [
      { ingredientId: 'sample-rice', unit: 'g', perServing: 50 },
      { ingredientId: 'sample-chicken', unit: 'g', perServing: 75 },
      { ingredientId: 'sample-water', unit: 'ml', perServing: 200 },
    ],
  },
  {
    menuId: 'sample-egg-bowl',
    ingredients: [
      { ingredientId: 'sample-rice', unit: 'g', perServing: 50 },
      { ingredientId: 'sample-egg', unit: 'piece', perServing: 1 },
      { ingredientId: 'sample-water', unit: 'ml', perServing: 200 },
    ],
  },
];
const request = (
  items = [{ menuId: 'sample-porridge', quantity: 1 }],
  tableId = 'T01',
) => ({
  requestId: 'synthetic-stock-request-0001',
  tableId,
  items,
});

describe('Café OS simulated stock preflight — read-only and NOT an order authorization', () => {
  it('checks a valid T01 request against fictional base-unit quantities', () => {
    const preflight = createCafeSimulatedStockPreflight(stock, recipes);
    expect(preflight.getFixtureValidation()).toEqual({ ok: true, status: 'SIMULATED_ONLY' });
    expect(preflight.check(request())).toEqual({
      status: 'SIMULATED_ONLY',
      available: true,
      requirements: [
        { ingredientId: 'sample-rice', unit: 'g', required: 50, onHand: 200 },
        { ingredientId: 'sample-chicken', unit: 'g', required: 75, onHand: 200 },
        { ingredientId: 'sample-water', unit: 'ml', required: 200, onHand: 500 },
      ],
    });
  });

  it('aggregates demand across dishes and quantities before comparing stock', () => {
    const preflight = createCafeSimulatedStockPreflight(stock, recipes);
    const result = preflight.check(request([
      { menuId: 'sample-porridge', quantity: 2 },
      { menuId: 'sample-egg-bowl', quantity: 1 },
    ], 'T03'));
    expect(result).toEqual({
      status: 'SIMULATED_ONLY',
      available: false,
      reason: 'insufficient_stock',
      shortages: [{ ingredientId: 'sample-water', unit: 'ml', required: 600, onHand: 500 }],
    });
  });

  it('accepts exactly enough stock, but zero stock fails', () => {
    const exactly = createCafeSimulatedStockPreflight(
      stock.map(line => line.ingredientId === 'sample-water' ? { ...line, onHand: 200 } : line),
      recipes,
    );
    expect(exactly.check(request()).available).toBe(true);
    const empty = createCafeSimulatedStockPreflight(
      stock.map(line => line.ingredientId === 'sample-water' ? { ...line, onHand: 0 } : line),
      recipes,
    );
    expect(empty.check(request())).toEqual({
      status: 'SIMULATED_ONLY', available: false, reason: 'insufficient_stock',
      shortages: [{ ingredientId: 'sample-water', unit: 'ml', required: 200, onHand: 0 }],
    });
  });

  it('rejects unknown menu IDs rather than assuming a recipe', () => {
    const preflight = createCafeSimulatedStockPreflight(stock, recipes);
    expect(preflight.check(request([{ menuId: 'unknown-menu', quantity: 1 }]))).toEqual({
      status: 'SIMULATED_ONLY', available: false, reason: 'missing_recipe',
    });
  });

  it('fails closed for missing ingredients and unit mismatches', () => {
    const noEgg = createCafeSimulatedStockPreflight(
      stock.filter(line => line.ingredientId !== 'sample-egg'), recipes,
    );
    expect(noEgg.check(request([{ menuId: 'sample-egg-bowl', quantity: 1 }]))).toEqual({
      status: 'SIMULATED_ONLY', available: false, reason: 'missing_ingredient',
    });
    const wrongUnit = createCafeSimulatedStockPreflight(
      stock.map(line => line.ingredientId === 'sample-water' ? { ...line, unit: 'g' } : line),
      recipes,
    );
    expect(wrongUnit.check(request())).toEqual({
      status: 'SIMULATED_ONLY', available: false, reason: 'unit_mismatch',
    });
  });

  it('rejects untrusted order payloads, unsupported tables and injected prices', () => {
    const preflight = createCafeSimulatedStockPreflight(stock, recipes);
    for (const invalid of [
      request(undefined, 'T04'),
      { ...request(), priceSatang: 100 },
      { ...request(), paymentStatus: 'paid' },
      { ...request(), role: 'owner' },
      { ...request(), items: [] },
      { ...request(), items: [{ menuId: 'sample-porridge', quantity: 0 }] },
      { ...request(), items: [{ menuId: 'sample-porridge', quantity: 1, discount: 50 }] },
      null,
    ]) {
      expect(preflight.check(invalid)).toEqual({
        status: 'SIMULATED_ONLY', available: false, reason: 'invalid_request',
      });
    }
  });

  it('rejects malformed stock and recipes instead of silently treating them as available', () => {
    const invalidFixtures: Array<[unknown, unknown]> = [
      [[], recipes],
      [stock, []],
      [[...stock, stock[0]], recipes],
      [[{ ...stock[0], onHand: -1 }, ...stock.slice(1)], recipes],
      [[{ ...stock[0], onHand: 1.5 }, ...stock.slice(1)], recipes],
      [[{ ...stock[0], priceSatang: 50 }, ...stock.slice(1)], recipes],
      [stock, [...recipes, recipes[0]]],
      [stock, [{ ...recipes[0], ingredients: [...recipes[0].ingredients, recipes[0].ingredients[0]] }]],
      [stock, [{ ...recipes[0], ingredients: [{ ingredientId: 'sample-rice', unit: 'g', perServing: 0 }] }]],
      [null, recipes],
    ];
    for (const [s, r] of invalidFixtures) {
      const preflight = createCafeSimulatedStockPreflight(s, r);
      expect(preflight.getFixtureValidation().ok).toBe(false);
      expect(preflight.check(request())).toEqual({
        status: 'SIMULATED_ONLY', available: false, reason: 'invalid_fixture',
      });
    }
  });

  it('snapshots input so caller mutations cannot alter the result', () => {
    const mutableStock = stock.map(line => ({ ...line }));
    const mutableRecipes = recipes.map(recipe => ({
      menuId: recipe.menuId,
      ingredients: recipe.ingredients.map(line => ({ ...line })),
    }));
    const preflight = createCafeSimulatedStockPreflight(mutableStock, mutableRecipes);
    const original = preflight.check(request());
    mutableStock[0].onHand = 0;
    mutableRecipes[0].ingredients[0].perServing = 1_000_000_000;
    mutableRecipes.push({ menuId: 'new-menu', ingredients: [{ ingredientId: 'sample-water', unit: 'ml', perServing: 1 }] });
    expect(preflight.check(request())).toEqual(original);
    expect(preflight.check(request([{ menuId: 'new-menu', quantity: 1 }]))).toEqual({
      status: 'SIMULATED_ONLY', available: false, reason: 'missing_recipe',
    });
  });

  it('never deducts or reserves stock, even when checked repeatedly', () => {
    const preflight = createCafeSimulatedStockPreflight(stock, recipes);
    const first = preflight.check(request());
    const second = preflight.check(request());
    expect(first).toEqual(second);
    expect(first.available).toBe(true);
  });

  it('does not confuse piece with grams and does not silently convert units', () => {
    const wrongRecipe = [
      { menuId: 'sample-egg-bowl', ingredients: [
        { ingredientId: 'sample-egg', unit: 'g', perServing: 1 },
      ] },
    ];
    const preflight = createCafeSimulatedStockPreflight(stock, wrongRecipe);
    expect(preflight.check(request([{ menuId: 'sample-egg-bowl', quantity: 1 }]))).toEqual({
      status: 'SIMULATED_ONLY', available: false, reason: 'unit_mismatch',
    });
  });
});
