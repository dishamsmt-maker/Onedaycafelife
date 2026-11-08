import { describe, expect, it } from 'vitest';
import { STATIONS, TABLE_LAYOUT, canVisitorWalk, canWalk, findPath, segmentWalkable } from './world';

describe('five-table navigation regression', () => {
  it('rejects non-finite coordinates and invalid actor radii instead of allowing collision bypass', () => {
    expect(canWalk(NaN, 1)).toBe(false);
    expect(canWalk(0, Infinity)).toBe(false);
    expect(canWalk(0, 1, -0.1)).toBe(false);
    expect(canVisitorWalk(NaN, 0)).toBe(false);
    expect(canVisitorWalk(0, 0, -1)).toBe(false);
    expect(segmentWalkable([0, 0], [NaN, 1])).toBe(false);
    expect(segmentWalkable([0, 0], [1, 1], Infinity)).toBe(false);
    expect(findPath([0, 0], [Infinity, 1])).toEqual([]);
  });

  it('keeps all work stations clear of furniture collision boxes', () => {
    for (const [name, [x, z]] of Object.entries(STATIONS)) {
      if (name === 'entrance' || name === 'rest' || name === 'manager') continue; // Entrance is outside; rest is inside its modeled structure.
      expect(canWalk(x, z), name).toBe(true);
    }
  });

  it('keeps table collision boxes separate from restroom and staff rest stations', () => {
    for (const station of ['restroom', 'rest'] as const) {
      const [x, z] = STATIONS[station];
      for (const table of TABLE_LAYOUT) {
        expect(Math.abs(x - table.position[0]) >= 1.25 / 2 + .16 ||
          Math.abs(z - table.position[1]) >= 1.2 / 2 + .16,
          `${table.id} blocks ${station}`).toBe(true);
      }
    }
  });

  it('routes between reachable staff checkpoints without clipping obstacles', () => {
    const checkpoints = ['pickup', 'dish', 'fridge', 'restroom'] as const;
    for (let i = 0; i < checkpoints.length - 1; i++) {
      const from = STATIONS[checkpoints[i]];
      const to = STATIONS[checkpoints[i + 1]];
      const path = findPath(from, to);
      expect(path.length, `${checkpoints[i]} to ${checkpoints[i + 1]}`).toBeGreaterThan(0);
      for (let j = 1; j < path.length; j++) {
        expect(segmentWalkable(path[j - 1], path[j]),
          `${checkpoints[i]} to ${checkpoints[i + 1]} segment ${j}`).toBe(true);
      }
      expect(canWalk(...path[path.length - 1])).toBe(true);
    }
  });
});
