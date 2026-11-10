import type { GameplaySession } from '../components/LiveThreeModeDemo';
import {
  createLayoutBoundNpcArrivalController,
  type NpcLayoutStations,
} from './gameplayNpcLayoutArrival';
import type { NpcGroundPosition } from './gameplayNpcArrivalController';

export type SceneNpcId = 'Na' | 'Ken';
export type SceneNpcAction = 'prepare' | 'ready' | 'serve';

/**
 * Adapter for the actual Gameplay V2 movement system. Read positions from
 * scene-owned transforms at arrival time, never from the click/action payload.
 * The scene must independently enforce pathfinding and collision boundaries.
 */
export function createSceneTransformNpcBridge(
  session: GameplaySession,
  layout: NpcLayoutStations,
  readNpcPosition: (npc: SceneNpcId) => NpcGroundPosition | null | undefined,
) {
  const arrival = createLayoutBoundNpcArrivalController(session, layout);
  return {
    pendingFor: arrival.pendingFor,
    completeAtCurrentTransform(npc: SceneNpcId, orderId: string, action: SceneNpcAction): boolean {
      let position: NpcGroundPosition | null | undefined;
      try {
        position = readNpcPosition(npc);
      } catch {
        return false;
      }
      if (!position || !Number.isFinite(position.x) || !Number.isFinite(position.z)) return false;
      return arrival.arrive(npc, orderId, action, position);
    },
  };
}
