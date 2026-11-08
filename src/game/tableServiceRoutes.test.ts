import { describe, expect, it } from 'vitest';
import { STATIONS, TABLE_LAYOUT, canWalk, findPath, segmentWalkable } from './world';

/**
 * The five-table prototype must route service staff around furniture.
 * This checks static clearance only; it does not prove NPC-vs-NPC avoidance.
 */
describe('service routes to every table', () => {
  it.each(TABLE_LAYOUT)('finds a collision-free route to $name from pickup', (table) => {
    const path = findPath(STATIONS.pickup, table.position);
    expect(path.length, `pickup to ${table.id} has no route`).toBeGreaterThan(0);

    let previous = STATIONS.pickup;
    for (const [index, waypoint] of path.entries()) {
      expect(canWalk(...waypoint), `${table.id} waypoint ${index} is blocked`).toBe(true);
      expect(segmentWalkable(previous, waypoint),
        `${table.id} segment ${index} crosses an obstacle`).toBe(true);
      previous = waypoint;
    }
    // Table centres are deliberately blocked by furniture. Reach its edge,
    // not the centre, without walking through the table collision box.
    expect(Math.hypot(previous[0] - table.position[0], previous[1] - table.position[1]),
      `${table.id} has no reachable service position nearby`).toBeLessThan(1.5);
  });
});
