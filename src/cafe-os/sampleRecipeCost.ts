/**
 * ONE DAY Café OS — sample-only recipe ingredient costing.
 *
 * Pure calculation; no real menu, vendor prices, purchases, tax, stock,
 * sales, game state or customer data. Every result is UNVERIFIED.
 * Integer base units prevent ambiguous kg/g, litre/ml conversions.
 */
export type IngredientUnit = 'g' | 'ml' | 'piece';

export type SamplePack = Readonly<{
  ingredientId: string;
  unit: IngredientUnit;
  packQuantity: number; // positive integer in g, ml or individual pieces
  packCostSatang: number; // integer THB minor units; sample values only
}>;

export type SampleRecipeLine = Readonly<{
  ingredientId: string;
  unit: IngredientUnit;
  usedQuantity: number; // positive integer in the same base unit
}>;

export type SampleCostInput = Readonly<{
  packs: ReadonlyArray<SamplePack>;
  recipe: ReadonlyArray<SampleRecipeLine>;
}>;

export type SampleCostResult =
  | Readonly<{
      ok: true;
      status: 'UNVERIFIED_SAMPLE_ONLY';
      ingredientCostSatang: number; // nearest satang, half-up ONCE on total
      rounding: 'half_up_at_total';
      ingredientCount: number;
    }>
  | Readonly<{
      ok: false;
      status: 'UNVERIFIED_SAMPLE_ONLY';
      reason: 'invalid_input' | 'missing_ingredient' | 'unit_mismatch' | 'cost_overflow';
    }>;

const ID_PATTERN = /^[a-z][a-z0-9-]{0,63}$/;
const UNITS = ['g', 'ml', 'piece'] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (value === null || typeof value !== 'object' || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function exactKeys(value: Record<string, unknown>, keys: readonly string[]): boolean {
  const actual = Object.keys(value);
  return actual.length === keys.length && actual.every(key => keys.includes(key));
}

function validId(value: unknown): value is string {
  return typeof value === 'string' && ID_PATTERN.test(value);
}

function validUnit(value: unknown): value is IngredientUnit {
  return UNITS.some(unit => unit === value);
}

function positiveQuantity(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value > 0 && value <= 1_000_000_000;
}

function sampleCost(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0 && value <= 1_000_000_000;
}

function gcd(a: bigint, b: bigint): bigint {
  while (b !== 0n) {
    const remainder = a % b;
    a = b;
    b = remainder;
  }
  return a;
}

const failure = (reason: 'invalid_input' | 'missing_ingredient' | 'unit_mismatch' | 'cost_overflow'): SampleCostResult =>
  { return { ok: false, status: 'UNVERIFIED_SAMPLE_ONLY', reason }; };

/**
 * Accepts unknown inputs to reject malformed imported sample data.
 * No unit conversion is implicit: 1 kg must be supplied as 1000 g,
 * 1 litre as 1000 ml, and pieces cannot mix with grams.
 * Does NOT check selling price, profit, stock availability or menu approval.
 */
export function estimateSampleIngredientCost(value: unknown): SampleCostResult {
  if (!isRecord(value) || !exactKeys(value, ['packs', 'recipe'])) return failure('invalid_input');
  const { packs, recipe } = value;
  if (!Array.isArray(packs) || !Array.isArray(recipe)) return failure('invalid_input');
  if (packs.length < 1 || packs.length > 30 || recipe.length < 1 || recipe.length > 30) return failure('invalid_input');

  const packMap = new Map<string, SamplePack>();
  for (const pack of packs) {
    if (!isRecord(pack) || !exactKeys(pack, ['ingredientId', 'unit', 'packQuantity', 'packCostSatang'])) {
      return failure('invalid_input');
    }
    const { ingredientId, unit, packQuantity, packCostSatang } = pack;
    if (!validId(ingredientId) || !validUnit(unit) || !positiveQuantity(packQuantity) || !sampleCost(packCostSatang)) {
      return failure('invalid_input');
    }
    if (packMap.has(ingredientId)) return failure('invalid_input');
    packMap.set(ingredientId, { ingredientId, unit, packQuantity, packCostSatang });
  }

  let numerator = 0n;
  let denominator = 1n;
  const used = new Set<string>();
  for (const line of recipe) {
    if (!isRecord(line) || !exactKeys(line, ['ingredientId', 'unit', 'usedQuantity'])) {
      return failure('invalid_input');
    }
    const { ingredientId, unit, usedQuantity } = line;
    if (!validId(ingredientId) || !validUnit(unit) || !positiveQuantity(usedQuantity) || used.has(ingredientId)) {
      return failure('invalid_input');
    }
    used.add(ingredientId);
    const pack = packMap.get(ingredientId);
    if (!pack) return failure('missing_ingredient');
    if (pack.unit !== unit) return failure('unit_mismatch');

    // Accumulate exact rational satang: round once at the end, not per line.
    numerator = numerator * BigInt(pack.packQuantity) +
      BigInt(usedQuantity) * BigInt(pack.packCostSatang) * denominator;
    denominator *= BigInt(pack.packQuantity);
    const factor = gcd(numerator, denominator);
    numerator /= factor;
    denominator /= factor;
  }

  const rounded = (2n * numerator + denominator) / (2n * denominator);
  if (rounded > BigInt(Number.MAX_SAFE_INTEGER)) return failure('cost_overflow');
  return {
    ok: true,
    status: 'UNVERIFIED_SAMPLE_ONLY',
    ingredientCostSatang: Number(rounded),
    rounding: 'half_up_at_total',
    ingredientCount: recipe.length,
  };
}
