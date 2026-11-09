import { applyDemoAction, demoDayViews, type DemoDay } from './demoDay';
import type { CafeCatalogItem } from './orderCore';

/**
 * Executes a staff task projected from the canonical demo order state.
 * Never trusts a stale UI task: the assignee and action must still match.
 * Ingredient costs are supplied in satang by the caller for preparation.
 */
export function dispatchDemoStaffTask(
  day: DemoDay,
  catalog: readonly CafeCatalogItem[],
  task: { orderId: string; assignee: 'Na' | 'Ken'; action: 'prepare' | 'ready' | 'serve' },
  costs?: Readonly<Record<string, number>>,
): DemoDay {
  const current = demoDayViews(day).staff.tasks.find(
    candidate => candidate.orderId === task.orderId &&
      candidate.assignee === task.assignee && candidate.action === task.action,
  );
  if (!current) return day;
  if (task.action === 'prepare') {
    if (!costs) return day;
    return applyDemoAction(day, catalog, { actor: 'Na', type: 'prepare', orderId: task.orderId, costs });
  }
  if (task.action === 'ready') {
    return applyDemoAction(day, catalog, { actor: 'Na', type: 'ready', orderId: task.orderId });
  }
  return applyDemoAction(day, catalog, { actor: 'Ken', type: 'serve', orderId: task.orderId });
}
