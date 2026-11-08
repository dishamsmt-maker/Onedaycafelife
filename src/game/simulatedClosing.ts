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
  return {
    ok: issues.length === 0,
    netSalesSatang: day.netSalesSatang,
    netCogsSatang: day.netCogsSatang,
    grossProfitSatang: day.grossProfitSatang,
    closingStock: inventory.closing,
    issues,
  };
}
