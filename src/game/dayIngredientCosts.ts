import type { StockReplay } from './dayStockReplay';

/** Simulation-only cost summary. Costs are satang per ingredient base unit.
 * No connection to Café OS stock, orders, or payments.
 */
export interface GameCostSummary {
  revenueSatang: number;
  ingredientCostSatang: number;
  wasteCostSatang: number;
  grossMarginSatang: number;
  missingCostIngredients: string[];
  complete: boolean;
}

export function summarizeGameIngredientCosts(
  replay: StockReplay,
  unitCostsSatang: Readonly<Record<string, number>>,
): GameCostSummary {
  if (Object.values(unitCostsSatang).some(cost => !Number.isSafeInteger(cost) || cost < 0)) {
    throw new Error('Invalid game ingredient unit cost');
  }
  let ingredientCostSatang = 0;
  let wasteCostSatang = 0;
  const missingCostIngredients: string[] = [];
  for (const [ingredient, quantity] of Object.entries(replay.consumed)) {
    const unitCost = Object.prototype.hasOwnProperty.call(unitCostsSatang, ingredient)
      ? unitCostsSatang[ingredient] : undefined;
    if (unitCost === undefined) {
      missingCostIngredients.push(ingredient);
      continue;
    }
    const lineCost = quantity * unitCost;
    const wasteLineCost = (replay.waste[ingredient] ?? 0) * unitCost;
    if (!Number.isSafeInteger(lineCost) || !Number.isSafeInteger(wasteLineCost) ||
        !Number.isSafeInteger(ingredientCostSatang + lineCost) ||
        !Number.isSafeInteger(wasteCostSatang + wasteLineCost)) {
      throw new Error('Game ingredient cost overflow');
    }
    ingredientCostSatang += lineCost;
    wasteCostSatang += wasteLineCost;
  }
  const grossMarginSatang = replay.day.revenueSatang - ingredientCostSatang;
  if (!Number.isSafeInteger(grossMarginSatang)) throw new Error('Game margin overflow');
  return {
    revenueSatang: replay.day.revenueSatang,
    ingredientCostSatang,
    wasteCostSatang,
    grossMarginSatang,
    missingCostIngredients,
    complete: missingCostIngredients.length === 0,
  };
}
