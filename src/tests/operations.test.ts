import {it,expect} from 'vitest';
import {act,createGame,tick} from '../game/engine';
import {operationIssues,productionView,storageGroup} from '../game/operations';
import {validateSave} from '../game/persistence';
it('collection removes real stock once, carries ingredients and resumes from a save',()=>{
 let s=createGame(22);s.minute=420;s.phase='open';s.paused=false;s.settings.arrivalsPerHour=0;s.events=[];
 s=act(s,{type:'visitor-order',menuId:'chicken-porridge'});
 const before=s.inventory.find(i=>i.id==='chicken')!.quantity;
 let carrying=false;
 for(let n=0;n<100;n++){s=tick(s,.1);const na=s.employees.find(e=>e.id==='na')!;if(na.task?.productionStep==='prepare'&&na.task.phase==='walking'){carrying=true;expect(productionView(s,na)?.stage).toBe('นำวัตถุดิบไปสถานี');break;}}
 expect(carrying).toBe(true);expect(s.inventory.find(i=>i.id==='chicken')!.quantity).toBeCloseTo(before-.09);
 s=validateSave(JSON.parse(JSON.stringify(s)));s.paused=false;s=tick(s,35);
 expect(s.orders[0].status).toBe('completed');expect(s.ledger.filter(t=>t.type==='cogs')).toHaveLength(1);
});
it('dashboard derives real shortages, planned work and announced next-hour events',()=>{
 let s=createGame();s.inventory[0].quantity=0;s.events=[{id:'known',day:1,minute:s.minute+30,label:'กรุ๊ป',size:12,announced:true,triggered:false},{id:'secret',day:1,minute:s.minute+15,label:'ไม่ทราบล่วงหน้า',size:10,announced:false,triggered:false}];
 expect(operationIssues(s).some(i=>i.id==='stock:chicken')).toBe(true);
 expect(operationIssues(s).some(i=>i.id==='event:known')).toBe(true);expect(operationIssues(s).some(i=>i.id==='event:secret')).toBe(false);
 s=act(s,{type:'plan-operation',id:'stock:chicken'});expect(s.operationPlans).toContain('stock:chicken');
 s=act(s,{type:'restock',id:'chicken',quantity:4});expect(operationIssues(s).some(i=>i.id==='stock:chicken')).toBe(false);
 expect(storageGroup(s.inventory.find(i=>i.id==='vegetables')!)).toBe('ผัก');expect(storageGroup(s.inventory[0])).toBe('เนื้อและอาหารแช่แข็ง');
});
