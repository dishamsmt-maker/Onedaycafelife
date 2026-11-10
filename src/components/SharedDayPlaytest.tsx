import { useRef, useState } from 'react';
import LiveThreeModeDemo from './LiveThreeModeDemo';
import { projectGameDay, type DayEvent } from '../game/dayEventProjection';
import { replayGameDayWithStock } from '../game/dayStockReplay';
import { closeGameDay } from '../game/dayCloseReport';
import { summarizeGameIngredientCosts } from '../game/dayIngredientCosts';

const initialStock = { teaLeaves: 100, milkMl: 500 };
const recipes = { 'halal-tea': { teaLeaves: 10, milkMl: 100 } };
// Illustrative game-only satang/unit costs, NOT verified café purchase prices.
const demoUnitCostsSatang = { teaLeaves: 10, milkMl: 2 };

/** Isolated interactive game-day vertical slice; never connects to real POS or inventory. */
export default function SharedDayPlaytest() {
  const [events, setEvents] = useState<DayEvent[]>([]);
  // Synchronous event snapshot prevents two taps in one React render from opening two orders.
  const eventsRef = useRef<DayEvent[]>([]);
  const [closed, setClosed] = useState(false);
  // A ref closes the day immediately, even before React renders the disabled controls.
  const closedRef = useRef(false);
  const stock = replayGameDayWithStock(events, initialStock, recipes);
  const day = stock.day;
  const costs = summarizeGameIngredientCosts(stock, demoUnitCostsSatang);
  const report = closed ? closeGameDay(stock) : null;
  const outstandingOrders = day.orders.filter(o => o.status !== 'paid' && o.status !== 'cancelled').length;
  const [table, setTable] = useState('T3');
  // Synchronous counter avoids duplicate IDs when taps happen before React re-renders.
  const eventCounter = useRef(0);
  const views = projectGameDay(day);
  const canPrepare = (itemId: string) => Object.entries(recipes[itemId as keyof typeof recipes] ?? {}).every(
    ([ingredient, quantity]) => quantity === 0 ||
      (Number.isSafeInteger(stock.remaining[ingredient]) && stock.remaining[ingredient] >= quantity),
  );
  const demoItemAvailable = canPrepare('halal-tea');
  const active = [...day.orders].reverse().find(o => o.tableId === table && o.status !== 'paid' && o.status !== 'cancelled');
  const emit = (event: { type: DayEvent['type']; orderId: string; tableId?: string; itemId?: string; totalSatang?: number }) => {
    if (closedRef.current) return;
    const id = 'playtest-' + (++eventCounter.current);
    eventsRef.current = [...eventsRef.current, { ...event, id } as DayEvent];
    setEvents(eventsRef.current);
  };
  const order = () => {
    const latest = replayGameDayWithStock(eventsRef.current, initialStock, recipes).day;
    if (latest.orders.some(o => o.tableId === table && o.status !== 'paid' && o.status !== 'cancelled')) return;
    // Recheck against the synchronous event snapshot: another rapid tap may have consumed the last serving.
    const latestStock = replayGameDayWithStock(eventsRef.current, initialStock, recipes).remaining;
    if (Object.entries(recipes['halal-tea']).some(([ingredient, quantity]) =>
      quantity > 0 && (!Number.isSafeInteger(latestStock[ingredient]) || latestStock[ingredient] < quantity))) return;
    emit({ type: 'ordered', orderId: 'demo-' + (eventCounter.current + 1), tableId: table, itemId: 'halal-tea', totalSatang: 4500 });
  };
  const closeDay = () => {
    if (closedRef.current) return;
    const latest = replayGameDayWithStock(eventsRef.current, initialStock, recipes);
    if (latest.day.orders.some(o => o.status !== 'paid' && o.status !== 'cancelled')) return;
    if (!closeGameDay(latest).balanced) return;
    closedRef.current = true;
    setClosed(true);
  };
  const transition = (type: 'preparing' | 'ready' | 'served' | 'paid' | 'cancelled', orderId: string) =>
    emit({ type, orderId });
  return <><LiveThreeModeDemo/><section aria-label="Shared game day playtest" className="soft-card">
    <h3>ทดลองเหตุการณ์ร่วม 3 โหมด · เกมเท่านั้น</h3>
    <p>ข้อมูลจำลองแยกจาก Café OS จริง ตัดเฉพาะสต็อกเกม ไม่รับเงินจริง · ตัวอย่างชาฮาลาล ฿45</p>
    <label>โต๊ะ <select aria-label="เลือกโต๊ะจำลอง" value={table} onChange={e => setTable(e.target.value)}>
      {['T1','T2','T3','T4','T5'].map(id => <option key={id} value={id}>{id}</option>)}
    </select></label>
    <div className="row"><strong>ลูกค้า</strong><button className="button secondary" disabled={closed || !!active || !demoItemAvailable} onClick={order}>สั่งชาโต๊ะ {table}</button></div>
    {!demoItemAvailable && <p role="status">ชาฮาลาลหมดชั่วคราว · ไม่สามารถรับออร์เดอร์ใหม่จนกว่าจะเติมสต็อกเกม</p>}
    <p aria-live="polite">สถานะโต๊ะ: {active?.status ?? 'ไม่มีออร์เดอร์ค้าง'}</p>
    <h4>Na · คิวครัว</h4>
    <p aria-live="polite">สต็อกเกม: ใบชา {stock.remaining.teaLeaves} กรัม · นม {stock.remaining.milkMl} มล. · ใช้ใบชา {stock.consumed.teaLeaves ?? 0} กรัม · ของเสียใบชา {stock.waste.teaLeaves ?? 0} กรัม</p>
    {stock.rejectedEventIds.length > 0 && <p role="status">เหตุการณ์ถูกปฏิเสธ {stock.rejectedEventIds.length} ครั้ง (อาจเกิดจากวัตถุดิบหมดหรือขั้นตอนผิดลำดับ)</p>}
    {views.kitchen.map(o => {
      const queued = o.status === 'queued';
      const itemId = day.orders.find(order => order.id === o.orderId)?.itemId ?? '';
      const outOfStock = queued && !canPrepare(itemId);
      return <div className="row" key={o.orderId}><span>{o.orderId} · {o.status}{outOfStock ? ' · วัตถุดิบไม่พอ' : ''}</span>
        <button className="button secondary" disabled={closed || outOfStock}
          title={outOfStock ? 'วัตถุดิบเกมไม่พอสำหรับรายการนี้' : undefined}
          onClick={() => transition(queued ? 'preparing' : 'ready', o.orderId)}>
          {queued ? 'เริ่มเตรียม' : 'ทำเสร็จ'}
        </button></div>;
    })}
    <h4>Ken · รอเสิร์ฟ</h4>
    {views.waiter.map(o => <div className="row" key={o.orderId}><span>{o.tableId} · {o.orderId}</span>
      <button className="button secondary" disabled={closed} onClick={() => transition('served', o.orderId)}>เสิร์ฟ</button></div>)}
    <h4>ผู้จัดการ</h4>
    <p>รายได้จำลอง ฿{(views.manager.revenueSatang / 100).toFixed(2)} · ออร์เดอร์ค้าง {views.manager.openOrders}</p>
    <p>ต้นทุนวัตถุดิบเกม ฿{(costs.ingredientCostSatang / 100).toFixed(2)} · ของเสีย (รวมในต้นทุน) ฿{(costs.wasteCostSatang / 100).toFixed(2)} · กำไรขั้นต้นก่อนค่าใช้จ่ายอื่น ฿{(costs.grossMarginSatang / 100).toFixed(2)}</p>
    <small>ต้นทุนต่อหน่วยเป็นตัวเลขสมมติสำหรับเกม ไม่ใช่ราคาซื้อจริง และกำไรขั้นต้นไม่ใช่กำไรสุทธิ{!costs.complete ? ` · ขาดต้นทุน: ${costs.missingCostIngredients.join(', ')}` : ''}</small>
    {day.orders.filter(o => o.status === 'served').map(o => <button className="button secondary" key={o.id} disabled={closed} onClick={() => transition('paid', o.id)}>รับเงิน {o.tableId} ฿{(o.totalSatang / 100).toFixed(2)}</button>)}
    {active && ['queued','preparing','ready'].includes(active.status) && <button className="button secondary" disabled={closed} onClick={() => transition('cancelled', active.id)}>ยกเลิก {active.id}</button>}
    {!closed && <button className="button secondary" disabled={outstandingOrders > 0} onClick={closeDay}>ปิดยอดวันจำลอง</button>}
    {!closed && outstandingOrders > 0 && <p role="status">ยังมีออร์เดอร์ค้าง {outstandingOrders} รายการ ต้องเสิร์ฟและรับเงินหรือยกเลิกก่อนปิดยอด</p>}
    {report && <div role="status" aria-live="polite">
      <h4>รายงานปิดยอด · เกมเท่านั้น</h4>
      <p>รายรับ ฿{(report.revenueSatang / 100).toFixed(2)} · ชำระแล้ว {report.paidOrders} · ยกเลิก {report.cancelledOrders} · ค้าง {report.outstandingOrders}</p>
      <p>ต้นทุนวัตถุดิบ ฿{(costs.ingredientCostSatang / 100).toFixed(2)} · ต้นทุนของเสีย (รวมแล้ว) ฿{(costs.wasteCostSatang / 100).toFixed(2)} · กำไรขั้นต้น ฿{(costs.grossMarginSatang / 100).toFixed(2)}</p>
      <p>ใบชาใช้ {report.consumed.teaLeaves ?? 0} กรัม · ของเสีย {report.waste.teaLeaves ?? 0} กรัม · คงเหลือ {report.remaining.teaLeaves ?? 0} กรัม</p>
      <p>เหตุการณ์ถูกปฏิเสธ {report.rejectedEvents} · กระทบยอด {report.balanced ? 'ตรง' : 'ไม่ตรง — ต้องตรวจสอบ'}</p>
      {report.outstandingOrders > 0 && <p>ยังมีออร์เดอร์ค้าง: รายงานนี้เป็นยอดชั่วคราวของวันจำลอง</p>}
    </div>}
    <button className="text-button" onClick={() => { eventsRef.current = []; setEvents([]); eventCounter.current = 0; closedRef.current = false; setClosed(false); }}>เริ่มวันจำลองใหม่</button>
    <small>นี่เป็น UI ทดสอบเหตุการณ์และสต็อกเกม ไม่ใช่การเชื่อม NPC/FPV หรือระบบจ่ายเงินจริง</small>
  </section></>;
}
