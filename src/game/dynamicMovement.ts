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
