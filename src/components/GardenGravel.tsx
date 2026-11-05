import {useEffect,useRef} from 'react';
import * as THREE from 'three';
/** A small instanced near-ground stone layer adds parallax without one draw call per pebble. */
export default function GardenGravel({quality,raining}:{quality:'low'|'high';raining:boolean}){
 const mesh=useRef<THREE.InstancedMesh>(null),count=quality==='high'?1200:400;
 useEffect(()=>{if(!mesh.current)return;let seed=1911;const random=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};const o=new THREE.Object3D(),color=new THREE.Color();for(let i=0;i<count;i++){const x=-.55+random()*2.85,z=13+random()*36;o.position.set(x,.015,z);o.scale.set(.025+random()*.035,.012+random()*.02,.025+random()*.04);o.rotation.set(random(),random()*6,random());o.updateMatrix();mesh.current.setMatrixAt(i,o.matrix);color.set(['#b0a999','#c8bfae','#8a887f','#d3ccbc'][i%4]);mesh.current.setColorAt(i,color)}mesh.current.instanceMatrix.needsUpdate=true;mesh.current.computeBoundingSphere()},[count]);
 return <instancedMesh ref={mesh} args={[undefined,undefined,count]} receiveShadow><icosahedronGeometry args={[1,0]}/><meshStandardMaterial roughness={raining?.5:.95}/></instancedMesh>;
}
