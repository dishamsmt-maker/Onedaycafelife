import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { demoRecipeUnitCosts } from './demoIngredientCosts';

describe('illustrative demo ingredient costs', () => {
  it('covers all eight recipes with nonzero integer unit costs', () => {
    for (const item of DEMO_HALAL_MENU) {
      const costs = demoRecipeUnitCosts(item.recipe);
      expect(Object.keys(costs).sort()).toEqual(Object.keys(item.recipe).sort());
      expect(Object.values(costs).every(value => Number.isSafeInteger(value) && value > 0)).toBe(true);
    }
  });
  it('rejects ingredients without an explicit assumed cost', () => {
    expect(() => demoRecipeUnitCosts({ unknown: 1 })).toThrow();
  });
});
