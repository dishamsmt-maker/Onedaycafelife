import type { GameState, Table, Vec2 } from './types';

export type CozyStyle = 'realistic' | 'cozy' | 'dreamy';
export interface CozyPreferences {
  style: CozyStyle; nature: boolean; spatial: boolean; life: boolean; weather: boolean;
}
export const DEFAULT_COZY: CozyPreferences = {style:'cozy',nature:true,spatial:true,life:true,weather:true};
export type PlantSpecies = 'monstera' | 'rubber' | 'fern';
export interface PlantedPot {slot:number;species:PlantSpecies;plantedDay:number;}
export interface JournalEntry {id:string;day:number;minute:number;text:string;}
export interface PhotoMemory {id:string;day:number;minute:number;caption:string;}
export interface CafeLife {
  pots:PlantedPot[]; light:'warm'|'amber'|'white'; dirtyDishes:number;
  journal:JournalEntry[]; photos:PhotoMemory[];
}
export const freshLife = ():CafeLife => ({pots:[],light:'warm',dirtyDishes:0,journal:[],photos:[]});
export const POT_SLOTS:Vec2[] = [3,5,15.4,20.2,25.5,28,30,33,37,41,44,48].map(z=>[z===28||z===30?.1:z===44||z===48?-.2:2.08,z]);
export const PLANT_PRICES:Record<PlantSpecies,number>={monstera:450,rubber:650,fern:250};
export const UMBRELLAS = {cream:{label:'ผ้าใบครีม',color:'#e4d7b7',price:1200},olive:{label:'เขียวมะกอก',color:'#7e8d65',price:1400},clay:{label:'ดินเผา',color:'#bb8068',price:1400},none:{label:'เก็บร่ม',color:'#e4d7b7',price:0}} as const;
export type UmbrellaStyle=keyof typeof UMBRELLAS;
export const LIGHT_COLORS={warm:'#ffc27c',amber:'#ffad55',white:'#fff0d5'};
export const activeTables=(s:Pick<GameState,'tables'>)=>s.tables.filter(t=>t.enabled!==false);
export const layoutKey=(tables:Pick<Table,'position'|'enabled'>[])=>tables.filter(t=>t.enabled!==false).map(t=>t.position.join(',')).join(';');
export function gardenComfort(s:GameState) {
  const planted=Math.min(4,(s.life?.pots.length??0)*.5);
  const shade=activeTables(s).filter(t=>t.umbrella!=='none').length/Math.max(1,activeTables(s).length);
  return Math.max(0,Math.min(6,planted+shade*2)) * Math.min(1,s.garden.moisture/45);
}
export function progression(s:GameState) {
  const completed=s.reports.reduce((n,r)=>n+r.completed,0)+(s.reports.some(r=>r.day===s.day)?0:s.orders.filter(o=>!o.parentOrderId&&o.status==='completed').length);
  const regulars=(s.guests??[]).filter(g=>g.visits>=2).length;
  const investment=s.ledger.filter(t=>t.type==='decoration').reduce((n,t)=>n+t.amount,0);
  return {completed,regulars,investment,stage:completed>=100&&regulars>=3?'คาเฟ่ของชุมชน':completed>=20?'มุมพักประจำวัน':'คีออสก์เริ่มต้น',milestones:[
    {label:'กาแฟและอาหารจานแรก',done:completed>0},
    {label:'ส่งมอบครบ 20 รายการ',done:completed>=20},
    {label:'มีคนกลับมาแวะอีก',done:regulars>0},
    {label:'ลงมือจัดสวนของตัวเอง',done:(s.life?.pots.length??0)>0},
    {label:'บันทึกภาพความทรงจำ',done:(s.life?.photos.length??0)>0},
    {label:'เปิดร้านครบ 3 วัน',done:s.reports.length>=3},
  ]};
}
export function guestActivity(id:string,takeaway:boolean,reason:string):'takeaway'|'reading'|'chatting'|'coffee'|'inspection' {
  if(reason.includes('ตรอ.'))return 'inspection';
  if(takeaway)return 'takeaway';
  const hash=[...id].reduce((n,c)=>n+c.charCodeAt(0),0);
  return (['reading','chatting','coffee'] as const)[hash%3];
}
export const ACTIVITY_LABELS={takeaway:'แวะซื้อกลับ',reading:'อ่านหนังสือเงียบ ๆ',chatting:'นั่งคุยกับเพื่อน',coffee:'พักจิบกาแฟ',inspection:'พักระหว่างรอตรวจรถ'};
export const staffSteps=(kind:'brew'|'cook',visual?:string)=>kind==='brew'?['บด / ตวงชา','สกัด / แช่ชา','เติมน้ำและนมตามสูตร','จัดแก้วพร้อมส่งมอบ']:visual==='porridge'?['เตรียมข้าวและน้ำซุป','ปรุงและคนหม้อ','ตักใส่ชาม','โรยหน้าและจัดถาด']:['เตรียมวัตถุดิบ','ปรุงตามสูตร','จัดจาน','จัดถาดพร้อมส่งมอบ'];
export const potObstacles=(s:Pick<GameState,'life'>)=>(s.life?.pots??[]).map(p=>({x:POT_SLOTS[p.slot][0],z:POT_SLOTS[p.slot][1],w:.42,d:.42}));
