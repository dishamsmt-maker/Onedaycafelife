import { useState } from 'react';
import { DEMO_HALAL_MENU, DEMO_TABLE_IDS, createDemoStock } from '../cafe-os/demoCatalog';
import { applyDemoAction, demoDayViews, startDemoDay } from '../cafe-os/demoDay';

/** All three role panels project the same game-only event stream. */
export default function CafeOsDemo() {
 const [day,setDay]=useState(()=>startDemoDay(createDemoStock()));
 const [table,setTable]=useState<string>('t3');
 const [item,setItem]=useState(DEMO_HALAL_MENU[0].id);
 const [serial,setSerial]=useState(1);
 const [message,setMessage]=useState('สาธิตเท่านั้น ไม่ใช่ POS ร้านจริง');
 const views=demoDayViews(day);
 const baht=(n:number)=>(n/100).toFixed(2);
 function order(){
  const next=applyDemoAction(day,DEMO_HALAL_MENU,{actor:'customer',type:'order',requestId:'demo-'+serial,tableId:table,itemId:item,quantity:1});
  if(next!==day){setDay(next);setSerial(n=>n+1);}
  setMessage(next===day?'สั่งไม่สำเร็จ: ตรวจสอบเมนูหรือสต็อก':'ลูกค้าสั่งแล้ว → คิวครัว');
 }
 function act(orderId:string,type:'prepare'|'ready'|'serve'|'pay'|'cancel'){
  const recipe=day.store.orders.find(o=>o.id===orderId)?.recipeSnapshot ?? {};
  const costs=Object.fromEntries(Object.keys(recipe).map(k=>[k,100]));
  const action=type==='prepare'?{actor:'Na' as const,type,orderId,costs}
    :type==='ready'?{actor:'Na' as const,type,orderId}
    :type==='serve'?{actor:'Ken' as const,type,orderId}
    :{actor:'manager' as const,type,orderId};
  const next=applyDemoAction(day,DEMO_HALAL_MENU,action);
  setDay(next);
  setMessage(next===day?'ทำรายการไม่ได้: ตรวจสถานะ/สต็อก':'อัปเดตทุกโหมดแล้ว');
 }
 return <section aria-label="Café OS demo" style={{display:'grid',gap:12}}>
  <h2>Café OS · ทดลองหนึ่งวัน (สถานะร่วม)</h2>
  <p>ข้อมูลสมมติ แยกจากร้านจริงและเกมหลัก ไม่รับเงินจริง</p>
  <h3>ลูกค้า · QR</h3>
  <label>โต๊ะ <select aria-label="โต๊ะ" value={table} onChange={e=>setTable(e.target.value)}>{DEMO_TABLE_IDS.map(t=><option key={t} value={t}>{t.toUpperCase()}</option>)}</select></label>
  <label>เมนู <select aria-label="เมนู" value={item} onChange={e=>setItem(e.target.value)}>{DEMO_HALAL_MENU.map(m=><option key={m.id} value={m.id}>{m.nameTh} ฿{baht(m.priceSatang)}</option>)}</select></label>
  <button className="button primary" disabled={day.closed} onClick={order}>จำลองสั่งผ่าน QR</button><p role="status">{message}</p>
  <h3>ลูกค้า · ติดตามออร์เดอร์</h3>
  {views.customer.filter(o=>o.tableId===table).map(o=><p key={o.id}>#{o.id} · {o.status}</p>)}
  {!views.customer.some(o=>o.tableId===table)&&<p>โต๊ะนี้ยังไม่มีออร์เดอร์</p>}
  <h3>Na · คิวครัว ({views.kitchen.length})</h3>
  {views.kitchen.map(o=><article key={o.id}><strong>{o.tableId.toUpperCase()} · {DEMO_HALAL_MENU.find(m=>m.id===o.itemId)?.nameTh}</strong> · {o.status} {' '}
   {o.status==='queued'?<button disabled={day.closed} onClick={()=>act(o.id,'prepare')}>Na เริ่มทำ</button>:<button disabled={day.closed} onClick={()=>act(o.id,'ready')}>Na ทำเสร็จ</button>}</article>)}
  <h3>Ken · รอเสิร์ฟ ({views.service.length})</h3>
  {views.service.map(o=><article key={o.id}>{o.tableId.toUpperCase()} <button disabled={day.closed} onClick={()=>act(o.id,'serve')}>Ken เสิร์ฟ</button></article>)}
  <h3>ผู้จัดการ · POS / ปิดยอด</h3>
  {day.store.orders.map(o=><article key={o.id}>{o.tableId.toUpperCase()} · {o.status} · ฿{baht(o.unitPriceSatang*o.quantity)}
   {o.paymentRecorded?' · ชำระแล้ว':o.status==='served'?<button disabled={day.closed} onClick={()=>act(o.id,'pay')}>POS รับเงิน</button>:' · รอเสิร์ฟ'}
   {o.status!=='cancelled'&&<button disabled={day.closed} onClick={()=>act(o.id,'cancel')}>{o.paymentRecorded?'คืนเงิน / ยกเลิก':'ยกเลิกออร์เดอร์'}</button>}
  </article>)}
  <p>เงินสด ฿{baht(views.manager.cashSatang)} · ต้นทุน ฿{baht(views.manager.close.ingredientCostSatang)}</p>
  <p>ยอดตรง: {views.manager.close.cashBalanced?'ใช่':'ไม่ตรง'} · ปิดยอดได้: {views.manager.close.readyToClose?'ใช่':'ไม่'}</p>
  <button className="button primary" disabled={day.closed || !views.manager.close.readyToClose} onClick={()=>{const next=applyDemoAction(day,DEMO_HALAL_MENU,{actor:'manager',type:'close'});setDay(next);setMessage(next.closed?'ปิดยอดวันทดลองแล้ว · ไม่สามารถรับออร์เดอร์เพิ่ม':'ยังปิดยอดไม่ได้');}}>ปิดยอดวันทดลอง</button>
  {day.closed&&<p role="status">ปิดวันแล้ว · ยอดสุทธิ ฿{baht(views.manager.close.netSalesSatang)} · ต้นทุน ฿{baht(views.manager.close.ingredientCostSatang)} · ของเสีย ฿{baht(views.manager.close.wasteCostSatang)}</p>}
  <details><summary>ตรวจสต็อกจำลอง ({Object.keys(views.manager.stock).length} วัตถุดิบ)</summary>
   <ul>{Object.entries(views.manager.stock).sort(([a],[b])=>a.localeCompare(b)).map(([name,qty])=><li key={name}>{name}: {qty} หน่วยจำลอง</li>)}</ul>
  </details>
  <p>ต้นทุนวัตถุดิบใน Demo ใช้ราคาอ้างอิงสมมติ 1 บาทต่อหน่วย ไม่ใช่ต้นทุนจริง</p>
  <h3>Event log</h3><ol>{day.events.map(e=><li key={e.sequence}>#{e.sequence} {e.actor} · {e.action} · {e.orderId}</li>)}</ol>
  <button className="button secondary" onClick={()=>{setDay(startDemoDay(createDemoStock()));setSerial(1);setMessage('เริ่มวันใหม่');}}>เริ่มวันทดลองใหม่</button>
 </section>;
}
