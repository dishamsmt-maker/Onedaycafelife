import { useState } from 'react';
import { DEMO_HALAL_MENU, DEMO_TABLE_IDS, createDemoStock } from '../cafe-os/demoCatalog';
import { advanceCafeOrder, closeCafeDay, createCafeStore, payCafeOrder, recordCafeOrderCost, refundAndCancelCafeOrder, submitCafeOrder } from '../cafe-os/orderCore';
export default function CafeOsDemo() {
 const [store,setStore]=useState(()=>createCafeStore(createDemoStock()));
 const [table,setTable]=useState<string>('t3'),[item,setItem]=useState(DEMO_HALAL_MENU[0].id);
 const [serial,setSerial]=useState(1),[message,setMessage]=useState('สาธิตเท่านั้น ไม่ใช่ POS ร้านจริง');
 const report=closeCafeDay(store);
 const baht=(n:number)=>(n/100).toFixed(2);
 function order(){
  const result=submitCafeOrder(store,DEMO_HALAL_MENU,{requestId:'demo-'+serial,tableId:table,itemId:item,quantity:1});
  if(result.accepted){setStore(result.store);setSerial(n=>n+1);}
  setMessage(result.accepted?'รับออร์เดอร์แล้ว':'ปฏิเสธ: '+result.reason);
 }
 function move(id:string,status:'preparing'|'ready'|'served'){
  let next=advanceCafeOrder(store,DEMO_HALAL_MENU,id,status);
  if(status==='preparing'&&next!==store)next=recordCafeOrderCost(next,DEMO_HALAL_MENU,id,Object.fromEntries(Object.keys(next.stock).map(k=>[k,100])));
  setMessage(next===store?'เปลี่ยนสถานะไม่ได้ ตรวจสต็อก/ลำดับ':'อัปเดตคิวแล้ว');
  setStore(next);
 }
 return <section aria-label="Café OS demo" style={{display:'grid',gap:12}}>
  <h2>Café OS · โหมดทดลองแยกจากเกม</h2><p>ตัวเลขสมมติทั้งหมด ไม่รับเงินจริง ไม่บันทึกลงฐานข้อมูลเกม</p>
  <label>โต๊ะ <select aria-label="โต๊ะ" value={table} onChange={e=>setTable(e.target.value)}>{DEMO_TABLE_IDS.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}</select></label>
  <label>เมนู <select aria-label="เมนู" value={item} onChange={e=>setItem(e.target.value)}>{DEMO_HALAL_MENU.map(m=><option key={m.id} value={m.id}>{m.nameTh} ฿{baht(m.priceSatang)}</option>)}</select></label>
  <button className="button primary" onClick={order}>จำลองสั่งผ่าน QR</button><p role="status">{message}</p>
  <h3>KDS / POS</h3>{store.orders.length===0?<p>ยังไม่มีคิว</p>:store.orders.map(o=><article key={o.id} style={{border:'1px solid #aaa',padding:10,borderRadius:8}}>
   <strong>{o.tableId.toUpperCase()} · {DEMO_HALAL_MENU.find(m=>m.id===o.itemId)?.nameTh}</strong><p>{o.status} · ฿{baht(o.unitPriceSatang)} {o.paymentRecorded?'· ชำระแล้ว':''}</p>
   {o.status==='queued'&&<button onClick={()=>move(o.id,'preparing')}>Na เริ่มทำ</button>}
   {o.status==='preparing'&&<button onClick={()=>move(o.id,'ready')}>Na ทำเสร็จ</button>}
   {o.status==='ready'&&<button onClick={()=>move(o.id,'served')}>Ken เสิร์ฟ</button>}
   {!o.paymentRecorded&&o.status!=='cancelled'&&<button onClick={()=>setStore(s=>payCafeOrder(s,o.id))}>POS รับเงิน</button>}
   {o.status!=='served'&&o.status!=='cancelled'&&<button onClick={()=>setStore(s=>refundAndCancelCafeOrder(s,o.id))}>ยกเลิก / คืนเงิน</button>}
  </article>)}
  <h3>ปิดยอดสาธิต</h3><p>ขายสุทธิ ฿{baht(report.netSalesSatang)} · ต้นทุน ฿{baht(report.ingredientCostSatang)} · ของเสีย ฿{baht(report.wasteCostSatang)}</p>
  <p>ยอดตรง: {report.cashBalanced?'ใช่':'ไม่ตรง'} · ปิดยอดได้: {report.readyToClose?'ใช่':'ไม่'}</p>
  <button className="button secondary" onClick={()=>{setStore(createCafeStore(createDemoStock()));setSerial(1);setMessage('เริ่มวันใหม่');}}>เริ่มวันทดลองใหม่</button>
 </section>;
}
