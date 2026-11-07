import { useState } from 'react';
import { projectGameDay, type DayEvent } from '../game/dayEventProjection';
import { replayGameDayWithStock } from '../game/dayStockReplay';

const initialStock = { teaLeaves: 100, milkMl: 500 };
const recipes = { 'halal-tea': { teaLeaves: 10, milkMl: 100 } };

/** Isolated interactive game-day vertical slice; never connects to real POS or inventory. */
export default function SharedDayPlaytest() {
  const [events, setEvents] = useState<DayEvent[]>([]);
  const stock = replayGameDayWithStock(events, initialStock, recipes);
  const day = stock.day;
  const [table, setTable] = useState('T3');
  const [sequence, setSequence] = useState(0);
  const views = projectGameDay(day);
  const active = [...day.orders].reverse().find(o => o.tableId === table && o.status !== 'paid' && o.status !== 'cancelled');
  const emit = (event: { type: DayEvent['type']; orderId: string; tableId?: string; itemId?: string; totalSatang?: number }) => {
    const id = 'playtest-' + (sequence + 1);
    setEvents(previous => [...previous, { ...event, id } as DayEvent]);
    setSequence(n => n + 1);
  };
  const order = () => {
    if (active) return;
    emit({ type: 'ordered', orderId: 'demo-' + (sequence + 1), tableId: table, itemId: 'halal-tea', totalSatang: 4500 });
  };
  const transition = (type: 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled', orderId: string) =>
    emit({ type, orderId });
  return <section aria-label="Shared game day playtest" className="soft-card">
    <h3>ทดลองเหตุการณ์ร่วม 3 โหมด · เกมเท่านั้น</h3>
    <p>ข้อมูลจำลองแยกจาก Café OS จริง ตัดเฉพาะสต็อกเกม ไม่รับเงินจริง · ตัวอย่างชาฮาลาล ฿45</p>
    <label>โต๊ะ <select aria-label="เลือกโต๊ะจำลอง" value={table} onChange={e => setTable(e.target.value)}>
      {['T1','T2','T3','T4','T5'].map(id => <option key={id} value={id}>{id}</option>)}
    </select></label>
    <div className="row"><strong>ลูกค้า</strong><button className="button secondary" disabled={!!active} onClick={order}>สั่งชาโต๊ะ {table}</button></div>
    <p aria-live="polite">สถานะโต๊ะ: {active?.status ?? 'ไม่มีออร์เดอร์ค้าง'}</p>
    <h4>Na · คิวครัว</h4>
    <p aria-live="polite">สต็อกเกม: ใบชา {stock.remaining.teaLeaves} กรัม · นม {stock.remaining.milkMl} มล. · ใช้ใบชา {stock.consumed.teaLeaves ?? 0} กรัม · ของเสียใบชา {stock.waste.teaLeaves ?? 0} กรัม</p>
    {stock.rejectedEventIds.length > 0 && <p role="status">เหตุการณ์ถูกปฏิเสธ {stock.rejectedEventIds.length} ครั้ง (อาจเกิดจากวัตถุดิบหมดหรือขั้นตอนผิดลำดับ)</p>}
    {views.kitchen.map(o => <div className="row" key={o.orderId}><span>{o.orderId} · {o.status}</span>
      <button className="button secondary" onClick={() => transition(o.status === 'queued' ? 'preparing' : 'ready', o.orderId)}>
        {o.status === 'queued' ? 'เริ่มเตรียม' : 'ทำเสร็จ'}
      </button></div>)}
    <h4>Ken · รอเสิร์ฟ</h4>
    {views.waiter.map(o => <div className="row" key={o.orderId}><span>{o.tableId} · {o.orderId}</span>
      <button className="button secondary" onClick={() => transition('served', o.orderId)}>เสิร์ฟ</button></div>)}
    <h4>ผู้จัดการ</h4>
    <p>รายได้จำลอง ฿{(views.manager.revenueSatang / 100).toFixed(2)} · ออร์เดอร์ค้าง {views.manager.openOrders}</p>
    {day.orders.filter(o => o.status === 'served').map(o => <button className="button secondary" key={o.id} onClick={() => transition('paid', o.id)}>รับเงิน {o.tableId} ฿{(o.totalSatang / 100).toFixed(2)}</button>)}
    {active && ['queued','preparing','ready'].includes(active.status) && <button className="button secondary" onClick={() => transition('cancelled', active.id)}>ยกเลิก {active.id}</button>}
    <button className="text-button" onClick={() => { setEvents([]); setSequence(0); }}>เริ่มวันจำลองใหม่</button>
    <small>นี่เป็น UI ทดสอบเหตุการณ์และสต็อกเกม ไม่ใช่การเชื่อม NPC/FPV หรือระบบจ่ายเงินจริง</small>
  </section>;
}
