import { describe, expect, it, vi } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';

describe('shared game session notification contract', () => {
  it('notifies each active subscriber once per accepted action, not for duplicate or invalid actions', () => {
    const session = createGameplayDemoSession();
    const customer = vi.fn();
    const staff = vi.fn();
    const manager = vi.fn();
    const unsubscribeStaff = session.subscribe(staff);
    session.subscribe(customer);
    session.subscribe(manager);
    const order = {
      mode: 'customer' as const, type: 'order' as const,
      requestId: 'notification-t3', tableId: 'T3',
      itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    };
    const original = session.getSnapshot();
    expect(session.dispatch(order)).toBe(true);
    expect(session.getSnapshot()).not.toBe(original);
    expect(customer).toHaveBeenCalledTimes(1);
    expect(staff).toHaveBeenCalledTimes(1);
    expect(manager).toHaveBeenCalledTimes(1);
    const acceptedSnapshot = session.getSnapshot();
    expect(session.dispatch(order)).toBe(false);
    expect(session.getSnapshot()).toBe(acceptedSnapshot);
    expect(customer).toHaveBeenCalledTimes(1);
    expect(staff).toHaveBeenCalledTimes(1);
    expect(manager).toHaveBeenCalledTimes(1);
    unsubscribeStaff();
    const id = session.getDay().store.orders[0].id;
    expect(session.dispatch({ mode: 'manager', type: 'pay', orderId: id })).toBe(false);
    expect(customer).toHaveBeenCalledTimes(1);
    expect(staff).toHaveBeenCalledTimes(1);
    expect(manager).toHaveBeenCalledTimes(1);
    expect(session.dispatch({
      mode: 'staff', type: 'task', orderId: id,
      assignee: 'Na', action: 'prepare',
      costs: { rice: 400, chicken: 1200, broth: 300 },
    })).toBe(true);
    expect(customer).toHaveBeenCalledTimes(2);
    expect(staff).toHaveBeenCalledTimes(1);
    expect(manager).toHaveBeenCalledTimes(2);
  });
});
