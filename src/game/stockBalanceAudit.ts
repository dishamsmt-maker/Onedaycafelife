import type { StockEntry } from './dayReconciliation';

/** Pure simulation-only stock balance check; never writes inventory. */
export function auditSimulatedStock(
  opening: Readonly<Record<string, number>>,
  events: readonly StockEntry[],
): { ok: boolean; closing: Record<string, number>; issues: string[] } {
  const issues: string[] = [];
  const closing: Record<string, number> = Object.create(null) as Record<string, number>;
  const seen = new Set<string>();
  for (const [ingredient, units] of Object.entries(opening)) {
    if (!ingredient || !Number.isSafeInteger(units) || units < 0) {
      issues.push('invalid opening stock: ' + ingredient);
      continue;
    }
    closing[ingredient] = units;
  }
  for (const event of events) {
    if (!event.id || seen.has(event.id)) {
      issues.push('duplicate or blank stock event: ' + event.id);
      continue;
    }
    seen.add(event.id);
    if (!event.saleId || !event.ingredientId ||
        !Number.isSafeInteger(event.units) || event.units === 0) {
      issues.push('invalid stock event: ' + event.id);
      continue;
    }
    if (!Object.hasOwn(closing, event.ingredientId)) {
      issues.push('unknown ingredient: ' + event.ingredientId);
      continue;
    }
    const next = closing[event.ingredientId] + event.units;
    if (!Number.isSafeInteger(next) || next < 0) {
      issues.push('stock underflow or overflow: ' + event.id);
      continue;
    }
    closing[event.ingredientId] = next;
  }
  return { ok: issues.length === 0, closing, issues };
}
