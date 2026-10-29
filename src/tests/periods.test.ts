import { describe, expect, it } from 'vitest';
import { act, createGame, getMetrics, placeCustomerOrder, tick } from '../game/engine';
import { INITIAL_MENU, menuAvailable, servicePeriod } from '../game/data';
import { validateSave } from '../game/persistence';
import { canWalk, findPath, STATIONS } from '../game/world';
import type { Customer, GameState, MenuItem } from '../game/types';

function operating(minute = 400): GameState {
  const s = createGame(7331); s.minute = minute; s.phase = 'open'; s.paused = false;
  s.settings.arrivalsPerHour = 0; s.events = []; return s;
}
function customer(s: GameState): Customer {
  const c: Customer = {id:'period-guest',name:'ลูกค้าทดสอบ',reason:'ตั้งใจมากินชุดอาหารเช้า',preference:'breakfast',budget:500,patience:180,groupId:'period-group',takeaway:true,position:[-1,1],path:[],status:'seated',tableId:null,orderIds:[],arrivedAt:s.minute,seatedAt:s.minute,eatRemaining:20,satisfaction:100,isReturn:false};
  s.customers.push(c); s.todayArrivals++; return c;
}
function onlyMenu(s:GameState,item:MenuItem){s.menu=s.menu.map(m=>({...m,enabled:m.id===item.id}));}

describe('service periods and reference menu',()=>{
  it('contains exactly 37 public items and the three poster price/time groups',()=>{
    const items=INITIAL_MENU.filter(m=>!m.hidden);
    expect(items).toHaveLength(37);
    expect(items.filter(m=>m.period==='breakfast')).toHaveLength(11);
    expect(items.filter(m=>m.period==='all-day')).toHaveLength(16);
    expect(items.filter(m=>m.period==='evening')).toHaveLength(10);
    expect(items.find(m=>m.id==='fish-porridge')?.price).toBe(70);
    expect(new Set(items.map(m=>m.id)).size).toBe(37);
  });
  it('uses exact opening, breakfast cutoff, evening and closing boundaries',()=>{
    const breakfast=INITIAL_MENU.find(m=>!m.hidden&&m.period==='breakfast')!;
    const drink=INITIAL_MENU.find(m=>!m.hidden&&m.period==='all-day')!;
    const evening=INITIAL_MENU.find(m=>!m.hidden&&m.period==='evening')!;
    expect(menuAvailable(breakfast,389.99)).toBe(false);
    expect(menuAvailable(breakfast,390)).toBe(true);
    expect(menuAvailable(breakfast,629.99)).toBe(true);
    expect(menuAvailable(breakfast,630)).toBe(false);
    expect(menuAvailable(evening,1019.99)).toBe(false);
    expect(menuAvailable(evening,1020)).toBe(true);
    expect(menuAvailable(drink,750)).toBe(true);
    expect(menuAvailable(drink,1229.99)).toBe(true);
    expect(menuAvailable(drink,1230)).toBe(false);
    expect(servicePeriod(420)).not.toEqual(servicePeriod(750));
    expect(servicePeriod(750)).not.toEqual(servicePeriod(1100));
  });
  it('never accepts breakfast orders at midday or evening, but keeps all-day beverages available',()=>{
    for(const minute of [640,1040]){
      let s=operating(minute);s=act(s,{type:'rush',size:20});s=tick(s,10);
      expect(s.orders.length).toBeGreaterThan(0);
      const accepted=s.orders.filter(o=>!o.parentOrderId).map(o=>s.menu.find(m=>m.id===o.menuId)!);
      expect(accepted.every(m=>m.period!=='breakfast')).toBe(true);
      if(minute===640)expect(accepted.every(m=>m.kind==='drink')).toBe(true);
    }
  });
  it('finishes breakfast already accepted before 10:30 without clearing its stock or payment',()=>{
    let s=operating(629);const m=s.menu.find(m=>m.id==='chicken-porridge')!;customer(s);
    // A previously accepted ticket is independent of subsequent menu availability.
    s.customers[0].status='waiting';s.customers[0].orderIds=['accepted-breakfast'];
    s.orders.push({id:'accepted-breakfast',customerId:s.customers[0].id,tableId:null,menuId:m.id,status:'waiting',createdAt:629,cost:0,price:m.price,stockConsumed:false,paid:false});
    s=tick(s,30);
    expect(s.orders[0].status).toBe('completed');
    expect(s.ledger.filter(t=>t.orderId==='accepted-breakfast'&&t.type==='food-sale')).toHaveLength(1);
    expect(s.ledger.filter(t=>t.orderId==='accepted-breakfast'&&t.type==='cogs')).toHaveLength(1);
  });
  it('produces a food-and-drink bundle at separate stations and charges its single set price once',()=>{
    let s=operating();const set=s.menu.find(m=>!m.hidden&&m.components?.some(c=>s.menu.find(x=>x.id===c.menuId)?.kind==='drink'))!;
    expect(set).toBeDefined();onlyMenu(s,set);customer(s);const cash=s.cash;
    s=tick(s,4);
    const root=s.orders.find(o=>!o.parentOrderId)!;
    expect(root).toBeDefined();const children=s.orders.filter(o=>o.parentOrderId===root.id);
    expect(children.length).toBeGreaterThanOrEqual(2);
    expect(children.some(o=>s.menu.find(m=>m.id===o.menuId)?.kind==='food')).toBe(true);
    expect(children.some(o=>s.menu.find(m=>m.id===o.menuId)?.kind==='drink')).toBe(true);
    expect(children.every(o=>o.price===0)).toBe(true);
    s=tick(s,45);
    expect(s.orders.find(o=>o.id===root.id)?.status).toBe('completed');
    const sales=s.ledger.filter(t=>t.type==='food-sale'||t.type==='drink-sale');
    expect(sales).toHaveLength(1);expect(sales[0].orderId).toBe(root.id);
    expect(sales[0].amount).toBe(set.price);expect(s.cash).toBe(cash+set.price);
    expect(s.ledger.filter(t=>t.type==='cogs'&&t.orderId===root.id)).toHaveLength(0);
    expect(s.ledger.filter(t=>t.type==='cogs')).toHaveLength(children.length);
    const after=JSON.parse(JSON.stringify(s.inventory));const afterCash=s.cash;
    s=tick(s,30);expect(s.inventory).toEqual(after);expect(s.cash).toBe(afterCash);
  });
  it('does not fabricate a bundle sale when its drink is cancelled after food was prepared',()=>{
    let s=operating();const set=s.menu.find(m=>m.id==='one-day-set')!;
    const c=customer(s);c.status='waiting';c.patience=8;
    const root=placeCustomerOrder(s,c,set.id)!;
    s.menu=s.menu.map(m=>m.id==='thai-tea'?{...m,duration:100}:m.id==='chicken-porridge'?{...m,duration:.25}:m);
    s=tick(s,20);
    expect(s.orders.find(o=>o.id===root.id)?.status).toBe('cancelled');
    expect(s.ledger.filter(t=>t.type==='food-sale'||t.type==='drink-sale')).toHaveLength(0);
    expect(getMetrics(s).cogs).toBeGreaterThan(0);
    const used=s.ledger.filter(t=>t.type==='cogs');
    expect(new Set(used.map(t=>t.orderId)).size).toBe(used.length);
  });
  it('zero added sweetness changes actual sugar consumption while preserving milk and the selling price',()=>{
    let s=operating();const c=customer(s);c.status='waiting';
    const initialSugar=s.inventory.find(i=>i.id==='sugar')!.quantity;
    const initialMilk=s.inventory.find(i=>i.id==='milk')!.quantity;
    const order=placeCustomerOrder(s,c,'thai-tea',0)!;
    s=tick(s,30);
    expect(s.orders.find(o=>o.id===order.id)?.sweetness).toBe(0);
    expect(s.inventory.find(i=>i.id==='sugar')!.quantity).toBe(initialSugar);
    expect(s.inventory.find(i=>i.id==='milk')!.quantity).toBeCloseTo(initialMilk-.1,6);
    expect(getMetrics(s).revenue).toBe(35);
  });
  it('keeps Ham physically behind the bar when idle and every station reachable',()=>{
    let s=operating();s=tick(s,3);
    const ham=s.employees.find(e=>e.id==='ham')!;
    expect(ham.position[0]).toBeCloseTo(STATIONS.bar[0],2);
    expect(ham.position[1]).toBeCloseTo(STATIONS.bar[1],2);
    for(const target of [STATIONS.bar,STATIONS.kitchen,STATIONS.pickup,STATIONS.fridge,STATIONS.restroom]){
      expect(canWalk(...target)).toBe(true);
      const path=findPath(STATIONS.entrance,target);expect(path.length).toBeGreaterThan(0);
      expect(path.every(p=>canWalk(...p))).toBe(true);
    }
  });
  it('a restroom visit walks back to the reserved seat and resumes eating',()=>{
    let s=operating(700);const c=customer(s);const table=s.tables[0];
    c.takeaway=false;c.tableId=table.id;table.customerIds=[c.id];
    c.position=[table.position[0]-.9,table.position[1]-.25];
    const seat=[...c.position];c.status='restroom';c.restroomUsed=true;c.restroomPhase='going';c.restroomRemaining=.5;
    c.eatRemaining=40;c.path=findPath(c.position,STATIONS.restroom);
    expect(c.path.length).toBeGreaterThan(0);
    s=tick(s,.5);expect(s.tables[0].customerIds).toContain(c.id);
    expect(s.tables[0].dirty).toBe(false);
    s=tick(s,8);const returned=s.customers.find(x=>x.id===c.id)!;
    expect(returned).toBeDefined();expect(returned.status).toBe('eating');
    expect(returned.position[0]).toBeCloseTo(seat[0],2);expect(returned.position[1]).toBeCloseTo(seat[1],2);
    expect(s.tables[0].customerIds).toContain(c.id);
    expect(s.ledger.filter(t=>t.type==='food-sale'||t.type==='drink-sale')).toHaveLength(0);
  });
  it('migrates old saves without losing cash, stock, history or active old tickets',()=>{
    const legacy=JSON.parse(JSON.stringify(createGame(300)));
    legacy.cash=8765;legacy.inventory.find((i:any)=>i.id==='egg').quantity=17;
    legacy.garden.food=22;legacy.garden.water=33;
    legacy.menu=[{id:'old-special',name:'เมนูจากเซฟเก่า',en:'Legacy',kind:'food',price:42,duration:3,recipe:{egg:1},enabled:true}];
    legacy.orders=[{id:'legacy-order',customerId:'legacy-guest',tableId:null,menuId:'old-special',status:'waiting',createdAt:legacy.minute,cost:0,price:42,stockConsumed:false,paid:false}];
    legacy.ledger=[{id:'legacy-tx',day:1,minute:400,type:'purchase',amount:40,cashDelta:-40,note:'รายการเดิม'}];
    const restored=validateSave(legacy);
    expect(restored.cash).toBe(8765);expect(restored.inventory.find(i=>i.id==='egg')!.quantity).toBe(17);
    expect(restored.ledger).toEqual(legacy.ledger);expect(restored.orders).toEqual(legacy.orders);
    expect(restored.menu.filter(m=>!m.hidden)).toHaveLength(37);
    expect(restored.menu.find(m=>m.id==='old-special')).toMatchObject({hidden:true,enabled:false});
    expect('food' in restored.garden).toBe(false);expect('water' in restored.garden).toBe(false);
    expect(restored.paused).toBe(true);
  });
});
