import {describe,expect,it} from 'vitest';
import {act,createGame,tick,activeServer,getMetrics} from '../game/engine';
import {validateSave} from '../game/persistence';
import {canWalk,findPath,segmentWalkable,STATIONS} from '../game/world';
import {gardenComfort,potObstacles,progression} from '../game/cozy';
import {soundAttenuation,SOUND_SOURCES} from '../game/soundSpace';
import type {GameState} from '../game/types';
function quiet(){const s=createGame(20261105);s.minute=420;s.phase='open';s.paused=false;s.events=[];s.settings.arrivalsPerHour=0;return s;}
function manualDrink(){let s=quiet();s=act(s,{type:'visitor-seat',tableId:'t1'});s=act(s,{type:'visitor-order',menuId:'thai-tea'});s=act(s,{type:'control-staff',id:'ham'});s=act(s,{type:'staff-work',id:'ham',work:'brew'});return s;}
function atTarget(s:GameState,id='ham'){const e=s.employees.find(e=>e.id===id)!;e.position=[...e.task!.target];return s;}
describe('cozy life shares the restaurant state',()=>{
 it('records garden investment exactly once, with no food cost or revenue',()=>{
  const before=quiet();let s=act(before,{type:'plant',slot:0,species:'monstera'});s=act(s,{type:'plant',slot:0,species:'monstera'});
  expect(s.cash).toBe(before.cash-450);expect(s.life!.pots).toHaveLength(1);expect(s.ledger.filter(t=>t.type==='decoration')).toHaveLength(1);
  expect(getMetrics(s).cogs).toBe(0);expect(getMetrics(s).revenue).toBe(0);expect(getMetrics(s).profit).toBe(0);
  expect(gardenComfort(s)).toBeGreaterThan(gardenComfort(before));expect(before.life!.pots).toHaveLength(0);
 });
 it('rejects overspending without creating a decoration or changing the ledger',()=>{
  const s=quiet();s.settings.setupBudget=100;const after=act(s,{type:'plant',slot:0,species:'rubber'});
  expect(after.cash).toBe(s.cash);expect(after.life!.pots).toEqual([]);expect(after.ledger).toEqual([]);
 });
 it('moves the rendered/saved furniture and routes against the new obstacle, not the old one',()=>{
  let s=act(quiet(),{type:'move-table',id:'t1',position:[.8,32]});
  expect(s.tables[0].position).toEqual([.8,32]);expect(canWalk(.8,14.2,.16,s.tables)).toBe(true);expect(canWalk(.8,32,.16,s.tables)).toBe(false);
  const path=findPath(STATIONS.entrance,[-1.45,49],s.tables,potObstacles(s));expect(path.at(-1)).toEqual([-1.45,49]);
  s=act(s,{type:'plant',slot:0,species:'fern'});const loaded=validateSave(JSON.parse(JSON.stringify(s)));
  expect(loaded.tables).toEqual(s.tables);expect(loaded.life).toEqual(s.life);expect(loaded.cash).toBe(s.cash);expect(loaded.ledger).toEqual(s.ledger);
 });
 it('protects occupied tables and keeps three to five owned tables available',()=>{
  let s=act(quiet(),{type:'visitor-seat',tableId:'t1'});s=act(s,{type:'move-table',id:'t1',position:[.8,32]});expect(s.tables[0].position[1]).toBe(14.2);
  for(const id of ['t2','t3','t4'])s=act(s,{type:'table-enabled',id,enabled:false});
  expect(s.tables.filter(t=>t.enabled!==false)).toHaveLength(3);
  s=act(s,{type:'table-enabled',id:'t2',enabled:true});expect(s.tables.filter(t=>t.enabled!==false)).toHaveLength(4);
 });
 it('requires a real station visit and four preparation steps before a manual drink can be served',()=>{
  let s=manualDrink();const tea=s.inventory.find(i=>i.id==='tea')!.quantity;
  s=act(s,{type:'staff-step',id:'ham'});expect(s.orders[0].stockConsumed).toBe(false);
  atTarget(s);s=act(s,{type:'staff-step',id:'ham'});expect(s.orders[0].stockConsumed).toBe(true);
  expect(s.inventory.find(i=>i.id==='tea')!.quantity).toBeLessThan(tea);
  s=act(s,{type:'staff-step',id:'ham'});expect(s.employees[0].task!.manualStep).toBe(0);
  atTarget(s);for(let n=0;n<3;n++){s=act(s,{type:'staff-step',id:'ham'});expect(s.orders[0].status).toBe('preparing');}
  s=act(s,{type:'staff-step',id:'ham'});expect(s.orders[0].status).toBe('ready');expect(s.ledger.filter(t=>t.type==='cogs')).toHaveLength(1);
  s=act(s,{type:'control-staff',id:null});s=tick(s,25);expect(s.orders[0].status).toBe('completed');
  s=act(s,{type:'visitor-pay'});const cash=s.cash;s=act(s,{type:'visitor-pay'});expect(s.cash).toBe(cash);expect(s.ledger.filter(t=>t.type==='drink-sale')).toHaveLength(1);
 });
 it('resumes a save made during manual production without consuming twice',()=>{
  let s=manualDrink();atTarget(s);s=act(s,{type:'staff-step',id:'ham'});atTarget(s);s=act(s,{type:'staff-step',id:'ham'});
  const inventory=s.inventory.map(i=>i.quantity);s=validateSave(JSON.parse(JSON.stringify(s)));s.paused=false;s=tick(s,30);
  expect(s.orders[0].status).toBe('completed');expect(s.inventory.map(i=>i.quantity)).toEqual(inventory);expect(s.ledger.filter(t=>t.type==='cogs')).toHaveLength(1);
 });
 it('returns dishes from a real table and clears them at the wash station',()=>{
  let s=quiet();s.tables[0].dirty=true;s=act(s,{type:'control-staff',id:'ken'});s=act(s,{type:'staff-work',id:'ken',work:'clean'});
  atTarget(s,'ken');s=act(s,{type:'staff-step',id:'ken'});expect(s.tables[0].dirty).toBe(false);expect(s.life!.dirtyDishes).toBe(4);
  s=act(s,{type:'staff-work',id:'ken',work:'wash'});atTarget(s,'ken');s=act(s,{type:'staff-step',id:'ken'});expect(s.life!.dirtyDishes).toBe(0);
 });
 it('greets named customers once per day and keeps their memory after reloading',()=>{
  let s=act(quiet(),{type:'rush',size:1}),c=s.customers[0],g=s.guests!.find(g=>g.id===c.guestId)!;const affinity=g.affinity;
  s=act(s,{type:'greet',customerId:c.id});s=act(s,{type:'greet',customerId:c.id});expect(s.guests![0].affinity).toBe(affinity+3);
  expect(validateSave(s).guests![0].greetedDay).toBe(1);expect(s.life!.journal.some(n=>n.text.includes(c.name))).toBe(true);
 });
 it('uses an adjusted service shift without creating extra payroll positions',()=>{
  let s=quiet();s.minute=700;s=act(s,{type:'shift',id:'ken',start:330,end:600});s=act(s,{type:'shift',id:'pun',start:600,end:1350});
  expect(activeServer(s)).toBe('pun');s=act(s,{type:'close'});s=tick(s,90);
  expect(s.ledger.filter(t=>t.type==='wage'&&/ken|pun/.test(t.note)).reduce((n,t)=>n+t.amount,0)).toBe(s.settings.serverWage);
 });
 it('carries journal, progress and garden investment into the next day',()=>{
  let s=act(quiet(),{type:'plant',slot:0,species:'rubber'});s=act(s,{type:'journal-note',text:'แสงเย็นที่ร้านของเรา'});s=act(s,{type:'close'});s=tick(s,90);s=act(s,{type:'next-day'});
  expect(s.life!.pots[0].plantedDay).toBe(1);expect(s.life!.journal.some(n=>n.day===1&&n.text.includes('แสงเย็น'))).toBe(true);expect(progression(s).investment).toBe(650);expect(s.reports).toHaveLength(1);
 });
 it('stores only bounded photograph metadata in game saves and never changes cash or stock',()=>{
  let s=quiet();const before=s.cash,inventory=structuredClone(s.inventory);
  for(let n=0;n<26;n++)s=act(s,{type:'photo-memory',photo:{id:`photo-${n}`,day:99,minute:999,caption:'สวนของเรา'}});
  expect(s.life!.photos).toHaveLength(24);expect(s.life!.photos[0].day).toBe(1);expect(s.cash).toBe(before);expect(s.inventory).toEqual(inventory);expect(s.ledger).toEqual([]);
 });
 it('keeps spatial road noise much quieter in the garden and bar noise louder up close',()=>{
  const road=SOUND_SOURCES.road;
  expect(soundAttenuation(Math.abs(30-road[2]))).toBeLessThan(soundAttenuation(3)*.1);
  expect(soundAttenuation(1)).toBeGreaterThan(soundAttenuation(25)*8);
 });
 it('lets a scheduled barista return from an earlier rest and counts actual duty hours',()=>{
  let s=quiet();s.baristaMode='ham';s=act(s,{type:'shift',id:'ham',start:500,end:900});s=act(s,{type:'visitor-order',menuId:'thai-tea'});
  s=tick(s,5);expect(s.employees.find(e=>e.id==='ham')!.hours).toBe(0);expect(s.orders[0].stockConsumed).toBe(false);
  s.minute=500;s=tick(s,15);expect(s.orders[0].stockConsumed).toBe(true);expect(s.employees.find(e=>e.id==='ham')!.hours).toBeGreaterThan(0);
 });
 it('replans an abandoned manual trip from the actual employee position',()=>{
  let s=manualDrink();const e=s.employees.find(e=>e.id==='ham')!;e.position=[-1.4,8];s=act(s,{type:'control-staff',id:null});
  const employee=s.employees.find(e=>e.id==='ham')!;let previous=employee.position;
  for(const next of employee.task!.path){expect(segmentWalkable(previous,next,.16,s.tables,potObstacles(s))).toBe(true);previous=next;}
 });
 it('keeps a carried tray until the waiter is within actual delivery reach',()=>{
  let s=manualDrink();atTarget(s);s=act(s,{type:'staff-step',id:'ham'});atTarget(s);for(let n=0;n<4;n++)s=act(s,{type:'staff-step',id:'ham'});
  s=act(s,{type:'control-staff',id:'ken'});s=act(s,{type:'staff-work',id:'ken',work:'serve'});atTarget(s,'ken');s=act(s,{type:'staff-step',id:'ken'});
  const e=s.employees.find(e=>e.id==='ken')!;e.position=[e.task!.target[0]-.8,e.task!.target[1]];
  s=act(s,{type:'staff-step',id:'ken'});expect(s.orders[0].status).toBe('serving');expect(s.employees.find(e=>e.id==='ken')!.task).not.toBeNull();
  atTarget(s,'ken');s=act(s,{type:'staff-step',id:'ken'});expect(s.orders[0].status).toBe('completed');expect(s.ledger.filter(t=>t.type==='cogs')).toHaveLength(1);
 });

});
