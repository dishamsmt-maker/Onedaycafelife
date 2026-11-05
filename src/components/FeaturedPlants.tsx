import {useEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';
import {GARDEN_PLANTS,type GardenSpecies,type GardenPlant} from '../game/service';

/** Distinct silhouettes keep the requested species legible even on the mobile tier. */
function leafShape(species:GardenSpecies){
 const shape=new THREE.Shape();
 if(species==='monstera'){
  // Lobed outline with interior fenestrations, not a generic oval leaf.
  const left:[number,number][]=[[0,-.5],[-.17,-.44],[-.38,-.33],[-.19,-.27],[-.43,-.15],[-.2,-.1],[-.45,.02],[-.21,.06],[-.4,.18],[-.17,.2],[-.3,.33],[-.12,.36],[0,.55]];
  shape.moveTo(...left[0]);for(const p of left.slice(1))shape.lineTo(...p);for(const [x,y] of left.slice(1,-1).reverse())shape.lineTo(-x,y);shape.closePath();
  for(const x of [-.11,.11])for(const y of [-.14,.08,.27]){const hole=new THREE.Path();hole.absellipse(x,y,.035,.055,0,Math.PI*2,false,0);shape.holes.push(hole)}
 }else if(species==='rubber'){
  shape.moveTo(0,-.5);shape.bezierCurveTo(-.36,-.43,-.42,.28,0,.54);shape.bezierCurveTo(.42,.28,.36,-.43,0,-.5);shape.closePath();
 }else{
  shape.moveTo(0,-.5);for(let i=0;i<=6;i++){const y=-.42+i*.14,w=.16*(1-i/7);shape.lineTo(-w,y);shape.lineTo(-.035,y+.06)}shape.lineTo(0,.53);for(let i=6;i>=0;i--){const y=-.42+i*.14,w=.16*(1-i/7);shape.lineTo(.035,y+.06);shape.lineTo(w,y)}shape.closePath();
 }
 const geometry=new THREE.ShapeGeometry(shape,8);geometry.computeVertexNormals();return geometry;
}
function SpeciesLeaves({species,quality,extra=[]}:{species:GardenSpecies;quality:'low'|'high';extra?:GardenPlant[]}){
 const ref=useRef<THREE.InstancedMesh>(null),plants=useMemo(()=>[...GARDEN_PLANTS,...extra].filter(p=>p.species===species),[species,extra]);
 const geometry=useMemo(()=>leafShape(species),[species]),perPlant=species==='fern'?8:quality==='high'?10:7;
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useEffect(()=>{if(!ref.current)return;const o=new THREE.Object3D();let index=0;
  for(const p of plants)for(let i=0;i<perPlant;i++){
   const angle=i*2.399+(p.z%5),ring=species==='fern'?.025:.08+(i%3)*.045;
   o.position.set(p.x+Math.cos(angle)*ring,(species==='fern'?.18:.36)+(i%5)*p.h*.1,p.z+Math.sin(angle)*ring);
   o.rotation.set(species==='fern'?1.0:.62+(i%3)*.14,angle,(i%2?1:-1)*.18);
   const size=species==='fern'?.32:species==='rubber'?.42:.48;o.scale.set(size,size*(species==='fern'?1.15:1),size);o.updateMatrix();ref.current.setMatrixAt(index++,o.matrix);
  }
  ref.current.instanceMatrix.needsUpdate=true;ref.current.computeBoundingSphere();
 },[plants,perPlant,species]);
 return <instancedMesh ref={ref} args={[geometry,undefined,plants.length*perPlant]} castShadow={quality==='high'} receiveShadow>
  <meshStandardMaterial color={species==='monstera'?'#39764c':species==='rubber'?'#264d37':'#719654'} roughness={species==='rubber'?.38:.72} side={THREE.DoubleSide}/>
 </instancedMesh>;
}
export default function FeaturedPlants({quality,extra}:{quality:'low'|'high';extra?:GardenPlant[]}){return <>{(['monstera','rubber','fern'] as const).map(species=><SpeciesLeaves key={species} species={species} quality={quality} extra={extra}/>)}</>}
