import { describe, expect, it } from 'vitest';
import { auditSimulatedStock } from './stockBalanceAudit';

describe('simulated inventory balance audit', () => {
  it('calculates consumption and returns without mutating inputs', () => {
    const opening = { rice: 5 };
    const events = [
      { id: 'use', saleId: 'T3', ingredientId: 'rice', units: -2 },
      { id: 'return', saleId: 'T3', ingredientId: 'rice', units: 1 },
    ];
    const before = JSON.stringify([opening, events]);
    const result = auditSimulatedStock(opening, events);
    expect(result.ok).toBe(true);
    expect(result.closing.rice).toBe(4);
    expect(JSON.stringify([opening, events])).toBe(before);
  });
  it('fails closed on overselling and duplicate consumption events', () => {
    const result = auditSimulatedStock({ rice: 1 }, [
      { id: 'use', saleId: 'T3', ingredientId: 'rice', units: -1 },
      { id: 'use', saleId: 'T3', ingredientId: 'rice', units: -1 },
      { id: 'extra', saleId: 'T4', ingredientId: 'rice', units: -1 },
    ]);
    expect(result.ok).toBe(false);
    expect(result.closing.rice).toBe(0);
    expect(result.issues).toContain('duplicate or blank stock event: use');
    expect(result.issues).toContain('stock underflow or overflow: extra');
  });
  it('rejects unknown ingredients, malformed units and overflow', () => {
    const result = auditSimulatedStock({ rice: Number.MAX_SAFE_INTEGER }, [
      { id: 'unknown', saleId: 'T3', ingredientId: 'salt', units: -1 },
      { id: 'bad', saleId: 'T3', ingredientId: 'rice', units: 0 },
      { id: 'overflow', saleId: 'T3', ingredientId: 'rice', units: 1 },
    ]);
    expect(result.ok).toBe(false);
    expect(result.issues).toContain('unknown ingredient: salt');
    expect(result.issues).toContain('invalid stock event: bad');
    expect(result.issues).toContain('stock underflow or overflow: overflow');
  });
});
