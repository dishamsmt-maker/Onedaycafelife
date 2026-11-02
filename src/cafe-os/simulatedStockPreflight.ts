/**
 * ONE DAY Café OS — simulated ingredient availability preflight.
 *
 * This is a PURE, READ-ONLY demonstration. It is NOT live stock, a stock
 * reservation, an authorization decision, a persistent POS, or a KDS.
 * Never treat "available: true" as permission to sell an unapproved menu.
 * Does not import game state or real customer, supplier, or transaction data.
 */
import { parseCafeDraftOrderRequest } from './orderIntake';
import type { IngredientUnit } from './sampleRecipeCost';

export type SimulatedStockLine = Readonly<{
  ingredientId: string;
  unit: IngredientUnit;
  onHand: number; // nonnegative integer in g, ml, or piece (synthetic only)
}>;

export type SimulatedRecipe = Readonly<{
  menuId: string;
  ingredients: ReadonlyArray<Readonly<{
    ingredientId: string;
    unit: IngredientUnit;
    perServing: number; // positive integer in the same base unit
  }>>;
}>;

export type SimulatedRequirement = Readonly<{
  ingredientId: string;
  unit: IngredientUnit;
  required: number;
  onHand: number;
}>;

export type SimulatedStockCheck =
  | Readonly<{
      status: 'SIMULATED_ONLY';
      available: true;
      requirements: ReadonlyArray<SimulatedRequirement>;
    }>
  | Readonly<{
      status: 'SIMULATED_ONLY';
      available: false;
      reason:
        | 'invalid_fixture'
        | 'invalid_request'
        | 'missing_recipe'
        | 'missing_ingredient'
        | 'unit_mismatch'
        | 'insufficient_stock';
      shortages?: ReadonlyArray<SimulatedRequirement>;
    }>;

const ID = /^[a-z][a-z0-9-]{0,63}$/;
const UNITS: ReadonlyArray<string> = ['g', 'ml', 'piece'];
const fail = (reason: Exclude<SimulatedStockCheck, { available: true }>['reason']): SimulatedStockCheck =>
  ({ status: 'SIMULATED_ONLY', available: false, reason });

function isRecord(value: unknown): value is Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}
function hasKeys(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every(key => expected.includes(key));
}
function validId(value: unknown): value is string {
  return typeof value === 'string' && ID.test(value);
}
function validUnit(value: unknown): value is IngredientUnit {
  return typeof value === 'string' && UNITS.includes(value);
}
function validQuantity(value: unknown, allowZero = false): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) &&
    value >= (allowZero ? 0 : 1) && value <= 1_000_000_000;
}

/**
 * Snapshot fictional stock and recipes at construction; caller mutations
 * cannot change a previously constructed preflight.
 *
 * check() does NOT create orders or deduct/reserve stock. In production,
 * stock validation, reservation, order insert and outbox must be atomic
 * inside an authenticated database transaction AFTER menu approval.
 */
export function createCafeSimulatedStockPreflight(stock: unknown, recipes: unknown) {
  const stockMap = new Map<string, SimulatedStockLine>();
  const recipeMap = new Map<string, SimulatedRecipe>();
  let valid = Array.isArray(stock) && stock.length > 0 && stock.length <= 100 &&
    Array.isArray(recipes) && recipes.length > 0 && recipes.length <= 100;

  if (valid) {
    for (const item of stock as unknown[]) {
      if (!isRecord(item) || !hasKeys(item, ['ingredientId', 'unit', 'onHand']) ||
          !validId(item.ingredientId) || !validUnit(item.unit) ||
          !validQuantity(item.onHand, true) || stockMap.has(item.ingredientId)) {
        valid = false;
        break;
      }
      stockMap.set(item.ingredientId, Object.freeze({
        ingredientId: item.ingredientId, unit: item.unit, onHand: item.onHand,
      }));
    }
  }

  if (valid) {
    for (const recipe of recipes as unknown[]) {
      if (!isRecord(recipe) || !hasKeys(recipe, ['menuId', 'ingredients']) ||
          !validId(recipe.menuId) || recipeMap.has(recipe.menuId) ||
          !Array.isArray(recipe.ingredients) || recipe.ingredients.length < 1 ||
          recipe.ingredients.length > 30) {
        valid = false;
        break;
      }
      const lines: Array<SimulatedRecipe['ingredients'][number]> = [];
      const seen = new Set<string>();
      for (const line of recipe.ingredients) {
        if (!isRecord(line) || !hasKeys(line, ['ingredientId', 'unit', 'perServing']) ||
            !validId(line.ingredientId) || !validUnit(line.unit) ||
            !validQuantity(line.perServing) || seen.has(line.ingredientId)) {
          valid = false;
          break;
        }
        seen.add(line.ingredientId);
        lines.push(Object.freeze({
          ingredientId: line.ingredientId, unit: line.unit, perServing: line.perServing,
        }));
      }
      if (!valid) break;
      recipeMap.set(recipe.menuId, Object.freeze({
        menuId: recipe.menuId,
        ingredients: Object.freeze(lines),
      }));
    }
  }

  return {
    getFixtureValidation(): Readonly<{ ok: boolean; status: 'SIMULATED_ONLY' }> {
      return { ok: valid, status: 'SIMULATED_ONLY' };
    },
    check(requestValue: unknown): SimulatedStockCheck {
      const request = parseCafeDraftOrderRequest(requestValue);
      if (!request) return fail('invalid_request');
      if (!valid) return fail('invalid_fixture');

      const required = new Map<string, { unit: IngredientUnit; quantity: number }>();
      for (const item of request.items) {
        const recipe = recipeMap.get(item.menuId);
        if (!recipe) return fail('missing_recipe');
        for (const line of recipe.ingredients) {
          const prior = required.get(line.ingredientId);
          if (prior && prior.unit !== line.unit) return fail('unit_mismatch');
          const quantity = (prior?.quantity ?? 0) + line.perServing * item.quantity;
          if (!Number.isSafeInteger(quantity)) return fail('invalid_fixture');
          required.set(line.ingredientId, { unit: line.unit, quantity });
        }
      }

      const requirements: SimulatedRequirement[] = [];
      const shortages: SimulatedRequirement[] = [];
      for (const [ingredientId, need] of required) {
        const supply = stockMap.get(ingredientId);
        if (!supply) return fail('missing_ingredient');
        if (supply.unit !== need.unit) return fail('unit_mismatch');
        const line = Object.freeze({
          ingredientId, unit: need.unit, required: need.quantity, onHand: supply.onHand,
        });
        requirements.push(line);
        if (line.required > line.onHand) shortages.push(line);
      }
      if (shortages.length) {
        return {
          status: 'SIMULATED_ONLY', available: false,
          reason: 'insufficient_stock', shortages: Object.freeze(shortages),
        };
      }
      return {
        status: 'SIMULATED_ONLY', available: true,
        requirements: Object.freeze(requirements),
      };
    },
  };
}
