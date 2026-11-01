/**
 * ONE DAY Café OS — proposed menu V2 candidate catalog, NOT the game's menu.
 *
 * Candidate names/IDs were manually transcribed from the public GAME V2
 * reference in src/game/data.ts (2026-11-02). This file NEVER imports the
 * game module or its simulated prices, recipes, sales or inventory.
 * All candidate menu names, prices, recipes and availability require owner
 * review before real café use. This is NOT a production menu endpoint.
 */
import { CAFE_TABLE_IDS } from './tableQr';

export const CAFE_LAUNCH_CONSTRAINTS = Object.freeze({
  tableIds: CAFE_TABLE_IDS, // T01–T03: user-specified launch scope
  opensAt: '06:30',
  closesAt: '20:30',
  source: 'USER_SPECIFIED_PLAN_NOT_OPERATIONALLY_VERIFIED',
} as const);

export type CafeMenuCategory = 'porridge' | 'breakfast_set' | 'salad' | 'drink' | 'snack';
export type CafeMenuSource = 'GAME_V2_REFERENCE_ONLY' | 'OWNER_CONFIRMED';
export type CafeMenuReviewStatus = 'PENDING' | 'APPROVED';

export type CafeMenuDraftItem = Readonly<{
  id: string;
  nameTh: string;
  category: CafeMenuCategory;
  source: CafeMenuSource;
  reviewStatus: CafeMenuReviewStatus;
  priceSatang: number | null;
  recipeVersion: string | null;
  approvalReference: string | null;
}>;

const draft = (id: string, nameTh: string, category: CafeMenuCategory): CafeMenuDraftItem =>
  Object.freeze({
    id,
    nameTh,
    category,
    source: 'GAME_V2_REFERENCE_ONLY' as const,
    reviewStatus: 'PENDING' as const,
    priceSatang: null,
    recipeVersion: null,
    approvalReference: null,
  });

/**
 * 37 *candidates*, not 37 approved products. Hidden game-only production
 * components are intentionally excluded. Game prices and recipes omitted.
 * No customer-facing QR/POS route reads this catalog.
 */
export const CAFE_MENU_V2_CANDIDATES: ReadonlyArray<CafeMenuDraftItem> = Object.freeze([
  draft('chicken-porridge', 'ข้าวต้มไก่', 'porridge'),
  draft('chicken-egg', 'ข้าวต้มไก่ใส่ไข่', 'porridge'),
  draft('shrimp-porridge', 'ข้าวต้มกุ้ง', 'porridge'),
  draft('fish-porridge', 'ข้าวต้มปลากะพง', 'porridge'),
  draft('seafood-porridge', 'ข้าวต้มทะเล', 'porridge'),

  draft('morning-set', 'Morning Set', 'breakfast_set'),
  draft('american-set', 'American Set', 'breakfast_set'),
  draft('one-day-set', 'ONE DAY Set', 'breakfast_set'),
  draft('special-set', 'Special Set', 'breakfast_set'),

  draft('egg-salad', 'สลัดไข่ต้ม', 'salad'),
  draft('chicken-egg-salad', 'สลัดไก่และไข่', 'salad'),

  draft('latte', 'ลาเต้เย็น', 'drink'),
  draft('americano', 'อเมริกาโน', 'drink'),
  draft('espresso', 'เอสเพรสโซเย็นแบบไทย', 'drink'),
  draft('caramel-macchiato', 'คาราเมลมัคคิอาโต้', 'drink'),
  draft('mocha', 'มอคค่า', 'drink'),
  draft('signature', 'ONE DAY Signature', 'drink'),
  draft('thai-tea', 'ชาไทยเย็น', 'drink'),
  draft('green-tea', 'ชาเขียวเย็น', 'drink'),
  draft('hot-tea', 'ชาร้อน', 'drink'),
  draft('lemon-tea', 'ชามะนาว', 'drink'),
  draft('cocoa', 'โกโก้', 'drink'),
  draft('fresh-milk', 'นมสดเย็น', 'drink'),
  draft('pink-milk', 'นมชมพู', 'drink'),
  draft('lime-soda', 'มะนาวโซดา', 'drink'),
  draft('honey-lemon', 'น้ำผึ้งมะนาว', 'drink'),
  draft('peach-soda', 'พีชโซดา', 'drink'),

  draft('toast', 'ขนมปังปิ้งเนยนม', 'snack'),
  draft('chocolate-toast', 'ขนมปังปิ้งช็อกโกแลต', 'snack'),
  draft('chicken-cheese-toast', 'ขนมปังปิ้งหน้าไก่ชีส', 'snack'),
  draft('fries', 'เฟรนช์ฟรายส์', 'snack'),
  draft('nuggets', 'นักเก็ตไก่ 5 ชิ้น', 'snack'),
  draft('grilled-sausage', 'ไส้กรอกไก่ย่าง', 'snack'),
  draft('cheese-fries', 'ชีสฟรายส์', 'snack'),
  draft('snack-box', 'ONE DAY Snack Box', 'snack'),
  draft('tea-toast-set', 'ชุดชาไทยและขนมปัง', 'snack'),
  draft('tea-break-combo', 'Tea Break Combo', 'snack'),
]);

export type CafeMenuValidation =
  | Readonly<{ ok: true; total: number; pending: number; structurallyApproved: number }>
  | Readonly<{ ok: false; reason: 'invalid_catalog' | 'invalid_item' | 'duplicate_id' | 'invalid_approval_state' }>;

const CATEGORIES: ReadonlyArray<string> = ['porridge', 'breakfast_set', 'salad', 'drink', 'snack'];
const KEYS = [
  'id', 'nameTh', 'category', 'source', 'reviewStatus',
  'priceSatang', 'recipeVersion', 'approvalReference',
] as const;

function isRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const proto = Object.getPrototypeOf(value);
  return proto === Object.prototype || proto === null;
}

function exactKeys(value: Record<string, unknown>): boolean {
  const keys = Object.keys(value);
  return keys.length === KEYS.length && keys.every(key => KEYS.some(expected => expected === key));
}

/**
 * Structural validation ONLY. It cannot verify that a human approved a
 * recipe, that a price is current, or that a product is actually in stock.
 */
export function validateCafeMenuCatalog(input: unknown): CafeMenuValidation {
  if (!Array.isArray(input) || input.length < 1 || input.length > 100) {
    return { ok: false, reason: 'invalid_catalog' };
  }
  const ids = new Set<string>();
  let pending = 0;
  let structurallyApproved = 0;
  for (const item of input) {
    if (!isRecord(item) || !exactKeys(item)) return { ok: false, reason: 'invalid_item' };
    const { id, nameTh, category, source, reviewStatus, priceSatang, recipeVersion, approvalReference } = item;
    if (typeof id !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(id) ||
        typeof nameTh !== 'string' || nameTh.length < 1 || nameTh.length > 100 ||
        nameTh.trim() !== nameTh || /[\u0000-\u001f\u007f]/.test(nameTh) ||
        !CATEGORIES.includes(String(category)) ||
        (source !== 'GAME_V2_REFERENCE_ONLY' && source !== 'OWNER_CONFIRMED') ||
        (reviewStatus !== 'PENDING' && reviewStatus !== 'APPROVED')) {
      return { ok: false, reason: 'invalid_item' };
    }
    if (ids.has(id)) return { ok: false, reason: 'duplicate_id' };
    ids.add(id);

    if (reviewStatus === 'PENDING') {
      // Fail closed: draft products must not accidentally carry sellable prices.
      if (priceSatang !== null || recipeVersion !== null || approvalReference !== null) {
        return { ok: false, reason: 'invalid_approval_state' };
      }
      pending += 1;
    } else {
      if (source !== 'OWNER_CONFIRMED' ||
          typeof priceSatang !== 'number' || !Number.isSafeInteger(priceSatang) ||
          priceSatang < 1 || priceSatang > 10_000_000 ||
          typeof recipeVersion !== 'string' || !/^[a-z][a-z0-9-]{2,63}$/.test(recipeVersion) ||
          typeof approvalReference !== 'string' || !/^[a-zA-Z0-9_-]{8,128}$/.test(approvalReference)) {
        return { ok: false, reason: 'invalid_approval_state' };
      }
      structurallyApproved += 1;
    }
  }
  return { ok: true, total: input.length, pending, structurallyApproved };
}

/** Informational review only; NEVER use this as authorization to accept payment. */
export function listStructurallyApprovedMenuItems(input: unknown): ReadonlyArray<CafeMenuDraftItem> {
  const result = validateCafeMenuCatalog(input);
  if (!result.ok) return Object.freeze([]);
  return Object.freeze((input as CafeMenuDraftItem[]).filter(item => item.reviewStatus === 'APPROVED'));
}
