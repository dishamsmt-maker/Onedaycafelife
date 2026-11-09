import { describe, expect, it } from 'vitest';
import { auditDemoDay } from './demoDayAudit';
import { applyDemoAction, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('simulation audit cash ledger reconciliation', () => {
  it('rejects a corrupted cash balance even when the event sequence is valid', () => {
    const day = startDemoDay(createDemoStock());
    expect(auditDemoDay(day).valid).toBe(true);
    const tampered = { ...day, store: { ...day.store, cashSatang: 100 } };
    expect(auditDemoDay(tampered).issues).toContain('cash ledger mismatch');
  });

  it('rejects a forged payment event not backed by an order', () => {
    const day = applyDemoAction(startDemoDay(createDemoStock()), DEMO_HALAL_MENU, {
      actor: 'customer', type: 'order', requestId: 'cash-audit-t3',
      tableId: 't3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    });
    expect(auditDemoDay(day).valid).toBe(true);
    const tampered = {
      ...day, store: { ...day.store, cashEvents: [
        ...day.store.cashEvents,
        { id: 'payment-ghost', orderId: 'ghost', type: 'payment' as const, amountSatang: 100 },
      ] },
    };
    expect(auditDemoDay(tampered).issues).toContain('cash ledger mismatch');
  });
});
