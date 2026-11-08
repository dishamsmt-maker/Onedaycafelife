import { describe, expect, it } from 'vitest';
import { canMovePastActors, resolveNpcSteps } from './dynamicMovement';

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
