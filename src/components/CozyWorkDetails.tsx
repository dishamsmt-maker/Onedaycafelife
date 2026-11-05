import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import {productionView} from '../game/operations';
import type {GameState} from '../game/types';
function Piece({p,s,c,metal=false}:{p:[number,number,number];s:[number,number,number];c:string;metal?:boolean}){return <mesh position={p}><boxGeometry args={s}/><meshStandardMaterial color={c} metalness={metal?.65:0} roughness={metal?.3:.75}/></mesh>}
export default function CozyWorkDetails({state}:{state:GameState}){
 const ladle=useRef<THREE.Group>(null),pitcher=useRef<THREE.Group>(null),wash=useRef<THREE.Mesh>(null);
 const jobs=state.employees.flatMap(e=>{const j=productionView(state,e);return j&&e.task?.productionStep!=='collect'&&e.task?.phase==='working'?[j]:[]}),cook=jobs.find(j=>j.menu.kind==='food'),brew=jobs.find(j=>j.menu.kind==='drink');
 const washing=state.employees.some(e=>e.task?.purpose==='wash');
 useFrame(({clock})=>{const t=clock.elapsedTime;if(ladle.current){ladle.current.rotation.z=cook?Math.sin(t*1.4)*.5:0;ladle.current.position.y=cook?.progress&&cook.progress>.5?1.25+Math.sin(t*1.4)*.1:1.2;}if(pitcher.current)pitcher.current.rotation.z=brew&&brew.progress>.25&&brew.progress<.9?-.6+Math.sin(t)*.1:0;if(wash.current)wash.current.scale.setScalar(washing?.85+Math.sin(t*4)*.1:0)});
 return <>
 <group position={[-.37,.98,8.05]}><Piece p={[0,.08,0]} s={[.22,.16,.2]} c="#424b46" metal/><mesh position={[0,.25,0]}><cylinderGeometry args={[.09,.06,.2,12]}/><meshStandardMaterial color="#6a4b35" roughness={.45}/></mesh><Piece p={[0,.06,.13]} s={[.11,.06,.11]} c="#a6afa9" metal/></group>
 {brew&&<group ref={pitcher} position={[-.375,1.27,9.35]}><mesh><cylinderGeometry args={[.06,.045,.13,12]}/><meshStandardMaterial color="#c6cfca" metalness={.7} roughness={.2}/></mesh>{brew.progress>.25&&brew.progress<.9&&<mesh position={[.05,-.13,0]}><cylinderGeometry args={[.009,.009,.2,6]}/><meshStandardMaterial color={brew.menu.visual==='tea'?'#bd824c':'#e9dfc5'}/></mesh>}</group>}
 {cook&&<group ref={ladle} position={[1.875,1.2,10.4]}><mesh rotation={[0,0,-.4]}><cylinderGeometry args={[.012,.012,.34,8]}/><meshStandardMaterial color="#b7c5bf" metalness={.7}/></mesh><mesh position={[.065,-.16,0]} scale={[.055,.02,.055]}><sphereGeometry args={[1,10,6]}/><meshStandardMaterial color={cook.progress>.6?'#d7c39f':'#a8b6ae'} metalness={.5}/></mesh></group>}
 {(state.life?.dirtyDishes??0)>0&&<group position={[.8,1.0,12.57]}>{Array.from({length:Math.min(4,state.life?.dirtyDishes??0)},(_,i)=><mesh key={i} position={[0,i*.025,0]}><cylinderGeometry args={[.12,.11,.02,16]}/><meshStandardMaterial color="#ddd5bd"/></mesh>)}</group>}
 {washing&&<group position={[.15,1.07,12.57]}><mesh><cylinderGeometry args={[.008,.008,.2,6]}/><meshStandardMaterial color="#b7dae0" transparent opacity={.5}/></mesh><mesh ref={wash} position={[0,-.1,0]} scale={.1}><sphereGeometry args={[.16,10,6]}/><meshStandardMaterial color="#e2ebe3" transparent opacity={.45}/></mesh></group>}
 </>;
}
