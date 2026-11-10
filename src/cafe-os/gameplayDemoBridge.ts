import { applyDemoAction, demoDayViews, type DemoDay } from './demoDay';
import { dispatchDemoStaffTask } from './demoStaffDispatch';
import type { CafeCatalogItem } from './orderCore';
import { demoRecipeUnitCosts } from './demoIngredientCosts';

/**
 * Game-only interaction boundary for Gameplay V2. The 3D scene can dispatch
 * player interactions here and render the resulting canonical projections.
 * This module intentionally has no persistence, payment API, or real POS imports.
 */
export type GameplayDemoInteraction =
  | { mode: 'customer'; type: 'order'; requestId: string; tableId: string; itemId: string; quantity: number }
  | { mode: 'staff'; type: 'task'; orderId: string; assignee: 'Na' | 'Ken'; action: 'prepare' | 'ready' | 'serve'; costs?: Readonly<Record<string, number>> }
  | { mode: 'manager'; type: 'pay' | 'cancel'; orderId: string }
  | { mode: 'manager'; type: 'close' };

export function applyGameplayDemoInteraction(
  day: DemoDay,
  catalog: readonly CafeCatalogItem[],
  interaction: GameplayDemoInteraction,
): DemoDay {
  if (interaction.mode === 'customer') {
    return applyDemoAction(day, catalog, { actor: 'customer', type: 'order',
      requestId: interaction.requestId, tableId: interaction.tableId,
      itemId: interaction.itemId, quantity: interaction.quantity });
  }
  if (interaction.mode === 'staff') {
    // 3D staff interactions do not carry supplier prices. Resolve game-only
    // illustrative costs from the accepted order's frozen recipe instead.
    // The scene is not a trusted source of ingredient prices. Always derive
    // costs from the accepted order's frozen recipe, even if a caller supplies
    // an override (including zero-valued costs).
    let costs: Readonly<Record<string, number>> | undefined;
    if (interaction.action === 'prepare') {
      const order = day.store.orders.find(candidate => candidate.id === interaction.orderId);
      if (!order?.recipeSnapshot) return day;
      try { costs = demoRecipeUnitCosts(order.recipeSnapshot); }
      catch { return day; } // unknown recipe must not be prepared at zero cost
    }
    return dispatchDemoStaffTask(day, catalog, {
      orderId: interaction.orderId, assignee: interaction.assignee, action: interaction.action,
    }, costs);
  }
  if (interaction.type === 'close') return applyDemoAction(day, catalog, { actor: 'manager', type: 'close' });
  return applyDemoAction(day, catalog, {
    actor: 'manager', type: interaction.type, orderId: interaction.orderId,
  });
}

/** All three UI modes read from the same state after every interaction. */
export function gameplayDemoSnapshot(day: DemoDay) {
  const views = demoDayViews(day);
  return {
    customer: views.customer,
    staff: views.staff,
    manager: views.manager,
    kitchen: views.kitchen,
    service: views.service,
    eventSequence: day.events.length,
  };
}
