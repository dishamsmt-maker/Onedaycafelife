import type {GameState,Vec2} from './types';
import {canWalk} from './world';
// Every decorative planting bed has a reachable watering stop.
export const GARDEN_PLANTS=[
 ...[1,4,7,10,14,18,22,26,30,34,38,42,47].map((z,i)=>({x:-2.38,z,h:i<4?.7:1.2+(i%3)*.25,type:'bush'})),
 ...[1,4,14,18,22,26,31,35,39].map((z,i)=>({x:z>=35?1.2:2.25,z,h:z>=35?3.2:.7+(i%3)*.3,type:z>=35?'tree':'pot'}))
];
export const WATER_STOPS:Vec2[]=GARDEN_PLANTS.map(p=>{let best:Vec2=[0,0],distance=Infinity;for(let x=-2.1;x<=2.1;x+=.3)for(let z=.3;z<=49.5;z+=.3)if(canWalk(x,z)){const d=Math.hypot(x-p.x,z-p.z);if(d<distance){distance=d;best=[x,z];}}return best;});
export const signWanted=(s:GameState)=>s.phase!=='closing'&&s.phase!=='closed'&&(s.minute<630||s.minute>=1020);
export const drinkSteps=(recipe:Record<string,number>,id:string)=>id==='water'?['หยิบขวดน้ำ','ตรวจและส่งมอบ']:['เตรียมแก้ว',...(recipe.beans?['บดกาแฟ','สกัดกาแฟ']:recipe.tea||recipe['green-tea']?['ชงชา']:recipe.cocoa?['ละลายโกโก้']:['ตวงส่วนผสม']),...(recipe.milk?['เติมนม']:[]),...(!id.startsWith('hot-')?['เติมน้ำแข็ง']:[]),...(recipe.soda?['เติมโซดา']:[]),'ผสมและปิดฝา'];
