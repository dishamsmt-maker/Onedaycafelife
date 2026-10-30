import type {GameState,Ingredient,Employee} from './types';
export const storageGroup=(i:Ingredient)=>['chicken','shrimp','seabass','squid','sausage','nuggets'].includes(i.id)?'เนื้อและอาหารแช่แข็ง':['vegetables','fries'].includes(i.id)?'ผัก': ['milk','water','soda','lime'].includes(i.id)?'เครื่องดื่ม':i.storage==='fridge'?'ไข่และของสด':'ของแห้ง';
export function productionView(s:GameState,e:Employee){
 const task=e.task,order=s.orders.find(o=>o.id===task?.orderId),menu=s.menu.find(m=>m.id===order?.menuId);
 if(!task||!order||!menu||!['cook','brew'].includes(task.kind))return null;
 return {order,menu,stage:task.productionStep==='collect'?'หยิบวัตถุดิบ':task.phase==='walking'?'นำวัตถุดิบไปสถานี':task.remaining>menu.duration*s.settings.prepMultiplier*.45?'กำลังเตรียม':'กำลังปรุงและจัดเสิร์ฟ',progress:task.phase==='working'&&task.productionStep!=='collect'?Math.max(0,Math.min(1,1-task.remaining/(menu.duration*s.settings.prepMultiplier))):0};
}
export function operationIssues(s:GameState){
 const issues:{id:string;title:string;detail:string;period:'now'|'next';working:boolean;ingredientId?:string}[]=[];
 for(const i of s.inventory.filter(i=>i.quantity<=i.reorder))issues.push({id:'stock:'+i.id,title:i.quantity<=0?`${i.name}หมด`:`${i.name}ใกล้หมด`,detail:`เหลือ ${i.quantity.toFixed(2)} ${i.unit} · ซื้อของเพิ่มหรือพักเมนูที่ใช้`,period:'now',working:false,ingredientId:i.id});
 for(const o of s.orders.filter(o=>!o.componentOrderIds?.length&&!['completed','cancelled'].includes(o.status))){const e=s.employees.find(e=>e.task?.orderId===o.id),m=s.menu.find(m=>m.id===o.menuId),c=s.customers.find(c=>c.id===o.customerId);if(s.minute-o.createdAt>8||!e)issues.push({id:'order:'+o.id,title:`${m?.name??o.menuId} · ${o.id}`,detail:c?.orderChannel==='counter'&&!o.paid?'รอลูกค้าชำระเงิน':e?`${e.name} · ${productionView(s,e)?.stage??'กำลังส่งมอบ'}`:'รอคนหรือสถานีว่าง / ตรวจวัตถุดิบ',period:'now',working:!!e});}
 for(const ev of s.events.filter(e=>e.announced&&!e.triggered&&e.minute>=s.minute&&e.minute<=s.minute+60))issues.push({id:'event:'+ev.id,title:ev.label,detail:`อีก ${Math.ceil(ev.minute-s.minute)} นาที · ประมาณ ${ev.size} คน ตามนัดหมายในเกม`,period:'next',working:false});
 for(const [minute,title] of [[630,'อาหารเช้าหยุดรับรายการใหม่'],[1020,'เริ่มขายของกินเล่น'],[1230,'ปิดรับลูกค้าใหม่']] as const)if(minute>s.minute&&minute<=s.minute+60)issues.push({id:'period:'+minute,title,detail:`อีก ${Math.ceil(minute-s.minute)} นาที · งานที่รับแล้วทำต่อ`,period:'next',working:false});
 return issues;
}
