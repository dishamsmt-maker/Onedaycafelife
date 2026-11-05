import type {Vec2} from './types';
/** Keep walking pace independent of frame rate, but never jump on background resume. */
export const cameraStride=(seconds:number)=>Number.isFinite(seconds)?Math.max(0,Math.min(seconds,.25))*1.65:0;
export function clearCameraSegment(from:Vec2,to:Vec2,walkable:(x:number,z:number)=>boolean){
 const samples=Math.max(1,Math.ceil(Math.hypot(to[0]-from[0],to[1]-from[1])/.06));
 for(let i=0;i<=samples;i++){const t=i/samples;if(!walkable(from[0]+(to[0]-from[0])*t,from[1]+(to[1]-from[1])*t))return false;}
 return true;
}
