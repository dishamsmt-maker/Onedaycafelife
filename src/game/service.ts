import type {GameState,Vec2} from './types';
import {canWalk} from './world';
// Every decorative planting bed has a reachable watering stop.
export const GARDEN_PLANTS=[
 {x:-3.35,z:1.9,h:3.8,type:'tree'},{x:-3.4,z:7.7,h:4.5,type:'tree'},{x:3.05,z:10.6,h:3.6,type:'tree'},
 {x:-2.8,z:4.9,h:2.25,type:'palm'},{x:3,z:6.9,h:2.4,type:'palm'},{x:-2.8,z:10.5,h:2.2,type:'palm'},
 {x:-2.55,z:.9,h:.55,type:'bush'},{x:-2.65,z:3.7,h:.7,type:'bush'},{x:-2.7,z:6.4,h:.5,type:'bush'},
 {x:-2.65,z:9.2,h:.7,type:'bush'},{x:2.9,z:1,h:.6,type:'bush'},{x:2.9,z:4.2,h:.6,type:'bush'},
 {x:2.9,z:8.4,h:.7,type:'bush'},{x:-1.5,z:10.7,h:.6,type:'bush'},{x:.2,z:10.7,h:.65,type:'bush'},
 {x:-2.15,z:.25,h:.95,type:'pot'},{x:2.55,z:.15,h:1.1,type:'pot'}
];
export const WATER_STOPS:Vec2[]=GARDEN_PLANTS.map(p=>{let best:Vec2=[0,0],distance=Infinity;for(let x=-2.1;x<=2.1;x+=.3)for(let z=-.6;z<=9.6;z+=.3)if(canWalk(x,z)){const d=Math.hypot(x-p.x,z-p.z);if(d<distance){distance=d;best=[x,z];}}return best;});
export const signWanted=(s:GameState)=>s.phase!=='closing'&&s.phase!=='closed'&&(s.minute<630||s.minute>=1020);
export const drinkSteps=(recipe:Record<string,number>,id:string)=>id==='water'?['หยิบขวดน้ำ','ตรวจและส่งมอบ']:['เตรียมแก้ว',...(recipe.beans?['บดกาแฟ','สกัดกาแฟ']:recipe.tea||recipe['green-tea']?['ชงชา']:recipe.cocoa?['ละลายโกโก้']:['ตวงส่วนผสม']),...(recipe.milk?['เติมนม']:[]),...(!id.startsWith('hot-')?['เติมน้ำแข็ง']:[]),...(recipe.soda?['เติมโซดา']:[]),'ผสมและปิดฝา'];
