import { describe, expect, it } from 'vitest';
import { createCafeStore, closeCafeDay } from './orderCore';

describe('stock identifier validation', () => {
  it('rejects blank and whitespace-only ingredient IDs at initialization', () => {
    expect(() => createCafeStore({ '': 2 })).toThrow('invalid stock');
    expect(() => createCafeStore({ '  ': 2 })).toThrow('invalid stock');
  });

  it('retains valid fractional stock and permits a balanced empty-day close', () => {
    const store = createCafeStore({ chicken: 1.5, rice: 0 });
    expect(store.stock).toEqual({ chicken: 1.5, rice: 0 });
    expect(closeCafeDay(store).readyToClose).toBe(true);
  });
});
