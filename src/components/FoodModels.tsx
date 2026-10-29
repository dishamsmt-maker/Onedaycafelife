import { useEffect, useMemo } from 'react';
import * as THREE from 'three';
type V3=[number,number,number];
/** Original procedural food textures, shared by dish kind. No billboard replacement for food geometry. */
const textures = new Map<string,THREE.CanvasTexture>();
function foodTexture(kind:string){
 if(textures.has(kind))return textures.get(kind)!;
 const c=document.createElement('canvas');c.width=c.height=256;const x=c.getContext('2d')!;
 x.fillStyle=kind==='toast'?'#e4b86e':kind==='soup'?'#dacba9':'#d9c19d';x.fillRect(0,0,256,256);
 let seed=15;const r=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296};
 for(let i=0;i<2200;i++){const a=r()*256,b=r()*256;x.fillStyle=kind==='soup'?['#f3e7c8','#fff1d2','#d6c39d','#b29b6b'][i%4]:['#9d64344d','#6940213b','#fff0c244','#e6c587'][i%4];x.beginPath();x.ellipse(a,b,kind==='soup'?1.4:r()*1.5+.3,kind==='soup'?3:.5+r()*1.2,r()*Math.PI,0,Math.PI*2);x.fill()}
 if(kind==='toast'){x.strokeStyle='#89532955';x.lineWidth=3;for(let i=0;i<7;i++){x.beginPath();x.moveTo(i*42,0);x.lineTo(i*42,256);x.stroke()}}
 const t=new THREE.CanvasTexture(c);t.colorSpace=THREE.SRGBColorSpace;t.anisotropy=4;textures.set(kind,t);return t;
}
function Sphere({p,s,color}:{p:V3;s:V3;color:string}){return <mesh position={p} scale={s}><sphereGeometry args={[1,12,8]}/><meshStandardMaterial color={color} roughness={.58}/></mesh>}
function Piece({p,s,color,rotate=0,map}:{p:V3;s:V3;color:string;rotate?:number;map?:THREE.Texture}){return <mesh position={p} rotation={[0,rotate,0]}><boxGeometry args={s}/><meshStandardMaterial color={color} roughness={.7} map={map} bumpMap={map} bumpScale={.003}/></mesh>}
function Tube({p,r,h,color,top}:{p:V3;r:number;h:number;color:string;top?:number}){return <mesh position={p}><cylinderGeometry args={[top??r,r,h,24]}/><meshStandardMaterial color={color} roughness={.32}/></mesh>}
function Plate(){const points=useMemo(()=>[[0,.006],[.09,.006],[.135,.012],[.159,.023],[.16,.03],[.147,.034],[.12,.021],[0,.016]].map(([x,y])=>new THREE.Vector2(x,y)),[]);return <mesh><latheGeometry args={[points,28]}/><meshStandardMaterial color="#f3eee3" roughness={.25}/></mesh>}
function Toast({chocolate=false,cheese=false,p=[0,0,0]}:{chocolate?:boolean;cheese?:boolean;p?:V3}){const tex=useMemo(()=>foodTexture('toast'),[]);return <group position={p}><Piece p={[0,.028,0]} s={[.14,.05,.17]} color="#b8753b"/><Piece p={[0,.054,0]} s={[.129,.009,.158]} color="#fff4d8" map={tex}/>{[0,1,2].map(i=><Piece key={i} p={[-.043+i*.043,.063,0]} s={[.008,.006,.14]} color={chocolate?'#593220':cheese?'#f3c75c':'#fff0bf'} rotate={.25}/>)}{cheese&&[0,1,2].map(i=><Sphere key={i} p={[-.04+i*.04,.066,.035]} s={[.015,.009,.025]} color="#e8cd9f"/>)}</group>}
function Shrimp({p,rotation=0}:{p:V3;rotation?:number}){return <group position={p} rotation={[-Math.PI/2,0,rotation]}><mesh><torusGeometry args={[.025,.011,7,12,Math.PI*1.55]}/><meshStandardMaterial color="#edac83" roughness={.5}/></mesh>{[0,1,2,3].map(i=><mesh key={i} position={[Math.cos(i*.9)*.025,Math.sin(i*.9)*.025,0]} rotation={[0,0,i*.9]}><sphereGeometry args={[.012,8,5]}/><meshStandardMaterial color={i%2?'#f0c8aa':'#d98762'} roughness={.5}/></mesh>)}<Piece p={[.003,-.027,0]} s={[.028,.015,.008]} color="#c87956"/></group>}
export function Dish({name,p=[0,0,0]}:{name:string;p?:V3}){
 const soup=useMemo(()=>foodTexture('soup'),[]),crumb=useMemo(()=>foodTexture('crumb'),[]);
 const salad=/สลัด|salad/.test(name),toast=/ขนมปัง|toast/.test(name),fries=/ฟราย|fries/.test(name),nuggets=/นักเก็ต|nugget/.test(name),sausage=/ไส้กรอก|sausage/.test(name),egg=/ไข่ลวก|boiled-egg/.test(name),american=/American|american|จานอเมริกัน/.test(name),snack=/Snack|snack-box/.test(name),shrimp=/กุ้ง|shrimp|ทะเล|seafood/.test(name),fish=/ปลา|fish|ทะเล|seafood/.test(name),seafood=/ทะเล|seafood/.test(name),chickenEgg=/ไก่ใส่ไข่|chicken-egg/.test(name);
 const bowl=useMemo(()=>[[0,.01],[.075,.01],[.096,.028],[.125,.095],[.142,.115],[.143,.123],[.134,.124],[.119,.099],[.092,.038],[0,.027]].map(([x,y])=>new THREE.Vector2(x,y)),[]);
 return <group position={p}><Plate/>{name==='empty'?null:toast?<group rotation={[0,.15,0]}><Toast p={[-.056,.02,-.01]} chocolate={/ช็อก|chocolate/.test(name)} cheese={/ชีส|cheese/.test(name)}/><Toast p={[.055,.055,.015]} chocolate={/ช็อก|chocolate/.test(name)} cheese={/ชีส|cheese/.test(name)}/></group>:fries||nuggets||sausage||snack||american?<>
 {(fries||snack)&&Array.from({length:11},(_,i)=><Piece key={i} p={[(i%4-1.5)*.035,.043+Math.floor(i/4)*.014,(Math.floor(i/4)-1)*.045]} s={[.017,.019,.13]} color={i%2?'#e1b05c':'#eac47b'} rotate={i*.67} map={crumb}/>)}
 {(nuggets||snack)&&Array.from({length:snack?3:5},(_,i)=><mesh key={i} position={[(i%3-1)*.065,.045+Math.floor(i/3)*.022,(Math.floor(i/3)-.5)*.06]} scale={[.04,.023,.032]} rotation={[0,i*.8,0]}><icosahedronGeometry args={[1,1]}/><meshStandardMaterial color="#d4a15a" map={crumb} bumpMap={crumb} bumpScale={.008} roughness={.85}/></mesh>)}
 {(sausage||snack||american)&&[0,1].map(i=><group key={i} position={[-.04+i*.075,.05,.02]} rotation={[Math.PI/2,0,.2]}><mesh><capsuleGeometry args={[.026,.11,5,12]}/><meshStandardMaterial color="#b97943" roughness={.45}/></mesh>{[0,1,2].map(j=><mesh key={j} position={[0,-.04+j*.035,-.025]} rotation={[0,0,.3]}><boxGeometry args={[.034,.004,.004]}/><meshStandardMaterial color="#70462d"/></mesh>)}</group>)}
 {fries&&/ชีส|cheese/.test(name)&&[0,1,2].map(i=><Piece key={i} p={[-.06+i*.06,.099,0]} s={[.015,.009,.16]} rotate={.4} color="#e9bb4e"/>)}
 {american&&<><Sphere p={[-.06,.045,-.065]} s={[.075,.016,.055]} color="#fff0ce"/><Sphere p={[-.055,.06,-.063]} s={[.028,.015,.028]} color="#e6b144"/><Toast p={[.035,.03,.055]}/></>}
 <Tube p={[.1,.043,.09]} r={.033} h={.027} color="#efe7d7"/><Tube p={[.1,.058,.09]} r={.026} h={.005} color="#9d4630"/>
 </>:salad?<>{Array.from({length:12},(_,i)=><Sphere key={i} p={[Math.cos(i*2.4)*.095,.04+(i%3)*.012,Math.sin(i*2.4)*.085]} s={[.045,.012,.033]} color={i%2?'#84a55e':'#a6b875'}/>)}{[-.05,.04].map(x=><group key={x}><Tube p={[x,.078,.02]} r={.043} h={.014} color="#f8edcf"/><Tube p={[x,.087,.02]} r={.022} h={.006} color="#ddb03c"/></group>)}</>:egg?<><Tube p={[0,.047,0]} r={.035} h={.06} color="#efe9dc"/><Sphere p={[0,.087,0]} s={[.039,.048,.037]} color="#e3c5a0"/><Tube p={[0,.125,0]} r={.026} h={.005} color="#fff0cb"/></>:<>
 <mesh><latheGeometry args={[bowl,28]}/><meshStandardMaterial color="#eee9df" roughness={.28}/></mesh><mesh position={[0,.103,0]} rotation={[-Math.PI/2,0,0]}><circleGeometry args={[.126,32]}/><meshStandardMaterial map={soup} roughness={.26} bumpMap={soup} bumpScale={.003}/></mesh>
 {shrimp&&[0,1,2].map(i=><Shrimp key={i} p={[-.06+i*.055,.117,(i%2-.5)*.065]} rotation={i*1.2}/>)}
 {fish&&[0,1].map(i=><Sphere key={i} p={[-.04+i*.08,.117,.05]} s={[.034,.013,.023]} color="#eee5cf"/>)}
 {!fish&&!shrimp&&[0,1,2,3].map(i=><Sphere key={i} p={[-.06+(i%3)*.055,.117,Math.floor(i/3)*.06-.02]} s={[.025,.013,.019]} color="#d9c3a2"/>)}
 {seafood&&<mesh position={[.055,.122,-.05]} rotation={[-Math.PI/2,0,0]}><torusGeometry args={[.021,.007,6,16]}/><meshStandardMaterial color="#f2ead7" roughness={.4}/></mesh>}
 {chickenEgg&&<><Sphere p={[.035,.116,.04]} s={[.048,.009,.04]} color="#f8edcd"/><Sphere p={[.035,.13,.04]} s={[.023,.012,.021]} color="#ddb13e"/></>}
 {[0,1,2,3,4,5].map(i=><Piece key={i} p={[Math.cos(i*2.4)*.075,.13,Math.sin(i*2.4)*.075]} s={[.008,.006,.021]} color={i%2?'#64834b':'#8fa56a'} rotate={i}/>)}
 </>}
 <group position={[.17,.025,0]} rotation={[0,-.25,0]}><Piece p={[0,0,.025]} s={[.012,.006,.15]} color="#a6aa9e"/><Sphere p={[0,0,-.065]} s={[.023,.005,.034]} color="#c3c6b9"/></group>
 </group>
}
export function Drink({name='',p=[0,0,0]}:{name?:string;p?:V3}){
 const tea=/ชาไทย|thai-tea|tea-set/.test(name),green=/เขียว|green/.test(name),pink=/ชมพู|pink/.test(name),dark=/อเมริกา|americano|ชาร้อน|hot-tea/.test(name),cocoa=/โกโก้|cocoa|mocha|มอค/.test(name),soda=/โซดา|soda|มะนาว|lime|พีช|peach/.test(name),coffee=/ลาเต้|ลาเต|latte|กาแฟ|coffee|espresso|signature|caramel/.test(name);
 const color=green?'#7d9e61':pink?'#db9fa9':tea?'#c77935':dark?'#67472c':cocoa?'#8c6343':soda?'#d5ba6c':coffee?'#b68a5d':'#e5d8bd';
 return <group position={p}><Tube p={[0,.014,0]} r={.074} h={.012} color="#ae956b"/>
 <mesh position={[0,.108,0]}><cylinderGeometry args={[.065,.051,.19,24,1,true]}/><meshStandardMaterial color="#e6eeee" transparent opacity={.22} side={THREE.DoubleSide} roughness={.12} depthWrite={false}/></mesh>
 <Tube p={[0,.099,0]} r={.048} top={.06} h={.16} color={color}/>{(tea||coffee)&&<Tube p={[0,.032,0]} r={.049} top={.052} h={.036} color="#e7d4af"/>}
 <Tube p={[0,.181,0]} r={.061} h={.006} color={dark?'#69452b':tea?'#d99756':cocoa?'#94704d':'#e1cfac'}/>
 {[0,1,2,3,4].map(i=><mesh key={i} position={[Math.cos(i*2.4)*.034,.187,Math.sin(i*2.4)*.034]} rotation={[.1,i,.2]}><boxGeometry args={[.025,.022,.025]}/><meshStandardMaterial color="#e4e8df" transparent opacity={.6} roughness={.1}/></mesh>)}
 <mesh position={[.026,.22,.01]} rotation={[0,0,-.08]}><cylinderGeometry args={[.003,.003,.18,6]}/><meshStandardMaterial color="#655643"/></mesh>
 <mesh position={[0,.2,0]} rotation={[Math.PI/2,0,0]}><torusGeometry args={[.064,.003,5,24]}/><meshStandardMaterial color="#eef0e7" roughness={.15}/></mesh>
 {soda&&<mesh position={[.035,.203,-.02]} rotation={[.2,0,.3]}><cylinderGeometry args={[.027,.027,.006,18]}/><meshStandardMaterial color="#bad179"/></mesh>}
 </group>
}
