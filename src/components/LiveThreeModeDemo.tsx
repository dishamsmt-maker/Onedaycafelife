import { useRef, useState, useSyncExternalStore } from 'react';
import { createGameplayDemoSession } from '../cafe-os/gameplayDemoSession';
import { DEMO_HALAL_MENU, DEMO_TABLE_IDS } from '../cafe-os/demoCatalog';

/** Game-only shared three-role controls. The session is owned once per mounted panel. */
export default function LiveThreeModeDemo() {
  const sessionRef = useRef<ReturnType<typeof createGameplayDemoSession> | null>(null);
  if (!sessionRef.current) sessionRef.current = createGameplayDemoSession();
  const session = sessionRef.current;
  const snapshot = useSyncExternalStore(session.subscribe, session.getSnapshot, session.getSnapshot);
  const [table, setTable] = useState<string>('t3');
  const [item, setItem] = useState<string>(DEMO_HALAL_MENU[0].id);
  const [message, setMessage] = useState('');
  const counter = useRef(0);
  const day = session.getDay();
  const act = (action: Parameters<typeof session.dispatch>[0]) => {
    setMessage(session.dispatch(action) ? 'บันทึกเหตุการณ์เกมแล้ว' : 'คำสั่งไม่สำเร็จหรือถูกส่งซ้ำ');
  };
  const active = snapshot.customer.filter(o => o.tableId === table && o.status !== 'cancelled');
  const stock = snapshot.manager.stock;
  const selected = DEMO_HALAL_MENU.find(m => m.id === item)!;
  const available = Object.entries(selected.recipe).every(([key, qty]) => (stock[key] ?? 0) >= qty);
  return <section className="soft-card" aria-label="Live three mode simulation">
    <h3>สามโหมด · สถานะเดียวกัน (เกมทดลอง)</h3>
    <p>แยกจาก POS และสต็อกร้านจริง · ราคากับต้นทุนเป็นสมมติฐาน · ยังไม่เชื่อม NPC 3D</p>
    <label>โต๊ะ <select aria-label="โต๊ะเกม" value={table} onChange={e => setTable(e.target.value)}>
      {DEMO_TABLE_IDS.map(id => <option key={id} value={id}>{id.toUpperCase()}</option>)}
    </select></label>
    <label> เมนู <select aria-label="เมนูเกม" value={item} onChange={e => setItem(e.target.value)}>
      {DEMO_HALAL_MENU.map(m => <option key={m.id} value={m.id}>{m.nameTh} ฿{m.priceSatang / 100}</option>)}
    </select></label>
    <div className="row"><strong>ลูกค้า</strong>
      <button className="button secondary" disabled={snapshot.manager.closed || !available} onClick={() => act({
        mode: 'customer', type: 'order', tableId: table.toUpperCase(), itemId: item, quantity: 1,
        requestId: 'live-ui-' + (++counter.current),
      })}>สั่งอาหาร {table.toUpperCase()}</button>
    </div>
    {!available && <p role="status">วัตถุดิบไม่เพียงพอสำหรับเมนูนี้</p>}
    <p>ออร์เดอร์โต๊ะนี้: {active.map(o => o.id + ' (' + o.status + ')').join(', ') || 'ไม่มีรายการค้าง'}</p>
    <h4>Na / Ken · งานจริงใน Simulation State</h4>
    {snapshot.staff.tasks.map(task => {
      const order = day.store.orders.find(o => o.id === task.orderId);
      const recipe = order?.recipeSnapshot ?? DEMO_HALAL_MENU.find(m => m.id === order?.itemId)?.recipe ?? {};
      // Explicitly illustrative zero satang costs; replace with validated purchase costs before any real use.
      const costs = Object.fromEntries(Object.keys(recipe).map(k => [k, 0]));
      return <div className="row" key={task.orderId}>
        <span>{task.assignee} · {task.tableId.toUpperCase()} · {task.action}</span>
        <button className="button secondary" onClick={() => act({
          mode: 'staff', type: 'task', orderId: task.orderId, assignee: task.assignee,
          action: task.action, ...(task.action === 'prepare' ? { costs } : {}),
        })}>ทำงาน</button>
      </div>;
    })}
    <h4>ผู้จัดการ · สถานะสด</h4>
    <p aria-live="polite">คิวครัว {snapshot.manager.queueCounts.kitchen} · รอเสิร์ฟ {snapshot.manager.queueCounts.service} · รอรับเงิน {snapshot.manager.queueCounts.payment} · เงินสดเกม ฿{(snapshot.manager.cashSatang / 100).toFixed(2)}</p>
    <p>สต็อกเกม: {Object.entries(stock).map(([k,v]) => k + ': ' + v).join(' · ')}</p>
    {day.store.orders.filter(o => o.status === 'served').map(o =>
      <button className="button secondary" key={'pay-'+o.id} onClick={() => act({ mode: 'manager', type: 'pay', orderId: o.id })}>รับเงิน {o.tableId.toUpperCase()}</button>)}
    {day.store.orders.filter(o => ['queued','preparing','ready'].includes(o.status)).map(o =>
      <button className="button secondary" key={'cancel-'+o.id} onClick={() => act({ mode: 'manager', type: 'cancel', orderId: o.id })}>ยกเลิก {o.id}</button>)}
    <button className="button secondary" disabled={snapshot.manager.closed || !snapshot.manager.close.readyToClose}
      onClick={() => act({ mode: 'manager', type: 'close' })}>ปิดยอดเกม</button>
    <p role="status">{message} · เหตุการณ์ {snapshot.eventSequence} · {snapshot.manager.closed ? 'ปิดร้านแล้ว' : 'ร้านเปิด'}</p>
  </section>;
}
