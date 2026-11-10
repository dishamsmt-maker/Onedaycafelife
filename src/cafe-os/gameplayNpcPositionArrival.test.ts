import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { createGameplayNpcArrivalController, isWithinNpcStation } from './gameplayNpcArrivalController';

describe('NPC physical arrival gate', () => {
  const kitchen = { station: 'kitchen' as const, position: { x: 2, z: 3 }, radius: 0.6 };

  it('rejects far, invalid and nonfinite positions, including invalid radii', () => {
    expect(isWithinNpcStation({ x: 2.5, z: 3 }, kitchen)).toBe(true);
    expect(isWithinNpcStation({ x: 2.61, z: 3 }, kitchen)).toBe(false);
    expect(isWithinNpcStation({ x: NaN, z: 3 }, kitchen)).toBe(false);
    expect(isWithinNpcStation({ x: Infinity, z: 3 }, kitchen)).toBe(false);
    expect(isWithinNpcStation({ x: 2, z: 3 }, { ...kitchen, radius: 0 })).toBe(false);
    expect(isWithinNpcStation({ x: 2, z: 3 }, { ...kitchen, radius: Infinity })).toBe(false);
  });

  it('does not mutate T3 order before Na reaches the kitchen; prevents replay', () => {
    const session = createGameplayDemoSession();
    const npc = createGameplayNpcArrivalController(session);
    expect(session.dispatch({
      mode: 'customer', type: 'order', requestId: 'position-t3-1',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    })).toBe(true);
    const orderId = session.getDay().store.orders[0].id;
    const before = session.getDay();
    expect(npc.arriveAtPositionAndComplete('Na', orderId, 'prepare', { x: 20, z: 30 }, kitchen)).toBe(false);
    expect(npc.arriveAtPositionAndComplete('Ken', orderId, 'prepare', { x: 2, z: 3 }, kitchen)).toBe(false);
    expect(session.getDay()).toBe(before);
    expect(npc.arriveAtPositionAndComplete('Na', orderId, 'prepare', { x: 2, z: 3 }, { ...kitchen, station: 'customer-table' })).toBe(false);
    expect(session.getDay()).toBe(before);
    expect(npc.arriveAtPositionAndComplete('Na', orderId, 'prepare', { x: 2.2, z: 3 }, kitchen)).toBe(true);
    const prepared = session.getDay();
    expect(npc.arriveAtPositionAndComplete('Na', orderId, 'prepare', { x: 2.2, z: 3 }, kitchen)).toBe(false);
    expect(session.getDay()).toBe(prepared);
  });
});
