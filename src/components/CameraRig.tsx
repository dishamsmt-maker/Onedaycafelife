import { useEffect, useRef } from 'react';
import { useFrame, useThree } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import { PerspectiveCamera } from 'three';
import { useVisitor } from '../game/visitor';
import { useGame } from '../game/store';
import { canWalk, canVisitorWalk, STATIONS } from '../game/world';
import { touchControls, type InteractionKind } from '../game/touchControls';

export interface CameraRigProps {
  mode: 'iso'|'first';
  onSelect: (kind: InteractionKind, id?: string) => void;
  onInteract: () => void;
}
const isField = (target: EventTarget | null) => target instanceof HTMLElement &&
  (['INPUT','SELECT','TEXTAREA'].includes(target.tagName) || target.isContentEditable);
const CLAMP = (value:number, min:number, max:number) => Math.max(min, Math.min(max,value));

/** Mobile and desktop both use the same camera and original engine collision grid. */
export default function CameraRig({mode,onSelect,onInteract}:CameraRigProps) {
  const {camera,gl,size} = useThree();
  const callbacks = useRef({onSelect,onInteract});
  callbacks.current = {onSelect,onInteract};
  const keys = useRef(new Set<string>());
  const drag = useRef<{id:number;x:number;y:number}|null>(null);
  const notifyTime = useRef(0);
  const firstStarted = useRef(false);
  const cameraRevision=useRef(-1);

  useEffect(() => {
    touchControls.reset();
    touchControls.active = mode === 'first';
    if (camera instanceof PerspectiveCamera) {
      camera.fov = mode === 'first' ? (size.width<size.height?75:64) : 42;
      camera.updateProjectionMatrix();
    }
    if (mode === 'iso') {
      const portrait = size.width / size.height < .85;
      const p=portrait?[-8,11.5,-11]:[-8,9,-9];
      camera.position.set(p[0],p[1],p[2]);
      camera.rotation.order = 'YXZ';
      camera.lookAt(0,.7,4.3);
      touchControls.nearby = null;
    } else {
      if (!firstStarted.current) {
        touchControls.position.x = .4;
        touchControls.position.z = -6.1;
        touchControls.view.yaw = 3.09;
        touchControls.view.pitch = .03;
        firstStarted.current = true;
      }
      camera.position.set(touchControls.position.x,touchControls.eyeHeight,touchControls.position.z);
      camera.rotation.order = 'YXZ';
      camera.rotation.set(touchControls.view.pitch,touchControls.view.yaw,0,'YXZ');
    }
    return () => { keys.current.clear(); drag.current=null; touchControls.reset(); touchControls.active=false; };
  },[mode,camera,size.width,size.height]);

  useEffect(() => {
    const clear=()=>{keys.current.clear();drag.current=null;touchControls.reset();};
    const visibility=()=>{if(document.hidden)clear();};
    const keydown=(event:KeyboardEvent)=>{
      if(mode!=='first'||!touchControls.enabled||isField(event.target)||event.metaKey||event.ctrlKey||event.altKey)return;
      if(['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(event.code)){
        event.preventDefault();keys.current.add(event.code);
      }
      if(event.code==='KeyE'&&!event.repeat){event.preventDefault();touchControls.interact=true;}
      if(event.code==='Escape')clear();
    };
    const keyup=(event:KeyboardEvent)=>keys.current.delete(event.code);
    // Desktop drag look works without pointer lock, including browsers that deny it.
    const down=(event:PointerEvent)=>{
      if(mode!=='first'||!touchControls.enabled||event.pointerType==='touch'||event.button!==0)return;
      drag.current={id:event.pointerId,x:event.clientX,y:event.clientY};
      gl.domElement.setPointerCapture?.(event.pointerId);
    };
    const move=(event:PointerEvent)=>{
      if(mode!=='first'||!drag.current||drag.current.id!==event.pointerId)return;
      touchControls.look.x+=event.clientX-drag.current.x;
      touchControls.look.y+=event.clientY-drag.current.y;
      drag.current={id:event.pointerId,x:event.clientX,y:event.clientY};
    };
    const up=(event:PointerEvent)=>{
      if(drag.current?.id===event.pointerId)drag.current=null;
    };
    window.addEventListener('blur',clear);
    document.addEventListener('visibilitychange',visibility);
    window.addEventListener('keydown',keydown);
    window.addEventListener('keyup',keyup);
    gl.domElement.addEventListener('pointerdown',down);
    gl.domElement.addEventListener('pointermove',move);
    gl.domElement.addEventListener('pointerup',up);
    gl.domElement.addEventListener('pointercancel',up);
    gl.domElement.addEventListener('lostpointercapture',up);
    return()=>{
      clear();window.removeEventListener('blur',clear);
      document.removeEventListener('visibilitychange',visibility);
      window.removeEventListener('keydown',keydown);window.removeEventListener('keyup',keyup);
      gl.domElement.removeEventListener('pointerdown',down);gl.domElement.removeEventListener('pointermove',move);
      gl.domElement.removeEventListener('pointerup',up);gl.domElement.removeEventListener('pointercancel',up);
      gl.domElement.removeEventListener('lostpointercapture',up);
    };
  },[mode,gl]);

  useFrame((_,dt)=>{
    if(mode!=='first')return;
    if(!touchControls.enabled){keys.current.clear();drag.current=null;touchControls.move.x=touchControls.move.y=0;touchControls.look.x=touchControls.look.y=0;touchControls.interact=false;}
    const visitor=useVisitor.getState();
    if(cameraRevision.current!==touchControls.cameraRevision){cameraRevision.current=touchControls.cameraRevision;camera.position.set(touchControls.position.x,touchControls.eyeHeight,touchControls.position.z);}
    touchControls.view.yaw-=touchControls.look.x*.004;
    touchControls.view.pitch=CLAMP(touchControls.view.pitch-touchControls.look.y*.0035,-1.05,1.05);
    touchControls.look.x=touchControls.look.y=0;
    const keyboardForward=(keys.current.has('KeyW')||keys.current.has('ArrowUp')?1:0)-(keys.current.has('KeyS')||keys.current.has('ArrowDown')?1:0);
    const keyboardSide=(keys.current.has('KeyD')||keys.current.has('ArrowRight')?1:0)-(keys.current.has('KeyA')||keys.current.has('ArrowLeft')?1:0);
    let forward=CLAMP(touchControls.move.y+keyboardForward,-1,1),side=CLAMP(touchControls.move.x+keyboardSide,-1,1);
    const length=Math.hypot(forward,side);if(length>1){forward/=length;side/=length;}
    const yaw=touchControls.view.yaw,pace=Math.min(dt,.08)*1.65;
    const dx=(-Math.sin(yaw)*forward+Math.cos(yaw)*side)*pace;
    const dz=(-Math.cos(yaw)*forward-Math.sin(yaw)*side)*pace;
    // The rendered world is X-mirrored; navigation always uses original coordinates.
    const walkable=visitor.role==='customer'?canVisitorWalk:canWalk;
    if(!visitor.tableId){
      if(walkable(-camera.position.x-dx,camera.position.z,.18))camera.position.x+=dx;
      if(walkable(-camera.position.x,camera.position.z+dz,.18))camera.position.z+=dz;
    }
    camera.position.y+=(touchControls.eyeHeight-camera.position.y)*Math.min(1,dt*12);
    camera.rotation.set(touchControls.view.pitch,yaw,0,'YXZ');
    touchControls.position.x=camera.position.x;touchControls.position.z=camera.position.z;
    const choices:{kind:InteractionKind;label:string;point:readonly[number,number];id?:string}[]=visitor.role==='customer'?
      [{kind:'bar',label:'ดูเมนูและสั่งอาหาร',point:[-.2,1.65]}]:[
      {kind:'fridge',label:'เปิดตู้เย็น',point:STATIONS.fridge},{kind:'bar',label:'สำรวจบาร์กาแฟ',point:STATIONS.bar},
      {kind:'kitchen',label:'สำรวจครัว',point:STATIONS.kitchen},{kind:'garden',label:'สำรวจสวน',point:STATIONS.garden}];
    if(visitor.role==='customer'&&!visitor.tableId)for(const t of useGame.getState().game.tables)choices.push({kind:'table',label:`นั่งโต๊ะ ${t.name}`,point:t.position,id:t.id});
    const near=choices.map(({point,...item})=>({...item,distance:Math.hypot(-camera.position.x-point[0],camera.position.z-point[1])})).sort((a,b)=>a.distance-b.distance)[0];
    touchControls.nearby=visitor.tableId?{kind:'table',label:'ลุกจากโต๊ะ',distance:0,id:visitor.tableId}:near?.distance<1.65?near:null;
    if(touchControls.interact){
      touchControls.interact=false;
      if(visitor.tableId)visitor.stand();
      else if(touchControls.nearby?.kind==='table'&&touchControls.nearby.id)visitor.sit(touchControls.nearby.id);
      else if(touchControls.nearby)callbacks.current.onSelect(touchControls.nearby.kind,touchControls.nearby.id);
    }
    notifyTime.current+=dt;
    if(notifyTime.current>.2){notifyTime.current=0;touchControls.emit();if(visitor.role!=='customer'&&(Math.abs(dx)+Math.abs(dz)>.0001))useGame.getState().dispatch({type:'control-move',id:visitor.role,position:[-camera.position.x,camera.position.z]});}
  });
  return mode==='iso'?<OrbitControls makeDefault target={[0,.7,4.3]} minDistance={5} maxDistance={32} minPolarAngle={.22} maxPolarAngle={Math.PI*.47} enableDamping dampingFactor={.09}/>:null;
}
