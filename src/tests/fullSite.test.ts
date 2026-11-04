import {expect,it} from 'vitest';
import {act,createGame,tick} from '../game/engine';
import {TABLE_LAYOUT,STATIONS,canVisitorWalk,canWalk,findPath,segmentWalkable,WORLD} from '../game/world';
import {validateSave} from '../game/persistence';
it('connects the entire fifty metre public route and all five tables without crossing the bar',()=>{
 expect(WORLD.width*WORLD.depth).toBe(250);expect(TABLE_LAYOUT).toHaveLength(5);
 for(let z=.3;z<49.6;z+=.1)expect(canVisitorWalk(-1.45,z)).toBe(true);
 for(const t of TABLE_LAYOUT){const destination:[number,number]=[t.position[0],t.position[1]-.9];const path=findPath(STATIONS.pickup,destination);expect(path.at(-1)).toEqual(destination);let previous=STATIONS.pickup;for(const p of path){expect(segmentWalkable(previous,p)).toBe(true);previous=p;}}
 expect(canVisitorWalk(...STATIONS.kitchen)).toBe(false);expect(canWalk(...STATIONS.kitchen)).toBe(true);
});
it('migrates a legacy active bill into five tables idempotently while preserving money and stock',()=>{
 let old=createGame();old.minute=420;old.phase='open';old=act(old,{type:'visitor-seat',tableId:'t3'});old=act(old,{type:'visitor-submit',channel:'table-qr',menuId:'latte',requestId:'legacy'});
 delete old.layoutVersion;old.tables=old.tables.slice(0,3);old.tables[2].position=[-1.25,8.35];
 const migrated=validateSave(old),again=validateSave(migrated);
 expect(migrated.tables).toHaveLength(5);expect(migrated.tables[2].position).toEqual([.8,19]);
 expect(migrated.cash).toBe(old.cash);expect(migrated.inventory).toEqual(old.inventory);expect(migrated.ledger).toEqual(old.ledger);expect(migrated.orders).toEqual(old.orders);expect(again).toEqual(migrated);
});
it('serves table five through real production, consumption and once-only payment',()=>{
 let s=createGame();s.minute=420;s.phase='open';s.paused=false;s.events=[];s.settings.arrivalsPerHour=0;
 s=act(s,{type:'visitor-seat',tableId:'t5'});s=act(s,{type:'visitor-submit',channel:'table-qr',menuId:'chicken-porridge',requestId:'table-five'});s=tick(s,60);
 expect(s.orders[0].status).toBe('completed');expect(s.orders[0].tableId).toBe('t5');expect(s.ledger.filter(t=>t.type==='cogs')).toHaveLength(1);
 s=act(s,{type:'visitor-consume',kind:'food'});s=act(s,{type:'visitor-pay'});const cash=s.cash;s=act(s,{type:'visitor-pay'});expect(s.cash).toBe(cash);expect(s.ledger.filter(t=>t.type==='food-sale')).toHaveLength(1);
});
it('finishes the physical morning plant route before opening in the expanded world',()=>{
 let s=createGame();s.paused=false;s.events=[];s.settings.arrivalsPerHour=0;
 s=tick(s,59.9);expect(s.minute).toBeLessThan(390);expect(s.phase).toBe('preparing');expect(s.wateredCount).toBeGreaterThanOrEqual(22);
});
