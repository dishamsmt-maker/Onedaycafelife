import { describe, expect, it } from 'vitest';
import { createCafeDraftInbox } from '../cafe-os/orderIntake';

const A = 'client-request-0001';
const B = 'client-request-0002';
const C = 'client-request-0003';

function request(requestId = A, tableId = 'T01', items = [{ menuId: 'chicken-porridge', quantity: 1 }]) {
  return { requestId, tableId, items };
}

describe('Café OS draft intake idempotency — not a production API', () => {
  it('accepts exactly the three supported table IDs, assigning draft IDs', () => {
    const inbox = createCafeDraftInbox();
    for (const [key, tableId] of [[A, 'T01'], [B, 'T02'], [C, 'T03']] as const) {
      const result = inbox.submit(request(key, tableId));
      expect(result.accepted).toBe(true);
      if (!result.accepted) throw new Error('unexpected rejection');
      expect(result.order.tableId).toBe(tableId);
      expect(result.order.status).toBe('received');
      expect(result.duplicate).toBe(false);
      expect(result.order.orderId).toMatch(/^LOCAL-00000[123]$/);
    }
    expect(inbox.getOrders()).toHaveLength(3);
  });

  it('returns the same order and creates no second record on an identical retry', () => {
    const inbox = createCafeDraftInbox();
    const first = inbox.submit(request());
    const retry = inbox.submit(request());
    expect(first.accepted && retry.accepted).toBe(true);
    if (!first.accepted || !retry.accepted) throw new Error('unexpected rejection');
    expect(retry.duplicate).toBe(true);
    expect(retry.order.orderId).toBe(first.order.orderId);
    expect(inbox.getOrders()).toHaveLength(1);
    // A different client request may still create a separate order.
    const next = inbox.submit(request(B));
    expect(next.accepted).toBe(true);
    expect(inbox.getOrders()).toHaveLength(2);
  });

  it('accepts reordered line items as an equivalent retry', () => {
    const inbox = createCafeDraftInbox();
    const items = [{ menuId: 'latte', quantity: 2 }, { menuId: 'boiled-egg', quantity: 1 }];
    const first = inbox.submit(request(A, 'T01', items));
    const retry = inbox.submit(request(A, 'T01', [...items].reverse()));
    expect(first.accepted && retry.accepted).toBe(true);
    if (!first.accepted || !retry.accepted) throw new Error('unexpected rejection');
    expect(retry.duplicate).toBe(true);
    expect(retry.order.orderId).toBe(first.order.orderId);
    expect(inbox.getOrders()).toHaveLength(1);
  });

  it('rejects key reuse for changed table, dish or quantity', () => {
    const inbox = createCafeDraftInbox();
    expect(inbox.submit(request()).accepted).toBe(true);
    for (const changed of [
      request(A, 'T02'),
      request(A, 'T01', [{ menuId: 'latte', quantity: 1 }]),
      request(A, 'T01', [{ menuId: 'chicken-porridge', quantity: 2 }]),
    ]) {
      expect(inbox.submit(changed)).toEqual({ accepted: false, reason: 'idempotency_conflict' });
    }
    expect(inbox.getOrders()).toHaveLength(1);
  });

  it('rejects invalid tables, missing IDs, unsupported fields and malformed lines', () => {
    const inbox = createCafeDraftInbox();
    const invalid: unknown[] = [
      request(A, 'T04'), request(A, 't01'), request('tiny'),
      { tableId: 'T01', items: [{ menuId: 'latte', quantity: 1 }] },
      { ...request(), price: 1 }, { ...request(), role: 'owner' },
      request(A, 'T01', []),
      request(A, 'T01', [{ menuId: 'latte', quantity: 0 }]),
      request(A, 'T01', [{ menuId: 'latte', quantity: 1.5 }]),
      request(A, 'T01', [{ menuId: 'latte', quantity: Number.NaN }]),
      request(A, 'T01', [{ menuId: 'latte', quantity: 21 }]),
      request(A, 'T01', [{ menuId: 'latte', quantity: 1 }, { menuId: 'latte', quantity: 1 }]),
      { ...request(), items: [{ menuId: 'latte', quantity: 1, paid: true }] },
      { ...request(), items: [{ menuId: 'LATTE', quantity: 1 }] },
      null, [], 'order',
    ];
    for (const value of invalid) {
      expect(inbox.submit(value)).toEqual({ accepted: false, reason: 'invalid_request' });
    }
    expect(inbox.getOrders()).toHaveLength(0);
  });

  it('clones and freezes accepted lines so caller mutations cannot change history', () => {
    const inbox = createCafeDraftInbox();
    const input = request();
    const result = inbox.submit(input);
    expect(result.accepted).toBe(true);
    if (!result.accepted) throw new Error('unexpected rejection');
    input.items[0].quantity = 20;
    input.items.push({ menuId: 'latte', quantity: 1 });
    expect(result.order.items).toEqual([{ menuId: 'chicken-porridge', quantity: 1 }]);
    expect(Object.isFrozen(result.order)).toBe(true);
    expect(Object.isFrozen(result.order.items)).toBe(true);
    expect(Object.isFrozen(result.order.items[0])).toBe(true);
    expect(inbox.getOrders()).toHaveLength(1);
  });

  it('does not imply persistence: a fresh inbox has no prior records', () => {
    const first = createCafeDraftInbox();
    expect(first.submit(request()).accepted).toBe(true);
    const afterRestart = createCafeDraftInbox();
    expect(afterRestart.getOrders()).toHaveLength(0);
  });
});
