import {describe,it,expect} from 'vitest';
import {act,createGame,tick,getMetrics} from '../game/engine';
import {validateSave} from '../game/persistence';
function game(){const s=createGame(112);s.phase='open';s.minute=420;s.paused=false;s.settings.arrivalsPerHour=0;s.events=[];return s;}
const submit=(channel:'table-qr'|'counter',requestId='one')=>({type:'visitor-submit' as const,channel,requestId,menuId:'thai-tea'});
describe('table QR and prepaid takeaway',()=>{
 it('requires a table, keeps one bill and rejects duplicate requests',()=>{
  let s=act(game(),submit('table-qr'));expect(s.orders).toHaveLength(0);
  s=act(s,{type:'visitor-seat',tableId:'t1'});s=act(s,submit('table-qr'));s=act(s,submit('table-qr'));
  expect(s.orders).toHaveLength(1);expect(s.orders[0].tableId).toBe('t1');
  s=tick(s,35);expect(s.orders[0].status).toBe('completed');expect(getMetrics(s).revenue).toBe(0);
  s=act(s,{type:'visitor-pay'});expect(getMetrics(s).revenue).toBe(35);
  const cash=s.cash;s=act(s,{type:'visitor-pay'});expect(s.cash).toBe(cash);
 });
 it('does not reserve a table or produce before payment, and never charges twice',()=>{
  let s=act(game(),submit('counter'));const cash=s.cash;
  expect(s.customers[0].tableId).toBeNull();expect(s.customers[0].takeaway).toBe(true);
  s=tick(s,10);expect(s.orders[0].stockConsumed).toBe(false);
  s=act(s,{type:'visitor-prepay'});expect(s.cash).toBe(cash+35);
  s=act(s,{type:'visitor-prepay'});expect(s.cash).toBe(cash+35);
  s=tick(s,35);expect(s.orders[0].status).toBe('completed');
  s=act(s,{type:'visitor-pay'});expect(s.cash).toBe(cash+35);expect(s.customers[0].status).toBe('leaving');
  expect(s.tables.every(t=>t.customerIds.length===0)).toBe(true);
 });
 it('refunds unfinished paid orders exactly once on departure',()=>{
  let s=act(game(),submit('counter'));const cash=s.cash;
  s=act(s,{type:'visitor-prepay'});s=act(s,{type:'visitor-leave'});
  expect(s.cash).toBe(cash);expect(getMetrics(s).revenue).toBe(0);
  expect(s.orders[0].status).toBe('cancelled');expect(s.ledger.filter(t=>t.type==='refund-drink')).toHaveLength(1);
  s=act(s,{type:'visitor-leave'});expect(s.cash).toBe(cash);
 });
 it('prepaid bundles charge only the root and refund once if interrupted',()=>{
  let s=act(game(),{...submit('counter'),menuId:'one-day-set'});const cash=s.cash;
  s=act(s,{type:'visitor-prepay'});expect(s.cash).toBe(cash+75);
  expect(s.orders.every(o=>o.paid)).toBe(true);
  s=tick(s,1);s=act(s,{type:'visitor-leave'});expect(s.cash).toBe(cash);
  expect(getMetrics(s).revenue).toBe(0);
  expect(s.ledger.filter(t=>t.type==='refund-food')).toHaveLength(1);
 });
 it('preserves payment, channel and request deduplication through save/load',()=>{
  let s=act(game(),submit('counter'));s=act(s,{type:'visitor-prepay'});
  const cash=s.cash;s=validateSave(JSON.parse(JSON.stringify(s)));
  s=act(s,submit('counter'));s=act(s,{type:'visitor-prepay'});
  expect(s.orders).toHaveLength(1);expect(s.cash).toBe(cash);expect(s.customers[0].orderChannel).toBe('counter');
 });
 it('prevents channel switching and rejects closed-menu orders',()=>{
  let s=act(game(),submit('counter'));s=act(s,{type:'visitor-seat',tableId:'t1'});
  expect(s.customers[0].tableId).toBeNull();s=act(s,submit('table-qr','two'));expect(s.orders).toHaveLength(1);
  s.phase='closed';s=act(s,submit('counter','three'));expect(s.orders).toHaveLength(1);
 });
});
