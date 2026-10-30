import { describe, expect, it } from 'vitest';
import { act, createGame, getMetrics, tick } from '../game/engine';
import { canWalk, findPath, STATIONS } from '../game/world';
import type { Customer, GameState, Order } from '../game/types';

function game() {
  const s = createGame(12345); s.minute = 390; s.phase = 'open'; s.paused = false; s.settings.arrivalsPerHour = 0; s.events = [];
  return s;
}
function advance(s: GameState, minutes: number) { return tick(s, minutes); }
function addOrder(s: GameState, menuId: string, index = 0) {
  const id = `fixture-${index}`;
  const c: Customer = { id, name: 'ทดสอบ', reason: 'ตั้งใจมาซื้ออาหาร', preference: 'breakfast', budget: 200, patience: 120, groupId: id, takeaway: true, position: [-1, 1], path: [], status: 'waiting', tableId: null, orderIds: [`order-${id}`], arrivedAt: s.minute, seatedAt: s.minute, eatRemaining: 1, satisfaction: 100, isReturn: false };
  const o: Order = { id: `order-${id}`, customerId: id, tableId: null, menuId, status: 'waiting', createdAt: s.minute, cost: 0, price: s.menu.find(m => m.id === menuId)!.price, stockConsumed: false, paid: false };
  s.customers.push(c); s.orders.push(o); s.todayArrivals++;
}
describe('ONE DAY controlled business simulation', () => {
  it('cooks chicken porridge, consumes once, serves physically and records payment once', () => {
    let s = game(); addOrder(s, 'chicken-porridge'); const chicken = s.inventory.find(i => i.id === 'chicken')!.quantity;
    s = advance(s, 30);
    expect(s.orders[0].status).toBe('completed'); expect(s.orders[0].workerId).toBeUndefined();
    expect(s.inventory.find(i => i.id === 'chicken')!.quantity).toBeCloseTo(chicken - .09, 5);
    expect(s.ledger.filter(t => t.type === 'food-sale')).toHaveLength(1);
    expect(s.ledger.filter(t => t.type === 'cogs')).toHaveLength(1);
    expect(s.cash).toBe(10045); expect(getMetrics(s).profit).toBeCloseTo(45 - (35 * .075 + 95 * .09 + 45 * .015));
    s = advance(s, 20); expect(s.cash).toBe(10045);
    expect(s.employees.find(e => e.id === 'na')!.tasksDone).toBeGreaterThan(0);
  });
  it('five single-egg dishes reduce 20 eggs to 15, without duplicate stock deductions', () => {
    let s = game(); s.inventory.find(i => i.id === 'egg')!.quantity = 20;
    for (let i = 0; i < 5; i++) addOrder(s, 'boiled-egg', i);
    const initialValue = getMetrics(s).inventoryValue;
    s = advance(s, 90);
    expect(s.inventory.find(i => i.id === 'egg')!.quantity).toBe(15);
    expect(getMetrics(s).inventoryValue).toBe(initialValue - 20);
    expect(getMetrics(s).cogs).toBe(20); expect(getMetrics(s).revenue).toBe(75);
  });
  it('Na keeps cooking while a physically travelling Ham covers the coffee bar', () => {
    let s = game(); addOrder(s, 'chicken-porridge', 0); addOrder(s, 'latte', 1);
    s = advance(s, .1);
    expect(s.employees.find(e => e.id === 'na')!.task?.kind).toBe('cook');
    expect(s.employees.find(e => e.id === 'ham')!.task?.kind).toBe('brew');
    expect(s.employees.find(e => e.id === 'ham')!.task?.phase).toBe('walking');
    expect(s.employees.filter(e => e.task?.kind === 'brew')).toHaveLength(1);
    s = advance(s, 30); expect(getMetrics(s).completed).toBe(2);
  });
  it('an assigned unavailable barista leaves drinks waiting honestly', () => {
    let s = game(); addOrder(s, 'chicken-porridge', 0); addOrder(s, 'latte', 1);
    s = act(s, { type: 'barista', id: 'na' }); s = advance(s, .2);
    expect(s.employees.find(e => e.id === 'na')!.task?.kind).toBe('cook'); expect(s.orders[1].status).toBe('waiting');
  });
  it('Pun leaves rest area at shift change, Ken travels back and shared wage stays 100%', () => {
    let s = game(); s.minute = 839; s = advance(s, .1);
    expect(s.employees.find(e => e.id === 'pun')!.task?.kind).toBe('rest');
    addOrder(s, 'water'); s = advance(s, 10);
    expect(getMetrics(s).activeServer).toBe('pun');
    expect(s.employees.find(e => e.id === 'ken')!.task?.kind).toBe('rest');
    expect(s.employees.find(e => e.id === 'pun')!.hours).toBeGreaterThan(0);
    s = act(s, { type: 'close' }); s = advance(s, 30);
    const shared = s.ledger.filter(t => t.type === 'wage' && (t.note.startsWith('ค่าจ้าง ken') || t.note.startsWith('ค่าจ้าง pun')));
    expect(shared.map(t => t.amount)).toEqual([200, 200]);
  });
  it('a 20-person rush respects seats and creates individual customers with real queued orders', () => {
    let s = game(); s = act(s, { type: 'rush', size: 20 });
    expect(s.customers).toHaveLength(20); expect(s.tables.reduce((n, t) => n + t.customerIds.length, 0)).toBeLessThanOrEqual(12);
    expect(s.customers.some(c => c.takeaway)).toBe(true); expect(s.customers.every(c => c.reason && c.budget > 0)).toBe(true);
    expect(s.ledger).toHaveLength(0);
    s = advance(s, 20);
    expect(s.orders.length).toBeGreaterThan(5);
    expect(getMetrics(s).pendingDrinks + getMetrics(s).pendingFood).toBeGreaterThan(0);
    const sales = s.ledger.filter(t => t.type === 'food-sale' || t.type === 'drink-sale');
    expect(sales.every(t => s.orders.find(o => o.id === t.orderId)?.status === 'completed')).toBe(true);
  });
  it('rain moistens soil while Alee still follows the requested daily plant round', () => {
    let s = game(); s.garden.moisture = 80; s = act(s, { type: 'weather', weather: 'rain' });
    s = advance(s, 5); expect(s.garden.moisture).toBeGreaterThan(80); expect(s.employees.find(e => e.id === 'alee')!.task?.maintenance).toBe('water');
    expect(s.minute).toBeCloseTo(395);
  });
  it('queues requested garden care while Alee brews and performs it after that drink', () => {
    let s = game(); s.garden.lastInspection = s.minute; addOrder(s, 'water');
    s = act(s, { type: 'barista', id: 'alee' }); s = advance(s, .1);
    expect(s.employees.find(e => e.id === 'alee')!.task?.kind).toBe('brew');
    s = act(s, { type: 'care' });
    expect(s.garden.careRequested).toBe(true); expect(s.employees.find(e => e.id === 'alee')!.task?.kind).toBe('brew');
    s = advance(s, 10);
    expect(s.garden.inspections).toBeGreaterThan(0); expect(s.garden.careRequested).toBe(false);
    expect(s.orders[0].stockConsumed).toBe(true); expect(s.garden.lastInspection).toBeGreaterThan(390);
  });
  it('inventory purchases change cash and asset value but never count as COGS', () => {
    let s = game(); const value = getMetrics(s).inventoryValue;
    s = act(s, { type: 'restock', id: 'egg', quantity: 10 });
    expect(s.cash).toBe(9960); expect(getMetrics(s).inventoryValue).toBe(value + 40); expect(getMetrics(s).cogs).toBe(0);
    expect(getMetrics(s).profit).toBe(0);
  });
  it('safe JSON save/load mid-production does not duplicate consumption or payments', () => {
    let s = game(); addOrder(s, 'chicken-porridge'); s = advance(s, 2);
    expect(s.orders[0].stockConsumed).toBe(true);
    const saved = JSON.parse(JSON.stringify(s)) as GameState;
    const a = advance(s, 30), b = advance(saved, 30);
    expect(b).toEqual(a); expect(b.ledger.filter(t => t.type === 'cogs')).toHaveLength(1); expect(b.ledger.filter(t => t.type === 'food-sale')).toHaveLength(1);
  });
  it('day close reconciles ledger, cash movements and combined server wages', () => {
    let s = game(); addOrder(s, 'chicken-porridge'); s = advance(s, 30);
    s = act(s, { type: 'restock', id: 'egg', quantity: 10 }); s = act(s, { type: 'close' }); s = advance(s, 40);
    expect(s.phase).toBe('closed'); expect(s.reports).toHaveLength(1);
    const r = s.reports[0]; expect(r.wages).toBe(1650); expect(r.revenue).toBe(45);
    expect(r.closingCash).toBeCloseTo(r.openingCash + s.ledger.reduce((n, t) => n + t.cashDelta, 0), 4);
    expect(r.profit).toBeCloseTo(r.revenue - r.cogs - r.wages - r.operating - r.spoilage, 4);
    const before = s.cash; s = advance(s, 60); expect(s.cash).toBe(before); expect(s.reports).toHaveLength(1);
    s = act(s, { type: 'next-day' }); expect(s.day).toBe(2); expect(s.cash).toBe(before); expect(s.openingCash).toBe(before);
  });
  it('same seed and actions reproduce demand, orders and financial outcomes', () => {
    const run = () => { let s = createGame(981); s.paused = false; s = advance(s, 180); s = act(s, { type: 'close' }); return advance(s, 90); };
    const a = run(), b = run(); expect(a).toEqual(b); expect(a.todayArrivals).toBeGreaterThan(0);
  });
  it('runs a full seeded operating day through closing with real payable transactions', () => {
    let s = createGame(2026); s.paused = false; s = tick(s, 1200);
    expect(s.phase).toBe('closed'); expect(s.minute).toBeGreaterThan(1230);
    expect(s.reports).toHaveLength(1); expect(s.reports[0].customers).toBeGreaterThan(30);
    expect(s.customers).toHaveLength(0);
    const sales = s.ledger.filter(t => t.type === 'food-sale' || t.type === 'drink-sale');
    expect(s.reports[0].revenue).toBeCloseTo(sales.reduce((n, t) => n + t.amount, 0), 3);
    expect(s.reports[0].closingCash).toBeCloseTo(10000 + s.ledger.reduce((n, t) => n + t.cashDelta, 0), 3);
    expect(s.inventory.every(i => i.quantity >= 0)).toBe(true);
    expect(new Set(s.ledger.filter(t => t.type === 'cogs').map(t => t.orderId)).size).toBe(s.ledger.filter(t => t.type === 'cogs').length);
  });
  it('continues normal days with persistent cash, expiry and historical reports', () => {
    let s = game(); s.inventory.find(i => i.id === 'shrimp')!.expiresDay = 1;
    const shrimpValue = s.inventory.find(i => i.id === 'shrimp')!.quantity * s.inventory.find(i => i.id === 'shrimp')!.unitCost;
    s = act(s, { type: 'close' }); s = advance(s, 20); const previousCash = s.cash;
    s = act(s, { type: 'next-day' });
    expect(s.day).toBe(2); expect(s.reports).toHaveLength(1); expect(s.cash).toBe(previousCash);
    expect(s.inventory.find(i => i.id === 'shrimp')!.quantity).toBe(0); expect(getMetrics(s).spoilage).toBe(shrimpValue);
    expect(s.ledger.some(t => t.day === 1 && t.type === 'wage')).toBe(true);
  });
  it('remembers actual customers and brings satisfied people back with their own history', () => {
    let s = game(); s.settings.patience = 120;
    s.menu = s.menu.map(m => ({ ...m, enabled: m.id === 'americano' }));
    s = act(s, { type: 'rush', size: 12 }); s = advance(s, 120);
    const visited = (s.guests ?? []).filter(g => g.visits > 0);
    expect(visited.length).toBeGreaterThan(0); expect(visited.some(g => g.affinity >= 55)).toBe(true);
    s = act(s, { type: 'close' }); s = advance(s, 30); s = act(s, { type: 'next-day' });
    s.minute = 390; s.phase = 'open';
    s = act(s, { type: 'rush', size: 25 });
    const returning = s.customers.filter(c => c.isReturn);
    expect(returning.length).toBeGreaterThan(0);
    expect(returning.every(c => visited.some(g => g.id === c.guestId && g.name === c.name))).toBe(true);
    expect(returning.every(c => c.reason.includes('เคยมา'))).toBe(true);
    const restored = JSON.parse(JSON.stringify(s)) as GameState;
    expect(restored.guests).toEqual(s.guests);
  });
  it('referrals name a real satisfied visitor and increase that person’s referral count', () => {
    let s = game(); s.settings.patience = 120;
    s.menu = s.menu.map(m => ({ ...m, enabled: m.id === 'americano' }));
    s = act(s, { type: 'rush', size: 1 }); s = advance(s, 100);
    s = act(s, { type: 'rush', size: 25 });
    const referred = s.customers.filter(c => c.referrer);
    expect(referred.length).toBeGreaterThan(0);
    for (const c of referred) {
      const recommender = s.guests!.find(g => g.id === c.referrer)!;
      expect(recommender.visits).toBeGreaterThan(0); expect(recommender.affinity).toBeGreaterThan(74);
      expect(recommender.referrals).toBeGreaterThan(0); expect(c.reason.includes(`${recommender.name} แนะนำ`)).toBe(true);
    }
  });
  it('loads older v1 saves without guest memory safely and initializes it on the next action', () => {
    const s = game(); delete s.guests;
    const updated = act(s, { type: 'rush', size: 1 });
    expect(updated.guests).toHaveLength(1); expect(updated.customers[0].isReturn).toBe(false);
  });
  it('all route waypoints avoid equipment and table obstacles', () => {
    for (const target of [STATIONS.bar, STATIONS.kitchen, STATIONS.pickup, [1, 9.3], [-.95, 9.45]] as [number, number][]) {
      const path = findPath(STATIONS.entrance, target); expect(path.length).toBeGreaterThan(0); expect(path.every(p => canWalk(...p))).toBe(true);
    }
  });
});
