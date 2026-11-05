import {useMemo,useRef} from 'react';
import {useFrame} from '@react-three/fiber';
import * as THREE from 'three';
import type {daylight} from '../game/daylight';
/** Keep the shadow map around the current view, rather than spending mobile pixels on all 50m. */
export default function Sunlight({light,quality,shadows}:{light:ReturnType<typeof daylight>;quality:'low'|'high';shadows:boolean}){
 const sun=useRef<THREE.DirectionalLight>(null),target=useMemo(()=>new THREE.Object3D(),[]);
 useFrame(({camera})=>{if(!sun.current)return;const z=Math.max(4,Math.min(43,camera.position.z+6));target.position.set(0,0,z);sun.current.position.set(light.sunX,light.sunY,z-6);target.updateMatrixWorld()});
 return <><primitive object={target}/><directionalLight ref={sun} target={target} position={[light.sunX,light.sunY,0]} castShadow={shadows} intensity={light.sunlight} color={light.sunColor} shadow-mapSize-width={quality==='high'?1536:768} shadow-mapSize-height={quality==='high'?1536:768} shadow-camera-left={-10} shadow-camera-right={10} shadow-camera-top={14} shadow-camera-bottom={-14} shadow-camera-far={65} shadow-bias={-.00035} shadow-normalBias={.02}/></>;
}
export function DuskLight({active,position,intensity,color,distance}:{active:boolean;position:[number,number,number];intensity:number;color:string;distance:number}){
 const ref=useRef<THREE.PointLight>(null);
 useFrame((_,dt)=>{if(ref.current)ref.current.intensity=THREE.MathUtils.damp(ref.current.intensity,active?intensity:0,1.3,Math.min(.1,dt))});
 return <pointLight ref={ref} position={position} intensity={0} color={color} distance={distance} decay={2}/>;
}
