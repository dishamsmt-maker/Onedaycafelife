import type { Vec2 } from './types';
export const WORLD = {width:5,depth:10,front:0,back:10};
export const STATIONS = {bar:[1.4,2.0],kitchen:[1.13,4.5],pickup:[0.6,4],dish:[0.6,5.3],garden:[-0.1,8.8],restroom:[1.4,8.6],rest:[1.65,9.35],manager:[0.4,1.1],entrance:[-0.5,-0.8],queue:[-1.45,0.65],fridge:[1.1,5.6]} satisfies Record<string,Vec2>;
export const TABLE_LAYOUT = [{id:'t1',name:'T1',position:[-1.25,6.35] as Vec2,capacity:4},{id:'t2',name:'T2',position:[1.15,7.15] as Vec2,capacity:4},{id:'t3',name:'T3',position:[-1.25,8.35] as Vec2,capacity:4}];
export interface Obstacle {x:number;z:number;w:number;d:number;}
export const OBSTACLES:Obstacle[]=[{x:1.4,z:.75,w:2,d:.4},{x:.55,z:2.1,w:.45,d:2.4},{x:2.05,z:2.15,w:.7,d:2.7},{x:1.95,z:4.65,w:.72,d:2.0},{x:1.95,z:5.85,w:.8,d:.7},...TABLE_LAYOUT.map(t=>({x:t.position[0],z:t.position[1],w:1.25,d:1.2})),{x:1.85,z:9.3,w:1.1,d:1.0}];
export function canWalk(x:number,z:number, radius=.16){return x>-2.32&&x<2.32&&z>-.95&&z<9.82&&!OBSTACLES.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);}
export function findPath(from:Vec2,to:Vec2):Vec2[]{
 const step=.25, key=(x:number,z:number)=>`${x},${z}`, snap=(p:Vec2):Vec2=>[Math.round(p[0]/step),Math.round(p[1]/step)];
 const start=snap(from), goal=snap(to);const queue:Vec2[]=[start],seen=new Set([key(...start)]),prev=new Map<string,Vec2>();let found:Vec2|undefined;
 for(let i=0;i<queue.length&&i<3500;i++){const p=queue[i];if(Math.hypot(p[0]-goal[0],p[1]-goal[1])<=1){found=p;break;}for(const [dx,dz] of [[1,0],[-1,0],[0,1],[0,-1]]){const n:Vec2=[p[0]+dx,p[1]+dz],k=key(...n);if(!seen.has(k)&&canWalk(n[0]*step,n[1]*step)){seen.add(k);prev.set(k,p);queue.push(n);}}}
 if(!found)return [];const path:Vec2[]=[];let p=found;while(key(...p)!==key(...start)){path.unshift([p[0]*step,p[1]*step]);const parent=prev.get(key(...p));if(!parent)break;p=parent;}if(canWalk(...to))path.push(to);return path;
}

/** Public circulation stays left of the counter/kitchen. Staff use canWalk instead. */
export function canVisitorWalk(x:number,z:number,radius=.18){
 if(z<=.27)return z>-7+radius&&x>-3.6+radius&&x<3.6-radius&&!OBSTACLES.some(o=>Math.abs(x-o.x)<o.w/2+radius&&Math.abs(z-o.z)<o.d/2+radius);
 if(!canWalk(x,z,radius))return false;
 if(z>.45-radius&&z<6.55+radius&&x>.25-radius)return false;
 if(z>9.0-radius&&x>.55-radius)return false;
 return true;
}
