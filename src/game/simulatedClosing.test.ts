import { describe, expect, it } from 'vitest';
import { auditSimulatedClosing } from './simulatedClosing';

describe('simulated closing combines sales and stock audits', () => {
  const sales = [{ id: 'T3', status: 'paid' as const, chargedSatang: 9000, refundedSatang: 0, cogsSatang: 3000 }];
  const ledger = [{ id: 'charge-T3', saleId: 'T3', kind: 'charge' as const, amountSatang: 9000 }];
  const stock = [{ id: 'use-T3', saleId: 'T3', ingredientId: 'rice', units: -2 }];

  it('reconciles a paid table without changing source data', () => {
    const opening = { rice: 5 };
    const before = JSON.stringify([sales, ledger, stock, opening]);
    const result = auditSimulatedClosing(sales, ledger, stock, opening);
    expect(result).toMatchObject({ ok: true, netSalesSatang: 9000, netCogsSatang: 3000, grossProfitSatang: 6000 });
    expect(result.closingStock.rice).toBe(3);
    expect(JSON.stringify([sales, ledger, stock, opening])).toBe(before);
  });

  it('rejects overselling even when money ledger balances', () => {
    const result = auditSimulatedClosing(sales, ledger, stock, { rice: 1 });
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('stock underflow or overflow: use-T3');
  });

  it('rejects duplicate payment even when inventory balances', () => {
    const result = auditSimulatedClosing(sales, [...ledger, { ...ledger[0], id: 'charge-again' }], stock, { rice: 5 });
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('charge mismatch: T3');
  });
});
