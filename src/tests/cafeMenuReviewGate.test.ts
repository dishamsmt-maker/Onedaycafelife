import { describe, expect, it } from 'vitest';
import { createCafeMenuReviewGate } from '../cafe-os/menuReviewGate';
import {
  CAFE_MENU_V2_CANDIDATES,
  type CafeMenuDraftItem,
} from '../cafe-os/menuDraft';

const REQUEST_ID = 'synthetic-request-0001';
const syntheticApproved: CafeMenuDraftItem = Object.freeze({
  id: 'synthetic-tea',
  nameTh: 'ชาทดสอบเท่านั้น',
  category: 'drink',
  source: 'OWNER_CONFIRMED',
  reviewStatus: 'APPROVED',
  priceSatang: 1, // FICTIONAL test fixture; not a real selling price
  recipeVersion: 'recipe-test-v1',
  approvalReference: 'synthetic-review-0001', // not proof of human approval
});

const request = (
  menuId = 'synthetic-tea',
  requestId = REQUEST_ID,
  tableId = 'T01',
) => ({
  requestId,
  tableId,
  items: [{ menuId, quantity: 1 }],
});

describe('Café OS menu review gate — structural prototype only', () => {
  it('rejects all 37 PENDING V2 candidates before any draft order is created', () => {
    const gate = createCafeMenuReviewGate(CAFE_MENU_V2_CANDIDATES);
    expect(gate.getCatalogValidation()).toEqual({
      ok: true, total: 37, pending: 37, structurallyApproved: 0,
    });
    for (const item of CAFE_MENU_V2_CANDIDATES) {
      expect(gate.submit(request(item.id))).toEqual({
        accepted: false, reason: 'menu_not_approved',
      });
    }
    expect(gate.getOrders()).toEqual([]);
  });

  it('rejects malformed catalogs without creating an order', () => {
    for (const catalog of [null, [], {}, [
      { ...syntheticApproved, priceSatang: null },
    ], [syntheticApproved, syntheticApproved]]) {
      const gate = createCafeMenuReviewGate(catalog);
      expect(gate.getCatalogValidation().ok).toBe(false);
      expect(gate.submit(request())).toEqual({
        accepted: false, reason: 'invalid_catalog',
      });
      expect(gate.getOrders()).toHaveLength(0);
    }
  });

  it('allows a synthetic structurally approved fixture in T01, T02 and T03', () => {
    const gate = createCafeMenuReviewGate([syntheticApproved]);
    expect(gate.getCatalogValidation()).toEqual({
      ok: true, total: 1, pending: 0, structurallyApproved: 1,
    });
    for (const [index, table] of ['T01', 'T02', 'T03'].entries()) {
      const result = gate.submit(request('synthetic-tea', `synthetic-request-${index + 10}`, table));
      expect(result.accepted).toBe(true);
      if (!result.accepted) throw new Error('fixture unexpectedly rejected');
      expect(result.order.tableId).toBe(table);
    }
    expect(gate.getOrders()).toHaveLength(3);
  });

  it('allows approved items but rejects pending items in the same valid catalog', () => {
    const gate = createCafeMenuReviewGate([syntheticApproved, CAFE_MENU_V2_CANDIDATES[0]]);
    expect(gate.submit(request('chicken-porridge'))).toEqual({
      accepted: false, reason: 'menu_not_approved',
    });
    expect(gate.getOrders()).toHaveLength(0);
    expect(gate.submit(request('synthetic-tea')).accepted).toBe(true);
    expect(gate.getOrders()).toHaveLength(1);
  });

  it('rejects unknown IDs and an order mixing approved and pending products', () => {
    const gate = createCafeMenuReviewGate([syntheticApproved, CAFE_MENU_V2_CANDIDATES[0]]);
    expect(gate.submit(request('nonexistent-item'))).toEqual({
      accepted: false, reason: 'menu_not_approved',
    });
    expect(gate.submit({
      requestId: REQUEST_ID, tableId: 'T01',
      items: [
        { menuId: 'synthetic-tea', quantity: 1 },
        { menuId: 'chicken-porridge', quantity: 1 },
      ],
    })).toEqual({ accepted: false, reason: 'menu_not_approved' });
    expect(gate.getOrders()).toHaveLength(0);
  });

  it('rejects malformed order payloads and injected prices, roles or payment flags', () => {
    const gate = createCafeMenuReviewGate([syntheticApproved]);
    const invalid: unknown[] = [
      request('synthetic-tea', 'short'),
      request('synthetic-tea', REQUEST_ID, 'T04'),
      { ...request(), priceSatang: 1 },
      { ...request(), role: 'admin' },
      { ...request(), paymentStatus: 'paid' },
      { ...request(), items: [] },
      { ...request(), items: [{ menuId: 'synthetic-tea', quantity: 0 }] },
      { ...request(), items: [{ menuId: 'synthetic-tea', quantity: 1, total: 1 }] },
      null,
    ];
    for (const value of invalid) {
      expect(gate.submit(value)).toEqual({ accepted: false, reason: 'invalid_request' });
    }
    expect(gate.getOrders()).toHaveLength(0);
  });

  it('preserves idempotency: exact retry returns the same draft order', () => {
    const gate = createCafeMenuReviewGate([syntheticApproved]);
    const first = gate.submit(request());
    const retry = gate.submit(request());
    expect(first.accepted && retry.accepted).toBe(true);
    if (!first.accepted || !retry.accepted) throw new Error('unexpected rejection');
    expect(retry.duplicate).toBe(true);
    expect(retry.order.orderId).toBe(first.order.orderId);
    expect(gate.getOrders()).toHaveLength(1);
  });

  it('rejects reuse of an existing request ID for a different table or quantity', () => {
    const gate = createCafeMenuReviewGate([syntheticApproved]);
    expect(gate.submit(request()).accepted).toBe(true);
    expect(gate.submit(request('synthetic-tea', REQUEST_ID, 'T02'))).toEqual({
      accepted: false, reason: 'idempotency_conflict',
    });
    expect(gate.submit({
      ...request(),
      items: [{ menuId: 'synthetic-tea', quantity: 2 }],
    })).toEqual({ accepted: false, reason: 'idempotency_conflict' });
    expect(gate.getOrders()).toHaveLength(1);
  });

  it('snapshots approved IDs so later mutation cannot approve a PENDING item', () => {
    const pending = { ...CAFE_MENU_V2_CANDIDATES[0] };
    const catalog = [syntheticApproved, pending];
    const gate = createCafeMenuReviewGate(catalog);
    pending.reviewStatus = 'APPROVED';
    pending.source = 'OWNER_CONFIRMED';
    pending.priceSatang = 1;
    pending.recipeVersion = 'recipe-test-v1';
    pending.approvalReference = 'synthetic-review-0002';
    expect(gate.submit(request('chicken-porridge'))).toEqual({
      accepted: false, reason: 'menu_not_approved',
    });
    expect(gate.getOrders()).toHaveLength(0);
  });
});
