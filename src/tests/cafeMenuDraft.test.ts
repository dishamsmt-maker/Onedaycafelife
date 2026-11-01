import { describe, expect, it } from 'vitest';
import {
  CAFE_LAUNCH_CONSTRAINTS,
  CAFE_MENU_V2_CANDIDATES,
  listStructurallyApprovedMenuItems,
  validateCafeMenuCatalog,
  type CafeMenuDraftItem,
} from '../cafe-os/menuDraft';

const approvedFixture: CafeMenuDraftItem = {
  id: 'synthetic-tea',
  nameTh: 'ชาทดสอบ',
  category: 'drink',
  source: 'OWNER_CONFIRMED',
  reviewStatus: 'APPROVED',
  priceSatang: 1, // fictional contract fixture, NOT a menu price
  recipeVersion: 'recipe-v1',
  approvalReference: 'test-review-0001', // synthetic only, NOT human approval
};

describe('Café OS V2 menu candidates — not the game or live menu', () => {
  it('keeps the launch table and time constraints explicit and separate', () => {
    expect(CAFE_LAUNCH_CONSTRAINTS.tableIds).toEqual(['T01', 'T02', 'T03']);
    expect(CAFE_LAUNCH_CONSTRAINTS.opensAt).toBe('06:30');
    expect(CAFE_LAUNCH_CONSTRAINTS.closesAt).toBe('20:30');
    expect(CAFE_LAUNCH_CONSTRAINTS.source).toBe('USER_SPECIFIED_PLAN_NOT_OPERATIONALLY_VERIFIED');
  });

  it('contains exactly 37 unique candidate products, no game-hidden ingredients', () => {
    expect(CAFE_MENU_V2_CANDIDATES).toHaveLength(37);
    expect(new Set(CAFE_MENU_V2_CANDIDATES.map(item => item.id)).size).toBe(37);
    expect(CAFE_MENU_V2_CANDIDATES.map(item => item.id)).not.toContain('american-plate');
    expect(CAFE_MENU_V2_CANDIDATES.map(item => item.id)).not.toContain('boiled-egg');
    expect(CAFE_MENU_V2_CANDIDATES.map(item => item.id)).toContain('chicken-porridge');
    expect(CAFE_MENU_V2_CANDIDATES.map(item => item.id)).toContain('thai-tea');
    expect(CAFE_MENU_V2_CANDIDATES.map(item => item.id)).toContain('tea-break-combo');
  });

  it('fails closed: all candidate names need review, with zero prices or recipes', () => {
    expect(validateCafeMenuCatalog(CAFE_MENU_V2_CANDIDATES)).toEqual({
      ok: true, total: 37, pending: 37, structurallyApproved: 0,
    });
    for (const item of CAFE_MENU_V2_CANDIDATES) {
      expect(item.source).toBe('GAME_V2_REFERENCE_ONLY');
      expect(item.reviewStatus).toBe('PENDING');
      expect(item.priceSatang).toBeNull();
      expect(item.recipeVersion).toBeNull();
      expect(item.approvalReference).toBeNull();
      expect(Object.isFrozen(item)).toBe(true);
    }
    expect(Object.isFrozen(CAFE_MENU_V2_CANDIDATES)).toBe(true);
    expect(listStructurallyApprovedMenuItems(CAFE_MENU_V2_CANDIDATES)).toEqual([]);
  });

  it('rejects duplicate menu IDs and malformed catalog containers', () => {
    const item = CAFE_MENU_V2_CANDIDATES[0];
    expect(validateCafeMenuCatalog([item, item])).toEqual({ ok: false, reason: 'duplicate_id' });
    for (const value of [[], null, {}, 'menu', Array.from({ length: 101 }, () => item)]) {
      expect(validateCafeMenuCatalog(value)).toEqual({ ok: false, reason: 'invalid_catalog' });
    }
  });

  it('rejects unknown fields, invalid names, IDs and categories', () => {
    const item = CAFE_MENU_V2_CANDIDATES[0];
    const invalid: unknown[] = [
      { ...item, price: 5000 }, { ...item, id: 'T01:foo' },
      { ...item, id: '' }, { ...item, nameTh: ' ' },
      { ...item, nameTh: ' ข้าวต้มไก่' }, { ...item, nameTh: 'bad\nname' },
      { ...item, category: 'coffee' }, { ...item, category: {} },
      { ...item, source: 'GAME' }, { ...item, reviewStatus: 'published' },
      { ...item, nameTh: 5 },
    ];
    for (const value of invalid) {
      expect(validateCafeMenuCatalog([value])).toEqual({ ok: false, reason: 'invalid_item' });
    }
  });

  it('rejects a pending item with any unreviewed price, recipe or approval marker', () => {
    const item = CAFE_MENU_V2_CANDIDATES[0];
    for (const value of [
      { ...item, priceSatang: 4500 },
      { ...item, recipeVersion: 'recipe-v1' },
      { ...item, approvalReference: 'owner-review-1' },
    ]) {
      expect(validateCafeMenuCatalog([value])).toEqual({ ok: false, reason: 'invalid_approval_state' });
      expect(listStructurallyApprovedMenuItems([value])).toEqual([]);
    }
  });

  it('checks structurally approved synthetic fixtures without treating them as real authorization', () => {
    expect(validateCafeMenuCatalog([approvedFixture])).toEqual({
      ok: true, total: 1, pending: 0, structurallyApproved: 1,
    });
    expect(listStructurallyApprovedMenuItems([approvedFixture])).toEqual([approvedFixture]);
    expect(validateCafeMenuCatalog([...CAFE_MENU_V2_CANDIDATES, approvedFixture])).toEqual({
      ok: true, total: 38, pending: 37, structurallyApproved: 1,
    });
  });

  it('requires owner-confirmed source, integer satang, recipe version and reference', () => {
    const invalid: unknown[] = [
      { ...approvedFixture, source: 'GAME_V2_REFERENCE_ONLY' },
      { ...approvedFixture, priceSatang: null },
      { ...approvedFixture, priceSatang: 0 },
      { ...approvedFixture, priceSatang: 1.5 },
      { ...approvedFixture, priceSatang: Number.NaN },
      { ...approvedFixture, priceSatang: 10_000_001 },
      { ...approvedFixture, recipeVersion: null },
      { ...approvedFixture, recipeVersion: 'v' },
      { ...approvedFixture, approvalReference: null },
      { ...approvedFixture, approvalReference: 'x' },
    ];
    for (const value of invalid) {
      expect(validateCafeMenuCatalog([value])).toEqual({ ok: false, reason: 'invalid_approval_state' });
    }
  });
});
