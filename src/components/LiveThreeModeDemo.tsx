import { useRef, useState, useSyncExternalStore } from 'react';
import { createGameplayDemoSession } from '../cafe-os/gameplayDemoSession';
import { DEMO_HALAL_MENU, DEMO_TABLE_IDS } from '../cafe-os/demoCatalog';

/** Game-only shared three-role controls. Gameplay V2 may inject its own session. */
export type GameplaySession = ReturnType<typeof createGameplayDemoSession>;
export type LiveThreeModeDemoProps = { session?: GameplaySession };
export default function LiveThreeModeDemo({ session: externalSession }: LiveThreeModeDemoProps = {}) {
  const sessionRef = useRef<GameplaySession | null>(null);
  // The fallback is created only for standalone demos, not for injected V2 sessions.
  const session = externalSession ?? (sessionRef.current ??= createGameplayDemoSession());
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const [table, setTable] = useState<string>('t3');
  const [item, setItem] = useState<string>(DEMO_HALAL_MENU[0].id);
  const [message, setMessage] = useState('');
  // Keep idempotency keys unique even when this UI remounts against the same game session.
  const requestPrefix = useRef<string | null>(null);
  if (requestPrefix.current === null) {
    requestPrefix.current = globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`;
  }
  const counter = useRef(0);
  const day = session.getDay();
  const act = (action: Parameters<typeof session.dispatch>[0]) => {
    setMessage(session.dispatch(action) ? 'บันทึกเหตุการณ์เกมแล้ว' : 'คำสั่งไม่สำเร็จหรือถูกส่งซ้ำ');
  };
  const active = day.store.orders.filter(o => o.tableId === table && o.status !== 'cancelled' && !o.paymentRecorded);
  const completed = day.store.orders.filter(o => o.tableId === table && o.paymentRecorded && o.refundedSatang === undefined);
  const stock = snapshot.manager.stock;
  const selected = DEMO_HALAL_MENU.find(m => m.id === item)!;
  const available = Object.entries(selected.recipe).every(([key, qty]) => (stock[key] ?? 0) >= qty);
  return <section className="soft-card" aria-label="Live three mode simulation">
    <h3>สามโหมด · สถานะเดียวกัน (เกมทดลอง)</h3>
    <p>แยกจาก POS และสต็อกร้านจริง · ราคาและต้นทุนต่อหน่วยเป็นสมมติฐาน ไม่ใช่ต้นทุนจัดซื้อจริง · ยังไม่เชื่อม NPC 3D</p>
    <label>โต๊ะ <select aria-label="โต๊ะเกม" value={table} onChange={e => setTable(e.target.value)}>
      {DEMO_TABLE_IDS.map(id => <option key={id} value={id}>{id.toUpperCase()}</option>)}
    </select></label>
    <label> เมนู <select aria-label="เมนูเกม" value={item} onChange={e => setItem(e.target.value)}>
      {DEMO_HALAL_MENU.map(m => <option key={m.id} value={m.id}>{m.nameTh} ฿{m.priceSatang / 100}</option>)}
    </select></label>
    <div className="row"><strong>ลูกค้า</strong>
      <button className="button secondary" disabled={snapshot.manager.closed || !available} onClick={() => act({
        mode: 'customer', type: 'order', tableId: table.toUpperCase(), itemId: item, quantity: 1,
        requestId: 'live-ui-' + requestPrefix.current + '-' + (++counter.current),
      })}>สั่งอาหาร {table.toUpperCase()}</button>
    </div>
    {!available && <p role="status">วัตถุดิบไม่เพียงพอสำหรับเมนูนี้</p>}
    <p>รายการที่ยังไม่ชำระโต๊ะนี้: {active.map(o => o.id + ' (' + o.status + ')').join(', ') || 'ไม่มีรายการค้าง'}</p>
    <p>ชำระแล้วโต๊ะนี้: {completed.map(o => o.id).join(', ') || 'ยังไม่มี'}</p>
    <h4>Na / Ken · งานจริงใน Simulation State</h4>
    {snapshot.staff.tasks.map(task => {
      return <div className="row" key={task.orderId}>
        <span>{task.assignee} · {task.tableId.toUpperCase()} · {task.action}</span>
        <button className="button secondary" disabled={snapshot.manager.closed} onClick={() => act({
          mode: 'staff', type: 'task', orderId: task.orderId, assignee: task.assignee,
          action: task.action,
        })}>ทำงาน</button>
      </div>;
    })}
    <h4>ผู้จัดการ · สถานะสด</h4>
    <p aria-live="polite">คิวครัว {snapshot.manager.queueCounts.kitchen} · รอเสิร์ฟ {snapshot.manager.queueCounts.service} · รอรับเงิน {snapshot.manager.queueCounts.payment} · เงินสดเกม ฿{(snapshot.manager.cashSatang / 100).toFixed(2)}</p>
    <p>สต็อกเกม: {Object.entries(stock).map(([k,v]) => k + ': ' + v).join(' · ')}</p>
    <div aria-label="ภาพรวมออร์เดอร์ทุกโต๊ะในเกม">
      <h4>ภาพรวมโต๊ะ · เกมทดลอง</h4>
      {DEMO_TABLE_IDS.map(tableId => {
        const orders = day.store.orders.filter(order => order.tableId === tableId && order.status !== 'cancelled');
        const unpaid = orders.filter(order => !order.paymentRecorded && order.refundedSatang === undefined);
        const refunded = orders.filter(order => order.refundedSatang !== undefined);
        const paid = orders.filter(order => order.paymentRecorded && order.refundedSatang === undefined);
        // Refunds are a separate outcome, never also counted as unpaid or paid.
        return <p key={tableId}>{tableId.toUpperCase()} · ค้างชำระ {unpaid.length} · ชำระแล้ว {paid.length} · คืนเงิน {refunded.length} · รวม {orders.length} ออร์เดอร์</p>;
      })}
    </div>

    {!snapshot.manager.close.cashBalanced && <p role="alert">ยอดเงินเกมไม่ตรงกัน — ตรวจสอบรายการรับเงินก่อนปิดยอด</p>}
    {!snapshot.manager.close.readyToClose && !snapshot.manager.closed && <p role="status">ยังปิดยอดไม่ได้: ตรวจสอบคิวค้างและรายการที่ยังไม่ได้รับเงิน</p>}
    {day.store.orders.filter(o => o.status === 'served' && !o.paymentRecorded).map(o =>
      <button className="button secondary" key={'pay-'+o.id} disabled={snapshot.manager.closed} onClick={() => act({ mode: 'manager', type: 'pay', orderId: o.id })}>รับเงิน {o.tableId.toUpperCase()} · {o.id}</button>)}
    {day.store.orders.filter(o => ['queued','preparing','ready'].includes(o.status)).map(o =>
      <button className="button secondary" key={'cancel-'+o.id} disabled={snapshot.manager.closed} onClick={() => act({ mode: 'manager', type: 'cancel', orderId: o.id })}>ยกเลิก {o.id}</button>)}
    <button className="button secondary" disabled={snapshot.manager.closed || !snapshot.manager.close.readyToClose}
      onClick={() => act({ mode: 'manager', type: 'close' })}>ปิดยอดเกม</button>
    <div aria-label="สรุปบัญชีเกมทดลอง" className="soft-card">
      <h4>สรุปยอดประจำวัน · เกมทดลองเท่านั้น</h4>
      <p>ออร์เดอร์ {snapshot.manager.close.orderCount} · ยกเลิก {snapshot.manager.close.cancelledCount} ·
        ยอดรับสุทธิ ฿{(snapshot.manager.close.netSalesSatang / 100).toFixed(2)} ·
        ต้นทุนวัตถุดิบ ฿{(snapshot.manager.close.ingredientCostSatang / 100).toFixed(2)} ·
        ของเสีย ฿{(snapshot.manager.close.wasteCostSatang / 100).toFixed(2)}</p>
      <p>กำไรขั้นต้นโดยประมาณ {snapshot.manager.close.grossMarginSatang === null
        ? 'ยังคำนวณไม่ได้ (ต้นทุนไม่ครบ)'
        : '฿' + (snapshot.manager.close.grossMarginSatang / 100).toFixed(2)}
        {' · '}ตรวจยอดเงิน {snapshot.manager.close.cashBalanced ? 'ตรงกัน' : 'ไม่ตรงกัน'}
        {' · '}ปิดยอด {snapshot.manager.closed ? 'ปิดแล้ว' : snapshot.manager.close.readyToClose ? 'พร้อม' : 'ยังไม่พร้อม'}</p>
      <p>{snapshot.manager.closed ? 'ปิดยอดเกมเรียบร้อยแล้ว · ไม่รับรายการใหม่' : 'บัญชีระหว่างวัน · ยังไม่ได้ปิดยอด'}</p>
      <p>เป็นตัวเลขจำลอง ไม่รวมค่าแรง ค่าเช่า ค่าไฟ และไม่ใช่รายรับร้านจริง</p>
    </div>
    <p role="status">{message} · เหตุการณ์ {snapshot.eventSequence} · {snapshot.manager.closed ? 'ปิดร้านแล้ว' : 'ร้านเปิด'}</p>
  </section>;
}
