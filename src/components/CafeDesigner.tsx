import {useState} from 'react';
import {useGame} from '../game/store';
import {activeTables, gardenComfort, POT_SLOTS, PLANT_PRICES, progression, UMBRELLAS, type PlantSpecies, type UmbrellaStyle} from '../game/cozy';
import type {GameState} from '../game/types';
const speciesNames={monstera:'มอนสเตอร่า',rubber:'ยางอินเดีย',fern:'เฟิร์น'};
export default function CafeDesigner({state}:{state:GameState}){
 const dispatch=useGame(s=>s.dispatch),[tableId,setTableId]=useState('t1'),[z,setZ]=useState(14.25),[slot,setSlot]=useState(0),[species,setSpecies]=useState<PlantSpecies>('monstera');
 const table=state.tables.find(t=>t.id===tableId)!;
 const progress=progression(state),spent=progress.investment;
 return <section className="cafe-designer" aria-label="ออกแบบร้านและสวน"><h3>ร้านที่ค่อย ๆ เติบโต</h3><p>{progress.stage} · {activeTables(state).length} โต๊ะ · ความสบายจากสวน +{gardenComfort(state).toFixed(1)}</p>
 <svg viewBox="0 0 520 115" role="img" aria-label="ผังร้าน 5 คูณ 50 เมตร" className="garden-plan"><rect x="10" y="10" width="500" height="75" fill="#e3dbc8"/><rect x="10" y="10" width="500" height="23" fill="#f7f2e7"/><rect x="80" y="34" width="60" height="45" fill="#c9998b"/><text x="88" y="60">บาร์</text>{activeTables(state).map(t=><g key={t.id}><circle cx={10+t.position[1]*10} cy="57" r="9" fill={UMBRELLAS[t.umbrella??'cream'].color} stroke="#596648"/><text x={5+t.position[1]*10} y="98">{t.name}</text></g>)}{state.life?.pots.map(p=><circle key={p.slot} cx={10+POT_SLOTS[p.slot][1]*10} cy="78" r="4" fill="#4c7651"/>)}<text x="15" y="104">ถนน</text><text x="412" y="104">หลังร้าน 50 ม.</text></svg>
 <p className="hint">ทางเดินหลักกว้าง 1.5 ม. อยู่ฝั่ง ตรอ. · ย้ายเฉพาะโต๊ะว่างและเก็บสะอาดแล้ว</p>
 <label className="setting-row">เลือกโต๊ะ<select aria-label="โต๊ะที่จะจัด" value={tableId} onChange={e=>{setTableId(e.target.value);setZ(state.tables.find(t=>t.id===e.target.value)!.position[1])}}>{state.tables.map(t=><option key={t.id} value={t.id}>{t.name}{t.enabled===false?' · เก็บไว้':''}</option>)}</select></label>
 <label className="setting-row">ระยะจากหน้าที่ดิน {z.toFixed(2)} ม.<input aria-label="ระยะโต๊ะจากหน้าที่ดิน" type="range" min="14" max="38" step="0.25" value={z} onChange={e=>setZ(Number(e.target.value))}/></label>
 <div className="row"><button className="button secondary" disabled={table.enabled===false||table.customerIds.length>0||table.dirty} onClick={()=>dispatch({type:'move-table',id:tableId,position:[.8,z]})}>ย้ายโต๊ะ</button><button className="button secondary" disabled={!!table.customerIds.length||table.dirty||(table.enabled!==false&&activeTables(state).length<=3)} onClick={()=>dispatch({type:'table-enabled',id:tableId,enabled:table.enabled===false})}>{table.enabled===false?'นำโต๊ะออกมา':'เก็บโต๊ะ'}</button></div>
 <h3>ร่มและแสง</h3><div className="decor-options">{Object.entries(UMBRELLAS).map(([id,u])=><button key={id} aria-pressed={(table.umbrella??'cream')===id} onClick={()=>dispatch({type:'umbrella',id:tableId,style:id as UmbrellaStyle})}>{u.label}<small>{u.price?`฿${u.price.toLocaleString()}`:'ไม่คิดเงิน'}</small></button>)}</div>
 <div className="decor-options">{(['warm','amber','white'] as const).map((id,i)=><button key={id} aria-pressed={(state.life?.light??'warm')===id} onClick={()=>dispatch({type:'garden-light',value:id})}>{['ไฟอุ่น','แอมเบอร์','ขาวนวล'][i]}<small>฿600 / ชุด</small></button>)}</div>
 <h3>ปลูกต้นไม้</h3><label className="setting-row">จุดปลูก<select aria-label="จุดปลูกกระถาง" value={slot} onChange={e=>setSlot(Number(e.target.value))}>{POT_SLOTS.map((p,i)=><option key={i} value={i} disabled={state.life?.pots.some(p=>p.slot===i)}>ริมสวน {p[1]} ม.{state.life?.pots.some(p=>p.slot===i)?' · ปลูกแล้ว':''}</option>)}</select></label>
 <label className="setting-row">ต้นไม้<select aria-label="ชนิดต้นไม้" value={species} onChange={e=>setSpecies(e.target.value as PlantSpecies)}>{Object.entries(speciesNames).map(([id,name])=><option key={id} value={id}>{name} · ฿{PLANT_PRICES[id as PlantSpecies]}</option>)}</select></label>
 <button className="button primary full" disabled={state.life?.pots.some(p=>p.slot===slot)} onClick={()=>dispatch({type:'plant',slot,species})}>ซื้อและปลูก · ฿{PLANT_PRICES[species]}</button>
 <p className="hint">เงินสด ฿{state.cash.toLocaleString()} · ลงทุนจัดร้านแล้ว ฿{spent.toLocaleString()} / งบ ฿{state.settings.setupBudget.toLocaleString()}<br/>ซื้อของตกแต่งลดเงินสดและบันทึกเป็นเงินลงทุน แยกจากต้นทุนอาหาร ต้นไม้โตขึ้นเมื่อผ่านวันและได้รับน้ำ</p>
 </section>;
}
