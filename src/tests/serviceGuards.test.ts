import { describe, expect, it } from 'vitest';
import { act, createGame, tick } from '../game/engine';
import { findPath, segmentWalkable, STATIONS, TABLE_LAYOUT } from '../game/world';

function delivery() {
  let s=createGame(20261104);
  s.phase='open';s.minute=420;s.paused=false;s.events=[];s.settings.arrivalsPerHour=0;
  s=act(s,{type:'visitor-seat',tableId:'t3'});
  s=act(s,{type:'visitor-submit',channel:'table-qr',requestId:'guard',menuId:'chicken-porridge'});
  for(let i=0;i<600;i++){
    s=tick(s,.1);
    const e=s.employees.find(e=>e.task?.stage==='deliver');
    if(e)return {s,staffId:e.id};
  }
  throw new Error('No real delivery started');
}

describe('delivery and navigation guards',()=>{
  it('cannot complete a delivery remotely even with an exhausted path',()=>{
    let {s,staffId}=delivery();
    const e=s.employees.find(e=>e.id===staffId)!;
    e.position=[-.5,1]; e.task!.path=[]; e.task!.phase='working'; e.task!.remaining=0;
    s=tick(s,.1);
    expect(s.orders[0].status).not.toBe('completed');
    expect(s.ledger.filter(t=>t.type==='food-sale')).toHaveLength(0);
  });
  it('does not resurrect a delivery when the customer leaves',()=>{
    let {s}=delivery();
    s=act(s,{type:'visitor-leave'});s=tick(s,30);
    expect(s.orders[0].status).toBe('cancelled');
    expect(s.ledger.filter(t=>t.type==='food-sale')).toHaveLength(0);
    expect(s.ledger.filter(t=>t.type==='cogs')).toHaveLength(1);
  });
  it('never assigns two staff to the same order through shift changes',()=>{
    let {s}=delivery();
    for(let i=0;i<500;i++){
      if(i===1)s=act(s,{type:'server',id:'pun'});
      if(i===10)s=act(s,{type:'server',id:'ken'});
      s=tick(s,.1);
      const ids=s.employees.flatMap(e=>e.task?.orderId?[e.task.orderId]:[]);
      expect(new Set(ids).size).toBe(ids.length);
    }
    expect(s.orders[0].status).toBe('completed');
    expect(s.todayWaits).toHaveLength(1);
  });
  it('station and table-service routes have collision-free segments',()=>{
    const destinations=[...Object.values(STATIONS),...TABLE_LAYOUT.map(t=>[t.position[0],t.position[1]-.9] as [number,number])];
    for(const target of destinations){
      const path=findPath(STATIONS.entrance,target);
      expect(path.length).toBeGreaterThan(0);
      let previous=STATIONS.entrance;
      for(const point of path){expect(segmentWalkable(previous,point)).toBe(true);previous=point;}
    }
  });
});
