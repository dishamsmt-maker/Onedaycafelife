import { create } from 'zustand';
import { act, createGame, tick } from './engine';
import type { GameState,GameAction } from './types';
interface Store { game:GameState; dispatch:(a:GameAction)=>void; step:()=>void; replace:(game:GameState)=>void; }
export const useGame=create<Store>((set)=>({game:createGame(),dispatch:a=>set(s=>({game:act(s.game,a)})),step:()=>set(s=>s.game.paused||s.game.phase==='closed'?s:{game:tick(s.game,.1*s.game.speed)}),replace:game=>set({game})}));
// Development-only integration harness. Never included in production behavior.
if(import.meta.env.DEV){(globalThis as any).__ONE_DAY_DEV__={store:useGame,advance:(minutes:number)=>{const g=useGame.getState().game;useGame.getState().replace({...tick({...g,paused:false},minutes),paused:true})}};}
