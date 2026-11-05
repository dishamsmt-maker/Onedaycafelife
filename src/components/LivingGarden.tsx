import {useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {GameState} from '../game/types';
/** Ambient life uses a presentation clock; it cannot consume simulation RNG. */
export default function LivingGarden({night,raining,quality}:{night:boolean;raining:boolean;quality:'low'|'high'}){
 const cat=useRef<THREE.Group>(null),tail=useRef<THREE.Mesh>(null),car=useRef<THREE.Group>(null),wings=useRef<THREE.Group>(null),leaves=useRef<THREE.InstancedMesh>(null),age=useRef(0),matrix=useRef(new THREE.Object3D());
 const count=quality==='high'?16:6;
 useFrame((_,dt)=>{
  age.current+=Math.min(dt,.1);const t=age.current;
  if(cat.current){const phase=t%120;cat.current.position.set(-1.85+.12*Math.sin(t),0,phase<32?26+phase*.13:phase<60?30.16:phase<92?30.16-(phase-60)*.13:26);cat.current.rotation.y=phase>=60&&phase<92?Math.PI:0;cat.current.children.forEach((leg,i)=>{if(leg.name==='leg')leg.rotation.x=phase<32||phase>=60&&phase<92?Math.sin(t*7+i)*.18:0});}
  if(tail.current)tail.current.rotation.x=.7+Math.sin(t*1.3)*.12;
  if(car.current){car.current.position.x=(t%60)*1.2-24;car.current.visible=t%60<40;}
  if(wings.current){wings.current.position.set(1.3+Math.sin(t*.28)*.5,1.2+Math.sin(t*.7)*.3,24+Math.sin(t*.17)*2);wings.current.children.forEach((wing,i)=>wing.rotation.y=Math.sin(t*13)*(i?1:-1));}
  if(leaves.current){for(let i=0;i<count;i++){const a=(t*.06+i*.618)%1,o=matrix.current;o.position.set(1.2+Math.sin(i*3+t*.3)*.5,(1-a)*3.8,26+(i%6)*3+Math.sin(t*.2+i));o.rotation.set(a*5,i,a*8);o.scale.set(.06,.11,.03);o.updateMatrix();leaves.current.setMatrixAt(i,o.matrix)}leaves.current.instanceMatrix.needsUpdate=true;}
 });
 return <>
 <group ref={cat} position={[-1.85,0,26]}><mesh position={[0,.28,0]} scale={[.12,.13,.28]}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color="#bcab91"/></mesh><mesh position={[0,.39,.24]}><sphereGeometry args={[.12,12,8]}/><meshStandardMaterial color="#bcab91"/></mesh>{[-.065,.065].map(x=><mesh key={x} position={[x,.51,.24]} rotation={[0,0,x>0?-.2:.2]}><coneGeometry args={[.05,.11,3]}/><meshStandardMaterial color="#ad947c"/></mesh>)}{[-.045,.045].map(x=><mesh key={x} position={[x,.41,.343]}><sphereGeometry args={[.012,6,4]}/><meshStandardMaterial color="#485b3c"/></mesh>)}{[-.075,.075].flatMap(x=>[-.16,.16].map(z=><mesh name="leg" key={`${x}${z}`} position={[x,.12,z]}><capsuleGeometry args={[.035,.15,3,8]}/><meshStandardMaterial color="#a89174"/></mesh>))}<mesh ref={tail} position={[0,.32,-.31]} rotation={[.7,0,0]}><capsuleGeometry args={[.025,.24,3,8]}/><meshStandardMaterial color="#9e886d"/></mesh></group>
 {!night&&!raining&&<group ref={wings}>{[-1,1].map(side=><mesh key={side} position={[side*.04,0,0]} rotation={[0,0,side*.2]} scale={[.08,.055,.02]}><sphereGeometry args={[1,8,6]}/><meshStandardMaterial color={side===1?'#f2cf82':'#d6b77a'} side={THREE.DoubleSide}/></mesh>)}</group>}
 <instancedMesh ref={leaves} args={[undefined,undefined,count]} frustumCulled={false}><sphereGeometry args={[1,5,3]}/><meshStandardMaterial color="#b7a672" roughness={1}/></instancedMesh>
 <group ref={car} position={[-15,0,-3.5]}><mesh position={[0,.46,0]}><boxGeometry args={[3.6,.6,1.45]}/><meshStandardMaterial color="#c8c9bd" roughness={.35} metalness={.3}/></mesh><mesh position={[.15,.95,0]}><boxGeometry args={[1.8,.55,1.3]}/><meshStandardMaterial color="#35484c" roughness={.22}/></mesh>{[-1.1,1.1].flatMap(x=>[-.73,.73].map(z=><mesh key={`${x}${z}`} position={[x,.25,z]} rotation={[Math.PI/2,0,0]}><cylinderGeometry args={[.27,.27,.15,12]}/><meshStandardMaterial color="#252929"/></mesh>))}{[-.5,.5].map(z=><mesh key={z} position={[1.82,.5,z]}><boxGeometry args={[.02,.12,.25]}/><meshStandardMaterial color="#f9e9c3" emissive="#ffe6b0" emissiveIntensity={night?2:.1}/></mesh>)}</group>
 </>;
}
export function QuietActivities({state}:{state:GameState}){return <>{state.customers.filter(c=>c.activity==='reading'&&c.status==='eating').map(c=><group key={c.id} position={[c.position[0],.99,c.position[1]]} rotation={[-.3,0,c.position[0]<.8?-.3:.3]}><mesh><boxGeometry args={[.25,.025,.19]}/><meshStandardMaterial color="#8e6b50"/></mesh><mesh position={[0,.018,0]}><boxGeometry args={[.23,.012,.18]}/><meshStandardMaterial color="#eee4ce"/></mesh></group>)}{state.employees.filter(e=>e.task?.kind==='rest'&&e.task.phase==='working').map(e=><mesh key={e.id} position={[e.position[0]-.2,1.1,e.position[1]+.15]}><cylinderGeometry args={[.04,.035,.13,10]}/><meshStandardMaterial color="#9fbcc0" roughness={.2}/></mesh>)}</>}
