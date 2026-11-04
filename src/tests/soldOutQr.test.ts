import {describe,it,expect} from 'vitest';
import {act,createGame,getMetrics} from '../game/engine';

describe('QR/POS inventory rejection regression',()=>{
 it('rejects sold-out orders without charging, creating kitchen work or consuming a request id',()=>{
  let s=createGame(20261104);
  s.phase='open';s.minute=420;s.paused=false;s.settings.arrivalsPerHour=0;s.events=[];
  s=act(s,{type:'visitor-seat',tableId:'t1'});
  const item=s.menu.find(m=>m.id==='thai-tea');
  expect(item).toBeDefined();
  const initialCash=s.cash,initialLedger=s.ledger.length;
  const original=s.inventory.map(i=>({id:i.id,quantity:i.quantity}));
  s.inventory.forEach(i=>{i.quantity=0;});
  const request={type:'visitor-submit' as const,channel:'table-qr' as const,requestId:'retry-after-restock',menuId:'thai-tea'};
  s=act(s,request);
  expect(s.orders).toHaveLength(0);
  expect(s.cash).toBe(initialCash);
  expect(s.ledger).toHaveLength(initialLedger);
  expect(getMetrics(s).revenue).toBe(0);
  for(const i of s.inventory){i.quantity=original.find(v=>v.id===i.id)!.quantity;}
  s=act(s,request);
  expect(s.orders).toHaveLength(1);
  s=act(s,request);
  expect(s.orders).toHaveLength(1);
  expect(s.cash).toBe(initialCash);
 });
 it('does not consume a QR request ID when bundle catalog is invalid',()=>{
  let s=createGame(20261104);
  s.phase='open';s.minute=420;s.paused=false;s.settings.arrivalsPerHour=0;s.events=[];
  s=act(s,{type:'visitor-seat',tableId:'t1'});
  const item=s.menu.find(m=>m.id==='thai-tea')!;
  item.components=[{menuId:'missing-component',quantity:1}];
  const request={type:'visitor-submit' as const,channel:'table-qr' as const,requestId:'bundle-retry',menuId:'thai-tea'};
  s=act(s,request);
  expect(s.orders).toHaveLength(0);
  expect(s.customers.find(c=>c.player)?.requestIds??[]).not.toContain('bundle-retry');
  item.components=[];
  s.menu.find(m=>m.id==='thai-tea')!.components=[];
  s=act(s,request);
  expect(s.orders).toHaveLength(1);
  s=act(s,request);
  expect(s.orders).toHaveLength(1);
 });

 it('does not lock the channel after a rejected counter bundle',()=>{
  let s=createGame(20261104);
  s.phase='open';s.minute=420;s.settings.arrivalsPerHour=0;s.events=[];
  s.menu.find(m=>m.id==='thai-tea')!.components=[{menuId:'missing',quantity:1}];
  s=act(s,{type:'visitor-submit',channel:'counter',requestId:'retry',menuId:'thai-tea'});
  expect(s.orders).toHaveLength(0);
  expect(s.customers.find(c=>c.player)?.orderChannel).toBeUndefined();
  s.menu.find(m=>m.id==='thai-tea')!.components=[];
  s=act(s,{type:'visitor-seat',tableId:'t3'});
  s=act(s,{type:'visitor-submit',channel:'table-qr',requestId:'retry',menuId:'thai-tea'});
  expect(s.orders).toHaveLength(1);
  expect(s.orders[0].tableId).toBe('t3');
 });

});
