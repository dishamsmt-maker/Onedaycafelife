import {describe,expect,it} from 'vitest';
import {canOccupyWithActors} from './world';

describe('dynamic actor occupancy guard',()=>{
 it('rejects overlapping people and permits a clear gap',()=>{
  const others=[{position:[0,1] as [number,number],radius:.2}];
  expect(canOccupyWithActors([0,1.2],others,.2)).toBe(false);
  expect(canOccupyWithActors([0,1.5],others,.2)).toBe(true);
 });
 it('rejects furniture collisions even when no other actors are present',()=>{
  expect(canOccupyWithActors([1.4,.75],[])).toBe(false);
 });
 it('fails closed on malformed actor data or radius',()=>{
  expect(canOccupyWithActors([0,1],[{position:[NaN,1],radius:.2}])).toBe(false);
  expect(canOccupyWithActors([0,1],[{position:[0,2],radius:-.2}])).toBe(false);
  expect(canOccupyWithActors([0,1],[],Infinity)).toBe(false);
 });
});
