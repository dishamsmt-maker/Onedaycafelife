import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { createLayoutBoundNpcArrivalController } from './gameplayNpcLayoutArrival';

describe('layout-bound NPC arrival', () => {
  it('serves T3 only at the T3 position and never at another table', () => {
    const session = createGameplayDemoSession();
    const layout = {
      kitchen: { station: 'kitchen', position: { x: 1, z: 1 }, radius: 0.5 },
      serviceCounter: { station: 'service-counter', position: { x: 2, z: 1 }, radius: 0.5 },
      tables: {
        t1: { station: 'customer-table', position: { x: 3, z: 3 }, radius: 0.5 },
        t3: { station: 'customer-table', position: { x: 9, z: 9 }, radius: 0.5 },
      },
    } as const;
    const npc = createLayoutBoundNpcArrivalController(session, layout);
    expect(session.dispatch({ mode: 'customer', type: 'order', requestId: 'layout-t3',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1 })).toBe(true);
    const orderId = session.getDay().store.orders[0].id;
    for (const [action, position] of [
      ['prepare', layout.kitchen.position],
      ['ready', layout.serviceCounter.position],
    ] as const) {
      const task = session.getSnapshot().staff.tasks.find(t => t.orderId === orderId && t.action === action);
      expect(task).toBeDefined();
      if (!task) throw new Error('Missing task');
      expect(npc.arrive(task.assignee, orderId, action, position)).toBe(true);
    }
    const serve = session.getSnapshot().staff.tasks.find(t => t.orderId === orderId && t.action === 'serve');
    expect(serve).toBeDefined();
    if (!serve) throw new Error('Missing serve task');
    const before = session.getDay();
    expect(npc.arrive(serve.assignee, orderId, 'serve', layout.tables.t1.position)).toBe(false);
    expect(session.getDay()).toBe(before);
    expect(npc.arrive(serve.assignee, orderId, 'serve', layout.tables.t3.position)).toBe(true);
    expect(session.getDay().store.orders[0].status).toBe('served');
    expect(npc.arrive(serve.assignee, orderId, 'serve', layout.tables.t3.position)).toBe(false);
  });
});
