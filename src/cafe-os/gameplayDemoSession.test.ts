import { describe, expect, it, vi } from 'vitest';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { DEMO_HALAL_MENU } from './demoCatalog';

describe('shared Gameplay V2 demo session', () => {
  it('notifies all modes from one canonical order, but not for duplicate retries', () => {
    const session = createGameplayDemoSession();
    const customer = vi.fn();
    const manager = vi.fn();
    const stop = session.subscribe(customer);
    session.subscribe(manager);
    const order = {
      mode: 'customer' as const, type: 'order' as const,
      requestId: 'scene-t3-1', tableId: 'T3',
      itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    };
    expect(session.dispatch(order)).toBe(true);
    expect(session.getSnapshot().manager.tables.find(t => t.tableId === 't3')?.orders).toHaveLength(1);
    expect(session.getSnapshot().staff.tasks[0]?.assignee).toBe('Na');
    expect(customer).toHaveBeenCalledTimes(1);
    expect(manager).toHaveBeenCalledTimes(1);
    const sameSnapshot = session.getSnapshot();
    expect(session.dispatch(order)).toBe(false);
    expect(session.getSnapshot()).toBe(sameSnapshot);
    expect(customer).toHaveBeenCalledTimes(1);
    stop();
    expect(session.dispatch({ mode: 'manager', type: 'cancel', orderId: session.getDay().store.orders[0].id })).toBe(true);
    expect(customer).toHaveBeenCalledTimes(1);
    expect(manager).toHaveBeenCalledTimes(2);
    expect(session.getSnapshot().staff.tasks).toHaveLength(0);
  });
});
