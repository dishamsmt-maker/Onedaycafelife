import type {GameState,Table,Vec2} from './types';
import {GARDEN_PLANTS,type GardenPlant} from './service';
import {POT_SLOTS} from './cozy';
import {canWalk} from './world';
export interface CafeLight {id:string;position:[number,number,number];intensity:number;distance:number}
/** Fixtures stay with the shared furniture; a bounded light pool illuminates nearby people. */
export function cafeLightSources(tables:Table[]):CafeLight[]{return [
 {id:'entry',position:[.7,2.3,3.6],intensity:12,distance:8},
 {id:'bar',position:[.65,2.15,8.6],intensity:18,distance:8},
 ...tables.filter(t=>t.enabled!==false).map(t=>({id:t.id,position:[t.position[0],2.05,t.position[1]] as [number,number,number],intensity:12,distance:6.5})),
 ...[28.6,34,40,47].map((z,i)=>({id:`garden-${i}`,position:[i%2?-.9:1.1,2.15,z] as [number,number,number],intensity:12,distance:8}))
]}
export function nearestCafeLights(sources:CafeLight[],camera:Vec2,quality:'low'|'high'){
 return [...sources].sort((a,b)=>Math.hypot(a.position[0]-camera[0],a.position[2]-camera[1])-Math.hypot(b.position[0]-camera[0],b.position[2]-camera[1])).slice(0,quality==='low'?4:6);
}
/** Layered planting within existing perimeter beds, never new save/watering counters. */
const landscape:GardenPlant[]=[];
for(const bed of GARDEN_PLANTS.filter(p=>p.x<0))for(const dz of [-.7,-.25,.3,.7]){
 const z=bed.z+dz;if(z>.35&&z<49.5)landscape.push({x:-2.36,z,h:.48,type:'bush',species:'fern'});
}
for(let z=13.4;z<42;z+=.7){
 if(canWalk(2.31,z,.12))landscape.push({x:2.31,z,h:.55,type:'bush',species:'fern'});
}
for(const [i,z] of [1.9,3.2,5.3,13.5,16.7,19.2,22.7,24.3,31.7,34,36.1,40].entries()){
 const x=2.28;
 if(canWalk(x,z,.16)&&POT_SLOTS.every(([px,pz])=>Math.hypot(px-x,pz-z)>.62))landscape.push({x,z,h:i%3===0?1.65:1.1,type:'pot',species:i%3===0?'rubber':'monstera'});
}
export const LANDSCAPE_PLANTS:GardenPlant[]=landscape;
/** Existing purchased pots keep their separate ownership, placement and growth. */
export const atmosphereKey=(s:GameState)=>s.tables.map(t=>`${t.id}:${t.enabled}:${t.position.join(',')}`).join('|');
