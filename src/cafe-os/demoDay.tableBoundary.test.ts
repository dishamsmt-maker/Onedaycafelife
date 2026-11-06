import { describe, expect, it } from 'vitest';
import { applyDemoAction, startDemoDay } from './demoDay';
import { createDemoStock, DEMO_HALAL_MENU, DEMO_TABLE_IDS } from './demoCatalog';

describe('five-table demo order boundary', () => {
  it('accepts each configured table while rejecting unknown table IDs without events', () => {
    const initial = startDemoDay(createDemoStock(20));
    for (const tableId of DEMO_TABLE_IDS) {
      const accepted = applyDemoAction(initial, DEMO_HALAL_MENU, {
        actor: 'customer', type: 'order', requestId: 'valid-' + tableId,
        tableId, itemId: 'congee-chicken', quantity: 1,
      });
      expect(accepted.events).toHaveLength(1);
      expect(accepted.store.orders[0].tableId).toBe(tableId);
    }
    for (const tableId of ['t6', 'T03', '', 'kitchen', 'staff']) {
      const rejected = applyDemoAction(initial, DEMO_HALAL_MENU, {
        actor: 'customer', type: 'order', requestId: 'invalid-' + tableId,
        tableId, itemId: 'congee-chicken', quantity: 1,
      });
      expect(rejected).toBe(initial);
      expect(rejected.events).toHaveLength(0);
      expect(rejected.store.orders).toHaveLength(0);
    }
  });
});
