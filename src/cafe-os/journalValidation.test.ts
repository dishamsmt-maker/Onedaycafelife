import { describe, expect, it } from 'vitest';
import { createCafeStore, reconcileCafeCash, closeCafeDay } from './orderCore';

describe('corrupted imported cash journal', () => {
  it.each([
    [null],
    [[null]],
    [[{ id: 'payment-a', orderId: 'a', type: 'unknown', amountSatang: 0 }]],
    [[{ id: 'payment-a', orderId: 'a', type: 'payment', amountSatang: Number.NaN }]],
    [[{ id: 'payment-a', orderId: 'a', type: 'payment', amountSatang: -1 }]],
  ])('rejects invalid journal %j without throwing', (cashEvents) => {
    const store = { ...createCafeStore({}), cashEvents } as unknown as ReturnType<typeof createCafeStore>;
    expect(reconcileCafeCash(store).balanced).toBe(false);
    expect(closeCafeDay(store).readyToClose).toBe(false);
  });
});
