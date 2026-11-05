import {useState} from 'react';
import {DEFAULT_COZY,type CozyPreferences} from './cozy';
export function useCozyPreferences(){
 const [preferences,setPreferences]=useState<CozyPreferences>(()=>{
  try{const p=JSON.parse(localStorage.getItem('one-day-cozy')??'{}');return {...DEFAULT_COZY,...Object.fromEntries(Object.entries(p).filter(([k,v])=>k==='style'?['realistic','cozy','dreamy'].includes(v as string):['nature','spatial','life','weather'].includes(k)&&typeof v==='boolean'))}}catch{return DEFAULT_COZY}
 });
 return [preferences,(value:CozyPreferences)=>{setPreferences(value);try{localStorage.setItem('one-day-cozy',JSON.stringify(value))}catch{/* Current session still works if storage is full. */}}] as const;
}
