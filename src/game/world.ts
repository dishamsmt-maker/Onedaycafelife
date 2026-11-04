import type { Vec2 } from './types';
export const LAYOUT_VERSION=2;
export const WORLD = {width:5,depth:50,front:0,back:50};
export const siteToWorld=(x:number,z:number):Vec2=>[x-2.5,z];
export const toRender=([x,z]:Vec2):Vec2=>[-x,z];
export const STATIONS = {bar:[.4,8.65],kitchen:[1.2,10.4],pickup:[-.1,6.6],dish:[.3,11.9],garden:[-1.4,32],restroom:[-.1,46],rest:[1.1,42],manager:[-.9,5.5],entrance:[-1.4,.4],queue:[.6,5.7],fridge:[1.2,11.65]} satisfies Record<string,Vec2>;
export const TABLE_LAYOUT = [14.2,16.6,19,21.4,23.8].map((z,i)=>({id:`t${i+1}`,name:`T${i+1}`,position:[.8,z] as Vec2,capacity:4}));
export interface Obstacle {x:number;z:number;w:number;d:number;}
export const OBSTACLES:Obstacle[]=[
 {x:.8,z:7.425,w:2.8,d:.65},
 {x:-.375,z:9.65,w:.65,d:3.4},{x:1.875,z:10.1,w:.65,d:4.3},
 {x:.8,z:12.575,w:2.8,d:.65},
 {x:-.65,z:9.175,w:.1,d:4.35},{x:-.65,z:12.625,w:.1,d:.75},
 {x:2.3,z:10,w:.4,d:6},{x:.8,z:12.95,w:3,d:.1},
 ...TABLE_LAYOUT.map(t=>({x:t.position[0],z:t.position[1],w:1.15,d:1.05})),
 {x:2.025,z:28.6,w:.55,d:3.2},{x:1.2,z:46,w:2,d:5}
];
export function canWalk(x:number,z:number, radius=.16){return x>-2.5+radius&&x<2.5-radius&&z>radius&&z<50-radius&&!OBSTACLES.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);}
/** Sample a complete movement segment so NPCs cannot clip through counter corners. */
export function segmentWalkable(from:Vec2,to:Vec2,radius=.16):boolean{
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
const pathCache=new Map<string,Vec2[]>();
export function findPath(from:Vec2,to:Vec2):Vec2[]{
 const cacheKey=[...from,...to].map(n=>n.toFixed(3)).join(',');
 const cached=pathCache.get(cacheKey);if(cached)return cached.map(p=>[...p]);
 const result=computePath(from,to);if(pathCache.size>2048)pathCache.clear();pathCache.set(cacheKey,result);return result.map(p=>[...p]);
}
function computePath(from:Vec2,to:Vec2):Vec2[]{
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
 for(let i=0;i<queue.length&&i<16000;i++){
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
 if(z<.3)return z>-7+radius&&x>-2.5+radius&&x<2.5-radius;
 if(!canWalk(x,z,radius))return false;
 if(z>7-radius&&z<13+radius&&x>-.7-radius)return false;
 if(z>40&&x>-.7-radius)return false;
 return true;
}
