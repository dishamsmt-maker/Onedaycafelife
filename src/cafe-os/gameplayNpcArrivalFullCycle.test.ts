import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { createGameplayNpcArrivalController } from './gameplayNpcArrivalController';

describe('NPC arrival full-day vertical slice', () => {
  it('requires each assigned worker to arrive at the correct station before T3 can be paid', () => {
    const session = createGameplayDemoSession();
    const npc = createGameplayNpcArrivalController(session);
    let notifications = 0;
    const unsubscribe = session.subscribe(() => { notifications += 1; });

    expect(session.dispatch({
      mode: 'customer', type: 'order', requestId: 'arrival-full-t3',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    })).toBe(true);
    const orderId = session.getDay().store.orders[0].id;
    const stations = {
      prepare: 'kitchen',
      ready: 'service-counter',
      serve: 'customer-table',
    } as const;
    const incorrect = {
      prepare: 'customer-table',
      ready: 'kitchen',
      serve: 'service-counter',
    } as const;
    const completed: string[] = [];

    for (let step = 0; step < 3; step++) {
      const task = session.getSnapshot().staff.tasks.find(t => t.orderId === orderId);
      expect(task).toBeDefined();
      if (!task) throw new Error('Expected assigned NPC task');
      const { assignee, action } = task;
      expect(npc.requiredStation(action)).toBe(stations[action]);
      const before = session.getDay();
      const beforeNotifications = notifications;
      expect(npc.arriveAndComplete(assignee, orderId, action, incorrect[action])).toBe(false);
      expect(session.getDay()).toBe(before);
      expect(notifications).toBe(beforeNotifications);
      const wrongWorker = assignee === 'Na' ? 'Ken' : 'Na';
      expect(npc.arriveAndComplete(wrongWorker, orderId, action, stations[action])).toBe(false);
      expect(session.getDay()).toBe(before);
      expect(npc.arriveAndComplete(assignee, orderId, action, stations[action])).toBe(true);
      completed.push(action);
      const after = session.getDay();
      expect(npc.arriveAndComplete(assignee, orderId, action, stations[action])).toBe(false);
      expect(session.getDay()).toBe(after);
    }
    expect(completed).toEqual(['prepare', 'ready', 'serve']);
    expect(session.getDay().store.orders.find(o => o.id === orderId)?.status).toBe('served');
    expect(session.dispatch({ mode: 'manager', type: 'pay', orderId })).toBe(true);
    const paid = session.getDay();
    expect(session.getSnapshot().manager.cashSatang).toBeGreaterThan(0);
    expect(session.dispatch({ mode: 'manager', type: 'pay', orderId })).toBe(false);
    expect(session.getDay()).toBe(paid);
    unsubscribe();
  });
});
