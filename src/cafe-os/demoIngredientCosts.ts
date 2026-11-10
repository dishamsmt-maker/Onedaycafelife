/** Illustrative ingredient costs in satang per recipe unit; NOT supplier quotes.
 * Game-only defaults. Replace after purchase invoices and portion sizes are verified.
 */
export const DEMO_INGREDIENT_COST_SATANG: Readonly<Record<string, number>> = Object.freeze({
  rice: 400, chicken: 1200, broth: 300, fish: 1800,
  congee: 600, bread: 350, egg: 600, marinade: 200,
  potato: 500, oil: 200, tea: 350, milk: 550,
  ice: 100, coffee: 750,
});

export function demoRecipeUnitCosts(recipe: Readonly<Record<string, number>>): Record<string, number> {
  const costs: Record<string, number> = {};
  for (const [ingredient, units] of Object.entries(recipe)) {
    const cost = DEMO_INGREDIENT_COST_SATANG[ingredient];
    if (!Number.isSafeInteger(units) || units < 0 || !Number.isSafeInteger(cost) || cost < 0) {
      throw new Error('Missing or invalid illustrative cost for ' + ingredient);
    }
    costs[ingredient] = cost;
  }
  return costs;
}
