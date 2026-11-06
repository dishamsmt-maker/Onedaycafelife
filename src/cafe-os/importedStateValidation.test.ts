import { describe, expect, it } from 'vitest';
import { createCafeStore, reconcileCafeCash, closeCafeDay } from './orderCore';

describe('malformed imported store collections', () => {
  it.each([
    [{ orders: null }],
    [{ orders: [null] }],
    [{ orders: [{}] }],
    [{ stock: null }],
    [{ stock: [] }],
  ])('refuses to close corrupted snapshot %j without throwing', (patch) => {
    const imported = { ...createCafeStore({ flour: 3 }), ...patch } as unknown as ReturnType<typeof createCafeStore>;
    expect(() => closeCafeDay(imported)).not.toThrow();
    expect(closeCafeDay(imported).readyToClose).toBe(false);
    expect(closeCafeDay(imported).cashBalanced).toBe(false);
  });
  it('refuses reconciliation of malformed orders', () => {
    const imported = { ...createCafeStore({}), orders: [null] } as unknown as ReturnType<typeof createCafeStore>;
    expect(reconcileCafeCash(imported).balanced).toBe(false);
  });
});
