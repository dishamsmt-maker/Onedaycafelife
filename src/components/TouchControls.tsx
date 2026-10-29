import { useEffect, useRef, useState, type PointerEvent } from 'react';
import { Hand, Move, RotateCcw } from 'lucide-react';
import { touchControls } from '../game/touchControls';

export interface TouchControlsProps {visible:boolean;}
const RADIUS=35;
/** DOM controls are separate from Canvas, and support two independent fingers. */
export default function TouchControls({visible}:TouchControlsProps){
  const [knob,setKnob]=useState({x:0,y:0});
  const [,refresh]=useState(0);
  const stick=useRef<{id:number;x:number;y:number}|null>(null);
  const look=useRef<{id:number;x:number;y:number}|null>(null);
  const resetCount=useRef(touchControls.resetCount);
  useEffect(()=>{
    const unsubscribe=touchControls.subscribe(()=>{
      if(resetCount.current!==touchControls.resetCount){resetCount.current=touchControls.resetCount;stick.current=null;look.current=null;setKnob({x:0,y:0});}
      if(touchControls.move.x===0&&touchControls.move.y===0){setKnob({x:0,y:0});}
      refresh(v=>v+1);
    });
    return unsubscribe;
  },[]);
  useEffect(()=>{
    touchControls.enabled=visible;touchControls.reset();stick.current=null;look.current=null;setKnob({x:0,y:0});
    return()=>{touchControls.enabled=false;touchControls.reset();stick.current=null;look.current=null;};
  },[visible]);
  if(!visible)return null;
  const stickMove=(event:PointerEvent<HTMLDivElement>)=>{
    if(!stick.current||stick.current.id!==event.pointerId)return;
    event.preventDefault();event.stopPropagation();
    const dx=event.clientX-stick.current.x,dy=event.clientY-stick.current.y;
    const length=Math.hypot(dx,dy),scale=length>RADIUS?RADIUS/length:1;
    const x=dx*scale,y=dy*scale;
    touchControls.move.x=Math.abs(x/RADIUS)<.08?0:x/RADIUS;
    touchControls.move.y=Math.abs(y/RADIUS)<.08?0:-y/RADIUS;
    setKnob({x,y});
  };
  const stickEnd=(event:PointerEvent<HTMLDivElement>)=>{
    if(stick.current?.id!==event.pointerId)return;
    event.stopPropagation();stick.current=null;
    touchControls.move.x=touchControls.move.y=0;setKnob({x:0,y:0});
  };
  const lookEnd=(event:PointerEvent<HTMLDivElement>)=>{if(look.current?.id===event.pointerId)look.current=null;};
  return <div className="touch-controls" data-testid="touch-controls" data-player-x={touchControls.position.x.toFixed(3)} data-player-z={touchControls.position.z.toFixed(3)}>
    <style>{`
      .touch-controls{position:absolute;inset:0;z-index:6;pointer-events:none;user-select:none;-webkit-user-select:none;-webkit-touch-callout:none}
      .walk-lookpad{position:absolute;left:40%;right:0;top:185px;bottom:0;touch-action:none;pointer-events:auto;cursor:grab}
      .walk-lookpad:active{cursor:grabbing}
      .walk-lookhint{position:absolute;right:20px;bottom:122px;display:flex;align-items:center;gap:5px;color:#fff7dfb8;font-size:10px;text-shadow:0 1px 5px #102316a0;pointer-events:none}
      .walk-joystick{position:absolute;left:24px;bottom:28px;width:108px;height:108px;border-radius:50%;border:1px solid #fff8e68a;background:radial-gradient(circle,#203e3480,#1c332b48);box-shadow:0 3px 18px #13261f22,inset 0 0 0 14px #fff8dc0b;touch-action:none;pointer-events:auto;display:flex;align-items:center;justify-content:center;color:#fffbe1c0;outline:none}
      .walk-joystick:before,.walk-joystick:after{content:'';position:absolute;background:#fffbe122;pointer-events:none}
      .walk-joystick:before{height:1px;width:76px}.walk-joystick:after{width:1px;height:76px}
      .walk-knob{position:relative;width:43px;height:43px;background:#fbf6e3db;border:1px solid #fffbe9;border-radius:50%;box-shadow:0 3px 10px #172c2438;display:flex;align-items:center;justify-content:center;color:#67765a;pointer-events:none;will-change:transform}
      .walk-interact{position:absolute;right:24px;bottom:29px;min-height:53px;min-width:112px;max-width:180px;border:1px solid #fff4d3aa;border-radius:30px;padding:12px 17px;background:#f8f1dbe8;color:#35503a;box-shadow:0 4px 20px #10251a22;display:flex;align-items:center;justify-content:center;gap:7px;font:600 11px 'Noto Sans Thai',sans-serif;pointer-events:auto;touch-action:none}
      .walk-interact:disabled{background:#2844397a;color:#fff5d59c;border-color:#fdf2cd48;opacity:1;box-shadow:none}
      .walk-crosshair{position:absolute;top:50%;left:50%;width:5px;height:5px;border-radius:50%;border:1px solid #fffbe1;background:#fffbe166;box-shadow:0 1px 4px #142b1a77;pointer-events:none}
      .walk-coordinate{display:none}
      @media(max-width:600px){.walk-joystick{left:15px;bottom:23px;width:98px;height:98px}.walk-lookpad{top:145px;left:38%}.walk-interact{right:14px;bottom:24px;min-width:106px;max-width:155px;padding:11px 14px;font-size:10px}.walk-lookhint{right:16px;bottom:102px;font-size:9px}}
      @media(max-height:500px){.walk-joystick{width:86px;height:86px;bottom:15px;left:20px}.walk-lookpad{top:70px}.walk-interact{bottom:18px}.walk-lookhint{bottom:86px}}
    `}</style>
    <div className="walk-lookpad" data-testid="look-pad" aria-label="ลากเพื่อหันมอง" onPointerDown={event=>{
      if(look.current)return;event.preventDefault();event.stopPropagation();
      event.currentTarget.setPointerCapture(event.pointerId);look.current={id:event.pointerId,x:event.clientX,y:event.clientY};
    }} onPointerMove={event=>{
      if(!look.current||look.current.id!==event.pointerId)return;
      event.preventDefault();event.stopPropagation();
      touchControls.look.x+=event.clientX-look.current.x;
      touchControls.look.y+=event.clientY-look.current.y;
      look.current={id:event.pointerId,x:event.clientX,y:event.clientY};
    }} onPointerUp={lookEnd} onPointerCancel={lookEnd} onLostPointerCapture={lookEnd}/>
    <span className="walk-lookhint"><RotateCcw size={12}/> ลากตรงนี้เพื่อหันมอง</span>
    <div className="walk-joystick" data-testid="walk-joystick" role="application" aria-label="จอยเดิน ลากเพื่อเคลื่อนที่" onPointerDown={event=>{
      if(stick.current)return;event.preventDefault();event.stopPropagation();
      const rect=event.currentTarget.getBoundingClientRect();
      stick.current={id:event.pointerId,x:rect.left+rect.width/2,y:rect.top+rect.height/2};
      event.currentTarget.setPointerCapture(event.pointerId);stickMove(event);
    }} onPointerMove={stickMove} onPointerUp={stickEnd} onPointerCancel={stickEnd} onLostPointerCapture={stickEnd}>
      <span className="walk-knob" style={{transform:`translate(${knob.x}px,${knob.y}px)`}}><Move size={17}/></span>
    </div>
    <button className="walk-interact" aria-label={touchControls.nearby?.label??'เข้าใกล้สิ่งของเพื่อสำรวจ'} disabled={!touchControls.nearby} onPointerDown={event=>{event.stopPropagation();}} onClick={event=>{event.stopPropagation();touchControls.interact=true;}}><Hand size={17}/>{touchControls.nearby?.label??'สำรวจใกล้ตัว'}</button>
    <span className="walk-crosshair"/>
  </div>;
}
