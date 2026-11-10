import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { createLayoutBoundNpcArrivalController } from './gameplayNpcLayoutArrival';

describe('NPC table ID case normalization', () => {
  for (const tableId of ['T3', 't3']) {
    it(`completes the same T3 service journey for input ${tableId}`, () => {
      const session = createGameplayDemoSession();
      const kitchen = { station: 'kitchen', position: { x: 1, z: 1 }, radius: 0.5 } as const;
      const serviceCounter = { station: 'service-counter', position: { x: 2, z: 1 }, radius: 0.5 } as const;
      const t1 = { station: 'customer-table', position: { x: 3, z: 3 }, radius: 0.5 } as const;
      const t3 = { station: 'customer-table', position: { x: 9, z: 9 }, radius: 0.5 } as const;
      const npc = createLayoutBoundNpcArrivalController(session, {
        kitchen, serviceCounter, tables: { t1, t3 },
      });
      expect(session.dispatch({
        mode: 'customer', type: 'order', requestId: `case-${tableId}`,
        tableId, itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
      })).toBe(true);
      const orderId = session.getDay().store.orders[0].id;
      for (const [action, position] of [
        ['prepare', kitchen.position], ['ready', serviceCounter.position],
      ] as const) {
        const task = session.getSnapshot().staff.tasks.find(t => t.orderId === orderId && t.action === action);
        expect(task).toBeDefined();
        if (!task) throw new Error(`Missing ${action} task`);
        expect(npc.arrive(task.assignee, orderId, action, position)).toBe(true);
      }
      const task = session.getSnapshot().staff.tasks.find(t => t.orderId === orderId && t.action === 'serve');
      expect(task).toBeDefined();
      if (!task) throw new Error('Missing serve task');
      const before = session.getDay();
      expect(npc.arrive(task.assignee, orderId, 'serve', t1.position)).toBe(false);
      expect(session.getDay()).toBe(before);
      expect(npc.arrive(task.assignee, orderId, 'serve', t3.position)).toBe(true);
      expect(session.getDay().store.orders[0].status).toBe('served');
      expect(npc.arrive(task.assignee, orderId, 'serve', t3.position)).toBe(false);
    });
  }
});
