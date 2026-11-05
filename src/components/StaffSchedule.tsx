import {useGame} from '../game/store';
import type {GameState} from '../game/types';
const clock=(m:number)=>`${Math.floor(m/60).toString().padStart(2,'0')}:${(m%60).toString().padStart(2,'0')}`;
const minutes=(s:string)=>{const [h,m]=s.split(':').map(Number);return h*60+m};
export default function StaffSchedule({state}:{state:GameState}){
 const dispatch=useGame(s=>s.dispatch);
 return <section aria-label="จัดเวรพนักงาน"><h3>เวรของทีม</h3><p className="hint">ทีมส่งงานที่รับไว้ให้เสร็จก่อนออกเวร · งบ Ken และ Pun รวมหนึ่งตำแหน่งตามเดิม</p>{state.employees.map(e=>{const shift=state.staffSchedule?.[e.id]??{start:e.id==='pun'?840:330,end:e.id==='ken'?840:1350};return <div className="shift-row" key={e.id}><strong>{e.name}</strong><label>เริ่ม<input aria-label={`เริ่มเวร ${e.name}`} type="time" min="05:30" max="22:30" value={clock(shift.start)} onChange={event=>dispatch({type:'shift',id:e.id,start:minutes(event.target.value),end:shift.end})}/></label><label>สิ้นสุด<input aria-label={`จบเวร ${e.name}`} type="time" min="05:30" max="22:30" value={clock(shift.end)} onChange={event=>dispatch({type:'shift',id:e.id,start:shift.start,end:minutes(event.target.value)})}/></label></div>})}</section>;
}
