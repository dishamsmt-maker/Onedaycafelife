import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { createGameplayNpcArrivalController } from './gameplayNpcArrivalController';

describe('NPC station arrival boundary', () => {
  it('does not mutate the shared day before arrival or at the wrong station', () => {
    const session = createGameplayDemoSession();
    const npc = createGameplayNpcArrivalController(session);
    expect(session.dispatch({
      mode: 'customer', type: 'order', requestId: 'station-t3-1',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1,
    })).toBe(true);
    const order = session.getDay().store.orders[0];
    const before = session.getDay();
    expect(npc.requiredStation('prepare')).toBe('kitchen');
    expect(npc.arriveAndComplete('Na', order.id, 'prepare', 'customer-table')).toBe(false);
    expect(npc.arriveAndComplete('Ken', order.id, 'prepare', 'kitchen')).toBe(false);
    expect(session.getDay()).toBe(before);
    expect(npc.arriveAndComplete('Na', order.id, 'prepare', 'kitchen')).toBe(true);
    const prepared = session.getDay();
    expect(npc.arriveAndComplete('Na', order.id, 'prepare', 'kitchen')).toBe(false);
    expect(session.getDay()).toBe(prepared);
  });
});
