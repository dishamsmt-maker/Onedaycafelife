import type { Customer, Employee, GameAction, GameState, Guest, MenuItem, Order, StaffId, Task, Transaction, Vec2, Weather } from './types';
import { DEFAULT_SETTINGS, INITIAL_EMPLOYEES, INITIAL_INVENTORY, INITIAL_MENU, menuAvailable, servicePeriod } from './data';
import { canWalk, findPath, STATIONS, TABLE_LAYOUT } from './world';

export { menuAvailable, servicePeriod } from './data';
export const OPEN = 390, CLOSE = 1230;
const REST: Vec2 = [1.0, 9.3];
const INSPECT: Vec2 = [-.1, 9.35];
const round = (n: number) => Math.round(n * 10000) / 10000;
const clamp = (n: number, a: number, b: number) => Math.min(b, Math.max(a, n));
const uid = (s: GameState, prefix: string) => `${prefix}-${s.day}-${s.nextId++}`;
function random(s: GameState) { s.seed = (Math.imul(s.seed, 1664525) + 1013904223) >>> 0; return s.seed / 4294967296; }
function pick<T>(s: GameState, items: T[]): T { return items[Math.min(items.length - 1, Math.floor(random(s) * items.length))]; }
function draft(s: GameState): GameState {
  return { ...s, guests: (s.guests ?? []).map(g => ({ ...g })), employees: s.employees.map(e => ({ ...e, position: [...e.position], task: e.task ? { ...e.task, target: [...e.task.target], path: e.task.path.map(p => [...p]) } : null })),
    customers: s.customers.map(c => ({ ...c, position: [...c.position], path: c.path.map(p => [...p]), orderIds: [...c.orderIds] })),
    orders: s.orders.map(o => ({ ...o })), tables: s.tables.map(t => ({ ...t, customerIds: [...t.customerIds] })),
    inventory: s.inventory.map(i => ({ ...i })), ledger: [...s.ledger], reviews: [...s.reviews], reports: [...s.reports],
    events: s.events.map(e => ({ ...e })), garden: { ...s.garden }, notices: [...s.notices], shortages: [...s.shortages],
    todayWaits: [...s.todayWaits], todaySatisfaction: [...s.todaySatisfaction], settings: { ...s.settings }, menu: s.menu.map(m => ({ ...m, recipe: { ...m.recipe } })) };
}
function notice(s: GameState, text: string) { s.notices.unshift({ id: uid(s, 'notice'), text, minute: s.minute }); s.notices = s.notices.slice(0, 25); }
function transaction(s: GameState, type: Transaction['type'], amount: number, cashDelta: number, note: string, orderId?: string) {
  if (orderId && s.ledger.some(t => t.orderId === orderId && t.type === type)) return;
  s.ledger.push({ id: uid(s, 'tx'), day: s.day, minute: round(s.minute), type, amount: round(amount), cashDelta: round(cashDelta), note, orderId });
  s.cash = round(s.cash + cashDelta);
}
export function activeServer(s: GameState): 'ken' | 'pun' { return s.serverOverride === 'auto' ? (s.minute < 840 ? 'ken' : 'pun') : s.serverOverride; }
function scheduleEvents(s: GameState) {
  const size = 8 + Math.floor(random(s) * 9);
  const minute = (s.day % 2 ? 8 * 60 : 17 * 60) + Math.floor(random(s) * 50);
  s.events = [{ id: uid(s, 'rush'), day: s.day, minute, label: s.day % 3 === 0 ? 'กรุ๊ปนักเดินทางแวะพัก' : pick(s, ['ลูกค้า ตรอ. และคนซื้อกลับมาพร้อมกัน', 'ชุมชนนัดกินข้าวที่ ONE DAY', 'เพื่อนชวนกันมาแวะร้าน']), size, announced: random(s) < .7, triggered: false }];
  if (s.day % 3 === 0) s.events[0].size = 12 + Math.floor(random(s) * 14);
}
export function createGame(seed = DEFAULT_SETTINGS.seed): GameState {
  const s: GameState = { version: 1, catalogVersion:2, day: 1, minute: 385, phase: 'preparing', paused: true, speed: 1, seed: seed >>> 0, nextId: 1,
    cash: DEFAULT_SETTINGS.openingCash, reputation: 3.8, hearts: 0, cleanliness: 100, weather: 'sunny', weatherRemaining: 240,
    employees: structuredClone(INITIAL_EMPLOYEES), customers: [], orders: [], tables: TABLE_LAYOUT.map(t => ({ ...t, position: [...t.position], customerIds: [], dirty: false })),
    inventory: structuredClone(INITIAL_INVENTORY), menu: structuredClone(INITIAL_MENU), ledger: [], reviews: [], reports: [], events: [], guests: [],
    garden: { moisture: 65, cleanliness: 95, lastInspection: -1, inspections: 0 }, baristaMode: 'auto', serverOverride: 'auto', notices: [],
    todayArrivals: 0, todayWaits: [], todaySatisfaction: [], openingCash: DEFAULT_SETTINGS.openingCash, settings: { ...DEFAULT_SETTINGS, seed }, shortages: [] };
  scheduleEvents(s);
  notice(s, 'ยินดีต้อนรับสู่ ONE DAY · กดเริ่มเพื่อเตรียมเปิดร้าน 06:30');
  return s;
}

function setTask(e: Employee, kind: Task['kind'], target: Vec2, remaining: number, extra: Partial<Task> = {}) {
  e.task = { kind, target: [...target], remaining, phase: 'walking', path: findPath(e.position, target), ...extra };
  e.available = false;
}
function walk(position: Vec2, path: Vec2[], distance: number) {
  while (path.length && distance > 0) {
    const p = path[0], dx = p[0] - position[0], dz = p[1] - position[1], d = Math.hypot(dx, dz);
    if (d <= distance + 1e-8) { position[0] = p[0]; position[1] = p[1]; path.shift(); distance -= d; }
    else { position[0] += dx / d * distance; position[1] += dz / d * distance; distance = 0; }
  }
}
function seatPosition(s: GameState, c: Customer): Vec2 {
  const t = s.tables.find(t => t.id === c.tableId);
  if (!t && c.player) return [-.35,1.4];
  if (!t) { const n = s.customers.filter(o => o.takeaway && o.id < c.id && o.status !== 'leaving').length % 8; return [-1.8 + (n % 3) * .55, -.65 + Math.floor(n / 3) * .25]; }
  const idx = Math.max(0, t.customerIds.indexOf(c.id));
  return [t.position[0] + (idx % 2 === 0 ? -.9 : .9), t.position[1] + (idx < 2 ? -.25 : .25)];
}
function seatCustomer(s: GameState, c: Customer): boolean {
  const table = s.tables.find(t => !t.dirty && t.customerIds.length < t.capacity);
  if (!table) return false;
  table.customerIds.push(c.id); c.tableId = table.id; c.status = 'arriving'; c.path = findPath(c.position, seatPosition(s, c)); return true;
}
const NAMES = ['เมย์', 'ต้น', 'อิง', 'บีม', 'ฟ้า', 'นนท์', 'อ้อม', 'ปาล์ม', 'นิด', 'โอม', 'Alex', 'Siti', 'มิน', 'อาร์ต', 'หลิน', 'พีท'];
/** Persistent people remember visits; age/nationality never constrain their needs. */
function arrivingGuest(s: GameState): { guest: Guest; referrer?: Guest; returning: boolean } {
  const guests = s.guests ?? (s.guests = []);
  const currentGuests = new Set(s.customers.filter(c => c.status !== 'leaving').flatMap(c => [c.guestId, c.referrer]));
  const returning = guests.filter(g => g.visits > 0 && g.affinity >= 55 && g.lastVisit < s.day && !currentGuests.has(g.id));
  if (returning.length && random(s) < Math.min(.6, .12 + s.hearts * .003)) {
    // A stronger memory of good service increases this person's return chance.
    let weight = random(s) * returning.reduce((n, g) => n + g.affinity * g.affinity, 0);
    const guest = returning.find(g => { weight -= g.affinity * g.affinity; return weight <= 0; }) ?? returning[returning.length - 1];
    return { guest, returning: true };
  }
  const recommenders = guests.filter(g => g.visits > 0 && g.affinity >= 75);
  const referrer = recommenders.length && random(s) < .24 ? pick(s, recommenders) : undefined;
  if (referrer) referrer.referrals++;
  const guest: Guest = { id: uid(s, 'guest'), name: pick(s, NAMES), visits: 0, affinity: 50, lastVisit: -1, preferred: pick(s, ['coffee', 'tea', 'breakfast', 'snack']), referrals: 0 };
  // Retain frequent/attached people; cap storage without evicting active customers.
  if (guests.length >= 500) {
    const removable = guests.filter(g => !currentGuests.has(g.id) && g.id !== referrer?.id).sort((a, b) => (a.visits * a.affinity) - (b.visits * b.affinity));
    if (removable.length) guests.splice(guests.findIndex(g => g.id === removable[0].id), 1);
  }
  if (guests.length < 500) guests.push(guest);
  return { guest, referrer, returning: false };
}
function arrive(s: GameState, count: number, eventId?: string) {
  if (s.phase !== 'open') return;
  const group = uid(s, 'group');
  const remaining = Math.max(0, 36 - s.customers.filter(c => c.status !== 'leaving').length);
  for (let i = 0; i < Math.min(count, remaining); i++) {
    const takeaway = random(s) < (s.minute < 630 ? .48 : .35);
    const reason = eventId ? pick(s, ['แวะพร้อมเพื่อนที่นัดกันไว้', 'ขับผ่านมาเห็นคนแวะ เลยลองเข้าร้าน', 'รอคิวตรวจรถ ตรอ. จึงแวะร้าน', 'มาซื้อเครื่องดื่มช่วงเดียวกับลูกค้าหลายคน'])
      : s.minute < 630 ? pick(s, ['อยากกินอาหารเช้าก่อนไปทำงาน', 'รอตรวจรถ ตรอ. ข้างร้าน', 'ขับรถผ่าน เห็นป้าย ONE DAY', 'คนในชุมชนออกมาซื้ออาหารให้ที่บ้าน', 'แวะซื้อเครื่องดื่มก่อนเริ่มงาน'])
      : s.minute >= 1020 ? pick(s, ['นัดเพื่อนมานั่งคุยตอนเย็น', 'อยากดื่มชากับของกินเล่น', 'แวะซื้อเครื่องดื่มกลับบ้าน', 'พักจากการเดินทางช่วงค่ำ'])
      : pick(s, ['พักเที่ยงจากที่ทำงานใกล้ร้าน', 'ขับรถผ่านแล้วอยากพักดื่มกาแฟ', 'คนในชุมชนแวะซื้อกลับบ้าน', 'เพื่อนแนะนำให้มาลองร้านนี้']);
    const { guest, referrer, returning: isReturn } = arrivingGuest(s);
    const visitReason = isReturn ? `เคยมา ${guest.visits} ครั้งแล้วประทับใจ วันนี้กลับมาอีก · ${reason}` : referrer ? `${referrer.name} แนะนำร้านนี้มา วันนี้เลยแวะลอง · ${reason}` : reason;
    const c: Customer = { id: uid(s, 'customer'), name: guest.name, guestId: guest.id, referrer: referrer?.id, reason: visitReason,
      preference: random(s) < .75 ? guest.preferred : pick(s, ['coffee', 'tea', 'breakfast', 'snack']), budget: 65 + Math.floor(random(s) * 100), patience: s.settings.patience * (.7 + random(s) * .7),
      groupId: group, takeaway, position: [-.5 + (i % 3) * .18, -.75], path: [], status: 'arriving', tableId: null, orderIds: [], arrivedAt: s.minute, seatedAt: 0,
      eatRemaining: 8 + random(s) * (s.minute >= 1020 ? 25 : 15), satisfaction: 100, isReturn, sweetness:pick(s,[0,25,50,75,100]),tourId: eventId };
    if (takeaway) c.path = findPath(c.position, seatPosition(s, c));
    else if (!seatCustomer(s, c)) { c.status = 'queuing'; c.path = findPath(c.position, [-1.7 + (i % 3) * .6, .2 + (Math.floor(i / 3) % 3) * .4]); }
    s.customers.push(c); s.todayArrivals++;
  }
}
function chooseMenu(s: GameState, c: Customer): MenuItem[] {
  const available = s.menu.filter(m => menuAvailable(m,s.minute) && stockAvailable(s,m));
  const foods = available.filter(m => m.kind === 'food' && m.price <= c.budget);
  const drinks = available.filter(m => m.kind === 'drink' && m.price <= c.budget);
  const preferred = drinks.filter(m => c.preference === 'coffee' ? ['espresso', 'americano', 'latte', 'cappuccino'].includes(m.id) : c.preference === 'tea' ? ['thai-tea', 'green-tea'].includes(m.id) : true);
  const selected: MenuItem[] = [];
  if (foods.length && (!c.takeaway || c.preference === 'breakfast') && random(s) < (s.minute < 630 ? .85 : .6)) selected.push(pick(s, foods));
  if (drinks.length && (!selected.length || (!selected.some(m=>m.components?.some(p=>s.menu.find(x=>x.id===p.menuId)?.kind==='drink')) && random(s) < .75))) {
    const affordable = (preferred.length ? preferred : drinks).filter(m => m.price + selected.reduce((sum, x) => sum + x.price, 0) <= c.budget);
    if (affordable.length) selected.push(pick(s, affordable));
  }
  if (!selected.length && foods.length) selected.push(pick(s, foods));
  return selected;
}
/** Accept one sale item. Bundles are a priced root plus real zero-price production jobs. */
export function placeCustomerOrder(s:GameState,c:Customer,menuId:string,sweetness=c.sweetness??100):Order|null {
 const m=s.menu.find(m=>m.id===menuId);if(!m||!menuAvailable(m,s.minute)||s.phase!=='open')return null;
 const add=(item:MenuItem,parentOrderId?:string):Order=>{const o:Order={id:uid(s,'order'),customerId:c.id,tableId:c.tableId,menuId:item.id,status:'waiting',createdAt:s.minute,cost:0,price:parentOrderId?0:item.price,stockConsumed:false,paid:false,parentOrderId,sweetness};s.orders.push(o);c.orderIds.push(o.id);return o;};
 const root=add(m);
 if(m.components?.length){root.componentOrderIds=[];for(const component of m.components){const childMenu=s.menu.find(x=>x.id===component.menuId);if(!childMenu)continue;for(let n=0;n<component.quantity;n++){const child=add(childMenu,root.id);root.componentOrderIds.push(child.id);}}}
 return root;
}
function placeOrders(s:GameState,c:Customer){
 if(c.player||c.orderIds.length||c.status==='leaving')return;
 for(const m of chooseMenu(s,c))placeCustomerOrder(s,c,m.id);
 c.status='waiting';if(!c.orderIds.length){c.satisfaction=30;leave(s,c,false);}
}
export function menuRecipe(s:GameState,m:MenuItem):Record<string,number>{
 if(!m.components?.length)return {...m.recipe};const recipe:Record<string,number>={};
 for(const part of m.components){const item=s.menu.find(x=>x.id===part.menuId);if(item)for(const [id,q] of Object.entries(menuRecipe(s,item)))recipe[id]=(recipe[id]??0)+q*part.quantity;}return recipe;
}
function recipeFor(s:GameState,m:MenuItem,sweetness=100){const recipe=menuRecipe(s,m);if(m.kind==='drink'&&recipe.sugar)recipe.sugar*=clamp(sweetness,0,100)/100;return recipe;}
function stockAvailable(s:GameState,m:MenuItem,sweetness=100){return Object.entries(recipeFor(s,m,sweetness)).every(([id,q])=>(s.inventory.find(i=>i.id===id)?.quantity??0)+1e-9>=q);}
function progressBundles(s:GameState){for(const root of s.orders.filter(o=>o.componentOrderIds?.length)){
 const children=root.componentOrderIds!.map(id=>s.orders.find(o=>o.id===id)).filter((o):o is Order=>!!o);
 root.cost=round(children.reduce((n,o)=>n+o.cost,0));root.stockConsumed=children.some(o=>o.stockConsumed);
 if(children.every(o=>o.status==='completed')){root.status='completed';root.completedAt=Math.max(...children.map(o=>o.completedAt??s.minute));}
 else if(children.some(o=>o.status==='cancelled'))root.status='cancelled';
 else if(children.some(o=>o.status!=='waiting'))root.status='preparing';
 }}
function consume(s: GameState, o: Order, m: MenuItem) {
  if (o.stockConsumed) return true;
  if (!stockAvailable(s, m, o.sweetness)) {
    for (const [id, q] of Object.entries(recipeFor(s,m,o.sweetness))) { const i = s.inventory.find(i => i.id === id); if (!i || i.quantity + 1e-9 < q) { const label = i?.name ?? id; if (!s.shortages.includes(label)) { s.shortages.push(label); notice(s, `${label}ไม่พอ · เติมสต็อกหรือพักขายเมนู`); } } }
    return false;
  }
  let cost = 0;
  for (const [id, q] of Object.entries(recipeFor(s,m,o.sweetness))) { const i = s.inventory.find(i => i.id === id)!; i.quantity = Math.max(0, round(i.quantity - q)); cost += q * i.unitCost; }
  o.cost = round(cost); o.stockConsumed = true;
  transaction(s, 'cogs', cost, 0, `ใช้วัตถุดิบ · ${m.name}`, o.id);
  return true;
}
function customerTarget(s: GameState, c: Customer): Vec2 { const table=s.tables.find(t=>t.id===c.tableId);return table?[table.position[0],table.position[1]-.9]:seatPosition(s,c); }
function finishTask(s: GameState, e: Employee) {
  const t = e.task!;
  if (t.kind === 'cook' || t.kind === 'brew') {
    const o = s.orders.find(o => o.id === t.orderId);
    if (o && o.status !== 'cancelled') { o.status = 'ready'; o.readyAt = s.minute; o.workerId = undefined; }
  } else if (t.kind === 'serve') {
    const c = s.customers.find(c => c.id === t.customerId);
    if (t.stage === 'take-order' && c) placeOrders(s, c);
    else {
      const o = s.orders.find(o => o.id === t.orderId);
      if (o && o.status !== 'cancelled' && c?.status !== 'leaving') {
        o.status = 'completed'; o.completedAt = s.minute; o.workerId = undefined;
        s.todayWaits.push(s.minute - o.createdAt);
      }
    }
  } else if (t.kind === 'clean') {
    const table = s.tables.find(table => table.id === t.tableId); if (table) table.dirty = false;
    s.cleanliness = Math.min(100, s.cleanliness + 4);
  } else if (t.kind === 'inspect') {
    s.garden.cleanliness = 100; s.garden.lastInspection = s.minute; s.garden.inspections++;
    s.garden.careRequested = false;
  } else if (t.kind === 'garden') {
    if (s.garden.moisture < 45 && !s.weather.includes('rain')) s.garden.moisture = 80;
    s.cleanliness = Math.min(100, s.cleanliness + 2);
  } else if (t.kind === 'manage') {
    // Ham's front-of-house round surfaces actual purchasing needs.
    const low = s.inventory.filter(i => i.quantity <= i.reorder);
    if (low.length) {
      const text = `แฮมตรวจสต็อก · ใกล้หมด: ${low.map(i => i.name).join(', ')}`;
      if (!s.notices.some(n => n.text === text)) notice(s, text);
    }
  }
  if (t.kind !== 'rest') e.tasksDone++;
  e.task = null; e.available = true;
}
function progressEmployees(s: GameState, dt: number) {
  const server = activeServer(s);
  for (const e of s.employees) {
    if(e.controlled){e.available=false;continue;}
    const onDuty = !['ken', 'pun'].includes(e.id) || e.id === server || (e.task && e.task.kind !== 'rest');
    if (onDuty && s.phase !== 'closed') e.hours += dt / 60;
    const t = e.task; if (!t) { e.available = !!onDuty; continue; }
    if (t.phase === 'walking') {
      walk(e.position, t.path, dt * 4.5);
      if (t.path.length) continue;
      const o = s.orders.find(o => o.id === t.orderId);
      if ((t.kind === 'cook' || t.kind === 'brew') && o) {
        const menu = s.menu.find(m => m.id === o.menuId)!;
        if (o.status === 'cancelled' || !consume(s, o, menu)) { if (o.status !== 'cancelled') { o.status = 'waiting'; o.workerId = undefined; } e.task = null; continue; }
        o.status = 'preparing';
      }
      if (t.kind === 'serve' && t.stage === 'pickup') {
        const c = s.customers.find(c => c.id === t.customerId);
        if (!o || o.status === 'cancelled' || !c || c.status === 'leaving') { e.task = null; continue; }
        o.status = 'serving'; t.stage = 'deliver'; t.target = customerTarget(s, c); t.path = findPath(e.position, t.target); continue;
      }
      t.phase = 'working';
    }
    if(t.kind==='station'){e.available=true;continue;}
    if (t.kind === 'rest') { e.available = false; continue; }
    t.remaining -= dt;
    if(t.remaining<=0&&t.productionStep==='collect'){
      const o=s.orders.find(o=>o.id===t.orderId),m=s.menu.find(m=>m.id===o?.menuId);
      if(!o||!m||o.status==='cancelled'){e.task=null;continue;}
      t.productionStep='prepare';t.target=[...(t.kind==='brew'?STATIONS.bar:STATIONS.kitchen)];t.path=findPath(e.position,t.target);t.phase='walking';t.remaining=m.duration*s.settings.prepMultiplier;
    }else if (t.remaining <= 0) finishTask(s, e);
  }
}
function scheduleStaff(s: GameState) {
  const server = activeServer(s);
  const serving = s.employees.find(e => e.id === server)!;
  const off = s.employees.find(e => (e.id === 'ken' || e.id === 'pun') && e.id !== server)!;
  if (!off.controlled && (!off.task||off.task.kind==='station')) setTask(off, 'rest', REST, 999999);
  if (!serving.controlled && serving.task?.kind === 'rest') { serving.task = null; serving.available = true; }
  if (!serving.controlled && (!serving.task||serving.task.kind==='station')) {
    const ready = s.orders.find(o => !o.componentOrderIds?.length && o.status === 'ready' && !o.workerId);
    const waiting = s.customers.find(c => !c.player && c.status === 'seated' && !c.orderIds.length && !s.employees.some(e => e.task?.customerId === c.id));
    const dirty = s.tables.find(t => t.dirty && !t.customerIds.length);
    if (ready) { ready.workerId = server; setTask(serving, 'serve', STATIONS.pickup, .35, { orderId: ready.id, customerId: ready.customerId, tableId: ready.tableId ?? undefined, stage: 'pickup' }); }
    else if (waiting) setTask(serving, 'serve', customerTarget(s, waiting), .65, { customerId: waiting.id, tableId: waiting.tableId ?? undefined, stage: 'take-order' });
    else if (dirty) setTask(serving, 'clean', [dirty.position[0] + .9, dirty.position[1]], 1.5, { tableId: dirty.id });
    else if(!serving.task)setTask(serving,'station',[-.4,3.5],999999);
  }
  const food = s.orders.find(o => !o.componentOrderIds?.length && o.status === 'waiting' && !(s.customers.find(c=>c.id===o.customerId)?.orderChannel==='counter'&&!o.paid) && s.menu.find(m => m.id === o.menuId)?.kind === 'food' && stockAvailable(s, s.menu.find(m => m.id === o.menuId)!));
  const na = s.employees.find(e => e.id === 'na')!;
  if (food && !na.controlled && (!na.task||na.task.kind==='station')) {
    const m = s.menu.find(m => m.id === food.menuId)!; food.workerId = 'na'; food.status = 'walking';
    setTask(na, 'cook', food.stockConsumed?STATIONS.kitchen:STATIONS.fridge, food.stockConsumed?m.duration*s.settings.prepMultiplier:.6, { orderId: food.id, productionStep:food.stockConsumed?'prepare':'collect' });
  }
  const drinks = s.orders.filter(o => !o.componentOrderIds?.length && o.status === 'waiting' && !(s.customers.find(c=>c.id===o.customerId)?.orderChannel==='counter'&&!o.paid) && s.menu.find(m => m.id === o.menuId)?.kind === 'drink');
  const stationBusy = s.employees.some(e => e.task?.kind === 'brew');
  if (drinks.length && !stationBusy) {
    const order = drinks.find(o => stockAvailable(s, s.menu.find(m => m.id === o.menuId)!));
    const candidates = s.employees.filter(e => !e.controlled && ['ham', 'na', 'alee'].includes(e.id) && (!e.task || ['manage', 'garden','station'].includes(e.task.kind)) && (s.baristaMode === 'auto' || e.id === s.baristaMode) && !(e.id === 'na' && food) && !(e.id === 'alee' && s.garden.careRequested));
    candidates.sort((a, b) => {
      const score = (e: Employee) => (e.id === 'ham' ? 0 : e.id === 'alee' ? 2 : 5) + Math.hypot(e.position[0] - STATIONS.bar[0], e.position[1] - STATIONS.bar[1]) * .1;
      return score(a) - score(b);
    });
    if (order && candidates.length) { const e = candidates[0], m = s.menu.find(m => m.id === order.menuId)!; order.status = 'walking'; order.workerId = e.id; setTask(e, 'brew', order.stockConsumed?STATIONS.bar:STATIONS.fridge, order.stockConsumed?m.duration*s.settings.prepMultiplier:.6, { orderId: order.id, productionStep:order.stockConsumed?'prepare':'collect' }); }
  }
  // Report unavailable ingredients even when nobody can start that item.
  for (const o of s.orders.filter(o => !o.componentOrderIds?.length && o.status === 'waiting')) {
    const m = s.menu.find(m => m.id === o.menuId)!;
    if (!stockAvailable(s, m)) for (const [id, q] of Object.entries(recipeFor(s,m,o.sweetness))) { const i = s.inventory.find(i => i.id === id); if (i && i.quantity < q && !s.shortages.includes(i.name)) { s.shortages.push(i.name); notice(s, `${i.name}ไม่พอ · ออร์เดอร์กำลังรอวัตถุดิบ`); } }
  }
  const alee = s.employees.find(e => e.id === 'alee')!;
  if (!alee.controlled && (!alee.task || (alee.task.kind==='station'&&s.garden.careRequested))) {
    if (s.garden.careRequested || s.garden.lastInspection < 0 || s.minute - s.garden.lastInspection > 180 || (s.phase === 'closing' && s.minute - s.garden.lastInspection > 10)) setTask(alee, 'inspect', INSPECT, 2);
    else if (s.garden.moisture < 45 && !s.weather.includes('rain')) setTask(alee, 'garden', STATIONS.garden, 3);
    else if (s.cleanliness < 90) setTask(alee, 'garden', [-.8, 1.2], 2);
  }
  const ham = s.employees.find(e => e.id === 'ham')!;
  // A barista remains behind the counter even when the drinks queue is empty.
  const assigned=s.baristaMode==='auto'?'ham':s.baristaMode;
  for(const e of s.employees.filter(e=>!e.controlled&&['ham','na','alee'].includes(e.id))){
   if(e.task&&e.task.kind!=='station')continue;
   const target=e.id===assigned?STATIONS.bar:e.id==='na'?STATIONS.kitchen:e.id==='ham'?STATIONS.manager:null;
   if(target&&(!e.task||Math.hypot(e.task.target[0]-target[0],e.task.target[1]-target[1])>.05))setTask(e,'station',target,999999);
  }
}
function review(s: GameState, c: Customer, wait: number, cancelled: boolean) {
  const stars = clamp(Math.round(c.satisfaction / 20), 1, 5);
  s.reputation = clamp(s.reputation * .98 + stars * .02, 1, 5);
  if (stars >= 4) s.hearts += c.isReturn ? 2 : 1;
  else if (stars <= 2) s.hearts = Math.max(0, s.hearts - 1);
  const guest = s.guests?.find(g => g.id === c.guestId);
  if (guest) {
    guest.visits++;
    guest.affinity = clamp(guest.affinity * .5 + c.satisfaction * .5, 0, 100);
    guest.lastVisit = s.day;
    // Preferences can evolve; the same person may buy takeaway or sit tomorrow.
    if (!cancelled) guest.preferred = c.preference;
  }
  if (random(s) < .4 || cancelled) {
    const text = cancelled ? 'รอนานจนต้องไปก่อน คราวหน้าหวังว่าจะได้ลอง' : stars >= 4 ? (c.isReturn ? 'กลับมาอีกครั้ง ยังประทับใจเหมือนเดิม จะชวนเพื่อนมาด้วย' : 'อาหารและเครื่องดื่มถูกใจ บริการดี มีโอกาสจะแวะอีก') : stars === 3 ? 'ร้านน่านั่ง แต่รออาหารและเครื่องดื่มนานไปหน่อย' : 'รอนานกว่าที่คาดไว้ อยากให้จัดคิวให้ดีขึ้น';
    s.reviews.unshift({ id: uid(s, 'review'), day: s.day, name: c.name, stars, text, reason: c.reason, wait: round(wait) }); s.reviews = s.reviews.slice(0, 80);
  }
}
function leave(s: GameState, c: Customer, pay: boolean) {
  const orders = s.orders.filter(o => c.orderIds.includes(o.id));
  if(c.orderChannel==='counter')for(const o of orders){if(o.paid&&!o.parentOrderId&&o.status!=='completed'){const m=s.menu.find(m=>m.id===o.menuId)!;transaction(s,m.kind==='food'?'refund-food':'refund-drink',o.price,-o.price,`คืนเงินรายการที่ไม่ได้รับ · ${m.name}`,o.id);}}
  const wait = orders.length ? Math.max(...orders.map(o => (o.completedAt ?? s.minute) - o.createdAt)) : s.minute - c.arrivedAt;
  const failed = orders.some(o => o.status !== 'completed');
  if (pay) {
    for (const o of orders) {
      if(o.status!=='completed'||o.paid)continue;
      if(o.parentOrderId){o.paid=true;continue;}
      const m = s.menu.find(m => m.id === o.menuId)!;
      transaction(s, m.kind === 'food' ? 'food-sale' : 'drink-sale', o.price, o.price, `${c.name} · ${m.name}`, o.id); o.paid = true;
    }
    const waitPenalty = Math.max(0, wait - 6) * 1.7;
    c.satisfaction = clamp(100 - waitPenalty - (100 - s.cleanliness) * .2 - (failed ? 30 : 0), 10, 100);
  } else c.satisfaction = clamp(35 - Math.max(0, wait - c.patience), 5, 35);
  for (const o of orders) if (o.status !== 'completed') { o.status = 'cancelled'; o.workerId = undefined; }
  for (const e of s.employees) if (e.task?.customerId === c.id || orders.some(o => e.task?.orderId === o.id && o.status === 'cancelled')) { e.task = null; e.available = true; }
  const table = s.tables.find(t => t.id === c.tableId);
  if (table) { table.customerIds = table.customerIds.filter(id => id !== c.id); if (!table.customerIds.length) table.dirty = true; }
  s.todaySatisfaction.push(c.satisfaction); review(s, c, wait, !pay);
  c.status = 'leaving'; c.path = findPath(c.position, STATIONS.entrance);
  s.cleanliness = Math.max(0, s.cleanliness - (c.takeaway ? .15 : .7));
}
function progressCustomers(s: GameState, dt: number) {
  for (const c of s.customers) {
    if(c.player && c.status!=='leaving'){
      const orders=s.orders.filter(o=>c.orderIds.includes(o.id));
      const resolved=orders.every(o=>['completed','cancelled'].includes(o.status));
      c.status=orders.length&&resolved?'eating':'waiting';
      if(s.phase==='closing'&&(resolved||s.minute>CLOSE+90))leave(s,c,true);
      continue;
    }
    if (c.status === 'leaving') { walk(c.position, c.path, dt * 4); continue; }
    walk(c.position, c.path, dt * 3.5);
    if (c.status === 'queuing') { if (!c.path.length) seatCustomer(s, c); }
    else if (c.status === 'arriving' && !c.path.length) { c.status = 'seated'; c.seatedAt = s.minute; }
    if ((c.status === 'queuing' || c.status === 'seated') && s.minute - c.arrivedAt > c.patience) { leave(s, c, false); continue; }
    if (c.status === 'waiting') {
      const orders = s.orders.filter(o => c.orderIds.includes(o.id));
      if (orders.length && orders.every(o => o.status === 'completed' || o.status === 'cancelled')) {
        if (c.takeaway || orders.every(o => o.status === 'cancelled')) leave(s, c, orders.some(o => o.status === 'completed'));
        else c.status = 'eating';
      } else {
        const oldest = Math.min(...orders.map(o => o.createdAt));
        if (s.minute - oldest > c.patience) {
          // A served item is charged even if the remaining item is cancelled.
          const hasServed = orders.some(o => o.status === 'completed'); leave(s, c, hasServed);
        }
      }
    } else if(c.status==='restroom'){
      if(c.path.length)continue;
      if(c.restroomPhase==='going'){c.restroomPhase='using';c.restroomRemaining=1.2+random(s)*1.3;}
      else if(c.restroomPhase==='using'){c.restroomRemaining=(c.restroomRemaining??0)-dt;if(c.restroomRemaining<=0){c.restroomPhase='returning';c.path=findPath(c.position,seatPosition(s,c));}}
      else {c.status='eating';c.restroomPhase=undefined;}
    } else if(c.status==='eating'){
      c.eatRemaining-=dt;if(c.eatRemaining<=0)leave(s,c,true);
    }
  }
  s.customers = s.customers.filter(c => c.status !== 'leaving' || c.path.length > 0);
}
function weather(s: GameState, dt: number) {
  s.weatherRemaining -= dt;
  if (s.weatherRemaining <= 0) {
    if (s.weather.includes('rain')) { s.weather = 'cloudy'; s.weatherRemaining = 300 + random(s) * 240; }
    else { s.weather = random(s) < s.settings.rainChance * .5 ? (random(s) < .65 ? 'light-rain' : 'rain') : random(s) < .45 ? 'cloudy' : 'sunny'; s.weatherRemaining = s.weather.includes('rain') ? 45 + random(s) * 90 : 180 + random(s) * 240; }
  }
  s.garden.moisture = clamp(s.garden.moisture + (s.weather.includes('rain') ? .3 : -.025) * dt, 0, 100);
  s.garden.cleanliness = Math.max(0, s.garden.cleanliness - dt * .02);
}
function closeReport(s: GameState) {
  if (s.reports.some(r => r.day === s.day)) return;
  const cfg = s.settings;
  for (const [id, amount] of [['ham', cfg.hamWage], ['na', cfg.naWage], ['alee', cfg.aleeWage], ['ken', cfg.serverWage / 2], ['pun', cfg.serverWage / 2]] as const) transaction(s, 'wage', amount, -amount, `ค่าจ้าง ${id}${id === 'ken' || id === 'pun' ? ' · 50% ตำแหน่งเสิร์ฟร่วม' : ''}`);
  transaction(s, 'rent', cfg.monthlyRent / 30, -cfg.monthlyRent / 30, 'ค่าเช่าเฉลี่ยรายวัน · สมมติฐาน');
  transaction(s, 'utility', cfg.dailyUtilities, -cfg.dailyUtilities, 'ค่าน้ำไฟและดำเนินงาน · สมมติฐาน');
  const m = getMetrics(s);
  s.reports.push({ day: s.day, weather: s.weather, customers: s.todayArrivals, completed: m.completed, cancelled: m.cancelled, foodRevenue: m.foodRevenue, drinkRevenue: m.drinkRevenue,
    revenue: m.revenue, cogs: m.cogs, spoilage: m.spoilage, wages: m.wages, operating: m.operating, profit: m.profit, openingCash: s.openingCash, closingCash: s.cash,
    cashFlow: round(s.cash - s.openingCash), satisfaction: m.satisfaction, averageWait: m.averageWait, shortages: [...s.shortages],
    inspection: s.garden.inspections ? `อาลีตรวจสวนและความสะอาด ${s.garden.inspections} ครั้ง · ความชื้นสวน ${Math.round(s.garden.moisture)}%` : 'ยังไม่ได้ตรวจพื้นที่' });
  s.phase = 'closed'; s.paused = true; notice(s, `ปิดวันที่ ${s.day} แล้ว · ยอดขาย ฿${m.revenue.toFixed(0)} · ดูรายงานก่อนเปิดวันถัดไป`);
}
function step(s: GameState, dt: number) {
  if (s.phase === 'closed') return;
  s.minute += dt;
  weather(s, dt);
  if (s.phase === 'preparing' && s.minute >= OPEN) { s.phase = 'open'; notice(s, 'เปิดร้านแล้ว · อาหารเช้า กาแฟ และเรื่องราวของวันนี้'); }
  if (s.phase === 'open') {
    if (s.minute >= CLOSE) { s.phase = 'closing'; notice(s, 'หยุดรับลูกค้าใหม่ · กำลังเคลียร์ออร์เดอร์และเก็บร้าน'); }
    else {
      for (const ev of s.events) if (!ev.triggered && s.minute >= ev.minute) { ev.triggered = true; notice(s, `${ev.label} · ลูกค้า ${ev.size} คนมาพร้อมกัน`); arrive(s, ev.size, ev.id); }
      const hour = s.minute / 60;
      const timeFactor = hour < 9 ? 1.5 : hour < 11 ? 1.1 : hour < 14 ? .8 : hour < 17 ? .6 : hour < 20 ? 1.15 : .45;
      const weatherFactor = s.weather === 'rain' ? .6 : s.weather === 'light-rain' ? .85 : 1;
      const rate = s.settings.arrivalsPerHour / 60 * timeFactor * weatherFactor * (.5 + s.reputation / 5);
      if (random(s) < rate * dt) arrive(s, random(s) < .2 ? 2 + Math.floor(random(s) * 3) : 1);
    }
  }
  progressEmployees(s, dt);
  progressBundles(s);
  progressCustomers(s, dt);
  scheduleStaff(s);
  if (s.phase === 'closing' && !s.customers.length) {
    const dirty = s.tables.some(t => t.dirty);
    const inspected = s.garden.lastInspection >= CLOSE || s.minute - s.garden.lastInspection < 10;
    if ((!dirty && inspected) || s.minute > CLOSE + 120) closeReport(s);
  }
}
export function tick(state: GameState, dtMinutes: number): GameState {
  if (state.paused || state.phase === 'closed' || !Number.isFinite(dtMinutes) || dtMinutes <= 0) return state;
  const s = draft(state);
  // Large caller steps use the same controlled integration as normal play.
  let remaining = Math.min(dtMinutes, 1440);
  while (remaining > 1e-8 && s.phase !== 'closed') { const dt = Math.min(.1, remaining); step(s, dt); remaining -= dt; }
  return s;
}
function restock(s: GameState, id: string, quantity: number) {
  const i = s.inventory.find(i => i.id === id); if (!i || !Number.isFinite(quantity) || quantity <= 0) return;
  quantity = round(quantity); const cost = round(quantity * i.unitCost);
  if (cost > s.cash) { notice(s, 'เงินสดไม่พอสำหรับการสั่งซื้อครั้งนี้'); return; }
  i.quantity = round(i.quantity + quantity);
  // Mixing a fresh delivery does not extend the expiry of existing stock.
  if (i.quantity === quantity) { const initial = INITIAL_INVENTORY.find(x => x.id === id)!; i.expiresDay = s.day + initial.expiresDay - 1; }
  transaction(s, 'purchase', cost, -cost, `ซื้อ ${i.name} ${quantity} ${i.unit}`);
}
function nextDay(s: GameState) {
  if (s.phase !== 'closed') return;
  s.day++; s.minute = 385; s.phase = 'preparing'; s.paused = true; s.openingCash = s.cash;
  s.customers = []; s.orders = []; s.todayArrivals = 0; s.todayWaits = []; s.todaySatisfaction = []; s.shortages = [];
  s.tables.forEach(t => { t.customerIds = []; t.dirty = false; });
  s.employees.forEach(e => { e.task = null; e.hours = 0; e.tasksDone = 0; e.available = e.id !== 'pun'; });
  s.garden.lastInspection = -1; s.garden.inspections = 0;
  for (const i of s.inventory) {
    if (i.expiresDay < s.day && i.quantity > 0) { const value = round(i.quantity * i.unitCost); transaction(s, 'spoilage', value, 0, `${i.name}หมดอายุ · ${i.quantity} ${i.unit}`); i.quantity = 0; }
    if (s.settings.autoRestock && i.quantity < i.reorder * 2) restock(s, i.id, round(i.reorder * 4 - i.quantity));
  }
  s.weather = random(s) < .35 ? 'cloudy' : 'sunny'; s.weatherRemaining = 180 + random(s) * 240;
  scheduleEvents(s); notice(s, `วันที่ ${s.day} · ตรวจสต็อกก่อนเปิดร้าน`);
}

/** Player orders go through exactly the NPC preparation, service, COGS and sales ledger. */
export const PLAYER_ID='visitor-player';
function ensurePlayer(s:GameState):Customer {
 let c=s.customers.find(c=>c.player&&c.status!=='leaving');
 if(c)return c;
 c={id:uid(s,PLAYER_ID),player:true,name:'คุณ',reason:'มานั่งพักที่ ONE DAY',preference:'breakfast',budget:10000,patience:10000,groupId:'visitor',takeaway:false,position:[-.35,1.4],path:[],status:'waiting',tableId:null,orderIds:[],arrivedAt:s.minute,seatedAt:s.minute,eatRemaining:99999,satisfaction:100,isReturn:false,sweetness:100};
 s.customers.push(c);s.todayArrivals++;return c;
}
function releaseControl(s:GameState){for(const e of s.employees)if(e.controlled){e.controlled=false;e.available=true;}}
function playerSeat(s:GameState,tableId:string){
 const table=s.tables.find(t=>t.id===tableId);const current=s.customers.find(c=>c.player&&c.status!=='leaving');
 if(current?.orderChannel==='counter')return;
 if(!table||table.dirty||(table.customerIds.length>=table.capacity&&!table.customerIds.includes(current?.id??'')))return;
 const c=ensurePlayer(s);for(const t of s.tables)t.customerIds=t.customerIds.filter(id=>id!==c.id);
 table.customerIds.push(c.id);c.tableId=table.id;c.position=seatPosition(s,c);c.path=[];
 for(const o of s.orders.filter(o=>o.customerId===c.id))o.tableId=table.id;
 // Retarget a waiter already carrying the player's order, preserving its service status.
 for(const e of s.employees)if(e.task?.customerId===c.id&&e.task.stage==='deliver'){e.task.target=customerTarget(s,c);e.task.path=findPath(e.position,e.task.target);e.task.phase='walking';}
}

export function act(state: GameState, action: GameAction): GameState {
  const s = draft(state);
  switch (action.type) {
    case 'plan-operation': s.operationPlans=(s.operationPlans??[]).includes(action.id)?s.operationPlans?.filter(id=>id!==action.id):[...(s.operationPlans??[]),action.id];break;
    case 'visitor-submit': {
      const current=s.customers.find(c=>c.player&&c.status!=='leaving');
      if(!action.requestId||current?.requestIds?.includes(action.requestId))break;
      if(action.channel==='table-qr'&&!current?.tableId)break;
      if(current?.orderChannel&&current.orderChannel!==action.channel)break;
      if(action.channel==='counter'&&current?.tableId)break;
      const m=s.menu.find(m=>m.id===action.menuId);
      if(!m||!menuAvailable(m,s.minute)||s.phase!=='open'||!stockAvailable(s,m))break;
      if(current&&current.orderIds.filter(id=>!s.orders.find(o=>o.id===id)?.parentOrderId).length>=8)break;
      const c=ensurePlayer(s);c.orderChannel=action.channel;c.takeaway=action.channel==='counter';
      c.requestIds=[...(c.requestIds??[]),action.requestId];
      placeCustomerOrder(s,c,m.id);c.status='waiting';break;
    }
    case 'visitor-prepay': {
      const c=s.customers.find(c=>c.player&&c.status!=='leaving'&&c.orderChannel==='counter');if(!c)break;
      for(const o of s.orders.filter(o=>o.customerId===c.id&&!o.paid&&o.status!=='cancelled')){
        if(!o.parentOrderId){const m=s.menu.find(m=>m.id===o.menuId)!;transaction(s,m.kind==='food'?'food-sale':'drink-sale',o.price,o.price,`รับชำระซื้อกลับ · ${m.name}`,o.id);}
        o.paid=true;
      }break;
    }

    case 'visitor-seat': playerSeat(s,action.tableId);break;
    case 'visitor-order': {
      const m=s.menu.find(m=>m.id===action.menuId);
      if(!m||!menuAvailable(m,s.minute)||s.phase!=='open'||!stockAvailable(s,m))break;
      const c=ensurePlayer(s);if(c.orderIds.filter(id=>!s.orders.find(o=>o.id===id)?.parentOrderId).length>=8)break;
      placeCustomerOrder(s,c,m.id);c.status='waiting';
      if(!c.tableId){const table=s.tables.find(t=>!t.dirty&&!t.customerIds.length);if(table)playerSeat(s,table.id);}
      break;
    }
    case 'visitor-pay':{const c=s.customers.find(c=>c.player&&c.status!=='leaving');if(c&&s.orders.filter(o=>o.customerId===c.id).every(o=>['completed','cancelled'].includes(o.status)))leave(s,c,true);break;}
    case 'visitor-leave':{const c=s.customers.find(c=>c.player&&c.status!=='leaving');if(c)leave(s,c,true);break;}
    case 'visitor-consume':{const c=s.customers.find(c=>c.player&&c.status!=='leaving');const o=s.orders.find(o=>o.customerId===c?.id&&!o.componentOrderIds?.length&&o.status==='completed'&&!o.consumed&&s.menu.find(m=>m.id===o.menuId)?.kind===action.kind);if(o)o.consumed=true;break;}
    case 'control-staff':{
      releaseControl(s);if(!action.id)break;
      const e=s.employees.find(e=>e.id===action.id);if(!e)break;
      const o=s.orders.find(o=>o.id===e.task?.orderId);
      if(o&&!['completed','cancelled'].includes(o.status)){o.status=e.task?.kind==='serve'?'ready':'waiting';o.workerId=undefined;}
      e.task=null;e.controlled=true;e.available=false;break;
    }
    case 'control-move':{const e=s.employees.find(e=>e.id===action.id&&e.controlled);if(e&&canWalk(...action.position,.18))e.position=[...action.position];break;}

    case 'pause': s.paused = !s.paused; break;
    case 'speed': if ([1, 2, 5].includes(action.value)) s.speed = action.value; break;
    case 'barista': if (['auto', 'ham', 'na', 'alee'].includes(action.id)) s.baristaMode = action.id; break;
    case 'server': s.serverOverride = action.id; break;
    case 'restock': restock(s, action.id, action.quantity); break;
    case 'price': if (Number.isFinite(action.price) && action.price >= 1 && action.price <= 1000) s.menu = s.menu.map(m => m.id === action.id ? { ...m, price: Math.round(action.price) } : m); break;
    case 'toggle-menu': s.menu = s.menu.map(m => m.id === action.id ? { ...m, enabled: !m.enabled } : m); break;
    case 'rush': {
      if (s.phase !== 'open') { notice(s, 'เปิดร้านเวลา 06:30 ก่อนเรียกลูกค้ากลุ่ม'); break; }
      const size = clamp(Math.floor(action.size ?? 20), 1, 25); const id = uid(s, 'rush');
      s.events.push({ id, day: s.day, minute: s.minute, label: 'ลูกค้าหลายกลุ่มมาพร้อมกัน', size, announced: false, triggered: true });
      arrive(s, size, id); notice(s, `ช่วงลูกค้าแน่น · ${size} คน ทั้งนั่งร้านและซื้อกลับ`); break;
    }
    case 'weather': s.weather = action.weather; s.weatherRemaining = 90; break;
    case 'close': if (s.phase !== 'closed') { s.phase = 'closing'; notice(s, 'ปิดรับลูกค้าใหม่ กำลังเคลียร์งานที่ค้าง'); } break;
    case 'next-day': nextDay(s); break;
    case 'settings': {
      const numericKeys = ['arrivalsPerHour', 'patience', 'hamWage', 'naWage', 'aleeWage', 'serverWage', 'monthlyRent', 'dailyUtilities', 'rainChance', 'prepMultiplier', 'setupBudget', 'openingCash'] as const;
      for (const key of numericKeys) { const val = action.value[key]; if (typeof val === 'number' && Number.isFinite(val) && val >= 0) s.settings[key] = val; }
      s.settings.patience = clamp(s.settings.patience, 5, 120); s.settings.prepMultiplier = clamp(s.settings.prepMultiplier, .25, 4); s.settings.arrivalsPerHour = clamp(s.settings.arrivalsPerHour, 0, 30); s.settings.rainChance = clamp(s.settings.rainChance, 0, 1);
      if (typeof action.value.autoRestock === 'boolean') s.settings.autoRestock = action.value.autoRestock;
      break;
    }
    case 'care': {
      const e = s.employees.find(e => e.id === 'alee')!;
      s.garden.careRequested = true;
      if (e.task?.kind === 'inspect') notice(s, 'อาลีกำลังตรวจสวนและความสะอาดอยู่แล้ว');
      else if (!e.task || ['manage', 'garden','station'].includes(e.task.kind)) { setTask(e, 'inspect', INSPECT, 2); notice(s, 'อาลีกำลังเดินไปตรวจสวนและความสะอาด'); }
      else notice(s, 'บันทึกงานตรวจสวนแล้ว · อาลีจะไปทันทีหลังทำเครื่องดื่มปัจจุบันเสร็จ');
      break;
    }
  }
  return s;
}
export function getMetrics(s: GameState) {
  const ledger = s.ledger.filter(t => t.day === s.day);
  const sum = (...types: Transaction['type'][]) => round(ledger.filter(t => types.includes(t.type)).reduce((a, t) => a + t.amount, 0));
  const foodRevenue = round(sum('food-sale')-sum('refund-food')), drinkRevenue = round(sum('drink-sale')-sum('refund-drink')), revenue = round(foodRevenue + drinkRevenue), cogs = sum('cogs'), spoilage = sum('spoilage'), wages = sum('wage'), operating = sum('rent', 'utility');
  const pending = (kind: 'food' | 'drink') => s.orders.filter(o => !o.componentOrderIds?.length&&!['completed', 'cancelled'].includes(o.status) && s.menu.find(m => m.id === o.menuId)?.kind === kind).length;
  const barista = s.employees.find(e=>e.task?.kind==='brew')??s.employees.find(e=>e.id===(s.baristaMode==='auto'?'ham':s.baristaMode)&&e.task?.kind==='station');
  const mean = (xs: number[], fallback: number) => xs.length ? xs.reduce((a, b) => a + b, 0) / xs.length : fallback;
  const estimatedWages = wages || s.settings.hamWage + s.settings.naWage + s.settings.aleeWage + s.settings.serverWage;
  const estimatedOperating = operating || s.settings.monthlyRent / 30 + s.settings.dailyUtilities;
  return { foodRevenue, drinkRevenue, revenue, cogs, spoilage, wages, operating, profit: round(revenue - cogs - spoilage - wages - operating),
    grossProfit: round(revenue - cogs), estimatedProfit: round(revenue - cogs - spoilage - estimatedWages - estimatedOperating),
    pendingFood: pending('food'), pendingDrinks: pending('drink'), completed: s.orders.filter(o => !o.parentOrderId&&o.status==='completed').length, cancelled: s.orders.filter(o => !o.parentOrderId&&o.status==='cancelled').length,
    satisfaction: mean(s.todaySatisfaction, 100), averageWait: mean(s.todayWaits, 0), activeBarista: barista?.id ?? null, activeServer: activeServer(s),
    inventoryValue: round(s.inventory.reduce((n, i) => n + i.quantity * i.unitCost, 0)) };
}
