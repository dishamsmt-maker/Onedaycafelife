import type { GameplaySession } from '../components/LiveThreeModeDemo';

/**
 * Game-only NPC task adapter. A character may complete only a task currently
 * assigned to it in the canonical simulation session. No direct stock/cash
 * mutation and no supplier-cost input from the 3D scene.
 */
export function createGameplayNpcTaskAdapter(session: GameplaySession) {
  return {
    pendingFor(assignee: 'Na' | 'Ken') {
      return session.getSnapshot().staff.tasks.filter(task => task.assignee === assignee);
    },
    complete(assignee: 'Na' | 'Ken', orderId: string, action: 'prepare' | 'ready' | 'serve') {
      const assigned = session.getSnapshot().staff.tasks.some(task =>
        task.assignee === assignee && task.orderId === orderId && task.action === action);
      if (!assigned) return false;
      return session.dispatch({ mode: 'staff', type: 'task', assignee, orderId, action });
    },
  };
}
