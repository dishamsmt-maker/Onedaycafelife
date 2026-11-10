import type { GameplaySession } from '../components/LiveThreeModeDemo';
import { createGameplayNpcTaskAdapter } from './gameplayNpcTaskAdapter';

export type NpcWorkStation = 'kitchen' | 'service-counter' | 'customer-table';
export type NpcGroundPosition = Readonly<{ x: number; z: number }>;
export type NpcStationTarget = Readonly<{ position: NpcGroundPosition; radius: number }>;

export function isWithinNpcStation(position: NpcGroundPosition, target: NpcStationTarget): boolean {
  const { x, z } = position;
  const { radius, position: center } = target;
  if (![x, z, center.x, center.z, radius].every(Number.isFinite) || radius <= 0) return false;
  return Math.hypot(x - center.x, z - center.z) <= radius;
}


/**
 * Only the 3D movement controller should call arriveAndComplete after its
 * pathfinding/collision layer reports arrival. Merely assigning an NPC task
 * must never advance the kitchen queue or deduct ingredients.
 */
export function createGameplayNpcArrivalController(session: GameplaySession) {
  const tasks = createGameplayNpcTaskAdapter(session);
  const stationFor = (action: 'prepare' | 'ready' | 'serve'): NpcWorkStation =>
    action === 'prepare' ? 'kitchen' :
    action === 'ready' ? 'service-counter' : 'customer-table';

  return {
    pendingFor: tasks.pendingFor,
    requiredStation: stationFor,
    /**
     * Position-gated alternative for a scene controller. Targets must be derived
     * from the current layout (including the actual table), not a client-supplied
     * station label. This is proximity validation, not pathfinding or collision.
     */
    arriveAtPositionAndComplete(
      assignee: 'Na' | 'Ken',
      orderId: string,
      action: 'prepare' | 'ready' | 'serve',
      position: NpcGroundPosition,
      target: NpcStationTarget,
    ) {
      if (!isWithinNpcStation(position, target)) return false;
      return tasks.complete(assignee, orderId, action);
    },
    arriveAndComplete(
      assignee: 'Na' | 'Ken',
      orderId: string,
      action: 'prepare' | 'ready' | 'serve',
      station: NpcWorkStation,
    ) {
      if (station !== stationFor(action)) return false;
      return tasks.complete(assignee, orderId, action);
    },
  };
}
