import type {GameState,GameAction} from '../game/types';
import {operationIssues} from '../game/operations';
export default function OperationsDashboard({state,dispatch}:{state:GameState;dispatch:(a:GameAction)=>void}){
 const issues=operationIssues(state),plans=state.operationPlans??[];
 return <section aria-label="Dashboard ปัญหาร้าน"><h2>ศูนย์จัดการร้าน</h2><p>สถานะปัจจุบันและสิ่งที่ทราบล่วงหน้าใน 60 นาทีถัดไป</p>
 {(['waiting','working','planned','next'] as const).map(group=>{const rows=issues.filter(i=>group==='next'?i.period==='next':i.period==='now'&&(group==='working'?i.working:group==='planned'?!i.working&&plans.includes(i.id):!i.working&&!plans.includes(i.id)));return <section key={group}><h3>{({waiting:'รอแก้ไข',working:'กำลังแก้ไข',planned:'วางแผนจะทำ',next:'ชั่วโมงถัดไป'})[group]} · {rows.length}</h3>{!rows.length&&<p>ไม่มีรายการในกลุ่มนี้</p>}{rows.map(i=><article className="order-card" key={i.id}><strong>{i.title}</strong><p>{i.detail}</p>{!i.working&&<button className="button secondary" aria-pressed={plans.includes(i.id)} onClick={()=>dispatch({type:'plan-operation',id:i.id})}>{plans.includes(i.id)?'ยกเลิกแผน':'เพิ่มในแผน'}</button>}{i.ingredientId&&<button className="button primary" onClick={()=>{const ingredient=state.inventory.find(x=>x.id===i.ingredientId)!;dispatch({type:'restock',id:ingredient.id,quantity:Math.max(ingredient.reorder*4-ingredient.quantity,1)})}}>ซื้อเติมสต็อก</button>}</article>)}</section>})}
 <small>การเพิ่มในแผนเป็นการจดงาน ไม่ได้สั่งพนักงานอัตโนมัติ รายการหายเมื่อเงื่อนไขแก้สำเร็จ คาดการณ์เฉพาะนัดหมายที่ประกาศและเวลาเปิดขาย ไม่ทำนายลูกค้าสุ่ม</small>
 </section>;
}
