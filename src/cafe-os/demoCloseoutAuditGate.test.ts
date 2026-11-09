import { describe, expect, it } from 'vitest';
import { applyDemoAction, startDemoDay } from './demoDay';
import { auditDemoDay } from './demoDayAudit';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

describe('simulated closeout audit gate', () => {
  const close = (day: ReturnType<typeof startDemoDay>) =>
    applyDemoAction(day, DEMO_HALAL_MENU, { actor: 'manager', type: 'close' });

  it('closes a clean empty day exactly once', () => {
    const day = startDemoDay(createDemoStock());
    const closed = close(day);
    expect(closed.closed).toBe(true);
    expect(closed.events.map(e => e.action)).toEqual(['closed']);
    expect(close(closed)).toBe(closed);
    expect(auditDemoDay(closed).valid).toBe(true);
  });

  it('rejects a corrupted cash balance despite an otherwise closable day', () => {
    const day = startDemoDay(createDemoStock());
    const corrupted = { ...day, store: { ...day.store, cashSatang: 100 } };
    expect(auditDemoDay(corrupted).valid).toBe(false);
    expect(close(corrupted)).toBe(corrupted);
    expect(corrupted.closed).toBe(false);
  });

  it('rejects an orphan order event and preserves the event log', () => {
    const day = startDemoDay(createDemoStock());
    const corrupted = { ...day, events: [{
      sequence: 1, actor: 'customer' as const, action: 'ordered' as const, orderId: 'ghost',
    }] };
    expect(auditDemoDay(corrupted).valid).toBe(false);
    expect(close(corrupted)).toBe(corrupted);
    expect(corrupted.events).toHaveLength(1);
  });
});
