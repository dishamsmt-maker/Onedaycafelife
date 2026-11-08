/** Read-only reconciliation for a simulated trading day.
 * No real-shop database, payment provider, or stock mutation is accessed here.
 * All money is integer satang; stock quantities are integer recipe units.
 */
export type SaleStatus = 'paid' | 'refunded' | 'cancelled';
export interface DaySale {
  id: string;
  status: SaleStatus;
  chargedSatang: number;
  refundedSatang: number;
  cogsSatang: number;
}
export interface MoneyEntry {
  id: string;
  saleId: string;
  kind: 'charge' | 'refund';
  amountSatang: number;
}
export interface StockEntry {
  id: string;
  saleId: string;
  ingredientId: string;
  units: number; // negative = consumed; positive = returned
}
export interface DayAudit {
  ok: boolean;
  netSalesSatang: number;
  netCogsSatang: number;
  grossProfitSatang: number;
  issues: string[];
}
const money = (n: number) => Number.isSafeInteger(n) && n >= 0;
const unique = (ids: string[]) => ids.every((id, i) => id.length > 0 && ids.indexOf(id) === i);

/** Fail closed: mismatches are reported rather than silently corrected. */
export function auditSimulatedDay(
  sales: readonly DaySale[],
  ledger: readonly MoneyEntry[],
  stock: readonly StockEntry[],
): DayAudit {
  const issues: string[] = [];
  if (!unique(sales.map(s => s.id))) issues.push('duplicate or blank sale ID');
  if (!unique(ledger.map(e => e.id))) issues.push('duplicate or blank ledger ID');
  if (!unique(stock.map(e => e.id))) issues.push('duplicate or blank stock event ID');
  const known = new Set(sales.map(s => s.id));
  for (const entry of ledger) {
    if (!known.has(entry.saleId)) issues.push('orphan ledger: ' + entry.id);
    if (!money(entry.amountSatang) || (entry.kind !== 'charge' && entry.kind !== 'refund'))
      issues.push('invalid ledger entry: ' + entry.id);
  }
  for (const entry of stock) {
    if (!known.has(entry.saleId)) issues.push('orphan stock event: ' + entry.id);
    if (!entry.ingredientId || !Number.isSafeInteger(entry.units) || entry.units === 0)
      issues.push('invalid stock event: ' + entry.id);
  }
  let netSalesSatang = 0, netCogsSatang = 0;
  for (const sale of sales) {
    if (sale.status !== 'paid' && sale.status !== 'refunded' && sale.status !== 'cancelled')
      issues.push('invalid sale status: ' + sale.id);
    if (!money(sale.chargedSatang) || !money(sale.refundedSatang) ||
        !money(sale.cogsSatang) || sale.refundedSatang > sale.chargedSatang) {
      issues.push('invalid sale amounts: ' + sale.id);
      continue;
    }
    if (sale.status === 'cancelled' && (sale.chargedSatang !== 0 || sale.refundedSatang !== 0))
      issues.push('cancelled sale has payment: ' + sale.id);
    if (sale.status === 'refunded' && sale.refundedSatang !== sale.chargedSatang)
      issues.push('refund not complete: ' + sale.id);
    if (sale.status === 'paid' && sale.refundedSatang !== 0)
      issues.push('paid sale has refund: ' + sale.id);
    const charges = ledger.filter(e => e.saleId === sale.id && e.kind === 'charge');
    const refunds = ledger.filter(e => e.saleId === sale.id && e.kind === 'refund');
    if (charges.length !== (sale.chargedSatang > 0 ? 1 : 0) ||
        charges.reduce((sum, e) => sum + e.amountSatang, 0) !== sale.chargedSatang)
      issues.push('charge mismatch: ' + sale.id);
    if (refunds.length !== (sale.refundedSatang > 0 ? 1 : 0) ||
        refunds.reduce((sum, e) => sum + e.amountSatang, 0) !== sale.refundedSatang)
      issues.push('refund mismatch: ' + sale.id);
    netSalesSatang += sale.chargedSatang - sale.refundedSatang;
    netCogsSatang += sale.cogsSatang;
  }
  if (![netSalesSatang, netCogsSatang, netSalesSatang - netCogsSatang].every(Number.isSafeInteger))
    issues.push('daily total overflow');
  return { ok: issues.length === 0, netSalesSatang, netCogsSatang,
    grossProfitSatang: netSalesSatang - netCogsSatang, issues };
}
