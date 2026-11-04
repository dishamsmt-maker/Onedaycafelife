import {expect,it} from 'vitest';
import {act,createGame,tick} from '../game/engine';
import {WATER_STOPS,drinkSteps} from '../game/service';
import {canWalk} from '../game/world';
function quiet(){const s=createGame(123);s.paused=false;s.settings.arrivalsPerHour=0;s.events=[];return s;}
it('Alee mounts before opening, removes at midday, remounts evening and removes closing',()=>{
 let s=quiet();s=tick(s,4.9);expect(s.signMounted).toBe(true);
 s.minute=630;s=tick(s,15);expect(s.signMounted).toBe(false);
 s.minute=1020;s=tick(s,15);expect(s.signMounted).toBe(true);
 s=act(s,{type:'close'});s=tick(s,20);expect(s.signMounted).toBe(false);
});
it('visits every actual garden plant once per morning and resets next day',()=>{
 let s=quiet();s=tick(s,100);expect(s.wateredCount).toBe(WATER_STOPS.length);
 expect(WATER_STOPS.every(p=>canWalk(...p))).toBe(true);
 const count=s.wateredCount;s=tick(s,30);expect(s.wateredCount).toBe(count);
 s=act(s,{type:'close'});s=tick(s,150);s=act(s,{type:'next-day'});expect(s.wateredCount).toBe(0);
});
it('delayed customer asks after ten minutes and a travelling server responds once',()=>{
 let s=quiet();s.minute=420;s.phase='open';s.baristaMode='na';s.employees.find(e=>e.id==='na')!.controlled=true;
 s=act(s,{type:'visitor-order',menuId:'latte'});s=tick(s,10);expect(s.customers.find(c=>c.player)?.askedAt).toBeUndefined();
 s=tick(s,10);const c=s.customers.find(c=>c.player)!;expect(c.askedAt).toBeDefined();expect(c.answeredAt).toBeGreaterThan(c.askedAt!);
 expect(s.notices.filter(n=>n.text.includes('อาหารเสร็จหรือยัง'))).toHaveLength(1);
});
it('drink workflows follow actual recipe families',()=>{
 expect(drinkSteps({beans:.018,milk:.16},'latte')).toEqual(['เตรียมแก้ว','บดกาแฟ','สกัดกาแฟ','เติมนม','เติมน้ำแข็ง','ผสมและปิดฝา']);
 expect(drinkSteps({tea:.01},'hot-tea')).not.toContain('เติมน้ำแข็ง');
 expect(drinkSteps({soda:1,lime:.03},'lime-soda')).toContain('เติมโซดา');
});
it('finishes a second plant round before closing and resumes its progress from save',()=>{
 let s=quiet();s=tick(s,100);expect(s.wateredCount).toBe(WATER_STOPS.length);
 s=act(s,{type:'close'});s=tick(s,5);expect(s.phase).toBe('closing');
 s=JSON.parse(JSON.stringify(s));s=tick(s,90);
 expect(s.wateredCount).toBe(WATER_STOPS.length*2);expect(s.phase).toBe('closed');
 expect(s.reports).toHaveLength(1);
});
it('both servers help a real delivery backlog without duplicate assignments or charges',()=>{
 let s=quiet();s.minute=420;s.phase='open';s.settings.patience=180;
 s=act(s,{type:'rush',size:20});const carriers=new Set<string>();
 for(let i=0;i<600;i++){
  s=tick(s,.1);
  const tasks=s.employees.filter(e=>e.task?.kind==='serve'&&e.task.orderId);
  expect(new Set(tasks.map(e=>e.task!.orderId)).size).toBe(tasks.length);
  for(const e of tasks)carriers.add(e.id);
 }
 expect([...carriers].sort()).toEqual(['ken','pun']);
 const counts=s.employees.filter(e=>e.id==='ken'||e.id==='pun').map(e=>e.tasksDone);
 expect(Math.min(...counts)/counts.reduce((a,b)=>a+b,0)).toBeGreaterThanOrEqual(.4);
 const sales=s.ledger.filter(t=>t.type==='food-sale'||t.type==='drink-sale');
 expect(new Set(sales.map(t=>t.orderId)).size).toBe(sales.length);
 expect(s.orders.some(o=>o.status==='completed')).toBe(true);
});
it('occasional children reserve a seat with their guardian and depart together',()=>{
 let s=quiet();s.minute=420;s.phase='open';s.settings.patience=180;
 s=act(s,{type:'rush',size:20});const children=s.customers.filter(c=>c.guardianId);
 expect(children.length).toBeGreaterThan(0);
 for(const child of children){const guardian=s.customers.find(c=>c.id===child.guardianId)!;expect(guardian).toBeDefined();expect(child.tableId).toBe(guardian.tableId);}
 for(let i=0;i<1000;i++){
  s=tick(s,.1);
  for(const child of s.customers.filter(c=>c.guardianId&&c.status!=='leaving'))expect(s.customers.find(c=>c.id===child.guardianId)?.status).not.toBe('leaving');
 }
 s=act(s,{type:'close'});s=tick(s,180);expect(s.phase).toBe('closed');expect(s.customers).toHaveLength(0);
});
