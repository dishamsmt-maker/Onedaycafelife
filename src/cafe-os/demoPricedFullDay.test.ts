import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { demoRecipeUnitCosts } from './demoIngredientCosts';
import { createGameplayDemoSession } from './gameplayDemoSession';

describe('game-only priced full-day journey', () => {
  it('keeps customer, kitchen, cash and ingredient costs consistent through closeout', () => {
    const session = createGameplayDemoSession();
    const item = DEMO_HALAL_MENU[0];
    const startingStock = { ...session.getSnapshot().manager.stock };
    const order = { mode: 'customer' as const, type: 'order' as const,
      requestId: 't3-priced-once', tableId: 'T3', itemId: item.id, quantity: 1 };
    expect(session.dispatch(order)).toBe(true);
    expect(session.dispatch(order)).toBe(false);
    const id = session.getDay().store.orders[0].id;
    expect(session.getSnapshot().staff.tasks[0]).toMatchObject({ orderId: id, assignee: 'Na', action: 'prepare' });
    const costs = demoRecipeUnitCosts(item.recipe);
    expect(session.dispatch({ mode: 'staff', type: 'task', orderId: id, assignee: 'Na', action: 'prepare', costs })).toBe(true);
    expect(session.dispatch({ mode: 'staff', type: 'task', orderId: id, assignee: 'Na', action: 'ready' })).toBe(true);
    expect(session.dispatch({ mode: 'staff', type: 'task', orderId: id, assignee: 'Ken', action: 'serve' })).toBe(true);
    expect(session.getSnapshot().manager.cashSatang).toBe(0);
    expect(session.dispatch({ mode: 'manager', type: 'pay', orderId: id })).toBe(true);
    const snapshot = session.getSnapshot();
    expect(snapshot.manager.cashSatang).toBe(item.priceSatang);
    for (const [ingredient, qty] of Object.entries(item.recipe)) {
      expect(snapshot.manager.stock[ingredient]).toBe(startingStock[ingredient] - qty);
    }
    const expectedCost = Object.entries(item.recipe).reduce((sum, [ingredient, qty]) => sum + qty * costs[ingredient], 0);
    expect(session.getDay().store.orders[0].consumedCostSatang).toBe(expectedCost);
    expect(session.dispatch({ mode: 'manager', type: 'close' })).toBe(true);
    expect(session.getSnapshot().manager.closed).toBe(true);
    expect(session.dispatch({ mode: 'manager', type: 'pay', orderId: id })).toBe(false);
    expect(session.getDay().events.map(e => e.action)).toEqual(['ordered', 'preparing', 'ready', 'served', 'paid', 'closed']);
  });
});
