import type { GameplaySession } from '../components/LiveThreeModeDemo';
import {
  createGameplayNpcArrivalController,
  type NpcGroundPosition,
  type NpcStationTarget,
} from './gameplayNpcArrivalController';

export type NpcLayoutStations = Readonly<{
  kitchen: NpcStationTarget;
  serviceCounter: NpcStationTarget;
  tables: Readonly<Record<string, NpcStationTarget>>;
}>;

/**
 * Game-scene integration boundary: callers supply only the NPC's measured
 * position. Station centers come from the trusted scene layout, never from
 * the arrival event itself. A table-specific target is resolved from the
 * canonical order, preventing an NPC at T1 from serving an order for T3.
 *
 * This still requires the scene to provide authoritative NPC transforms and
 * collision/pathfinding; it is not proof of physical arrival by itself.
 */
export function createLayoutBoundNpcArrivalController(
  session: GameplaySession,
  layout: NpcLayoutStations,
) {
  const controller = createGameplayNpcArrivalController(session);
  return {
    pendingFor: controller.pendingFor,
    arrive(
      assignee: 'Na' | 'Ken',
      orderId: string,
      action: 'prepare' | 'ready' | 'serve',
      position: NpcGroundPosition,
    ): boolean {
      const order = session.getDay().store.orders.find(o => o.id === orderId);
      if (!order) return false;
      // The demo accepts uppercase table IDs (T3), while the core order
      // model and layout use lowercase IDs (t3). Resolve both consistently.
      const tableKey = order.tableId.toLowerCase();
      const target = action === 'prepare' ? layout.kitchen :
        action === 'ready' ? layout.serviceCounter : layout.tables[tableKey];
      if (!target) return false;
      const expected = controller.requiredStation(action);
      if (target.station !== expected) return false;
      return controller.arriveAtPositionAndComplete(assignee, orderId, action, position, target);
    },
  };
}
