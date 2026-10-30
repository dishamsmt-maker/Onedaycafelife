import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {GameState} from '../game/types';
import {GARDEN_PLANTS,drinkSteps} from '../game/service';
import {productionView} from '../game/operations';
import {Dish,Drink} from './FoodModels';
import {StockLabel} from './LiveWorkstations';
function Box({p,s,c}:{p:[number,number,number];s:[number,number,number];c:string}){return <mesh position={p}><boxGeometry args={s}/><meshStandardMaterial color={c} roughness={.45}/></mesh>}
export default function ServiceDetails({state}:{state:GameState}){
 const pour=useRef<THREE.Group>(null),grinder=useRef<THREE.Mesh>(null),scoop=useRef<THREE.Group>(null);
 const jobs=state.employees.flatMap(e=>{const j=productionView(state,e);return j?[j]:[]}),cook=jobs.find(j=>j.menu.kind==='food'&&j.progress>0),bar=jobs.find(j=>j.menu.kind==='drink'&&j.progress>0);
 const steps=bar?drinkSteps(bar.menu.recipe,bar.menu.id):[],step=bar?steps[Math.min(steps.length-1,Math.floor(bar.progress*steps.length))]:'';
 useFrame(()=>{if(pour.current)pour.current.rotation.z=bar?-.55-Math.sin(bar.progress*Math.PI*steps.length)**2*.4:0;if(grinder.current)grinder.current.rotation.y=step==='บดกาแฟ'?(bar?.progress??0)*160:0;if(scoop.current){const f=((bar?.progress??0)*steps.length)%1;scoop.current.position.set(-.1,.25+Math.sin(f*Math.PI)*.2,-.15);scoop.current.rotation.z=f*.8;}});
 const alee=state.employees.find(e=>e.id==='alee')!,watering=alee.task?.maintenance==='water'&&alee.task.phase==='working';
 return <>
 {/* Flat pan / griddle and visible egg, toast or snack production. */}
 <group position={[1.95,1.12,4.85]}><mesh><cylinderGeometry args={[.23,.2,.045,24]}/><meshStandardMaterial color="#252c2c" metalness={.7}/></mesh><Box p={[-.31,0,0]} s={[.27,.035,.05]} c="#343832"/>
 {cook&&cook.menu.visual!=='porridge'&&cook.menu.visual!=='salad'&&cook.menu.id!=='boiled-egg'&&<group scale={.9}>{cook.progress>.65?<Dish name={cook.menu.id} p={[0,.025,0]}/>:<><mesh position={[0,.03,0]}><cylinderGeometry args={[.13,.13,.01,18]}/><meshStandardMaterial color={cook.menu.visual==='eggs'?'#f1e9ce':'#dab775'}/></mesh>{cook.menu.visual==='eggs'&&<mesh position={[.03,.045,0]} scale={[.04,.018,.04]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={cook.progress>.4?'#efb840':'#d88126'}/></mesh>}</>}</group>}
 {cook&&<group rotation={[0,Math.sin(cook.progress*24)*.5,0]}><Box p={[-.17,.11,.1]} s={[.025,.025,.35]} c="#b89968"/></group>}</group>
 {cook?.menu.visual==='salad'&&<group position={[1.95,1.09,3.93]}><Box p={[0,0,0]} s={[.4,.02,.32]} c="#ba9563"/><Dish name={cook.menu.id}/><Box p={[.1,.05,0]} s={[.015,.04,.16]} c="#bec8c4"/></group>}
 {/* Prepared dishes persist at pickup until that exact order is carried. */}
 {state.orders.filter(o=>o.status==='ready'&&!o.componentOrderIds?.length).slice(0,4).map((o,n)=>{const m=state.menu.find(m=>m.id===o.menuId)!;return <group key={o.id} position={[.65,1.08,3.8+n*.22]}>{m.kind==='drink'?<Drink name={m.id}/>:<Dish name={m.id}/>}</group>})}
 {/* Counter POS, open cash tray, order screen, grinder, milk and ice station. */}
 <group position={[.9,1.08,.75]}><Box p={[0,.04,0]} s={[.35,.08,.27]} c="#303a37"/><Box p={[0,.18,0]} s={[.055,.25,.05]} c="#282f2e"/><Box p={[0,.34,0]} s={[.34,.23,.035]} c="#243431"/><StockLabel text={`POS · ฿${Math.floor(state.cash)}`} position={[0,.34,-.025]} rotation={[0,Math.PI,0]} width={.3}/><Box p={[0,-.035,-.21]} s={[.34,.055,.28]} c="#292f2e"/>{[-.1,0,.1].map(x=><Box key={x} p={[x,0,-.21]} s={[.075,.012,.16]} c={x===0?'#b7cb96':'#b39eaf'}/>)}</group>
 <group position={[2,1.12,2.85]}><Box p={[0,.04,0]} s={[.35,.08,.25]} c="#6a7c80"/><Box p={[0,.22,0]} s={[.26,.28,.2]} c="#262e30"/><mesh ref={grinder} position={[0,.44,0]}><cylinderGeometry args={[.13,.07,.2,16]}/><meshStandardMaterial color="#68432c" transparent opacity={.75}/></mesh>{step==='บดกาแฟ'&&Array.from({length:5},(_,n)=><Box key={n} p={[-.1,.1+n*.025,.1]} s={[.015,.015,.015]} c="#573421"/>)}</group>
 <StockLabel text={state.orders.filter(o=>!['completed','cancelled'].includes(o.status)&&!o.componentOrderIds?.length).slice(0,3).map(o=>`${o.id.split('-').at(-1)} ${o.status}`).join(' | ')||'คิวพร้อมรับงาน'} position={[1.55,1.85,2.85]} width={.65}/>
 <group position={[1.8,1.12,1.35]}><Box p={[.18,.07,.1]} s={[.24,.14,.2]} c="#9daeb2"/>{Array.from({length:6},(_,n)=><Box key={n} p={[.12+n%3*.05,.16,.05+Math.floor(n/3)*.06]} s={[.04,.04,.04]} c="#d9f2f4"/>)}
 {bar&&step==='เติมน้ำแข็ง'?<group ref={scoop}><Box p={[0,0,0]} s={[.12,.035,.09]} c="#becbce"/>{[0,1,2].map(i=><Box key={i} p={[.03,-.06-i*.045,0]} s={[.035,.035,.035]} c="#d3edf3"/>)}</group>:bar&&!['เตรียมแก้ว','บดกาแฟ','ตรวจและส่งมอบ','หยิบขวดน้ำ'].includes(step)&&<group ref={pour} position={[0,.35,0]}><mesh><cylinderGeometry args={[.065,.055,.14,12]}/><meshStandardMaterial color={step.includes('นม')?'#f6f0d9':step.includes('ชา')?'#c57f35':'#9da9ac'} metalness={.4}/></mesh><mesh position={[.055,-.13,0]}><cylinderGeometry args={[.008,.008,.18,6]}/><meshStandardMaterial color={step.includes('นม')?'#eee9d5':step.includes('โซดา')?'#d9eff0':'#87623b'}/></mesh></group>}</group>
 {bar&&<StockLabel text={`${bar.menu.name} · ${step}`} position={[1.5,1.65,1.35]} width={.8}/>}
 {/* Alee's ladder and water stream follow real engine tasks. */}
 {alee.task?.maintenance==='sign'&&<group position={[-2.1,0,-.6]} rotation={[0,0,.5]}>{[-.22,.22].map(x=><Box key={x} p={[x,1.25,0]} s={[.045,2.5,.045]} c="#baaa86"/>)}{Array.from({length:7},(_,i)=><Box key={i} p={[0,.2+i*.32,0]} s={[.45,.035,.05]} c="#c2b496"/>)}</group>}
 {alee.task?.maintenance==='water'&&<group position={[alee.position[0]-.2,.8,alee.position[1]+.2]}><Box p={[0,0,0]} s={[.18,.2,.14]} c="#3a8d76"/><Box p={[-.15,.07,0]} s={[.2,.035,.04]} c="#3a8d76"/>{watering&&<mesh position={[-.25,-.3,0]}><cylinderGeometry args={[.015,.06,.65,8]}/><meshStandardMaterial color="#9ed9f2" transparent opacity={.6}/></mesh>}</group>}
 {GARDEN_PLANTS.map(({x,z},i)=><group key={i} position={[x,0,z]}><Box p={[0,.06,0]} s={[.24,.1,.24]} c={(state.wateredCount??0)>i?'#74664f':'#a39373'}/></group>)}
 {state.customers.filter(c=>c.askedAt!==undefined&&c.answeredAt===undefined&&c.status!=='leaving').map(c=><StockLabel key={c.id} text="ขอโทษครับ อาหารเสร็จหรือยัง?" position={[c.position[0],1.9,c.position[1]]} rotation={[0,Math.PI,0]} width={.8}/>)}
 </>;
}
