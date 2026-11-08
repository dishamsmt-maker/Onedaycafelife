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
  it('rejects a return that creates stock without consumption for that sale', () => {
    const returned = [{ id: 'return-T3', saleId: 'T3', ingredientId: 'rice', units: 1 }];
    const result = auditSimulatedClosing(sales, ledger, returned, { rice: 5 });
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('stock return exceeds consumption: T3/rice');
  });

  it('allows a partial return only up to units consumed for the same sale', () => {
    const events = [...stock, { id: 'return-T3', saleId: 'T3', ingredientId: 'rice', units: 1 }];
    const result = auditSimulatedClosing(sales, ledger, events, { rice: 5 });
    expect(result.ok).toBe(true);
    expect(result.closingStock.rice).toBe(4);
  });

  it('rejects return before consumption even if end-of-day net stock is valid', () => {
    const events = [
      { id: 'early-return', saleId: 'T3', ingredientId: 'rice', units: 1 },
      { id: 'later-use', saleId: 'T3', ingredientId: 'rice', units: -2 },
    ];
    const result = auditSimulatedClosing(sales, ledger, events, { rice: 5 });
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('stock return before consumption: early-return');
  });

  it('allows consumption followed by a legitimate return', () => {
    const events = [
      { id: 'use-first', saleId: 'T3', ingredientId: 'rice', units: -2 },
      { id: 'return-later', saleId: 'T3', ingredientId: 'rice', units: 2 },
    ];
    const result = auditSimulatedClosing(sales, ledger, events, { rice: 5 });
    expect(result.ok).toBe(true);
    expect(result.closingStock.rice).toBe(5);
  });

  it('does not let consumption by another sale justify an unrelated return', () => {
    const events = [...stock, { id: 'return-T4', saleId: 'T4', ingredientId: 'rice', units: 1 }];
    const otherSale = { id: 'T4', status: 'cancelled' as const, chargedSatang: 0, refundedSatang: 0, cogsSatang: 0 };
    const result = auditSimulatedClosing([...sales, otherSale], ledger, events, { rice: 5 });
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('stock return exceeds consumption: T4/rice');
  });

});
