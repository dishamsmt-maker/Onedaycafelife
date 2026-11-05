import {useMemo} from 'react';
import * as THREE from 'three';
/** Surrounding inspection shed, neighbour and overhead lines from the owner's site photo.
 * Their dimensions are context estimates, not additional owned floor space. */
export default function SiteContext(){
 const lines=useMemo(()=>{const points:number[]=[];for(const y of [5.1,5.4,5.8,6.1])points.push(-16,y,.4,2.9,y-.15,.4,2.9,y-.15,.4,16,y,.4);return new Float32Array(points)},[]);
 return <>
 <group position={[-5.8,0,14]}><mesh position={[0,1.8,0]}><boxGeometry args={[5.7,3.6,24]}/><meshStandardMaterial color="#b2b3aa" roughness={1}/></mesh><mesh position={[0,3.65,0]} rotation={[0,0,.08]}><boxGeometry args={[6.2,.15,24.5]}/><meshStandardMaterial color="#9c514c" roughness={.8}/></mesh><mesh position={[0,2.7,-12.1]}><boxGeometry args={[5.8,.5,.1]}/><meshStandardMaterial color="#a24640"/></mesh><mesh position={[0,1.1,-12.1]}><boxGeometry args={[4.8,2.1,.1]}/><meshStandardMaterial color="#38423e"/></mesh></group>
 <group position={[5.8,0,13]}><mesh position={[0,2.8,0]}><boxGeometry args={[5.7,5.6,20]}/><meshStandardMaterial color="#b58e5a" roughness={1}/></mesh><mesh position={[0,5.65,0]} rotation={[0,0,-.09]}><boxGeometry args={[6.2,.2,20.5]}/><meshStandardMaterial color="#625f55"/></mesh>{[6,12,18].map(z=><mesh key={z} position={[-2.88,3.7,z-13]}><boxGeometry args={[.04,.9,.75]}/><meshStandardMaterial color="#35464a" roughness={.3}/></mesh>)}</group>
 <lineSegments><bufferGeometry><bufferAttribute attach="attributes-position" args={[lines,3]}/></bufferGeometry><lineBasicMaterial color="#343b3b"/></lineSegments>
 </>;
}
