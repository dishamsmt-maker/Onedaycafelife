import {useEffect,useMemo,useState} from 'react';
import * as THREE from 'three';
import type {GameState,Ingredient} from '../game/types';
import {productionView,storageGroup} from '../game/operations';
import {Dish,Drink} from './FoodModels';
type V3=[number,number,number];
export function StockLabel({text,position,rotation=[0,-Math.PI/2,0],width=.5}:{text:string;position:V3;rotation?:V3;width?:number}){
 const texture=useMemo(()=>{const c=document.createElement('canvas');c.width=768;c.height=160;const x=c.getContext('2d')!;x.fillStyle='#f5edda';x.fillRect(0,0,768,160);x.fillStyle='#243a2f';x.font='42px sans-serif';x.textAlign='center';x.fillText(text,384,95,740);const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;return t},[text]);useEffect(()=>()=>texture.dispose(),[texture]);
 return <mesh position={position} rotation={rotation} scale={[-1,1,1]}><planeGeometry args={[width,width*160/768]}/><meshBasicMaterial map={texture} side={THREE.DoubleSide}/></mesh>;
}
function Cube({p,s,color}:{p:V3;s:V3;color:string}){return <mesh position={p}><boxGeometry args={s}/><meshStandardMaterial color={color} roughness={.75}/></mesh>}
export function IngredientModel({item,scale=1}:{item:Ingredient;scale?:number}){
 const group=storageGroup(item),fill=Math.min(1,item.quantity/Math.max(item.reorder*4,.01));
 if(item.quantity<=0)return null;
 const color=group==='ผัก'?'#54883b':group==='เนื้อและอาหารแช่แข็ง'?'#c98f82':group==='เครื่องดื่ม'?'#e5e5cd':'#d3b57c';
 return <group scale={[scale,scale*(.4+.6*fill),scale]}>
 {group==='เครื่องดื่ม'?<><mesh position={[0,.08*fill,0]}><cylinderGeometry args={[.035,.04,.16*fill,10]}/><meshStandardMaterial color={item.id==='milk'?'#f5eedc':'#97c6cb'}/></mesh><Cube p={[0,.17*fill,0]} s={[.035,.02,.035]} color="#426859"/></>:<><Cube p={[0,.012,0]} s={[.13,.025,.12]} color="#d8d6c5"/>{Array.from({length:Math.max(1,Math.ceil(fill*5))},(_,n)=><mesh key={n} position={[(n%2-.5)*.055,.035+Math.floor(n/2)*.02,(n%3-1)*.025]} scale={group==='ผัก'?[.045,.015,.03]:[.035,.02,.025]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color={item.id==='egg'?'#eee1c4':color}/></mesh>)}</>}
 </group>;
}
export function LiveFridge({state,open,onToggle}:{state:GameState;open:boolean;onToggle:()=>void}){
 const rows=['เครื่องดื่ม','ไข่และของสด','ผัก','เนื้อและอาหารแช่แข็ง','ของแห้ง'];
 const collecting=state.employees.some(e=>e.task?.productionStep==='collect'&&e.task.phase==='working');
 const visible=open||collecting;
 return <group position={[1.95,0,5.85]} onClick={e=>{e.stopPropagation();onToggle()}}>
 <Cube p={[.32,.95,0]} s={[.06,1.9,.85]} color="#c1cbc2"/>{[-.43,.43].map(z=><Cube key={z} p={[0,.95,z]} s={[.7,1.9,.035]} color="#c1cbc2"/>)}
 {rows.map((name,row)=>{const y=1.65-row*.32;const items=state.inventory.filter(i=>storageGroup(i)===name);return <group key={name}>
 <Cube p={[0,y-.04,0]} s={[.65,.025,.82]} color="#d7e0d4"/>
 {visible&&items.map((i,n)=><group key={i.id} position={[.16-Math.floor(n/5)*.18,y,-.32+(n%5)*.16]}><IngredientModel item={i} scale={.8}/><StockLabel text={`${i.name} ${Number(i.quantity.toFixed(2))} ${i.unit}`} position={[-.08,.12,0]} width={.15}/></group>)}
 {visible&&<group position={[-.31,y-.03,0]}><Cube p={[0,0,0]} s={[.03,.06,.18]} color={row===0?'#7ecbd0':row===1?'#f0ddae':row===2?'#64a34e':row===3?'#d78877':'#c79d55'}/></group>}
 </group>})}
 <group position={[-.36,.95,-.44]} rotation={[0,visible?-Math.PI*.65:0,0]}><Cube p={[0,0,.44]} s={[.055,1.9,.88]} color="#b7c4b9"/><Cube p={[-.045,0,.74]} s={[.04,.45,.03]} color="#344a3d"/></group>
 </group>;
}
export function LiveProduction({state}:{state:GameState}){
 const [lidOpen,setLidOpen]=useState(false);
 const jobs=state.employees.flatMap(e=>{const job=productionView(state,e);return job?[{...job,employee:e}]:[]});
 const kitchen=jobs.find(j=>j.menu.kind==='food'&&j.employee.task?.productionStep!=='collect'&&j.employee.task?.phase==='working');
 const bar=jobs.find(j=>j.menu.kind==='drink'&&j.employee.task?.productionStep!=='collect'&&j.employee.task?.phase==='working');
 return <>
 <group position={[1.95,1.1,4.3]} onClick={e=>{e.stopPropagation();setLidOpen(v=>!v)}}>
 <mesh><cylinderGeometry args={[.2,.17,.2,24,1,true]}/><meshStandardMaterial color="#aab4ad" metalness={.7} roughness={.3} side={THREE.DoubleSide}/></mesh>
 <mesh position={[0,-.09,0]}><cylinderGeometry args={[.17,.17,.02,24]}/><meshStandardMaterial color="#505b54"/></mesh>
 {kitchen&&<><mesh position={[0,.03,0]}><cylinderGeometry args={[.18,.18,.07,24]}/><meshStandardMaterial color={kitchen.menu.visual==='porridge'?'#d4ba82':'#d0a158'}/></mesh>{Object.keys(kitchen.menu.recipe).slice(0,6).map((id,n)=>{const i=state.inventory.find(i=>i.id===id);return i&&<group key={id} position={[Math.sin(n*2)*.1,.07,Math.cos(n*2)*.1]}><IngredientModel item={{...i,quantity:Math.max(i.reorder,.1)}} scale={.5}/></group>})}</>}
 {kitchen&&lidOpen&&<group rotation={[0,state.minute*4,0]}><Cube p={[.09,.16,0]} s={[.025,.32,.025]} color="#89663f"/></group>}
 <group position={[0,lidOpen?.4:.12,lidOpen?.2:0]} rotation={[lidOpen?1:0,0,0]}><mesh><cylinderGeometry args={[.21,.21,.025,24]}/><meshStandardMaterial color="#c5cec6" metalness={.7}/></mesh><Cube p={[0,.04,0]} s={[.06,.05,.06]} color="#29382f"/></group>
 <StockLabel text={lidOpen?'แตะปิดหม้อ':'แตะเปิดหม้อ'} position={[-.23,.1,0]} width={.35}/>
 </group>
 {kitchen&&<><StockLabel text={`${kitchen.menu.name} · ${kitchen.stage}`} position={[1.52,1.5,4.3]} width={.8}/>{kitchen.progress>.65&&<Dish name={kitchen.menu.id} p={[1.95,1.08,3.93]}/>}</>}
 {bar&&<><Drink name={bar.menu.id} p={[1.75,1.11,1.35]} fill={bar.progress}/><StockLabel text={`${bar.menu.name} · ${bar.stage}`} position={[1.52,1.5,1.35]} width={.75}/></>}
 {jobs.filter(j=>j.order.stockConsumed&&j.employee.task?.phase==='walking').map(j=><group key={j.employee.id} position={[j.employee.position[0],1.0,j.employee.position[1]+.2]}><Cube p={[0,0,0]} s={[.3,.025,.22]} color="#9c8055"/>{Object.keys(j.menu.recipe).slice(0,3).map((id,n)=>{const i=state.inventory.find(i=>i.id===id);return i&&<group key={id} position={[(n-1)*.08,.025,0]}><IngredientModel item={{...i,quantity:Math.max(i.reorder,.1)}} scale={.65}/></group>})}</group>)}
 </>;
}
