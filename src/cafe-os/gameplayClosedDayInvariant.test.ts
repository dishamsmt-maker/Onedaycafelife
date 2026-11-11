import { describe, expect, it } from 'vitest';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { DEMO_HALAL_MENU } from './demoCatalog';

describe('game-only closed-day invariant across all three modes', () => {
  it('locks direct dispatches after close without changing events, cash or stock', () => {
    const session = createGameplayDemoSession();
    let notifications = 0;
    const unsubscribe = session.subscribe(() => { notifications += 1; });
    const menu = DEMO_HALAL_MENU[0];
    expect(session.dispatch({
      mode: 'customer', type: 'order', tableId: 'T3',
      itemId: menu.id, quantity: 1, requestId: 'close-guard-t3',
    })).toBe(true);
    const orderId = session.getDay().store.orders[0].id;
    for (const [assignee, action] of [
      ['Na', 'prepare'], ['Na', 'ready'], ['Ken', 'serve'],
    ] as const) {
      expect(session.dispatch({ mode: 'staff', type: 'task', orderId, assignee, action })).toBe(true);
    }
    expect(session.dispatch({ mode: 'manager', type: 'pay', orderId })).toBe(true);
    expect(session.getSnapshot().manager.close.readyToClose).toBe(true);
    expect(session.dispatch({ mode: 'manager', type: 'close' })).toBe(true);
    const closedDay = session.getDay();
    const closedSnapshot = session.getSnapshot();
    const count = notifications;
    expect(closedSnapshot.manager.closed).toBe(true);

    // UI button disabling is not a security boundary: direct scene/session
    // calls must also fail after closing, including retries of old actions.
    const attempts = [
      { mode: 'customer', type: 'order', tableId: 't3', itemId: menu.id, quantity: 1, requestId: 'after-close-new' },
      { mode: 'staff', type: 'task', orderId, assignee: 'Na', action: 'prepare' },
      { mode: 'staff', type: 'task', orderId, assignee: 'Ken', action: 'serve' },
      { mode: 'manager', type: 'pay', orderId },
      { mode: 'manager', type: 'cancel', orderId },
      { mode: 'manager', type: 'close' },
    ] as const;
    for (const attempt of attempts) {
      expect(session.dispatch(attempt)).toBe(false);
      expect(session.getDay()).toBe(closedDay);
      expect(session.getSnapshot()).toBe(closedSnapshot);
    }
    expect(notifications).toBe(count);
    expect(session.getDay().events.at(-1)?.action).toBe('closed');
    unsubscribe();
  });
});
