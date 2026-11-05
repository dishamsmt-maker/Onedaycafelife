import {touchControls} from '../game/touchControls';
import { useEffect, useRef } from 'react';
import { createCafeSoundscape, type CafeSoundscape, type SoundPeriodOverride } from '../game/audio';
import type { GameState } from '../game/types';

export interface AmbientAudioProps {
  nature?:boolean;spatial?:boolean;state:GameState;
  enabled:boolean;
  volume?:number;
  musicVolume?:number;
  effectsVolume?:number;
  periodOverride?:SoundPeriodOverride;
}
/** Renderless audio controller. Nothing is constructed until sound is explicitly enabled. */
export default function AmbientAudio({state,enabled,volume=.65,musicVolume=.48,effectsVolume=.42,periodOverride='auto',nature=true,spatial=true}:AmbientAudioProps){
  const audio=useRef<CafeSoundscape|null>(null);
  const latest=useRef({state,volume,musicVolume,effectsVolume,periodOverride,nature,spatial});
  latest.current={state,volume,musicVolume,effectsVolume,periodOverride,nature,spatial};
  useEffect(()=>{
    if(!enabled)return;
    const sound=createCafeSoundscape();audio.current=sound;
    if(!sound)return;
    sound.setMix(latest.current);sound.update(latest.current.state);
    const resume=()=>{void sound.resume()};
    const visibility=()=>sound.setVisible(!document.hidden);
    document.addEventListener('pointerdown',resume,{passive:true});
    document.addEventListener('touchend',resume,{passive:true});
    document.addEventListener('keydown',resume);
    document.addEventListener('visibilitychange',visibility);
    const listenerTimer=setInterval(()=>{const p=touchControls.listener;sound.setListener(p.x,p.y,p.z,p.forwardX,p.forwardZ)},150);
    visibility();void sound.resume();
    return()=>{clearInterval(listenerTimer);document.removeEventListener('pointerdown',resume);document.removeEventListener('touchend',resume);document.removeEventListener('keydown',resume);document.removeEventListener('visibilitychange',visibility);sound.dispose();if(audio.current===sound)audio.current=null;};
  },[enabled]);
  useEffect(()=>{audio.current?.setMix({volume,musicVolume,effectsVolume,periodOverride,nature,spatial})},[volume,musicVolume,effectsVolume,periodOverride,nature,spatial]);
  useEffect(()=>{audio.current?.update(state)},[state]);
  return null;
}
