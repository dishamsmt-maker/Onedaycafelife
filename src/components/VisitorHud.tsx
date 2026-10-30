import {useState} from 'react';
import {Coffee,UtensilsCrossed,Users,QrCode} from 'lucide-react';
import {useVisitor} from '../game/visitor';
import type {GameState} from '../game/types';
const labels={waiting:'รอคิวผลิต',walking:'พนักงานกำลังไปสถานี',preparing:'กำลังทำ',ready:'พร้อมแล้ว · รอส่งมอบ',serving:'กำลังส่งมอบ',completed:'ส่งมอบแล้ว',cancelled:'ยกเลิกแล้ว'};
export default function VisitorHud({state,onMenu,onNotice}:{state:GameState;onMenu:()=>void;onNotice:(s:string)=>void}){
 const v=useVisitor();const [roles,setRoles]=useState(false),[bill,setBill]=useState(false);
 const customer=state.customers.find(c=>c.player&&c.status!=='leaving');
 const table=state.tables.find(t=>t.id===v.tableId);
 const tableLabel=table?`โต๊ะ T${Math.max(1,state.tables.indexOf(table)+1)}`:'';
 const orders=state.orders.filter(o=>o.customerId===customer?.id&&!o.parentOrderId);
 const ready=orders.filter(o=>o.status==='completed');
 const unpaid=orders.filter(o=>!o.paid&&o.status!=='cancelled').reduce((n,o)=>n+o.price,0);
 const takeaway=customer?.orderChannel==='counter';
 const run=(fn:()=>unknown)=>{fn();onNotice(useVisitor.getState().message)};
 return <><div className="visitor-role"><button onClick={()=>setRoles(!roles)} aria-label="เลือกตัวละคร"><Users size={14}/>{v.role==='customer'?'ลูกค้า':state.employees.find(e=>e.id===v.role)?.name} ⌄</button>{roles&&<div className="role-list">{(['customer','ham','na','alee','ken','pun'] as const).map(id=><button key={id} onClick={()=>{run(()=>v.setRole(id));setRoles(false)}}>{id==='customer'?'ลูกค้า':state.employees.find(e=>e.id===id)?.name}</button>)}</div>}</div>
 {v.role==='customer'?<div className="visitor-story"><span>ONE DAY · TABLE & TAKEAWAY</span><strong>{table?`${tableLabel} · สั่งผ่าน QR`:takeaway?`ซื้อกลับ · คิว ${customer.id.split('-').at(-1)}`:'นั่งร้าน: เลือกโต๊ะในสวน · ซื้อกลับ: สั่งหน้าเคาน์เตอร์'}</strong>
 <div className="visitor-actions">{table&&<><button className="table-qr" aria-label="สแกน QR บนโต๊ะ" onClick={()=>{if(v.scanTable())onMenu();else onNotice(useVisitor.getState().message)}}><QrCode size={28}/>แตะ QR เพื่อสั่ง</button><button onClick={()=>run(()=>v.stand())}>ลุกขึ้น</button></>}
 {orders.length>0&&<button onClick={()=>setBill(true)}>บิลและคิว · {orders.length} รายการ</button>}
 {table&&ready.length>0&&<><button aria-label="รับประทานอาหาร" onClick={()=>run(()=>v.consume('food'))}><UtensilsCrossed size={15}/>ทาน</button><button aria-label="ดื่มเครื่องดื่ม" onClick={()=>run(()=>v.consume('drink'))}><Coffee size={15}/>ดื่ม</button></>}
 </div>{takeaway&&<small>{unpaid>0?'ยืนยันชำระในบิลก่อนเริ่มผลิต':'ชำระแล้ว · รอเรียกรับที่เคาน์เตอร์'}</small>}</div>:<div className="visitor-story"><span>TEAM ONE DAY</span><strong>คุณกำลังเดินเป็น {state.employees.find(e=>e.id===v.role)?.name}</strong></div>}
 {bill&&<div className="sheet-backdrop"><section className="game-sheet" role="dialog" aria-label="บิลและคิว"><div className="sheet-heading"><h2>{takeaway?'บิลซื้อกลับ':`บิล ${state.tables.find(t=>t.id===customer?.tableId)?.name??'ของคุณ'}`}</h2><button className="icon-btn" aria-label="ปิดบิล" onClick={()=>setBill(false)}>×</button></div><div className="panel-content">
 <p>รับรายการ → ผลิต → ส่งมอบ → ปิดบิล</p>{orders.map(o=><div className="order-card" key={o.id}><strong>{state.menu.find(m=>m.id===o.menuId)?.name} · ฿{o.price}</strong><p>{takeaway&&!o.paid&&o.status==='waiting'?'รอชำระก่อนผลิต':labels[o.status]}</p><small>{o.paid?'ชำระแล้ว':o.status==='cancelled'?'ไม่คิดเงิน':'ยังไม่ชำระ'} · #{o.id}</small>{o.componentOrderIds?.map(id=>{const child=state.orders.find(x=>x.id===id);return child&&<p key={id}>{state.menu.find(m=>m.id===child.menuId)?.name}: {labels[child.status]}</p>})}</div>)}
 {takeaway&&unpaid>0?<button className="button primary full" onClick={()=>run(()=>v.prepay())}>ยืนยันชำระ ฿{unpaid} และเข้าคิว</button>:<button className="button primary full" disabled={!orders.length||orders.some(o=>!['completed','cancelled'].includes(o.status))} onClick={()=>{if(v.pay())setBill(false);onNotice(useVisitor.getState().message)}}>{takeaway?'รับสินค้าและปิดบิล':`ชำระเงินและปิดบิล ฿${unpaid}`}</button>}
 <small>การชำระเงินจำลองภายในเกม</small></div></section></div>}
 </>;
}
