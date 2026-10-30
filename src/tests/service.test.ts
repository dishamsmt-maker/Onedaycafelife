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
