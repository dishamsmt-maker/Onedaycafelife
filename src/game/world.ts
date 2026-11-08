import type { Vec2 } from './types';
export const WORLD = {width:5,depth:10,front:0,back:10};
export const STATIONS = {bar:[1.4,2.0],kitchen:[1.13,4.5],pickup:[0.6,4],dish:[0.6,5.3],garden:[-0.1,8.8],restroom:[1.4,8.6],rest:[1.65,9.35],manager:[0.4,1.1],entrance:[-0.5,-0.8],queue:[-1.45,0.65],fridge:[1.1,5.6]} satisfies Record<string,Vec2>;
/** Five-table gameplay prototype; coordinates are NOT a surveyed physical site plan. */
export const TABLE_LAYOUT = [
 {id:'t1',name:'T1',position:[-1.25,6.35] as Vec2,capacity:4},
 {id:'t2',name:'T2',position:[1.15,7.15] as Vec2,capacity:4},
 {id:'t3',name:'T3',position:[-1.25,8.35] as Vec2,capacity:4},
 {id:'t4',name:'T4',position:[-1.25,4.45] as Vec2,capacity:4},
 {id:'t5',name:'T5',position:[-1.25,2.35] as Vec2,capacity:4},
];
export interface Obstacle {x:number;z:number;w:number;d:number;}
export const OBSTACLES:Obstacle[]=[{x:1.4,z:.75,w:2,d:.4},{x:.55,z:2.1,w:.45,d:2.4},{x:2.05,z:2.15,w:.8,d:2.7},{x:1.95,z:4.65,w:.72,d:2.0},{x:1.95,z:5.85,w:.8,d:.7},...TABLE_LAYOUT.map(t=>({x:t.position[0],z:t.position[1],w:1.25,d:1.2})),{x:1.85,z:9.3,w:1.1,d:1.0}];
export function canWalk(x:number,z:number, radius=.16){return Number.isFinite(x)&&Number.isFinite(z)&&Number.isFinite(radius)&&radius>=0&&x>-2.32&&x<2.32&&z>-.95&&z<9.82&&!OBSTACLES.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);}
/** Sample a complete movement segment so NPCs cannot clip through counter corners. */
export function segmentWalkable(from:Vec2,to:Vec2,radius=.16):boolean{
 if(![...from,...to,radius].every(Number.isFinite)||radius<0)return false;
 const distance=Math.hypot(to[0]-from[0],to[1]-from[1]);
 const samples=Math.max(1,Math.ceil(distance/.05));
 for(let i=0;i<=samples;i++){
  const t=i/samples;
  if(!canWalk(from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t,radius))return false;
 }
 return true;
}
/** Grid routing selects the nearest reachable walkable endpoint, even when a station
 * or table centre is blocked by its own collision box. */
export function findPath(from:Vec2,to:Vec2):Vec2[]{
 if(![...from,...to].every(Number.isFinite))return [];
 const step=.25;
 const key=(x:number,z:number)=>`${x},${z}`;
 const snap=(p:Vec2):Vec2=>[Math.round(p[0]/step),Math.round(p[1]/step)];
 // Start from a walkable grid cell when the actor spawns inside furniture.
 // This avoids routing through an obstacle on the very first step.
 const requestedOrigin=snap(from);
 let origin=requestedOrigin;
 if(!canWalk(origin[0]*step,origin[1]*step)){
  let closest=Infinity;
  for(let dx=-8;dx<=8;dx++)for(let dz=-8;dz<=8;dz++){
   const candidate:Vec2=[requestedOrigin[0]+dx,requestedOrigin[1]+dz];
   const x=candidate[0]*step,z=candidate[1]*step;
   const d=Math.hypot(x-from[0],z-from[1]);
   if(canWalk(x,z)&&d<closest){closest=d;origin=candidate;}
  }
  if(!canWalk(origin[0]*step,origin[1]*step))return [];
 }
 const queue:Vec2[]=[origin], seen=new Set([key(...origin)]);
 const prev=new Map<string,Vec2>();
 let best:Vec2|undefined, bestDistance=Infinity;
 for(let i=0;i<queue.length&&i<3500;i++){
  const p=queue[i], x=p[0]*step,z=p[1]*step;
  if(canWalk(x,z)){
   const distance=Math.hypot(x-to[0],z-to[1]);
   if(distance<bestDistance){best=p;bestDistance=distance;}
   if(distance<=step*.55)break;
  }
  for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){
   const n:Vec2=[p[0]+dx,p[1]+dz], k=key(...n);
   if(!seen.has(k)&&canWalk(n[0]*step,n[1]*step)&&segmentWalkable([p[0]*step,p[1]*step],[n[0]*step,n[1]*step])){seen.add(k);prev.set(k,p);queue.push(n);}
  }
 }
 if(!best)return [];
 const path:Vec2[]=[];
 let p=best;
 while(key(...p)!==key(...origin)){
  path.unshift([p[0]*step,p[1]*step]);
  const parent=prev.get(key(...p));if(!parent)break;p=parent;
 }
 // Recovery must be the FIRST waypoint, not the last one.
 if(key(...origin)!==key(...requestedOrigin))path.unshift([origin[0]*step,origin[1]*step]);
 // Do not append a destination unless its direct segment is collision-free.
 const last=path.length?path[path.length-1]:from;
 const distance=Math.hypot(to[0]-last[0],to[1]-last[1]);
 if(canWalk(...to)&&segmentWalkable(last,to))path.push([...to]);
 return path;
}

/** Public circulation stays left of the counter/kitchen. Staff use canWalk instead. */
export function canVisitorWalk(x:number,z:number,radius=.18){
 if(![x,z,radius].every(Number.isFinite)||radius<0)return false;
 if(z<=.27)return z>-7+radius&&x>-3.6+radius&&x<3.6-radius&&!OBSTACLES.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);
 if(!canWalk(x,z,radius))return false;
 if(z>.45-radius&&z<6.55+radius&&x>.25-radius)return false;
 if(z>9.0-radius&&x>.55-radius)return false;
 return true;
}
