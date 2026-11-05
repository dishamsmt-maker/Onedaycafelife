import {useEffect,useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {GameState} from '../game/types';
import {atmosphereKey,cafeLightSources,nearestCafeLights} from '../game/cafeAtmosphere';
import {LIGHT_COLORS} from '../game/cozy';

export default function CafeNightLighting({state,active,quality}:{state:GameState;active:boolean;quality:'low'|'high'}){
 const key=atmosphereKey(state),sources=useMemo(()=>cafeLightSources(state.tables),[key]);
 const lights=useRef<(THREE.PointLight|null)[]>([]),assigned=useRef<string[]>([]),last=useRef(1);
 const bulbs=useRef<THREE.InstancedMesh>(null),posts=useRef<THREE.InstancedMesh>(null);
 const wire=useMemo(()=>{const p:number[]=[];for(const z of [6,14.2,19,23.8,31,39,46]){for(let i=0;i<12;i++){const x=-2.35+i*.395,n=x+.395;const y=(x:number)=>2.95-Math.sin((x+2.35)/4.74*Math.PI)*.22;p.push(x,y(x),z,n,y(n),z)}}return new Float32Array(p)},[]);
 useEffect(()=>{if(!bulbs.current)return;const o=new THREE.Object3D();let n=0;for(const z of [6,14.2,19,23.8,31,39,46])for(let i=0;i<=12;i++){const x=-2.35+i*.395;o.position.set(x,2.95-Math.sin(i/12*Math.PI)*.22,z);o.scale.setScalar(.035);o.updateMatrix();bulbs.current.setMatrixAt(n++,o.matrix)}bulbs.current.instanceMatrix.needsUpdate=true;bulbs.current.computeBoundingSphere();n=0;for(const z of [6,14.2,19,23.8,31,39,46])for(const x of [-2.35,2.35]){o.position.set(x,1.48,z);o.scale.set(.024,2.96,.024);o.updateMatrix();posts.current?.setMatrixAt(n++,o.matrix)}if(posts.current){posts.current.instanceMatrix.needsUpdate=true;posts.current.computeBoundingSphere()}},[]);
 const pool=quality==='low'?4:6,color=LIGHT_COLORS[state.life?.light??'warm'];
 useFrame(({camera},dt)=>{
  last.current+=dt;
  if(last.current>.3){const chosen=nearestCafeLights(sources,[-camera.position.x,camera.position.z],quality);const wanted=new Set(chosen.map(l=>l.id));assigned.current=assigned.current.slice(0,pool).map(id=>wanted.has(id)?id:'');for(const source of chosen)if(!assigned.current.includes(source.id)){let slot=assigned.current.indexOf('');if(slot<0)slot=assigned.current.length;if(slot<pool)assigned.current[slot]=source.id;}last.current=0;}
  lights.current.forEach((light,i)=>{if(!light)return;const source=sources.find(s=>s.id===assigned.current[i]);if(source){light.position.set(...source.position);light.distance=source.distance;}light.intensity=THREE.MathUtils.damp(light.intensity,active&&source?source.intensity:0,2,Math.min(dt,.15));});
  if(import.meta.env.DEV)(globalThis as any).__ONE_DAY_CAFE_LIGHTS__={active,pool,assigned:[...assigned.current],settled:lights.current.every((light,i)=>{const source=sources.find(s=>s.id===assigned.current[i]);return !active||!source||!!light&&light.intensity>=source.intensity*.9})};
 });
 return <>
 {Array.from({length:pool},(_,i)=><pointLight key={i} ref={ref=>{lights.current[i]=ref}} intensity={0} color={color} decay={2} distance={8}/>)}
 <instancedMesh ref={posts} args={[undefined,undefined,14]} receiveShadow><cylinderGeometry args={[1,1,1,6]}/><meshStandardMaterial color="#4e5748" roughness={.75}/></instancedMesh>
 <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[wire,3]}/></bufferGeometry><lineBasicMaterial color="#594e3c"/></lineSegments>
 <instancedMesh ref={bulbs} args={[undefined,undefined,91]}><sphereGeometry args={[1,6,4]}/><meshStandardMaterial color="#fff1d4" emissive={color} emissiveIntensity={active?3.5:.08}/></instancedMesh>
 {state.tables.filter(t=>t.enabled!==false).map(t=><group key={t.id} position={[t.position[0],0,t.position[1]]}>
  <mesh position={[.32,2.1,.12]}><cylinderGeometry args={[.085,.045,.09,10]}/><meshStandardMaterial color="#c7ad7b" metalness={.35}/></mesh>
  <mesh position={[.32,2.04,.12]}><sphereGeometry args={[.035,8,6]}/><meshStandardMaterial color="#fff0c5" emissive={color} emissiveIntensity={active?4:.05}/></mesh>
  <mesh position={[0,.84,0]}><cylinderGeometry args={[.045,.04,.13,10]}/><meshStandardMaterial color="#e5cfaa" emissive={color} emissiveIntensity={active?.9:0} roughness={.6}/></mesh>
 </group>)}
 </>;
}
