import {describe,it,expect} from 'vitest';
import {createGame} from '../game/engine';
import {LANDSCAPE_PLANTS,cafeLightSources,nearestCafeLights} from '../game/cafeAtmosphere';
import {POT_SLOTS} from '../game/cozy';
import {canWalk,findPath,STATIONS} from '../game/world';
describe('readable, planted café evenings',()=>{
 it('puts light under each active umbrella and follows relocated tables',()=>{
  const s=createGame();s.tables[0].position=[.8,32];s.tables[1].enabled=false;
  const sources=cafeLightSources(s.tables);expect(sources.find(l=>l.id==='t1')?.position).toEqual([.8,2.05,32]);expect(sources.some(l=>l.id==='t2')).toBe(false);
  for(const l of sources.filter(l=>l.id.startsWith('t')))expect(l.position[1]).toBeLessThan(2.5);
 });
 it('limits local lights to four on mobile and selects the table next to the player',()=>{
  const sources=cafeLightSources(createGame().tables),saved=structuredClone(sources);
  expect(nearestCafeLights(sources,[-1.45,25.5],'low')).toHaveLength(4);expect(nearestCafeLights(sources,[-1.45,25.5],'low')[0].id).toBe('t5');expect(nearestCafeLights(sources,[-1.45,49],'high')).toHaveLength(6);expect(sources).toEqual(saved);
 });
 it('adds layered perimeter planting with clear roots and leaves the full main path connected',()=>{
  expect(LANDSCAPE_PLANTS.length).toBeGreaterThan(80);
  for(const p of LANDSCAPE_PLANTS){expect(canWalk(p.x,p.z,.08)).toBe(true);expect(p.x< -2.2||p.x>2.2).toBe(true);}
  expect(findPath(STATIONS.entrance,[-1.45,49]).at(-1)).toEqual([-1.45,49]);
 });
 it('preserves the spaces where players can buy pots',()=>{
  for(const p of LANDSCAPE_PLANTS.filter(p=>p.type==='pot'))for(const [x,z] of POT_SLOTS)expect(Math.hypot(x-p.x,z-p.z)).toBeGreaterThan(.62);
 });
});
