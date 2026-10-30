import { create } from 'zustand';
import { useGame } from './store';
import { menuAvailable, menuRecipe } from './engine';
import { touchControls } from './touchControls';
import type { StaffId,Vec2 } from './types';

interface VisitorState {
 role:'customer'|StaffId;
 tableId:string|null;
 scannedTableId:string|null;
 scanTable:()=>boolean;
 prepay:()=>boolean;
 action:'idle'|'eating'|'drinking';
 message:string;
 returnPosition:Vec2|null;
 setRole:(role:'customer'|StaffId)=>void;
 sit:(tableId:string)=>boolean;
 stand:()=>void;
 order:(menuId:string)=>boolean;
 consume:(kind:'food'|'drink')=>boolean;
 pay:()=>boolean;
 clearMessage:()=>void;
}
const moveCamera=(x:number,z:number,y=1.62,yaw?:number)=>{
 touchControls.position={x,z};touchControls.eyeHeight=y;
 if(yaw!==undefined)touchControls.view.yaw=yaw;
 touchControls.cameraRevision++;touchControls.reset();
};
export const playerCustomer=()=>useGame.getState().game.customers.find(c=>c.player&&c.status!=='leaving');
export const useVisitor=create<VisitorState>((set,get)=>({
 role:'customer',tableId:null,scannedTableId:null,action:'idle',message:'',returnPosition:null,
 clearMessage:()=>set({message:''}),
 scanTable:()=>{const id=get().tableId,c=playerCustomer();if(!id||c?.tableId!==id){set({message:'นั่งที่โต๊ะก่อนแตะ QR'});return false;}set({scannedTableId:id,message:'เปิดเมนูจาก QR โต๊ะแล้ว · เลือกรายการเพื่อยืนยัน'});return true;},
 prepay:()=>{const c=playerCustomer();if(c?.orderChannel!=='counter')return false;useGame.getState().dispatch({type:'visitor-prepay'});set({message:'รับชำระแล้ว · ส่งเข้าคิวครัวและบาร์'});return true;},
 setRole:role=>{
  get().stand();useGame.getState().dispatch({type:'control-staff',id:role==='customer'?null:role});
  if(role==='customer')moveCamera(.4,-6.1,1.62,3.09);
  else {const e=useGame.getState().game.employees.find(e=>e.id===role)!;moveCamera(-e.position[0],e.position[1],1.62,Math.PI/2);}
  set({role,tableId:null,action:'idle',message:role==='customer'?'เข้ามานั่งพักที่ร้านได้เลย':`ควบคุม ${role.toUpperCase()} · งานอัตโนมัติของคนนี้พักชั่วคราว`});
 },
 sit:tableId=>{
  if(get().role!=='customer'){set({message:'เปลี่ยนเป็นลูกค้าก่อนเลือกที่นั่ง'});return false;}
  if(playerCustomer()?.orderChannel==='counter'){set({message:'รับรายการซื้อกลับให้ครบก่อนเริ่มบิลนั่งร้าน'});return false;}
  const game=useGame.getState().game,t=game.tables.find(t=>t.id===tableId),existing=playerCustomer();
  if(!t||t.dirty||(t.customerIds.length>=t.capacity&&!t.customerIds.includes(existing?.id??''))){set({message:'โต๊ะนี้ยังไม่พร้อมรับลูกค้า'});return false;}
  if(Math.hypot(-touchControls.position.x-t.position[0],touchControls.position.z-t.position[1])>1.7){set({message:'เดินเข้าใกล้โต๊ะก่อนนั่ง'});return false;}
  const back:Vec2=[touchControls.position.x,touchControls.position.z];
  useGame.getState().dispatch({type:'visitor-seat',tableId});const c=playerCustomer();if(!c?.tableId)return false;
  // Actual NPC seat allocation chooses a free chair. Rendered world is X mirrored.
  const x=-c.position[0],z=c.position[1],targetX=-t.position[0];
  moveCamera(x,z,1.12,Math.atan2(-(targetX-x),-(t.position[1]-z)));
  touchControls.view.pitch=-.18;
  set({tableId,scannedTableId:null,returnPosition:back,message:`นั่งที่${t.name}`,action:'idle'});return true;
 },
 stand:()=>{
  const state=get();if(!state.tableId)return;
  const p=state.returnPosition??[.5,6.0];
  moveCamera(p[0],p[1]);set({tableId:null,scannedTableId:null,returnPosition:null,action:'idle',message:'ลุกจากโต๊ะแล้ว'});
 },
 order:menuId=>{
  const state=get(),game=useGame.getState().game,m=game.menu.find(m=>m.id===menuId);
  if(state.role!=='customer'){set({message:'เปลี่ยนเป็นลูกค้าก่อนสั่งอาหาร'});return false;}
  const atCounter=Math.hypot(-touchControls.position.x+.2,touchControls.position.z-1.65)<1.15;
  if(state.tableId&&state.scannedTableId!==state.tableId){set({message:'แตะ QR บนโต๊ะก่อนสั่งอาหาร'});return false;}
  if(!state.tableId&&!atCounter){set({message:'สั่งที่เคาน์เตอร์ หรือเลือกนั่งโต๊ะก่อน'});return false;}
  if(!m||!menuAvailable(m,game.minute)||game.phase!=='open'){set({message:'เมนูนี้ยังไม่เปิดขายในช่วงนี้'});return false;}
  if(Object.entries(menuRecipe(game,m)).some(([id,q])=>(game.inventory.find(i=>i.id===id)?.quantity??0)<q)){set({message:'วัตถุดิบเมนูนี้หมดแล้ว'});return false;}
  const previous=game.orders.length;useGame.getState().dispatch({type:'visitor-submit',menuId,channel:state.tableId?'table-qr':'counter',requestId:crypto.randomUUID()});
  if(useGame.getState().game.orders.length===previous){set({message:'ส่งรายการไม่ได้ · ตรวจว่าบิลเดิมเป็นนั่งร้านหรือซื้อกลับ และไม่เกิน 8 รายการ'});return false;}
  const c=playerCustomer(),t=useGame.getState().game.tables.find(t=>t.id===c?.tableId);
  set({message:`รับออร์เดอร์${m.name}แล้ว${t?` · เสิร์ฟที่${t.name}`:' · รับที่เคาน์เตอร์'}`});return true;
 },
 consume:kind=>{
  const state=get(),game=useGame.getState().game,c=playerCustomer();
  if(!state.tableId||state.action!=='idle'){return false;}
  const o=game.orders.find(o=>o.customerId===c?.id&&!o.componentOrderIds?.length&&o.status==='completed'&&!o.consumed&&game.menu.find(m=>m.id===o.menuId)?.kind===kind);
  if(!o){set({message:kind==='food'?'ยังไม่มีอาหารที่เสิร์ฟพร้อมทาน':'ยังไม่มีเครื่องดื่มที่เสิร์ฟแล้ว'});return false;}
  set({action:kind==='food'?'eating':'drinking',message:kind==='food'?'ทานอาหารให้อร่อย':'พักจิบเครื่องดื่มสักหน่อย'});
  // Consumption is distinct from delivery and payment; stock was deducted at production.
  useGame.getState().dispatch({type:'visitor-consume',kind});
  setTimeout(()=>set({action:'idle'}),2200);return true;
 },
 pay:()=>{
  const game=useGame.getState().game,c=playerCustomer();if(!c){set({message:'ยังไม่มีบิลที่ต้องชำระ'});return false;}
  const orders=game.orders.filter(o=>o.customerId===c.id);
  if(orders.some(o=>!['completed','cancelled'].includes(o.status))){set({message:'รอให้เสิร์ฟครบก่อนชำระเงิน'});return false;}
  const total=orders.filter(o=>!o.parentOrderId&&o.status==='completed'&&!o.paid).reduce((a,o)=>a+o.price,0);
  get().stand();useGame.getState().dispatch({type:'visitor-pay'});set({message:`ชำระ ฿${total} แล้ว · ขอบคุณที่แวะ ONE DAY`});return true;
 },
}));
// Releasing the staff role is intentional on reload; no employee stays frozen from an old browser session.
if(import.meta.env.DEV)(globalThis as any).__ONE_DAY_VISITOR__=useVisitor;
