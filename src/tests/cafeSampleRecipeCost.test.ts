import { describe, expect, it } from 'vitest';
import { estimateSampleIngredientCost } from '../cafe-os/sampleRecipeCost';

// ALL VALUES BELOW ARE FICTIONAL TEST FIXTURES, NOT ONE DAY PURCHASES.
const sample = {
  packs: [
    { ingredientId: 'rice', unit: 'g', packQuantity: 1000, packCostSatang: 6000 },
    { ingredientId: 'chicken', unit: 'g', packQuantity: 500, packCostSatang: 9000 },
  ],
  recipe: [
    { ingredientId: 'rice', unit: 'g', usedQuantity: 50 },
    { ingredientId: 'chicken', unit: 'g', usedQuantity: 75 },
  ],
};

describe('Café OS sample ingredient costing — no real prices or sales', () => {
  it('calculates a fictional recipe in exact integer satang and labels it unverified', () => {
    expect(estimateSampleIngredientCost(sample)).toEqual({
      ok: true,
      status: 'UNVERIFIED_SAMPLE_ONLY',
      ingredientCostSatang: 1650, // rice 300 + chicken 1350, NOT a real price
      rounding: 'half_up_at_total',
      ingredientCount: 2,
    });
  });

  it('handles g, ml and piece only when the pack and recipe units match', () => {
    const result = estimateSampleIngredientCost({
      packs: [
        { ingredientId: 'milk', unit: 'ml', packQuantity: 1000, packCostSatang: 6500 },
        { ingredientId: 'egg', unit: 'piece', packQuantity: 30, packCostSatang: 12000 },
      ],
      recipe: [
        { ingredientId: 'milk', unit: 'ml', usedQuantity: 150 },
        { ingredientId: 'egg', unit: 'piece', usedQuantity: 2 },
      ],
    });
    expect(result.ok && result.ingredientCostSatang).toBe(1775);
  });

  it('rounds once at the total: two 1/3-satang lines become 1 satang', () => {
    const result = estimateSampleIngredientCost({
      packs: [
        { ingredientId: 'a', unit: 'g', packQuantity: 3, packCostSatang: 1 },
        { ingredientId: 'b', unit: 'g', packQuantity: 3, packCostSatang: 1 },
      ],
      recipe: [
        { ingredientId: 'a', unit: 'g', usedQuantity: 1 },
        { ingredientId: 'b', unit: 'g', usedQuantity: 1 },
      ],
    });
    expect(result.ok && result.ingredientCostSatang).toBe(1);
  });

  it('uses half-up rounding for exact half satang', () => {
    const result = estimateSampleIngredientCost({
      packs: [{ ingredientId: 'a', unit: 'piece', packQuantity: 2, packCostSatang: 1 }],
      recipe: [{ ingredientId: 'a', unit: 'piece', usedQuantity: 1 }],
    });
    expect(result.ok && result.ingredientCostSatang).toBe(1);
  });

  it('rejects a missing ingredient or mixed unit rather than silently converting', () => {
    const missing = estimateSampleIngredientCost({
      ...sample,
      recipe: [{ ingredientId: 'fish', unit: 'g', usedQuantity: 100 }],
    });
    expect(missing).toEqual({ ok: false, status: 'UNVERIFIED_SAMPLE_ONLY', reason: 'missing_ingredient' });
    const mixed = estimateSampleIngredientCost({
      ...sample,
      recipe: [{ ingredientId: 'rice', unit: 'ml', usedQuantity: 50 }],
    });
    expect(mixed).toEqual({ ok: false, status: 'UNVERIFIED_SAMPLE_ONLY', reason: 'unit_mismatch' });
  });

  it('rejects duplicate ingredients, unsupported units, and invalid quantities', () => {
    const invalid: unknown[] = [
      { ...sample, recipe: [] },
      { ...sample, recipe: [...sample.recipe, sample.recipe[0]] },
      { ...sample, packs: [...sample.packs, sample.packs[0]] },
      { ...sample, recipe: [{ ingredientId: 'rice', unit: 'kg', usedQuantity: 1 }] },
      { ...sample, recipe: [{ ingredientId: 'rice', unit: 'g', usedQuantity: 0 }] },
      { ...sample, recipe: [{ ingredientId: 'rice', unit: 'g', usedQuantity: 1.5 }] },
      { ...sample, recipe: [{ ingredientId: 'rice', unit: 'g', usedQuantity: Number.NaN }] },
      { ...sample, recipe: [{ ingredientId: 'rice', unit: 'g', usedQuantity: Number.POSITIVE_INFINITY }] },
      { ...sample, packs: [{ ...sample.packs[0], packCostSatang: -1 }] },
      { ...sample, packs: [{ ...sample.packs[0], packCostSatang: 12.5 }] },
      { ...sample, packs: [{ ...sample.packs[0], packQuantity: 0 }] },
      { ...sample, packs: [{ ...sample.packs[0], packQuantity: 1_000_000_001 }] },
      { ...sample, recipe: [{ ...sample.recipe[0], price: 1 }] },
      { ...sample, packs: [{ ...sample.packs[0], verified: true }] },
      { ...sample, salePriceSatang: 9999 },
      null, [], 'recipe',
    ];
    for (const value of invalid) {
      expect(estimateSampleIngredientCost(value)).toEqual({
        ok: false, status: 'UNVERIFIED_SAMPLE_ONLY', reason: 'invalid_input',
      });
    }
  });

  it('reports an overflow instead of silently losing precision', () => {
    const result = estimateSampleIngredientCost({
      packs: [{ ingredientId: 'a', unit: 'piece', packQuantity: 1, packCostSatang: 1_000_000_000 }],
      recipe: [{ ingredientId: 'a', unit: 'piece', usedQuantity: 1_000_000_000 }],
    });
    expect(result).toEqual({ ok: false, status: 'UNVERIFIED_SAMPLE_ONLY', reason: 'cost_overflow' });
  });

  it('is deterministic, read-only and independent of game data', () => {
    const first = estimateSampleIngredientCost(sample);
    const second = estimateSampleIngredientCost(structuredClone(sample));
    expect(first).toEqual(second);
    expect(sample.recipe[0].usedQuantity).toBe(50);
    expect(JSON.stringify(first)).not.toContain('sellingPrice');
    expect(JSON.stringify(first)).not.toContain('profit');
  });
});
