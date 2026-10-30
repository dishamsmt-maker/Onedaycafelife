import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import * as THREE from 'three';
import { useVisitor } from '../game/visitor';
import type { GameState } from '../game/types';
import { Drink } from './FoodModels';
/** Camera-relative hands animate only after consuming a real delivered order. */
export default function FirstPersonHands({state}:{state:GameState}){
 const scanned=useVisitor(s=>s.scannedTableId),action=useVisitor(s=>s.action),{camera}=useThree(),rig=useRef<THREE.Group>(null),hand=useRef<THREE.Group>(null),elapsed=useRef(0);
 const player=state.customers.find(c=>c.player),drinkOrder=[...state.orders].reverse().find(o=>o.customerId===player?.id&&o.consumed&&state.menu.find(m=>m.id===o.menuId)?.kind==='drink');
 const name=state.menu.find(m=>m.id===drinkOrder?.menuId)?.id??'latte';
 useEffect(()=>{elapsed.current=0},[action]);
 useFrame((_,dt)=>{if(!rig.current||!hand.current)return;rig.current.position.copy(camera.position);rig.current.quaternion.copy(camera.quaternion);elapsed.current+=dt;const lift=Math.sin(Math.min(1,elapsed.current/2.2)*Math.PI);hand.current.position.set(.14-lift*.07,-.43+lift*.22,-.48+lift*.13);hand.current.rotation.x=action==='drinking'?lift*.6:-lift*.4;});
 if(action==='idle'&&!scanned)return null;
 return <group ref={rig}><group ref={hand}>
 <mesh position={[.07,-.1,.15]} rotation={[.65,0,-.3]}><capsuleGeometry args={[.035,.22,5,12]}/><meshStandardMaterial color="#c99d78" roughness={.8}/></mesh>
 <mesh position={[.035,-.025,.035]} scale={[.052,.032,.065]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#c99d78" roughness={.8}/></mesh>
 {[0,1,2].map(i=><mesh key={i} position={[-.005,-.015+i*.014,.015]} rotation={[0,0,.8]}><capsuleGeometry args={[.009,.045,3,7]}/><meshStandardMaterial color="#d2a884" roughness={.8}/></mesh>)}
 {action==='idle'?<group rotation={[-.25,0,0]}><mesh><boxGeometry args={[.13,.23,.018]}/><meshStandardMaterial color="#18262b"/></mesh><mesh position={[0,0,.012]}><boxGeometry args={[.115,.2,.005]}/><meshBasicMaterial color="#b7d8bf"/></mesh><mesh position={[0,.04,.017]}><boxGeometry args={[.065,.065,.005]}/><meshBasicMaterial color="#284f3b"/></mesh></group>:action==='drinking'?<Drink name={name} p={[-.01,-.04,-.01]}/>:<group rotation={[.1,0,Math.PI/2]}><mesh position={[0,-.045,0]}><boxGeometry args={[.012,.17,.006]}/><meshStandardMaterial color="#bfc6bf" metalness={.75} roughness={.25}/></mesh><mesh position={[0,-.145,0]} scale={[.026,.038,.005]}><sphereGeometry args={[1,12,7]}/><meshStandardMaterial color="#bfc6bf" metalness={.75} roughness={.25}/></mesh><mesh position={[0,-.143,-.006]} scale={[.019,.025,.007]}><sphereGeometry args={[1,10,6]}/><meshStandardMaterial color="#e8d7b2" roughness={.65}/></mesh></group>}
 </group></group>
}
