import { applyGameplayDemoInteraction, gameplayDemoSnapshot, type GameplayDemoInteraction } from './gameplayDemoBridge';
import { startDemoDay, type DemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU } from './demoCatalog';

/**
 * In-memory, GAME-ONLY session shared by customer/staff/manager views.
 * A single instance must be owned by the Gameplay V2 root, never created
 * separately by each mode. No real POS, payment, or storage access.
 */
export function createGameplayDemoSession(initialDay: DemoDay = startDemoDay(createDemoStock())) {
  let day = initialDay;
  const listeners = new Set<() => void>();
  let snapshot = gameplayDemoSnapshot(day);

  return {
    getDay: () => day,
    getSnapshot: () => snapshot,
    subscribe(listener: () => void) {
      listeners.add(listener);
      return () => { listeners.delete(listener); };
    },
    dispatch(interaction: GameplayDemoInteraction) {
      // Scene labels can use T1–T5, while the demo core uses lowercase IDs.
      const normalized = interaction.mode === 'customer'
        ? { ...interaction, tableId: interaction.tableId.toLowerCase() }
        : interaction;
      const next = applyGameplayDemoInteraction(day, DEMO_HALAL_MENU, normalized);
      if (next === day) return false; // duplicate, invalid or stale action
      day = next;
      snapshot = gameplayDemoSnapshot(day);
      for (const listener of [...listeners]) listener();
      return true;
    },
  };
}
