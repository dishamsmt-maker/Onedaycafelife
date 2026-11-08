import { describe, expect, it } from 'vitest';
import { canMovePastActors } from './dynamicMovement';

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
