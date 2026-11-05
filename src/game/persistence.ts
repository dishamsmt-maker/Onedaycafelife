import { freshLife, POT_SLOTS, UMBRELLAS, potObstacles } from './cozy';
import Dexie, { type Table } from 'dexie';
import type { GameState } from './types';
import { INITIAL_MENU, INITIAL_INVENTORY } from './data';
import { canWalk, findPath, STATIONS, TABLE_LAYOUT } from './world';
class Saves extends Dexie { saves!:Table<{id:string;version:number;updatedAt:number;state:GameState},string>; constructor(){super('one-day-cafe-v1');this.version(1).stores({saves:'id,updatedAt'});} }
const db=new Saves();
export function validateSave(value:unknown):GameState {
 const s=value as GameState;
 if(!s||s.version!==1||!Number.isFinite(s.minute)||!Number.isFinite(s.cash)||!Array.isArray(s.inventory)||!Array.isArray(s.employees)||s.employees.length!==5||!Array.isArray(s.orders)||!Array.isArray(s.ledger)||!s.settings||!Array.isArray(s.tables)||!s.garden)throw new Error('ไฟล์บันทึกไม่รองรับหรือข้อมูลไม่ครบ เกมปัจจุบันยังปลอดภัย');
 const orders=new Set(s.orders.map(o=>o.id)); const tx=new Set(s.ledger.map(t=>t.id));
 if(orders.size!==s.orders.length||tx.size!==s.ledger.length||s.inventory.some(i=>!Number.isFinite(i.quantity)||i.quantity<0))throw new Error('ข้อมูลบันทึกมีรายการซ้ำหรือสต็อกไม่ถูกต้อง');
 const migrated=structuredClone(s);
 const oldLayout=(migrated.layoutVersion??1)<2;
 migrated.tables=TABLE_LAYOUT.map(t=>{const prior=migrated.tables.find(p=>p.id===t.id);return {...t,position:!oldLayout&&prior?[...prior.position]:[...t.position],enabled:prior?.enabled!==false,umbrella:prior?.umbrella??'cream',customerIds:prior?[...prior.customerIds]:[],dirty:prior?.dirty??false}});
 if(oldLayout){
  migrated.wateredCount=Math.floor((migrated.wateredCount??0)/17)*22+Math.floor(((migrated.wateredCount??0)%17)/17*22);
  for(const c of migrated.customers){const t=migrated.tables.find(t=>t.id===c.tableId);const index=t?.customerIds.indexOf(c.id)??0;c.position=t?[t.position[0]+(index%2===0?-.9:.9),t.position[1]+(index<2?-.25:.25)]:[...STATIONS.queue];c.path=c.status==='leaving'?findPath(c.position,STATIONS.entrance):[];}
  for(const e of migrated.employees){e.position=[...(e.id==='ham'?STATIONS.bar:e.id==='na'?STATIONS.kitchen:e.id==='alee'?STATIONS.manager:STATIONS.rest)];if(e.task){const t=migrated.tables.find(t=>t.id===e.task?.tableId);e.task.target=t?[t.position[0],t.position[1]-.9]:[...STATIONS.pickup];if(e.task.maintenance==='water'){e.task=null;}else if(e.task.maintenance==='sign')e.task.target=[-1.9,1.1];else if(e.task.stage==='deliver')e.task.target=t?[t.position[0],t.position[1]-.9]:[...STATIONS.queue];}}
 }
 migrated.layoutVersion=2;
 const life={...freshLife(),...migrated.life};
 if(!Array.isArray(life.pots)||life.pots.some(p=>!POT_SLOTS[p.slot]||!['monstera','rubber','fern'].includes(p.species))||new Set(life.pots.map(p=>p.slot)).size!==life.pots.length||!Array.isArray(life.journal)||!Array.isArray(life.photos)||!['warm','amber','white'].includes(life.light)||!Number.isFinite(life.dirtyDishes)||life.dirtyDishes<0)throw new Error('ข้อมูลสวนหรือสมุดบันทึกไม่ถูกต้อง');
 if(migrated.tables.some(t=>t.position.length!==2||t.position.some(n=>!Number.isFinite(n))||!(t.umbrella! in UMBRELLAS)))throw new Error('ตำแหน่งโต๊ะไม่ถูกต้อง');
 migrated.life=life;
 migrated.staffSchedule=migrated.staffSchedule??{};
 const old=new Map(migrated.menu.map(m=>[m.id,m]));
 migrated.menu=INITIAL_MENU.map(m=>{const previous=old.get(m.id);return {...structuredClone(m),...(s.catalogVersion===2&&previous?{price:previous.price,enabled:previous.enabled}:{}),hidden:m.hidden};});
 // Keep retired definitions so already accepted tickets can finish, but never sell them again.
 for(const m of s.menu)if(!migrated.menu.some(n=>n.id===m.id))migrated.menu.push({...m,hidden:true,enabled:false});
 for(const i of INITIAL_INVENTORY)if(!migrated.inventory.some(n=>n.id===i.id))migrated.inventory.push({...i,quantity:0,expiresDay:migrated.day+i.expiresDay-1});
 migrated.garden={moisture:s.garden.moisture,cleanliness:s.garden.cleanliness,lastInspection:s.garden.lastInspection,inspections:s.garden.inspections,careRequested:!!s.garden.careRequested};
 for(const employee of migrated.employees){
  employee.controlled=false;
  if(employee.task?.manual){const o=migrated.orders.find(o=>o.id===employee.task?.orderId);if(o&&!['completed','cancelled'].includes(o.status)){o.status=employee.task.kind==='serve'?'ready':'waiting';o.workerId=undefined;}employee.task=null;}
  if(!canWalk(...employee.position,.16,migrated.tables,potObstacles(migrated))){const target=employee.id==='ham'?STATIONS.bar:employee.id==='na'?STATIONS.kitchen:employee.id==='alee'?STATIONS.garden:STATIONS.rest;employee.position=[...target];}
  if(employee.task){if(employee.task.maintenance){/* Keep saved plant / ladder / customer destination. */}else if(employee.task.kind==='inspect')employee.task.target=[...STATIONS.garden];else if(employee.task.productionStep==='collect')employee.task.target=[...STATIONS.fridge];else if(employee.task.kind==='brew')employee.task.target=[...STATIONS.bar];else if(employee.task.kind==='cook')employee.task.target=[...STATIONS.kitchen];
   if(employee.task.phase==='walking')employee.task.path=findPath(employee.position,employee.task.target,migrated.tables,potObstacles(migrated));}
 }
  migrated.tables=migrated.tables.map((t,n)=>({...t,name:`T${n+1}`}));
 migrated.catalogVersion=2;migrated.paused=true;return migrated;
}
export async function saveGame(state:GameState){await db.saves.put({id:'current',version:1,updatedAt:Date.now(),state:structuredClone(state)});}
export async function loadGame(){const row=await db.saves.get('current');return row?validateSave(row.state):null;}
export async function deleteSave(){await db.saves.delete('current');}
