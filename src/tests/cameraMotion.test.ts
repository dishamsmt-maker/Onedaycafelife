import {describe,it,expect} from 'vitest';
import {cameraStride,clearCameraSegment} from '../game/cameraMotion';
import {canVisitorWalk,canWalk} from '../game/world';
describe('walking across slower frames',()=>{
 it('covers the same real distance at 4 and 60 frames per second',()=>{
  const distance=(frames:number)=>Array.from({length:frames},()=>cameraStride(1/frames)).reduce((n,v)=>n+v,0);
  expect(distance(4)).toBeCloseTo(distance(60),8);expect(distance(4)).toBeCloseTo(1.65,8);
 });
 it('cannot jump on resume or move with invalid frame times',()=>{
  expect(cameraStride(30)).toBeLessThan(.42);expect(cameraStride(-1)).toBe(0);expect(cameraStride(NaN)).toBe(0);expect(cameraStride(Infinity)).toBe(0);
 });
 it('checks the entire segment, including thin bar walls and the public forecourt',()=>{
  expect(canWalk(-1,8.65)).toBe(true);expect(canWalk(.4,8.65)).toBe(true);
  expect(clearCameraSegment([-1,8.65],[.4,8.65],canWalk)).toBe(false);
  expect(clearCameraSegment([-1.45,-.2],[-1.45,.3],canVisitorWalk)).toBe(true);
  expect(clearCameraSegment([-1.45,13.5],[-1.45,15],canVisitorWalk)).toBe(true);
 });
});
