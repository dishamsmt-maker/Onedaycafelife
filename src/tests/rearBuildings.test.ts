import {expect,it} from 'vitest';
import {PAVILION_POSTS,canWalk,canVisitorWalk,findPath,segmentWalkable,STATIONS} from '../game/world';
it('pavilion posts block bodies while the public corridor and restroom remain reachable',()=>{
 for(const post of PAVILION_POSTS)expect(canWalk(post.x,post.z)).toBe(false);
 for(let z=30;z<49.6;z+=.1)expect(canVisitorWalk(-1.45,z)).toBe(true);
 for(const target of [[.8,32.8],STATIONS.restroom] as [number,number][]){
  const origin:[number,number]=[-1.45,30],path=findPath(origin,target);expect(path.at(-1)).toEqual(target);
  let previous=origin;for(const point of path){expect(segmentWalkable(previous,point)).toBe(true);previous=point;}
 }
});
