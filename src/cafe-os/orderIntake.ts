/**
 * ONE DAY Café OS — prototype idempotent intake contract.
 *
 * An in-memory, dependency-free draft for reviewing a real POS contract.
 * It is NOT a backend, durable queue, authentication, payment, or KDS.
 * Do not use this as the source of truth for real customer orders.
 */
import { isCafeTableId, type CafeTableId } from './tableQr';

export type CafeOrderLine = Readonly<{
  menuId: string;
  quantity: number;
}>;

export type CafeDraftOrder = Readonly<{
  orderId: string;
  requestId: string;
  tableId: CafeTableId;
  status: 'received';
  items: ReadonlyArray<CafeOrderLine>;
}>;

export type CafeIntakeResult =
  | Readonly<{ accepted: true; duplicate: boolean; order: CafeDraftOrder }>
  | Readonly<{ accepted: false; reason: 'invalid_request' | 'idempotency_conflict' }>;

type StoredOrder = Readonly<{ fingerprint: string; order: CafeDraftOrder }>;

type ValidOrderRequest = {
  requestId: string;
  tableId: CafeTableId;
  items: ReadonlyArray<CafeOrderLine>;
};

function isPlainRecord(value: unknown): value is Record<string, unknown> {
  if (typeof value !== 'object' || value === null || Array.isArray(value)) return false;
  const prototype = Object.getPrototypeOf(value);
  return prototype === Object.prototype || prototype === null;
}

function keysMatch(value: Record<string, unknown>, expected: readonly string[]): boolean {
  const keys = Object.keys(value);
  return keys.length === expected.length && keys.every(key => expected.includes(key));
}

/**
 * Reject unexpected fields: caller-provided totals, role, price, or payment
 * status must never enter the intake record.
 */
/** Validate an untrusted draft request without creating an order. */
export function parseCafeDraftOrderRequest(value: unknown): ValidOrderRequest | null {
  if (!isPlainRecord(value) || !keysMatch(value, ['requestId', 'tableId', 'items'])) return null;
  const { requestId, tableId, items } = value;

  // Client-generated UUIDs are valid, but an ID alone is never authorization.
  if (typeof requestId !== 'string' || !/^[a-zA-Z0-9_-]{16,128}$/.test(requestId)) return null;
  if (!isCafeTableId(tableId)) return null;
  if (!Array.isArray(items) || items.length < 1 || items.length > 20) return null;

  const lines: CafeOrderLine[] = [];
  const seen = new Set<string>();
  for (const item of items) {
    if (!isPlainRecord(item) || !keysMatch(item, ['menuId', 'quantity'])) return null;
    const { menuId, quantity } = item;
    if (typeof menuId !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(menuId)) return null;
    if (typeof quantity !== 'number' || !Number.isSafeInteger(quantity) || quantity < 1 || quantity > 20) return null;
    if (seen.has(menuId)) return null;
    seen.add(menuId);
    lines.push(Object.freeze({ menuId, quantity }));
  }

  // Item order does not affect whether a retry has the same business meaning.
  lines.sort((a, b) => a.menuId.localeCompare(b.menuId));
  return { requestId, tableId, items: Object.freeze(lines) };
}

/**
 * Demonstration inbox: one instance = one temporary in-memory process.
 * In production, enforce a unique (shop_id, request_id) index in a database
 * and insert the order + outbox event atomically in a transaction.
 */
export function createCafeDraftInbox() {
  const byRequestId = new Map<string, StoredOrder>();
  let sequence = 0;

  return {
    submit(value: unknown): CafeIntakeResult {
      const request = parseCafeDraftOrderRequest(value);
      if (!request) return { accepted: false, reason: 'invalid_request' };

      const fingerprint = JSON.stringify([request.tableId, request.items]);
      const existing = byRequestId.get(request.requestId);
      if (existing) {
        if (existing.fingerprint !== fingerprint) {
          return { accepted: false, reason: 'idempotency_conflict' };
        }
        return { accepted: true, duplicate: true, order: existing.order };
      }

      sequence += 1;
      const order: CafeDraftOrder = Object.freeze({
        orderId: `LOCAL-${String(sequence).padStart(6, '0')}`,
        requestId: request.requestId,
        tableId: request.tableId,
        status: 'received',
        items: request.items,
      });
      byRequestId.set(request.requestId, { fingerprint, order });
      return { accepted: true, duplicate: false, order };
    },
    getOrders(): ReadonlyArray<CafeDraftOrder> {
      return Object.freeze([...byRequestId.values()].map(entry => entry.order));
    },
  };
}
