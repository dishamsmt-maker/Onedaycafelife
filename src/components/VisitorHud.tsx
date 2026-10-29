import {useState} from 'react';
import {Coffee,UtensilsCrossed,LogOut,Users,Armchair} from 'lucide-react';
import {useVisitor} from '../game/visitor';
import type {GameState,StaffId} from '../game/types';
export default function VisitorHud({state,onMenu,onNotice}:{state:GameState;onMenu:()=>void;onNotice:(s:string)=>void}){
 const v=useVisitor(); const [roles,setRoles]=useState(false);
 const table=state.tables.find(t=>t.id===v.tableId);
 const orders=state.orders.filter(o=>o.customerId===state.customers.find(c=>c.player&&c.status!=='leaving')?.id&&!o.parentOrderId&&o.status!=='cancelled');
 const ready=orders.filter(o=>o.status==='completed');
 const run=(action:()=>unknown)=>{action();onNotice(useVisitor.getState().message)};
 return <><div className="visitor-role"><button onClick={()=>setRoles(!roles)} aria-label="เลือกตัวละคร"><Users size={14}/>{v.role==='customer'?'ลูกค้า':state.employees.find(e=>e.id===v.role)?.name}<span>⌄</span></button>{roles&&<div className="role-list">{(['customer','ham','na','alee','ken','pun'] as const).map(id=><button key={id} onClick={()=>{run(()=>v.setRole(id));setRoles(false)}}>{id==='customer'?'ลูกค้า':state.employees.find(e=>e.id===id)?.name}</button>)}</div>}</div>
 {v.role==='customer'&&<div className="visitor-story">{table?<><span><Armchair size={13}/>{table.name}</span><strong>{orders.length===0?'เลือกเมนูโปรด แล้วพักสักครู่':ready.length===orders.length?'เสิร์ฟแล้ว · ขอให้อร่อยครับ':'ครัวกำลังทำให้คุณ'}</strong><div className="visitor-actions">{ready.length>0&&<><button aria-label="รับประทานอาหาร" onClick={()=>run(()=>v.consume('food'))}><UtensilsCrossed size={15}/>ทาน</button><button aria-label="ดื่มเครื่องดื่ม" onClick={()=>run(()=>v.consume('drink'))}><Coffee size={15}/>ดื่ม</button></>}<button onClick={()=>run(()=>v.stand())}>ลุกขึ้น</button>{ready.length>0&&<button onClick={()=>run(()=>v.pay())}>ชำระเงิน</button>}</div></>:<><span>WELCOME TO ONE DAY</span><strong>{orders.length?`เดินไป${state.tables.find(t=>t.id===state.customers.find(c=>c.player&&c.status!=='leaving')?.tableId)?.name??'รับอาหารที่เคาน์เตอร์'}`:'เดินมาสั่งที่บาร์ หรือเลือกโต๊ะในสวน'}</strong></>}</div>}
 {v.role!=='customer'&&<div className="visitor-story"><span>TEAM ONE DAY</span><strong>คุณกำลังเดินเป็น {state.employees.find(e=>e.id===v.role)?.name}</strong><small>แตะสิ่งของเพื่อดูแลร้าน · กลับเป็นลูกค้าเพื่อคืนงานให้ทีม</small></div>}
 </>;
}
