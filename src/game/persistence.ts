import Dexie, { type Table } from 'dexie';
import type { GameState } from './types';
import { INITIAL_MENU, INITIAL_INVENTORY } from './data';
import { canWalk, findPath, STATIONS } from './world';
class Saves extends Dexie { saves!:Table<{id:string;version:number;updatedAt:number;state:GameState},string>; constructor(){super('one-day-cafe-v1');this.version(1).stores({saves:'id,updatedAt'});} }
const db=new Saves();
export function validateSave(value:unknown):GameState {
 const s=value as GameState;
 if(!s||s.version!==1||!Number.isFinite(s.minute)||!Number.isFinite(s.cash)||!Array.isArray(s.inventory)||!Array.isArray(s.employees)||s.employees.length!==5||!Array.isArray(s.orders)||!Array.isArray(s.ledger)||!s.settings||!Array.isArray(s.tables)||!s.garden)throw new Error('ไฟล์บันทึกไม่รองรับหรือข้อมูลไม่ครบ เกมปัจจุบันยังปลอดภัย');
 const orders=new Set(s.orders.map(o=>o.id)); const tx=new Set(s.ledger.map(t=>t.id));
 if(orders.size!==s.orders.length||tx.size!==s.ledger.length||s.inventory.some(i=>!Number.isFinite(i.quantity)||i.quantity<0))throw new Error('ข้อมูลบันทึกมีรายการซ้ำหรือสต็อกไม่ถูกต้อง');
 const migrated=structuredClone(s);
 const old=new Map(migrated.menu.map(m=>[m.id,m]));
 migrated.menu=INITIAL_MENU.map(m=>{const previous=old.get(m.id);return {...structuredClone(m),...(s.catalogVersion===2&&previous?{price:previous.price,enabled:previous.enabled}:{}),hidden:m.hidden};});
 // Keep retired definitions so already accepted tickets can finish, but never sell them again.
 for(const m of s.menu)if(!migrated.menu.some(n=>n.id===m.id))migrated.menu.push({...m,hidden:true,enabled:false});
 for(const i of INITIAL_INVENTORY)if(!migrated.inventory.some(n=>n.id===i.id))migrated.inventory.push({...i,quantity:0,expiresDay:migrated.day+i.expiresDay-1});
 migrated.garden={moisture:s.garden.moisture,cleanliness:s.garden.cleanliness,lastInspection:s.garden.lastInspection,inspections:s.garden.inspections,careRequested:!!s.garden.careRequested};
 for(const employee of migrated.employees){
  employee.controlled=false;
  if(!canWalk(...employee.position)){const target=employee.id==='ham'?STATIONS.bar:employee.id==='na'?STATIONS.kitchen:employee.id==='alee'?STATIONS.garden:[1,9.3] as [number,number];employee.position=[...target];}
  if(employee.task){if(employee.task.kind==='inspect')employee.task.target=[-.1,9.35];else if(employee.task.kind==='brew')employee.task.target=[...STATIONS.bar];else if(employee.task.kind==='cook')employee.task.target=[...STATIONS.kitchen];
   if(employee.task.phase==='walking')employee.task.path=findPath(employee.position,employee.task.target);}
 }
 migrated.catalogVersion=2;migrated.paused=true;return migrated;
}
export async function saveGame(state:GameState){await db.saves.put({id:'current',version:1,updatedAt:Date.now(),state:structuredClone(state)});}
export async function loadGame(){const row=await db.saves.get('current');return row?validateSave(row.state):null;}
export async function deleteSave(){await db.saves.delete('current');}
