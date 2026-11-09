import { auditSimulatedDay } from './dayReconciliation';
import type { DaySale, MoneyEntry, StockEntry } from './dayReconciliation';
import { auditSimulatedStock } from './stockBalanceAudit';

/** Read-only combined closing audit for the game sandbox; never touches real POS. */
export function auditSimulatedClosing(
  sales: readonly DaySale[],
  ledger: readonly MoneyEntry[],
  stock: readonly StockEntry[],
  openingStock: Readonly<Record<string, number>>,
) {
  const day = auditSimulatedDay(sales, ledger, stock);
  const inventory = auditSimulatedStock(openingStock, stock);
  const issues = [...day.issues, ...inventory.issues];
  // A refund/return can restore consumed recipe units, but must never create
  // inventory from nothing. Check per sale AND ingredient, not only day totals.
  const netBySaleIngredient = new Map<string, number>();
  for (const event of stock) {
    if (!event.saleId || !event.ingredientId || !Number.isSafeInteger(event.units) || event.units === 0) continue;
    const key = JSON.stringify([event.saleId, event.ingredientId]);
    const next = (netBySaleIngredient.get(key) ?? 0) + event.units;
    if (!Number.isSafeInteger(next)) {
      issues.push('sale stock total overflow: ' + event.saleId + '/' + event.ingredientId);
      continue;
    }
    // Event order matters: a return must be backed by consumption already recorded.
    // A later consumption cannot retroactively authorize an earlier return.
    if (next > 0) {
      issues.push('stock return before consumption: ' + event.id);
    }
    netBySaleIngredient.set(key, next);
  }
  for (const [key, net] of netBySaleIngredient) {
    if (net > 0) {
      const [saleId, ingredientId] = JSON.parse(key) as [string, string];
      issues.push('stock return exceeds consumption: ' + saleId + '/' + ingredientId);
    }
  }
  return {
    ok: issues.length === 0,
    netSalesSatang: day.netSalesSatang,
    netCogsSatang: day.netCogsSatang,
    grossProfitSatang: day.grossProfitSatang,
    closingStock: inventory.closing,
    issues,
  };
}
