import {memo,useEffect,useMemo,useRef} from 'react';
import * as THREE from 'three';

/** Reference-inspired fittings live above existing surfaces or in perimeter beds. */
function ReferenceDetails({night}:{night:boolean}){
 const leaves=useRef<THREE.InstancedMesh>(null);
 const geometry=useMemo(()=>{
  const shape=new THREE.Shape();shape.moveTo(0,0);shape.bezierCurveTo(-.22,.3,-.24,.8,0,1.1);shape.bezierCurveTo(.24,.8,.22,.3,0,0);
  const g=new THREE.ShapeGeometry(shape,8),p=g.attributes.position;
  for(let i=0;i<p.count;i++)p.setZ(i,Math.sin(p.getY(i)*Math.PI)*.12);g.computeVertexNormals();return g;
 },[]);
 useEffect(()=>()=>geometry.dispose(),[geometry]);
 useEffect(()=>{
  if(!leaves.current)return;const o=new THREE.Object3D();let n=0;
  for(const [x,z] of [[2.22,6.15],[2.22,13.5],[-2.36,4],[-2.36,18],[-2.36,30]]){
   for(let i=0;i<12;i++){const a=i*2.399;o.position.set(x,.55+(i%4)*.34,z);o.rotation.set(.25+(i%3)*.25,a,Math.sin(a)*.45);o.scale.set(.8,1.25,.8);if(x<0){o.position.set(x+Math.cos(a)*.3,2.2+Math.sin(a*2)*.22,z+Math.sin(a)*.4);o.rotation.set(.7,a,.4);o.scale.set(.7,.65,.7);}o.updateMatrix();leaves.current.setMatrixAt(n++,o.matrix);leaves.current.setColorAt(n-1,new THREE.Color(['#547332','#70913e','#3e642d'][i%3]));}
  }
  leaves.current.instanceMatrix.needsUpdate=true;leaves.current.computeBoundingSphere();
 },[]);
 const box=(key:string,p:[number,number,number],s:[number,number,number],color:string)=><mesh key={key} position={p} receiveShadow><boxGeometry args={s}/><meshStandardMaterial color={color} roughness={.8}/></mesh>;
 return <>
  <instancedMesh ref={leaves} args={[geometry,undefined,60]} receiveShadow><meshStandardMaterial roughness={.55} side={THREE.DoubleSide}/></instancedMesh>
  {[2,4,6,14,18,22,28,34,40,46].map(z=><group key={z}>
   {box('bed',[-2.37,.2,z],[.22,.4,1.6],'#c5bdac')}
   {box('soil',[-2.37,.405,z],[.2,.015,1.53],'#554c37')}
  </group>)}
  {[[2.22,6.15],[2.22,13.5]].map(([x,z])=><mesh key={z} position={[x,.3,z]} receiveShadow><cylinderGeometry args={[.22,.18,.6,12]}/><meshStandardMaterial color="#aaa28f" roughness={.9}/></mesh>)}
  {[4,18,30].map(z=><group key={`tree-${z}`} position={[-2.36,0,z]}>
   <mesh position={[0,1.1,0]}><cylinderGeometry args={[.025,.055,2.2,7]}/><meshStandardMaterial color="#9b9277"/></mesh>
   {[-1,1].map(side=><mesh key={side} position={[0,1.85,side*.16]} rotation={[side*.55,0,0]}><cylinderGeometry args={[.015,.03,.75,6]}/><meshStandardMaterial color="#9b9277"/></mesh>)}
   {[0,1,2,3,4].map(i=><mesh key={i} position={[Math.cos(i*2.4)*.25,2.6,Math.sin(i*2.4)*.35]}><sphereGeometry args={[.045,6,4]}/><meshStandardMaterial color="#fff3c9"/></mesh>)}
  </group>)}
  {/* Cream vertical siding and charcoal hatch frame follow the existing solid shell. */}
  {Array.from({length:38},(_,i)=>box(`batten-${i}`,[2.095,1.42,7.1+i*.15],[.018,2.65,.014],'#c9baa0'))}
  {[-.59,2.19].map(x=>box(`jamb-${x}`,[x,1.66,7.06],[.055,1.25,.065],'#45483c'))}
  {[.72,1.65].map(y=>box(`shelf-${y}`,[1.96,y+.55,8.85],[.24,.035,2.7],'#a17d50'))}
  {[7.7,8.05,8.4,8.75,9.1,9.45,9.8].map((z,i)=><group key={z}>
   {box('jar',[1.95,1.94,z],[.09,.19,.1],i%2?'#d6c5a4':'#767951')}
   {box('lid',[1.95,2.045,z],[.1,.018,.11],'#7b6243')}
  </group>)}
  {[[.8,1.005,7.055,2.72,.018,.018],[.8,2.76,6.55,2.9,.025,.05],[-.71,1.01,8.75,.018,.018,2.6]].map(([x,y,z,w,h,d],i)=><mesh key={i} position={[x,y,z]}><boxGeometry args={[w,h,d]}/><meshStandardMaterial color="#fff0cb" emissive="#ffc06b" emissiveIntensity={night?2.8:.15}/></mesh>)}
  {[-.35,.4,1.15,1.9].map(x=><mesh key={x} position={[x,2.76,6.55]} rotation={[Math.PI/2,0,0]}><circleGeometry args={[.055,12]}/><meshStandardMaterial color="#fff1d0" emissive="#ffc574" emissiveIntensity={night?4:.1}/></mesh>)}
 </>;
}

export default memo(ReferenceDetails);
