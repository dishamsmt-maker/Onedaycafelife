import {useEffect,useMemo} from 'react';
import {useGLTF} from '@react-three/drei';
import * as THREE from 'three';

/** Shared CC-BY/CC0 authored asset. Sample cameras, animated insects and lights are excluded. */
export default function AuthoredPlants(){
 const {scene}=useGLTF(import.meta.env.BASE_URL+'assets/plants/potted-plant.glb');
 const prepared=useMemo(()=>{
  const root=new THREE.Group(),materials:THREE.Material[]=[];
  for(const name of ['pot','leaves']){
   const source=scene.getObjectByName(name);if(!source)continue;
   const part=source.clone(true);
   part.traverse(node=>{if(!(node instanceof THREE.Mesh))return;const original=node.material as THREE.MeshStandardMaterial;
    const material=new THREE.MeshStandardMaterial({map:original.map,normalMap:original.normalMap,roughnessMap:original.roughnessMap,aoMap:original.aoMap,color:original.color,roughness:Math.max(.55,original.roughness),metalness:0,alphaTest:name==='leaves'?.4:0,side:name==='leaves'?THREE.DoubleSide:THREE.FrontSide});
    node.material=material;node.castShadow=true;node.receiveShadow=true;materials.push(material);
   });root.add(part);
  }
  const pot=root.getObjectByName('pot'),potBounds=new THREE.Box3().setFromObject(pot??root),potSize=potBounds.getSize(new THREE.Vector3()),potCentre=potBounds.getCenter(new THREE.Vector3());
  const soilGeometry=new THREE.CylinderGeometry(Math.min(potSize.x,potSize.z)*.43,Math.min(potSize.x,potSize.z)*.43,.006,20),soilMaterial=new THREE.MeshStandardMaterial({color:'#554734',roughness:1});materials.push(soilMaterial);
  const soil=new THREE.Mesh(soilGeometry,soilMaterial);soil.position.set(potCentre.x,potBounds.max.y-.015,potCentre.z);root.add(soil);
  const bounds=new THREE.Box3().setFromObject(root),size=bounds.getSize(new THREE.Vector3()),centre=bounds.getCenter(new THREE.Vector3());
  const scale=1.1/Math.max(size.y,.01);root.scale.setScalar(scale);root.position.set(-centre.x*scale,-bounds.min.y*scale,-centre.z*scale);
  return {root,materials,soilGeometry};
 },[scene]);
 useEffect(()=>()=>{prepared.materials.forEach(m=>m.dispose());prepared.soilGeometry.dispose()},[prepared]);
 const copies=useMemo(()=>[0,1,2].map(()=>prepared.root.clone(true)),[prepared]);
 return <group dispose={null}>{[[2.05,4.4],[2.05,6.1],[2.05,26]].map(([x,z],i)=><group key={z} position={[x,0,z]} rotation={[0,i*1.8,0]}><primitive object={copies[i]}/></group>)}</group>;
}
