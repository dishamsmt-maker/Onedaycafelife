import { describe, expect, it } from 'vitest';
import { canWalk, findPath, segmentWalkable, TABLE_LAYOUT } from './world';

/** Regression: the Lab prototype must have five navigable customer tables.
 * Physical placement is provisional until the real site is measured. */
describe('AI Lab five-table navigation', () => {
  it('has five unique, collision-blocking tables', () => {
    expect(TABLE_LAYOUT).toHaveLength(5);
    expect(new Set(TABLE_LAYOUT.map(table => table.id)).size).toBe(5);
    for (const table of TABLE_LAYOUT) {
      expect(table.capacity).toBe(4);
      expect(canWalk(...table.position)).toBe(false);
    }
  });

  it('offers a collision-free chair-side approach for every table', () => {
    const entrance: [number, number] = [-0.5, -0.75];
    for (const table of TABLE_LAYOUT) {
      const approaches: [number, number][] = [
        [table.position[0] - 0.9, table.position[1] - 0.25],
        [table.position[0] + 0.9, table.position[1] - 0.25],
        [table.position[0] - 0.9, table.position[1] + 0.25],
        [table.position[0] + 0.9, table.position[1] + 0.25],
      ];
      const reachable = approaches.some(target => {
        if (!canWalk(...target)) return false;
        const path = findPath(entrance, target);
        if (!path.length) return false;
        const last = path[path.length - 1];
        if (Math.hypot(last[0] - target[0], last[1] - target[1]) > 0.35) return false;
        return segmentWalkable(last, target);
      });
      expect(reachable, table.id + ' must have at least one reachable chair').toBe(true);
    }
  });
});
