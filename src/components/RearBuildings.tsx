import {memo} from 'react';
import {PAVILION_POSTS,REAR_PAVILION} from '../game/world';
type V3=[number,number,number];
function Block({p,s,color,rotation}:{p:V3;s:V3;color:string;rotation?:V3}){return <mesh position={p} rotation={rotation} castShadow receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={color} roughness={.8}/></mesh>}
function Glow({p,s,night}:{p:V3;s:V3;night:boolean}){return <mesh position={p}><boxGeometry args={s}/><meshStandardMaterial color="#ffebbf" emissive="#ffbf68" emissiveIntensity={night?2.8:.05}/></mesh>}
/** Roofed garden pavilion plus the existing solid rear service footprint. */
function RearBuildings({night}:{night:boolean}){
 const {x,z}=REAR_PAVILION;
 return <>
  <Block p={[x,.025,z]} s={[3,.05,3.4]} color="#c9baa0"/>
  {PAVILION_POSTS.map(p=><Block key={`${p.x}:${p.z}`} p={[p.x,1.4,p.z]} s={[p.w,2.8,p.d]} color="#786347"/>)}
  {[31.25,34.35].map(z=><Block key={z} p={[x,2.7,z]} s={[2.85,.16,.14]} color="#7a6448"/>)}
  {[-1,1].map(side=><group key={side}>
   <Block p={[x+side*.82,2.98,z]} s={[1.76,.12,3.95]} rotation={[0,0,-side*.23]} color="#343b3d"/>
   <Block p={[x+side*.8,2.88,z]} s={[1.7,.035,3.8]} rotation={[0,0,-side*.23]} color="#a38661"/>
   <Block p={[x+side*1.65,2.77,z]} s={[.09,.17,4]} color="#454944"/>
   <Glow p={[x+side*1.25,2.72,z]} s={[.025,.025,3.1]} night={night}/>
  </group>)}
  <Block p={[x,3.2,z]} s={[.13,.1,4]} color="#3e4444"/>
  {Array.from({length:15},(_,i)=><Block key={i} p={[x,3.2,30.86+i*.277]} s={[.2,.04,.018]} color="#5b6260"/>)}
  {[31.8,33.8].map(z=><group key={z}>
   <Block p={[x,2.57,z]} s={[.014,.65,.014]} color="#4a4336"/>
   <Block p={[x,2.23,z]} s={[.21,.23,.21]} color="#433c2f"/>
   <Glow p={[x,2.23,z-.11]} s={[.15,.16,.015]} night={night}/>
  </group>)}
  {/* Same rear block footprint as its collision volume: 0.2..2.2 × 43.5..48.5. */}
  <Block p={[1.2,1.35,46]} s={[2,2.7,5]} color="#dfd3bc"/>
  <Block p={[1.2,2.83,46]} s={[2.35,.14,5.5]} color="#424a48"/>
  <Block p={[1.2,2.72,46]} s={[2.2,.045,5.35]} color="#b59468"/>
  <Block p={[1.2,.055,43.15]} s={[2.15,.11,.65]} color="#bbb29f"/>
  <Block p={[1.2,1.48,43.44]} s={[1.65,1.9,.08]} color="#3c4944"/>
  <Block p={[1.2,1.5,43.385]} s={[1.48,1.67,.035]} color="#c4a67a"/>
  {[.47,1.2,1.93].map(x=><Block key={x} p={[x,1.48,43.35]} s={[.045,1.9,.06]} color="#67543b"/>)}
  <Glow p={[1.2,2.65,43.35]} s={[1.8,.035,.035]} night={night}/>
  <Block p={[.185,1.05,46]} s={[.035,2.1,.85]} color="#826d4d"/>
  <Block p={[.16,1.02,45.72]} s={[.055,.09,.04]} color="#c9bd9a"/>
  <Block p={[.185,2.4,46]} s={[.045,.24,.7]} color="#53635b"/>
  {[44.1,47.9].map(z=><group key={z}>
   <Block p={[.12,2.1,z]} s={[.14,.28,.15]} color="#44493a"/>
   <Glow p={[.04,2.1,z]} s={[.025,.19,.11]} night={night}/>
  </group>)}
 </>;
}
export default memo(RearBuildings);
