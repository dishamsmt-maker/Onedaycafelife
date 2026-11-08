import { describe, expect, it } from 'vitest';
import { STATIONS, canVisitorWalk, canWalk } from './world';

describe('customer access boundaries in the five-table prototype', () => {
  it('keeps the public queue reachable while blocking staff-only workstations', () => {
    expect(canVisitorWalk(...STATIONS.queue)).toBe(true);
    for (const name of ['bar', 'kitchen', 'pickup', 'dish', 'fridge', 'rest'] as const) {
      const position = STATIONS[name];
      expect(canVisitorWalk(...position), name).toBe(false);
    }
  });

  it('rejects attempts to bypass the staff-only boundary with invalid radii', () => {
    expect(canVisitorWalk(0.8, 3, -0.01)).toBe(false);
    expect(canVisitorWalk(0.8, 3, NaN)).toBe(false);
    expect(canVisitorWalk(Infinity, 3)).toBe(false);
  });

  it('does not grant customers the same access as staff in a clear kitchen-side aisle', () => {
    const staffOnlyPoint: [number, number] = [0.4, 4.5];
    expect(canWalk(...staffOnlyPoint)).toBe(true);
    expect(canVisitorWalk(...staffOnlyPoint)).toBe(false);
  });
});
