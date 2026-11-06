import { describe, expect, it } from 'vitest';
import { closeCafeDay, createCafeStore, reconcileCafeCash } from './orderCore';

describe('legacy cash journal closeout', () => {
  it('rejects closing when an imported store has no cashEvents array', () => {
    const legacy = createCafeStore({ rice: 10 }) as ReturnType<typeof createCafeStore> & { cashEvents?: any };
    delete legacy.cashEvents;
    expect(reconcileCafeCash(legacy).balanced).toBe(false);
    const report = closeCafeDay(legacy);
    expect(report.readyToClose).toBe(false);
    expect(report.cashBalanced).toBe(false);
    expect(report.paymentsSatang).toBe(0);
    expect(report.refundsSatang).toBe(0);
  });
  it('accepts a fresh empty balanced store', () => {
    const report = closeCafeDay(createCafeStore({ rice: 10 }));
    expect(report.cashBalanced).toBe(true);
    expect(report.readyToClose).toBe(true);
  });
});
