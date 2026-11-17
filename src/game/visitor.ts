import { create } from 'zustand';
import { useGame } from './store';
import { menuAvailable } from './engine';
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
 prepay:()=>{const c=playerCustomer();if(c?.orderChannel!=='counter')return false;const pending=useGame.getState().game.orders.filter(o=>o.customerId===c.id&&!o.parentOrderId&&!o.paid&&o.status!=='cancelled');
  if(!pending.length){set({message:'ไม่มีรายการซื้อกลับที่รอชำระ'});return false;}
  useGame.getState().dispatch({type:'visitor-prepay'});
  const updated=useGame.getState().game;
  const paid=pending.every(o=>updated.orders.find(row=>row.id===o.id)?.paid&&updated.ledger.some(tx=>tx.orderId===o.id&&['food-sale','drink-sale'].includes(tx.type)));if(!paid){set({message:'ยังชำระไม่ได้ · ตรวจสถานะบิลและลองใหม่'});return false;}set({message:'รับชำระแล้ว · ส่งเข้าคิวครัวและบาร์'});return true;},
 setRole:role=>{
  get().stand();useGame.getState().dispatch({type:'control-staff',id:role==='customer'?null:role});
  if(role==='customer'){
    // Switching to staff mode must not silently orphan an active dine-in bill.
    // Restore the actual simulation seat when returning to customer mode;
    // QR authorization is intentionally cleared so the customer scans again.
    const customer=playerCustomer();
    const seat=customer?.tableId?useGame.getState().game.tables.find(t=>t.id===customer.tableId):undefined;
    if(seat&&customer){
      moveCamera(-customer.position[0],customer.position[1],1.12,3.09);
      set({role,tableId:seat.id,scannedTableId:null,returnPosition:null,action:'idle',message:`กลับมาที่${seat.name} · แตะ QR อีกครั้งเพื่อสั่งอาหาร`});
    }else{
      moveCamera(.4,-6.1,1.62,3.09);
      set({role,tableId:null,scannedTableId:null,returnPosition:null,action:'idle',message:'เข้ามานั่งพักที่ร้านได้เลย'});
    }
  }else{
    const e=useGame.getState().game.employees.find(e=>e.id===role)!;
    moveCamera(-e.position[0],e.position[1],1.62,Math.PI/2);
    set({role,tableId:null,scannedTableId:null,action:'idle',message:`ติดตาม ${role.toUpperCase()} · งานอัตโนมัติยังทำต่อ (ขยับจอยเมื่อว่างเพื่อควบคุม)`});
  }
 },
 sit:tableId=>{
  if(get().role!=='customer'){set({message:'เปลี่ยนเป็นลูกค้าก่อนเลือกที่นั่ง'});return false;}
  if(playerCustomer()?.orderChannel==='counter'){set({message:'รับรายการซื้อกลับให้ครบก่อนเริ่มบิลนั่งร้าน'});return false;}
  const current=playerCustomer();
  if(current?.tableId && current.tableId!==tableId && useGame.getState().game.orders.some(o=>o.customerId===current.id&&o.status!=='cancelled'&&(!o.paid||o.status!=='completed'))){set({message:'มีออร์เดอร์ค้างที่โต๊ะเดิม · รอเสิร์ฟและชำระให้ครบก่อนย้ายโต๊ะ'});return false;}
  const game=useGame.getState().game,t=game.tables.find(t=>t.id===tableId),existing=playerCustomer();
  if(!t||t.dirty||(t.customerIds.length>=t.capacity&&!t.customerIds.includes(existing?.id??''))){set({message:'โต๊ะนี้ยังไม่พร้อมรับลูกค้า'});return false;}
  if(Math.hypot(-touchControls.position.x-t.position[0],touchControls.position.z-t.position[1])>1.7){set({message:'เดินเข้าใกล้โต๊ะก่อนนั่ง'});return false;}
  const back:Vec2=[touchControls.position.x,touchControls.position.z];
  useGame.getState().dispatch({type:'visitor-seat',tableId});const c=playerCustomer();
  // A rejected seat action must not make the UI claim another table's session.
  if(c?.tableId!==tableId){set({message:'ย้ายโต๊ะไม่ได้ระหว่างมีออร์เดอร์ค้าง · กลับไปโต๊ะเดิม'});return false;}
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
  // Reject stale QR sessions when the simulation has released or reassigned the seat.
  const seatedPlayer=game.customers.find(c=>c.player&&c.status!=='leaving');
  if(state.tableId&&(!seatedPlayer||seatedPlayer.tableId!==state.tableId)){
   set({tableId:seatedPlayer?.tableId??null,scannedTableId:null,message:'สถานะโต๊ะเปลี่ยนแล้ว · กรุณานั่งและสแกน QR ใหม่'});
   return false;
  }
  if(state.tableId&&state.scannedTableId!==state.tableId){set({message:'แตะ QR บนโต๊ะก่อนสั่งอาหาร'});return false;}
  if(!state.tableId&&!atCounter){set({message:'สั่งที่เคาน์เตอร์ หรือเลือกนั่งโต๊ะก่อน'});return false;}
  if(!m||!menuAvailable(m,game.minute)||game.phase!=='open'){set({message:'เมนูนี้ยังไม่เปิดขายในช่วงนี้'});return false;}
  // The simulation action is the single authority for recipe/sweetness stock checks.
  // A UI-side default-sweetness check can reject a valid low-sugar QR order.
  const beforeIds=new Set(game.orders.map(o=>o.id));
  // randomUUID is unavailable on some non-secure mobile/LAN preview origins.
  // Generate a per-attempt idempotency key without blocking the QR order UI.
  const requestId=globalThis.crypto?.randomUUID?.() ?? `qr-${Date.now()}-${Math.random().toString(36).slice(2)}`;
  useGame.getState().dispatch({type:'visitor-submit',menuId,channel:state.tableId?'table-qr':'counter',requestId});
  const nextGame=useGame.getState().game;
  const player=nextGame.customers.find(c=>c.player&&c.status!=='leaving');
  const accepted=!!player?.requestIds?.includes(requestId)&&nextGame.orders.some(o=>!beforeIds.has(o.id)&&!o.parentOrderId&&o.customerId===player.id&&o.menuId===menuId);
  if(!accepted){set({message:'ส่งรายการไม่ได้ · ตรวจว่าบิลเดิมเป็นนั่งร้านหรือซื้อกลับ และไม่เกิน 8 รายการ'});return false;}
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
  const game=useGame.getState().game,c=playerCustomer();
  if(!c){set({message:'ยังไม่มีบิลที่ต้องชำระ'});return false;}
  const orders=game.orders.filter(o=>o.customerId===c.id);
  if(!orders.length){set({message:'ยังไม่มีรายการอาหารในบิล'});return false;}
  if(orders.some(o=>!['completed','cancelled'].includes(o.status))){set({message:'รอให้เสิร์ฟหรือรับสินค้าครบก่อนปิดบิล'});return false;}
  const roots=orders.filter(o=>!o.parentOrderId&&o.status==='completed');
  if(!roots.length){set({message:'ไม่มีรายการที่ต้องชำระ'});return false;}
  const unpaid=roots.filter(o=>!o.paid);
  if(c.orderChannel==='counter'&&unpaid.length){set({message:'กรุณาชำระรายการซื้อกลับที่เคาน์เตอร์ก่อนรับสินค้า'});return false;}
  const total=unpaid.reduce((sum,o)=>sum+o.price,0);
  if(c.orderChannel!=='counter'&&total<=0){set({message:'ไม่มีรายการค้างชำระ'});return false;}
  // Checkout must be confirmed against this customer's orders, not a global
  // ledger count: another customer's payment must never produce a false success.
  useGame.getState().dispatch({type:'visitor-pay'});
  const updated=useGame.getState().game;
  const settled=roots.every(o=>{
    const current=updated.orders.find(row=>row.id===o.id);
    return current?.paid&&updated.ledger.some(tx=>tx.orderId===o.id&&['food-sale','drink-sale'].includes(tx.type));
  });
  const departed=updated.customers.find(row=>row.id===c.id)?.status==='leaving';
  if(!settled||!departed){set({message:'POS ยังไม่ยืนยันการปิดบิล · โปรดลองใหม่'});return false;}
  get().stand();
  set({message:c.orderChannel==='counter'?'รับสินค้าซื้อกลับครบแล้ว · ขอบคุณที่แวะ HUA CHAO':`ชำระ ฿${total} แล้ว · ขอบคุณที่แวะ HUA CHAO`});
  return true;
 },
}));
// Releasing the staff role is intentional on reload; no employee stays frozen from an old browser session.
if(import.meta.env.DEV)(globalThis as any).__ONE_DAY_VISITOR__=useVisitor;
