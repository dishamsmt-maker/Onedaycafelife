import type { DemoDay, DemoEvent } from './demoDay';

/**
 * Audits a simulation day without modifying canonical state.
 * Event sequence is logical order, NOT elapsed time; no throughput claims.
 * Useful for diagnosing missing handoffs before connecting 3D actors.
 */
export function auditDemoDay(day: DemoDay) {
  const events = day.events;
  const issues: string[] = [];
  const seen = new Map<string, DemoEvent['action']>();
  const transitions: Record<DemoEvent['action'], readonly (DemoEvent['action'] | undefined)[]> = {
    ordered: [undefined],
    preparing: ['ordered'],
    ready: ['preparing'],
    served: ['ready'],
    paid: ['served'],
    cancelled: ['ordered', 'preparing', 'ready', 'served'],
    closed: [],
  };
  let closeCount = 0;
  for (const [index, event] of events.entries()) {
    if (event.sequence !== index + 1) issues.push(`invalid event sequence at ${index + 1}`);
    if (event.action === 'closed') {
      closeCount++;
      if (index !== events.length - 1) issues.push('events after close');
      if (event.actor !== 'manager' || event.orderId !== '') issues.push('invalid close actor');
      continue;
    }
    if (!event.orderId) { issues.push('missing order ID'); continue; }
    const previous = seen.get(event.orderId);
    if (!transitions[event.action].includes(previous)) {
      issues.push(`invalid ${event.action} transition for ${event.orderId}`);
    }
    const expectedActor = event.action === 'ordered' ? 'customer'
      : event.action === 'preparing' || event.action === 'ready' ? 'Na'
      : event.action === 'served' ? 'Ken' : 'manager';
    if (event.actor !== expectedActor) issues.push(`invalid actor for ${event.action}`);
    seen.set(event.orderId, event.action);
  }
  if (day.closed !== (closeCount === 1)) issues.push('closed flag disagrees with event log');
  if (closeCount > 1) issues.push('duplicate close');
  const statuses = new Map<string, string>();
  for (const order of day.store.orders) {
    if (statuses.has(order.id)) issues.push(`duplicate store order ${order.id}`);
    statuses.set(order.id, order.status);
    if (!seen.has(order.id)) issues.push(`order missing event history ${order.id}`);
  }
  for (const [id, last] of seen) {
    const status = statuses.get(id);
    if (!status) issues.push(`event references missing order ${id}`);
    else if (last !== status && !(last === 'paid' && status === 'paid')) {
      issues.push(`order status mismatch for ${id}`);
    }
  }
  return { valid: issues.length === 0, issues, eventCount: events.length,
    ordersObserved: seen.size, closed: day.closed };
}
