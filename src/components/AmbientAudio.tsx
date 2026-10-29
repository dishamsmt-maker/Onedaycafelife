import { useEffect, useRef } from 'react';
import { createCafeSoundscape, type CafeSoundscape, type SoundPeriodOverride } from '../game/audio';
import type { GameState } from '../game/types';

export interface AmbientAudioProps {
  state:GameState;
  enabled:boolean;
  volume?:number;
  musicVolume?:number;
  effectsVolume?:number;
  periodOverride?:SoundPeriodOverride;
}
/** Renderless audio controller. Nothing is constructed until sound is explicitly enabled. */
export default function AmbientAudio({state,enabled,volume=.65,musicVolume=.48,effectsVolume=.42,periodOverride='auto'}:AmbientAudioProps){
  const audio=useRef<CafeSoundscape|null>(null);
  const latest=useRef({state,volume,musicVolume,effectsVolume,periodOverride});
  latest.current={state,volume,musicVolume,effectsVolume,periodOverride};
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
    visibility();void sound.resume();
    return()=>{document.removeEventListener('pointerdown',resume);document.removeEventListener('touchend',resume);document.removeEventListener('keydown',resume);document.removeEventListener('visibilitychange',visibility);sound.dispose();if(audio.current===sound)audio.current=null;};
  },[enabled]);
  useEffect(()=>{audio.current?.setMix({volume,musicVolume,effectsVolume,periodOverride})},[volume,musicVolume,effectsVolume,periodOverride]);
  useEffect(()=>{audio.current?.update(state)},[state]);
  return null;
}
