import { describe, expect, it } from 'vitest';
import { DEMO_HALAL_MENU } from './demoCatalog';
import { createGameplayDemoSession } from './gameplayDemoSession';
import { createSceneTransformNpcBridge } from './gameplayNpcSceneTransformBridge';

describe('NPC live transform bridge', () => {
  it('reads current position at completion and refuses distant, missing, or wrong-table arrivals', () => {
    const session = createGameplayDemoSession();
    const kitchen = { station: 'kitchen', position: { x: 1, z: 1 }, radius: 0.5 } as const;
    const serviceCounter = { station: 'service-counter', position: { x: 2, z: 1 }, radius: 0.5 } as const;
    const t3 = { station: 'customer-table', position: { x: 9, z: 9 }, radius: 0.5 } as const;
    const t1 = { station: 'customer-table', position: { x: 3, z: 3 }, radius: 0.5 } as const;
    const positions = { Na: { x: 0, z: 0 }, Ken: { x: 0, z: 0 } };
    const npc = createSceneTransformNpcBridge(session, { kitchen, serviceCounter, tables: { t1, t3 } },
      assignee => positions[assignee]);
    expect(session.dispatch({ mode: 'customer', type: 'order', requestId: 'live-transform-t3',
      tableId: 'T3', itemId: DEMO_HALAL_MENU[0].id, quantity: 1 })).toBe(true);
    const orderId = session.getDay().store.orders[0].id;
    const before = session.getDay();
    expect(npc.completeAtCurrentTransform('Na', orderId, 'prepare')).toBe(false);
    expect(session.getDay()).toBe(before);
    positions.Na = { ...kitchen.position };
    expect(npc.completeAtCurrentTransform('Na', orderId, 'prepare')).toBe(true);
    positions.Na = { ...serviceCounter.position };
    expect(npc.completeAtCurrentTransform('Na', orderId, 'ready')).toBe(true);
    positions.Ken = { ...t1.position };
    const waiting = session.getDay();
    expect(npc.completeAtCurrentTransform('Ken', orderId, 'serve')).toBe(false);
    expect(session.getDay()).toBe(waiting);
    positions.Ken = { ...t3.position };
    expect(npc.completeAtCurrentTransform('Ken', orderId, 'serve')).toBe(true);
    expect(npc.completeAtCurrentTransform('Ken', orderId, 'serve')).toBe(false);
    expect(session.getDay().store.orders[0].status).toBe('served');
  });
  it('rejects absent or invalid scene transforms without modifying state', () => {
    const session = createGameplayDemoSession();
    const target = { station: 'kitchen', position: { x: 1, z: 1 }, radius: 0.5 } as const;
    const npc = createSceneTransformNpcBridge(session,
      { kitchen: target, serviceCounter: { ...target, station: 'service-counter' }, tables: {} },
      () => ({ x: Number.NaN, z: 1 }));
    const before = session.getDay();
    expect(npc.completeAtCurrentTransform('Na', 'missing', 'prepare')).toBe(false);
    expect(session.getDay()).toBe(before);
  });
});
