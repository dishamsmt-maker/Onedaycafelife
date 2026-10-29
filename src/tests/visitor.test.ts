import {describe,it,expect} from 'vitest';
import {act,createGame,getMetrics,tick} from '../game/engine';
import {canVisitorWalk,canWalk,STATIONS} from '../game/world';
import {validateSave} from '../game/persistence';
function game(){const s=createGame(112);s.minute=420;s.phase='open';s.paused=false;s.settings.arrivalsPerHour=0;s.events=[];return s;}
describe('first person café visitor',()=>{
 it('public circulation connects entrance, counter, garden while excluding work areas',()=>{
  expect(canVisitorWalk(-.5,-.72)).toBe(true);
  expect(canVisitorWalk(-1.4,-3.7)).toBe(true);
  expect(canVisitorWalk(0,-7)).toBe(false);
  expect(canVisitorWalk(-.2,1.65)).toBe(true);
  // Continuous public aisle clear past all workstations, leading to garden.
  for(let z=0;z<8.2;z+=.1)expect(canVisitorWalk(-.15,z)).toBe(true);
  for(const p of [STATIONS.bar,STATIONS.kitchen,[1,9.3] as [number,number]]){
   expect(canVisitorWalk(...p)).toBe(false);expect(canWalk(...p)).toBe(true);
  }
 });
 it('counter order reserves a real table, cooks and serves with no random player orders or automatic departure',()=>{
  let s=game();const chicken=s.inventory.find(i=>i.id==='chicken')!.quantity;
  s=act(s,{type:'visitor-order',menuId:'chicken-porridge'});
  s=act(s,{type:'visitor-order',menuId:'thai-tea'});
  const player=s.customers.find(c=>c.player)!;
  expect(player.tableId).toBe('t1');expect(s.tables[0].customerIds).toContain(player.id);
  expect(s.orders).toHaveLength(2);expect(getMetrics(s).revenue).toBe(0);
  s=tick(s,40);expect(s.orders.every(o=>o.status==='completed')).toBe(true);
  expect(s.customers.find(c=>c.player)?.status).toBe('eating');
  const seated=s.customers.find(c=>c.player)!;expect(s.employees.every(e=>Math.hypot(e.position[0]-seated.position[0],e.position[1]-seated.position[1])>.4)).toBe(true);
  expect(s.inventory.find(i=>i.id==='chicken')!.quantity).toBeCloseTo(chicken-.09);
  expect(s.ledger.filter(t=>t.type==='cogs')).toHaveLength(2);
  expect(getMetrics(s).revenue).toBe(0);
  s=act(s,{type:'visitor-consume',kind:'food'});s=act(s,{type:'visitor-consume',kind:'food'});
  expect(s.orders[0].consumed).toBe(true);expect(s.ledger.filter(t=>t.type==='cogs')).toHaveLength(2);
  s=act(s,{type:'visitor-pay'});const cash=s.cash;
  expect(getMetrics(s).revenue).toBe(80);expect(s.tables[0].customerIds).not.toContain(player.id);
  s=act(s,{type:'visitor-pay'});expect(s.cash).toBe(cash);
 });
 it('unserved orders cannot generate payment and evening cannot sell breakfast',()=>{
  let s=act(game(),{type:'visitor-order',menuId:'chicken-porridge'});
  s=act(s,{type:'visitor-pay'});expect(getMetrics(s).revenue).toBe(0);
  expect(s.customers[0].status).not.toBe('leaving');
  s.minute=1100;s=act(s,{type:'visitor-order',menuId:'chicken-porridge'});expect(s.orders).toHaveLength(1);
 });
 it('occupied table and dirty table cannot be reserved again',()=>{
  let s=game();s.tables[0].customerIds=['a','b','c','d'];
  s=act(s,{type:'visitor-seat',tableId:'t1'});expect(s.customers).toHaveLength(0);
  s.tables[1].dirty=true;s=act(s,{type:'visitor-seat',tableId:'t2'});expect(s.customers).toHaveLength(0);
 });
 it('taking control suspends staff AI, preserves consumed stock and resumes without double charging',()=>{
  let s=act(game(),{type:'visitor-order',menuId:'chicken-porridge'});
  s=tick(s,2);s=act(s,{type:'control-staff',id:'na'});
  const consumed=s.orders[0].stockConsumed;
  s=act(s,{type:'control-move',id:'na',position:[-.2,4]});s=tick(s,5);
  expect(s.employees.find(e=>e.id==='na')!.position).toEqual([-.2,4]);
  expect(s.employees.find(e=>e.id==='na')!.task).toBeNull();
  s=act(s,{type:'control-staff',id:null});s=tick(s,20);
  expect(s.orders[0].status).toBe('completed');expect(s.ledger.filter(t=>t.type==='cogs')).toHaveLength(1);
  expect(consumed).toBe(true);
 });
 it('saved player orders restore without duplicating ledger and staff controls release on load',()=>{
  let s=act(game(),{type:'visitor-order',menuId:'latte'});s=tick(s,20);
  s=act(s,{type:'control-staff',id:'ham'});
  const loaded=validateSave(JSON.parse(JSON.stringify(s)));
  expect(loaded.customers.find(c=>c.player)?.orderIds).toEqual(s.customers.find(c=>c.player)?.orderIds);
  expect(loaded.employees.every(e=>!e.controlled)).toBe(true);
  expect(loaded.ledger).toEqual(s.ledger);
 });
});
