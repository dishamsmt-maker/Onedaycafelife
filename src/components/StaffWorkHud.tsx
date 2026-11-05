import {useEffect,useState} from 'react';
import {useGame} from '../game/store';
import {staffSteps} from '../game/cozy';
import type {Employee,GameState,StaffWork} from '../game/types';
export default function StaffWorkHud({employee:e,state}:{employee:Employee;state:GameState}){
 const dispatch=useGame(s=>s.dispatch),[busy,setBusy]=useState(false),t=e.task;
 const menu=state.menu.find(m=>m.id===state.orders.find(o=>o.id===t?.orderId)?.menuId);
 const step=t?.productionStep==='collect'?'หยิบวัตถุดิบ':t?.kind==='brew'||t?.kind==='cook'?staffSteps(t.kind,menu?.visual)[t.manualStep??0]:t?.purpose==='wash'?'ล้างอุปกรณ์':t?.stage==='pickup'?'รับถาด':t?.stage==='deliver'?'ส่งมอบถึงลูกค้า':t?.stage==='take-order'?'รับออร์เดอร์':t?.maintenance==='water'?'รดน้ำต้นไม้':t?.maintenance==='sign'?'จัดป้ายหน้าร้าน':t?.kind==='clean'?'เก็บโต๊ะ':'ตรวจความเรียบร้อย';
 const close=t&&Math.hypot(e.position[0]-t.target[0],e.position[1]-t.target[1])<=1.05;
 useEffect(()=>{setBusy(false)},[e.id,t?.orderId,t?.manualStep,t?.productionStep,t?.stage,t?.tableId]);
 useEffect(()=>{if(!busy)return;const timer=setTimeout(()=>{dispatch({type:'staff-step',id:e.id});setBusy(false)},2200);return()=>clearTimeout(timer)},[busy,e.id,dispatch]);
 const destination=t?.productionStep==='collect'?'ตู้วัตถุดิบ':t?.kind==='brew'?'บาร์เครื่องดื่ม':t?.kind==='cook'?'ครัว':t?.purpose==='wash'?'อ่างล้าง':t?.stage==='pickup'?'จุดรับถาด':t?.stage==='deliver'?'โต๊ะลูกค้า':t?.kind==='clean'?'โต๊ะที่ต้องเก็บ':'จุดเตรียมร้าน';
 return <div className="staff-work" aria-label="งานพนักงาน"><strong>{e.name} · ลงมือดูแลร้าน</strong>{t?.manual?<><p>{menu?.name??destination} · {close?'พร้อมทำงาน':`เดินไป${destination}`}</p><button className="button primary" disabled={!close||busy} onClick={()=>setBusy(true)}>{busy?'กำลังลงมือ…':`ทำขั้นตอน · ${step}`}</button><small>แต่ละขั้นตอนใช้เวลาประมาณ 2 วินาที</small></>:<><p>เลือกงาน แล้วเดินไปยังจุดทำงาน</p><div className="staff-work-options">{([['brew','ชงเครื่องดื่ม'],['cook','ทำอาหาร'],['serve','รับ / เสิร์ฟ'],['clean','เก็บโต๊ะ'],['wash','ล้างอุปกรณ์'],['prepare','เตรียมร้าน / สวน']] as [StaffWork,string][]).map(([work,label])=><button key={work} onClick={()=>dispatch({type:'staff-work',id:e.id,work})}>{label}</button>)}</div></>}</div>;
}
