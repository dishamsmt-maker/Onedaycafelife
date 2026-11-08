import { describe, expect, it } from 'vitest';
import { canMovePastActors, resolveNpcSteps, resolveNpcStepsWithStalls } from './dynamicMovement';

describe('swept NPC movement clearance', () => {
  it('rejects crossing an actor even when both endpoints are clear', () => {
    expect(canMovePastActors([-1, 1], [0, 1], [{position: [-.5, 1], radius: .16}])).toBe(false);
  });
  it('allows a clear segment past an actor', () => {
    expect(canMovePastActors([-1, 1], [0, 1], [{position: [-.5, 1.6], radius: .16}])).toBe(true);
  });
  it('rejects touching an occupied endpoint', () => {
    expect(canMovePastActors([-1, 1], [-.5, 1], [{position: [-.5, 1], radius: .16}])).toBe(false);
  });
  it('rejects malformed actors and movement coordinates', () => {
    expect(canMovePastActors([-1, 1], [NaN, 1], [])).toBe(false);
    expect(canMovePastActors([-1, 1], [0, 1], [{position: [Infinity, 1], radius: .16}])).toBe(false);
    expect(canMovePastActors([-1, 1], [0, 1], [{position: [0, 2], radius: -1}])).toBe(false);
  });
});

describe('NPC tick resolution', () => {
  it('rotates priority for competing NPCs without overlapping them', () => {
    const actors = [{position: [-1, 1] as const, radius: .16}, {position: [1, 1] as const, radius: .16}];
    const proposals: [number, number][] = [[0, 1], [0, 1]];
    expect(resolveNpcSteps(actors, proposals, 0)).toEqual([[0, 1], [1, 1]]);
    expect(resolveNpcSteps(actors, proposals, 1)).toEqual([[-1, 1], [0, 1]]);
    expect(() => resolveNpcSteps(actors, proposals, -1)).toThrow();
  });
  it('rejects mismatched movement proposals', () => {
    expect(() => resolveNpcSteps([{position: [-1, 1], radius: .16}], [])).toThrow();
  });
  it('blocks a step through another stationary NPC', () => {
    const positions = resolveNpcSteps(
      [{position: [-1, 1], radius: .16}, {position: [0, 1], radius: .16}],
      [[.5, 1], [0, 1]],
    );
    expect(positions).toEqual([[-1, 1], [0, 1]]);
  });
  it('prevents head-on swaps', () => {
    const positions = resolveNpcSteps(
      [{position: [-1, 1], radius: .16}, {position: [0, 1], radius: .16}],
      [[0, 1], [-1, 1]],
    );
    expect(positions).toEqual([[-1, 1], [0, 1]]);
  });
  it('allows separated NPCs to move in the same tick', () => {
    const positions = resolveNpcSteps(
      [{position: [-1, 1], radius: .16}, {position: [1, 1], radius: .16}],
      [[-.8, 1], [1.2, 1]],
    );
    expect(positions).toEqual([[-.8, 1], [1.2, 1]]);
  });
});

describe('NPC stall and reroute signals', () => {
  const actors = [
    { position: [-1, 1] as [number, number], radius: .16 },
    { position: [0, 1] as [number, number], radius: .16 },
  ];
  it('increments only blocked movement and flags sustained stalls', () => {
    const first = resolveNpcStepsWithStalls(actors, [[.5, 1], [0, 1]], [6, 0], 0, 8);
    expect(first.positions).toEqual([[-1, 1], [0, 1]]);
    expect(first.stalledTicks).toEqual([7, 0]);
    expect(first.needsRepath).toEqual([false, false]);
    const second = resolveNpcStepsWithStalls(actors, [[.5, 1], [0, 1]], first.stalledTicks, 1, 8);
    expect(second.stalledTicks).toEqual([8, 0]);
    expect(second.needsRepath).toEqual([true, false]);
  });
  it('resets stall count when actor moves or intentionally waits', () => {
    const moving = resolveNpcStepsWithStalls(
      [{ position: [-1, 1], radius: .16 }], [[-.8, 1]], [7], 0, 8);
    expect(moving.stalledTicks).toEqual([0]);
    const waiting = resolveNpcStepsWithStalls(
      [{ position: [-1, 1], radius: .16 }], [[-1, 1]], [7], 0, 8);
    expect(waiting.stalledTicks).toEqual([0]);
  });
  it('rejects invalid tracking state', () => {
    expect(() => resolveNpcStepsWithStalls(actors, [[0, 1], [0, 1]], [0])).toThrow();
    expect(() => resolveNpcStepsWithStalls(actors, [[0, 1], [0, 1]], [0, -1])).toThrow();
    expect(() => resolveNpcStepsWithStalls(actors, [[0, 1], [0, 1]], [0, 0], 0, 0)).toThrow();
  });
});
