import type { Vec2 } from './types';
import { canOccupyWithActors, segmentWalkable } from './world';

export interface MovingActor { position: Vec2; radius: number }

/** Validate an entire proposed NPC step, not only its destination.
 * Other actors are treated as stationary for this tick. The simulation
 * must still resolve simultaneous moves and stalled actors separately.
 */
export function canMovePastActors(
  from: Vec2,
  to: Vec2,
  others: ReadonlyArray<MovingActor>,
  radius = .16,
): boolean {
  if (!Number.isFinite(radius) || radius < 0 ||
      ![...from, ...to].every(Number.isFinite) ||
      !segmentWalkable(from, to, radius)) return false;
  if (!canOccupyWithActors(from, others, radius) ||
      !canOccupyWithActors(to, others, radius)) return false;
  const dx = to[0] - from[0], dz = to[1] - from[1];
  const distanceSquared = dx * dx + dz * dz;
  if (!Number.isFinite(distanceSquared)) return false;
  return others.every(({ position: [x, z], radius: otherRadius }) => {
    if (![x, z, otherRadius].every(Number.isFinite) || otherRadius < 0) return false;
    const t = distanceSquared === 0 ? 0 :
      Math.max(0, Math.min(1, ((x - from[0]) * dx + (z - from[1]) * dz) / distanceSquared));
    const nearestX = from[0] + t * dx;
    const nearestZ = from[1] + t * dz;
    return Math.hypot(x - nearestX, z - nearestZ) >= radius + otherRadius;
  });
}

/** Resolve one simulation tick in stable actor order.
 * A blocked actor stays put; later actors must respect both the initial
 * positions and accepted destinations. This prevents overlapping moves
 * and head-on swaps without silently teleporting anyone. Rotate tick
 * priority to prevent permanent index-based preference in shared aisles.
 */
export function resolveNpcSteps(
  actors: ReadonlyArray<MovingActor>,
  proposed: ReadonlyArray<Vec2>,
  tick = 0,
): Vec2[] {
  if (actors.length !== proposed.length) {
    throw new Error('Each NPC needs exactly one proposed destination');
  }
  if (!Number.isSafeInteger(tick) || tick < 0) {
    throw new Error('Simulation tick must be a non-negative safe integer');
  }
  const positions: Vec2[] = actors.map(actor => [...actor.position] as Vec2);
  // Rotate priority each tick so the lowest actor index cannot always win.
  for (let offset = 0; offset < actors.length; offset++) {
    const i = (tick + offset) % actors.length;
    const others: MovingActor[] = actors.flatMap((actor, j) =>
      j === i ? [] : [{position: positions[j], radius: actor.radius}]);
    const destination = proposed[i];
    if (canMovePastActors(positions[i], destination, others, actors[i].radius)) {
      positions[i] = [...destination] as Vec2;
    }
  }
  return positions;
}
