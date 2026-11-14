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
});
