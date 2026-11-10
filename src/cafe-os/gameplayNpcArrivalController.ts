import type { GameplaySession } from '../components/LiveThreeModeDemo';
import { createGameplayNpcTaskAdapter } from './gameplayNpcTaskAdapter';

export type NpcWorkStation = 'kitchen' | 'service-counter' | 'customer-table';

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
