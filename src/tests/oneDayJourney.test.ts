import { describe, expect, it } from 'vitest';
import { act, createGame, tick } from '../game/engine';
import { validateSave } from '../game/persistence';

describe('table 3 one-day service journey', () => {
  it('routes QR to Na and Ken, survives save/load, and reconciles stock, payment and closing once', () => {
    let s = createGame(20261104);
    s.phase = 'open'; s.minute = 420; s.paused = false;
    s.settings.arrivalsPerHour = 0; s.events = [];
    s = act(s, { type: 'visitor-seat', tableId: 't3' });
    const request = { type: 'visitor-submit' as const, channel: 'table-qr' as const, requestId: 't3-breakfast', menuId: 'chicken-porridge' };
    const originalStock = structuredClone(s.inventory);
    const initialCash = s.cash;
    s = act(s, request); s = act(s, request);
    expect(s.orders).toHaveLength(1);
    const id = s.orders[0].id;
    expect(s.orders[0]).toMatchObject({ tableId: 't3', status: 'waiting', paid: false });
    let preparedByNa = false, servedByKen = false, resumed = false;
    for (let i = 0; i < 600 && s.orders[0].status !== 'completed'; i++) {
      s = tick(s, .1);
      preparedByNa ||= s.employees.some(e => e.id === 'na' && e.task?.orderId === id && e.task.kind === 'cook');
      servedByKen ||= s.employees.some(e => e.id === 'ken' && e.task?.orderId === id && e.task.kind === 'serve');
      if (s.orders[0].stockConsumed && !resumed) {
        s = validateSave(JSON.parse(JSON.stringify(s))); s.paused = false;
        s = act(s, request); resumed = true;
      }
    }
    expect(preparedByNa).toBe(true); expect(servedByKen).toBe(true); expect(resumed).toBe(true);
    expect(s.orders).toHaveLength(1); expect(s.orders[0].status).toBe('completed');
    expect(s.cash).toBe(initialCash);
    for (const [ingredient, quantity] of Object.entries(s.menu.find(m => m.id === request.menuId)!.recipe)) {
      expect(s.inventory.find(i => i.id === ingredient)!.quantity).toBeCloseTo(originalStock.find(i => i.id === ingredient)!.quantity - quantity, 8);
    }
    expect(s.ledger.filter(t => t.orderId === id && t.type === 'cogs')).toHaveLength(1);
    s = act(s, { type: 'visitor-pay' }); s = act(s, { type: 'visitor-pay' });
    expect(s.cash).toBe(initialCash + 45);
    expect(s.ledger.filter(t => t.orderId === id && t.type === 'food-sale')).toHaveLength(1);
    s = act(s, { type: 'close' }); s = tick(s, 90);
    expect(s.phase).toBe('closed'); expect(s.reports).toHaveLength(1);
    expect(s.tables.find(t => t.id === 't3')!.customerIds).toHaveLength(0);
    expect(s.reports[0].revenue).toBe(45);
    expect(s.reports[0].closingCash).toBeCloseTo(initialCash + s.ledger.reduce((sum, t) => sum + t.cashDelta, 0), 8);
    const cash = s.cash;
    s = act(s, { type: 'close' }); s = tick(s, 90);
    expect(s.cash).toBe(cash); expect(s.reports).toHaveLength(1);
  });
});
