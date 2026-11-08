import { describe, expect, it } from 'vitest';
import { auditSimulatedDay, type DaySale, type MoneyEntry } from './dayReconciliation';

const paid: DaySale = { id: 'T3-1', status: 'paid', chargedSatang: 8500, refundedSatang: 0, cogsSatang: 3200 };
const charge: MoneyEntry = { id: 'p1', saleId: 'T3-1', kind: 'charge', amountSatang: 8500 };

describe('simulated day ledger reconciliation', () => {
  it('reconciles a completed T3 sale in satang without mutating inputs', () => {
    const sales = [paid], ledger = [charge], stock = [{ id: 's1', saleId: 'T3-1', ingredientId: 'rice', units: -1 }];
    const snapshot = JSON.stringify([sales, ledger, stock]);
    expect(auditSimulatedDay(sales, ledger, stock)).toEqual({
      ok: true, netSalesSatang: 8500, netCogsSatang: 3200,
      grossProfitSatang: 5300, issues: [],
    });
    expect(JSON.stringify([sales, ledger, stock])).toBe(snapshot);
  });
  it('flags duplicate charges even when amounts appear balanced', () => {
    const result = auditSimulatedDay([paid], [
      { ...charge, amountSatang: 4250 }, { ...charge, id: 'p2', amountSatang: 4250 },
    ], []);
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('charge mismatch: T3-1');
  });
  it('flags orphan events and duplicate stock event identifiers', () => {
    const result = auditSimulatedDay([], [{ ...charge }], [
      { id: 's1', saleId: 'missing', ingredientId: 'rice', units: -1 },
      { id: 's1', saleId: 'missing', ingredientId: 'rice', units: -1 },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('duplicate or blank stock event ID');
    expect(result.issues).toContain('orphan ledger: p1');
  });
  it('accepts full refund and rejects cancelled sale with money', () => {
    const refunded: DaySale = { ...paid, status: 'refunded', refundedSatang: 8500 };
    expect(auditSimulatedDay([refunded], [charge,
      { id: 'r1', saleId: 'T3-1', kind: 'refund', amountSatang: 8500 }], []).netSalesSatang).toBe(0);
    const cancelled = { ...paid, status: 'cancelled' as const };
    expect(auditSimulatedDay([cancelled], [charge], []).issues)
      .toContain('cancelled sale has payment: T3-1');
  });
  it('rejects fractional money and invalid stock quantities', () => {
    const result = auditSimulatedDay([{ ...paid, chargedSatang: 8500.5 }], [charge],
      [{ id: 's1', saleId: 'T3-1', ingredientId: 'rice', units: Number.NaN }]);
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('invalid sale amounts: T3-1');
    expect(result.issues).toContain('invalid stock event: s1');
  });
  it('fails closed for unknown sale statuses and ledger event kinds', () => {
    const badStatus = { ...paid, status: 'pending' as DaySale['status'] };
    const badKind = { ...charge, kind: 'void' as MoneyEntry['kind'] };
    const result = auditSimulatedDay([badStatus], [badKind], []);
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('invalid sale status: T3-1');
    expect(result.issues).toContain('invalid ledger entry: p1');
    expect(result.issues).toContain('charge mismatch: T3-1');
  });

});
