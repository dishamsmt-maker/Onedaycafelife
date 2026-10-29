import type { GameState } from './types';

export type SoundPeriod = 'morning' | 'day' | 'evening';
export type SoundPeriodOverride = 'auto' | SoundPeriod;
export interface AudioMix { volume?:number; musicVolume?:number; effectsVolume?:number; periodOverride?:SoundPeriodOverride; }
export interface AudioDiagnostics { running:boolean; period:SoundPeriod; notes:number; effects:number; voices:number; }
const clamp=(n:number,low=0,high=1)=>Math.max(low,Math.min(high,Number.isFinite(n)?n:0));
const hz=(midi:number)=>440*Math.pow(2,(midi-69)/12);
export const soundPeriod=(minute:number):SoundPeriod=>minute<630?'morning':minute<1020?'day':'evening';

/** Original, quiet synthesized café music. It never reads or writes simulation RNG. */
export class CafeSoundscape {
  readonly context:AudioContext;
  readonly diagnostics:AudioDiagnostics={running:false,period:'morning',notes:0,effects:0,voices:0};
  private master:GainNode;
  private musicBus:GainNode;
  private effectsBus:GainNode;
  private rainGain:GainNode;
  private musicLayer:GainNode;
  private mix:Required<AudioMix>={volume:.65,musicVolume:.48,effectsVolume:.42,periodOverride:'auto'};
  private sources=new Set<AudioScheduledSourceNode>();
  private disconnectTimers=new Set<ReturnType<typeof setTimeout>>();
  private scheduler:ReturnType<typeof setInterval>;
  private nextNote=0;
  private step=0;
  private disposed=false;
  private visible=true;
  private latest:GameState|null=null;
  private priorOrders=new Map<string,string>();
  private priorCustomers=new Set<string>();
  private priorDay=0;
  private lastSfx=new Map<string,number>();
  private noise:AudioBuffer;

  constructor(context:AudioContext){
    this.context=context;
    this.master=context.createGain(); this.master.gain.value=0;
    const limiter=context.createDynamicsCompressor(); limiter.threshold.value=-17; limiter.knee.value=16; limiter.ratio.value=3; limiter.attack.value=.012; limiter.release.value=.3;
    this.master.connect(limiter);limiter.connect(context.destination);
    this.musicBus=context.createGain();this.musicBus.gain.value=.3;this.musicBus.connect(this.master);
    this.effectsBus=context.createGain();this.effectsBus.gain.value=.25;this.effectsBus.connect(this.master);
    this.musicLayer=context.createGain();this.musicLayer.gain.value=1;this.musicLayer.connect(this.musicBus);
    this.noise=context.createBuffer(1,context.sampleRate*5,context.sampleRate);
    const data=this.noise.getChannelData(0);let seed=83917, filtered=0;
    for(let i=0;i<data.length;i++){seed=(Math.imul(seed,1664525)+1013904223)>>>0;const white=seed/2147483648-1;filtered=filtered*.82+white*.18;data[i]=filtered;}
    this.rainGain=context.createGain();this.rainGain.gain.value=0;this.rainGain.connect(this.effectsBus);
    const rain=context.createBufferSource();rain.buffer=this.noise;rain.loop=true;
    const filter=context.createBiquadFilter();filter.type='highpass';filter.frequency.value=370;rain.connect(filter);filter.connect(this.rainGain);this.track(rain);rain.start();
    this.nextNote=context.currentTime+.12;
    this.scheduler=setInterval(()=>this.schedule(),125);
    this.publish();
  }

  private publish(){
    this.diagnostics.running=this.context.state==='running'&&!this.disposed&&this.visible;
    this.diagnostics.voices=this.sources.size;
    if(import.meta.env.DEV)(globalThis as typeof globalThis & {__ONE_DAY_AUDIO__?:AudioDiagnostics}).__ONE_DAY_AUDIO__={...this.diagnostics};
  }
  private track<T extends AudioScheduledSourceNode>(node:T):T{
    this.sources.add(node);
    node.addEventListener('ended',()=>{this.sources.delete(node);try{node.disconnect()}catch{/* already disconnected */}this.publish()},{once:true});
    return node;
  }
  private later(callback:()=>void,milliseconds:number){
    const timer=setTimeout(()=>{this.disconnectTimers.delete(timer);callback()},milliseconds);this.disconnectTimers.add(timer);
  }
  async resume(){
    if(this.disposed||!this.visible)return;
    if(this.context.state==='suspended')try{await this.context.resume()}catch{/* a later touch retries on iOS */}
    this.nextNote=Math.max(this.nextNote,this.context.currentTime+.07);this.publish();
  }
  setVisible(visible:boolean){
    this.visible=visible;
    if(!visible){if(this.context.state==='running')void this.context.suspend().catch(()=>{});}
    else{this.nextNote=this.context.currentTime+.15;void this.resume()}
    this.publish();
  }
  setMix(mix:AudioMix){
    this.mix={volume:clamp(mix.volume??this.mix.volume),musicVolume:clamp(mix.musicVolume??this.mix.musicVolume),effectsVolume:clamp(mix.effectsVolume??this.mix.effectsVolume),periodOverride:mix.periodOverride??this.mix.periodOverride};
    const now=this.context.currentTime;
    this.master.gain.setTargetAtTime(this.mix.volume,now,.15);
    this.effectsBus.gain.setTargetAtTime(this.mix.effectsVolume*.65,now,.15);
    this.musicBus.gain.setTargetAtTime(this.mix.musicVolume*.65*(this.latest?.weather.includes('rain')?.85:1),now,.5);
    if(this.latest)this.setPeriod(this.mix.periodOverride==='auto'?soundPeriod(this.latest.minute):this.mix.periodOverride);
  }
  private setPeriod(period:SoundPeriod){
    if(this.diagnostics.period===period)return;
    const now=this.context.currentTime,old=this.musicLayer;
    old.gain.cancelScheduledValues(now);old.gain.setTargetAtTime(0,now,.32);
    this.musicLayer=this.context.createGain();this.musicLayer.gain.value=0;this.musicLayer.connect(this.musicBus);this.musicLayer.gain.setTargetAtTime(1,now,.7);
    this.later(()=>{try{old.disconnect()}catch{/* layer already closed */}},6000);
    this.diagnostics.period=period;this.step=0;this.nextNote=now+.12;this.publish();
  }

  update(state:GameState){
    if(this.disposed)return;
    this.latest=state;
    this.setPeriod(this.mix.periodOverride==='auto'?soundPeriod(state.minute):this.mix.periodOverride);
    const now=this.context.currentTime;
    const rain=state.weather==='rain'?.8:state.weather==='light-rain'?.38:0;
    this.rainGain.gain.setTargetAtTime(rain,now,1.2);
    this.musicBus.gain.setTargetAtTime(this.mix.musicVolume*.65*(rain>0?.85:1),now,.7);
    if(this.priorDay===state.day&&!state.paused&&this.context.state==='running'&&this.visible){
      const newPreparation=state.orders.find(o=>o.status==='preparing'&&this.priorOrders.has(o.id)&&this.priorOrders.get(o.id)!=='preparing');
      if(newPreparation){const kind=state.menu.find(m=>m.id===newPreparation.menuId)?.kind;if(kind==='drink')this.effect('brew',10);else if(kind==='food')this.effect('cook',16);}
      if(state.orders.some(o=>o.status==='completed'&&this.priorOrders.has(o.id)&&this.priorOrders.get(o.id)!=='completed'))this.effect('serve',4);
      if(state.customers.some(c=>!this.priorCustomers.has(c.id)))this.effect('arrival',16);
    }
    this.priorDay=state.day;this.priorOrders=new Map(state.orders.map(o=>[o.id,o.status]));this.priorCustomers=new Set(state.customers.map(c=>c.id));this.publish();
  }

  /** Gentle plucked partials have a rounded attack instead of a notification-like beep. */
  private tone(midi:number,time:number,duration:number,level:number,timbre:'pluck'|'keys'|'pad'|'bass',destination:AudioNode=this.musicLayer){
    if(this.disposed||this.sources.size>65)return;
    const ctx=this.context,gain=ctx.createGain(),attack=timbre==='pad'?.6:timbre==='keys'?.025:.009;
    gain.gain.setValueAtTime(.00001,time);gain.gain.exponentialRampToValueAtTime(Math.max(.00002,level),time+attack);
    gain.gain.exponentialRampToValueAtTime(.00001,time+duration);gain.connect(destination);
    const fundamental=this.track(ctx.createOscillator());fundamental.type='sine';fundamental.frequency.value=hz(midi);fundamental.connect(gain);
    fundamental.start(time);fundamental.stop(time+duration+.06);
    if(timbre==='pluck'||timbre==='keys'){
      const harmonic=this.track(ctx.createOscillator()),partial=ctx.createGain();harmonic.type='sine';harmonic.frequency.value=hz(midi)*(timbre==='keys'?3.001:2);
      partial.gain.value=timbre==='keys'?.1:.19;harmonic.connect(partial);partial.connect(gain);harmonic.start(time);harmonic.stop(time+Math.min(duration,.65));
      harmonic.addEventListener('ended',()=>partial.disconnect(),{once:true});
    }
    fundamental.addEventListener('ended',()=>gain.disconnect(),{once:true});this.diagnostics.notes++;
  }
  private schedule(){
    if(this.disposed||!this.visible||this.context.state!=='running')return;
    const now=this.context.currentTime;
    if(this.nextNote<now-.5)this.nextNote=now+.08;
    let cap=0;
    while(this.nextNote<now+.33&&cap++<5){
      this.scheduleStep(this.step,this.nextNote);
      const tempo=this.diagnostics.period==='morning'?70:this.diagnostics.period==='day'?76:64;
      this.nextNote+=60/tempo/2;this.step++;
    }
    this.publish();
  }
  private scheduleStep(step:number,time:number){
    const period=this.diagnostics.period,bar=Math.floor(step/8),beat=step%8,phrase=bar%8,variation=Math.floor(bar/8)%4;
    const morning=[[50,57,62,66],[47,54,59,62],[43,50,55,59],[45,52,57,61],[50,57,62,66],[54,57,61,64],[43,50,55,59],[45,52,57,64]];
    const daytime=[[53,60,64,69],[57,64,67,71],[50,57,60,65],[55,62,65,69],[53,60,64,69],[52,59,62,67],[57,64,67,71],[55,62,65,70]];
    const evening=[[50,57,60,64],[46,53,57,60],[43,50,53,57],[45,52,55,61],[50,57,60,65],[46,53,57,62],[43,50,57,60],[45,52,55,61]];
    const chord=(period==='morning'?morning:period==='day'?daytime:evening)[phrase];
    if(beat===0){this.tone(chord[0]-12,time,period==='evening'?3.1:2.2,.1,'bass');
      for(let i=1;i<chord.length;i++)this.tone(chord[i],time+i*.035,period==='evening'?5:3.4,period==='evening'?.044:.034,'pad');}
    if(period==='morning'){
      const patterns=[[1,2,3,2,1,3,2,3],[1,3,2,3,2,1,3,2],[3,2,1,2,3,1,2,1],[1,2,3,2,1,2,3,2]],note=chord[patterns[variation][beat]]+(beat===6&&bar%4===3?12:0);
      if(!(bar%4===3&&beat>5))this.tone(note,time,1.35,beat%2===0?.055:.038,'pluck');
      if(beat===4&&bar%2===0)this.tone(chord[3]+12,time+.03,2,.026,'keys');
    }else if(period==='day'){
      if((variation%2===0?[0,3,6]:[0,2,5]).includes(beat))for(let i=1;i<4;i++)this.tone(chord[i]+(variation===2&&i===1?12:0),time+i*.012,1.65,.035,'keys');
      if(beat===4)this.tone(chord[0]-5,time,1.8,.06,'bass');
      if((beat===2||beat===7)&&bar%4!==3)this.tone(chord[2+(beat===7?1:0)]+12,time,1.2,.025,'keys');
    }else{
      if((beat===2||beat===5)&&!(variation===3&&bar%2===1))this.tone(chord[beat===2?2:3]+(variation===1?0:12),time,3.5,.032,'keys');
      if(beat===6&&bar%2===0)this.tone(chord[1],time,2.4,.035,'pluck');
    }
  }
  private noiseEffect(time:number,duration:number,frequency:number,level:number,kind:BiquadFilterType='bandpass'){
    const src=this.track(this.context.createBufferSource()),filter=this.context.createBiquadFilter(),gain=this.context.createGain();
    src.buffer=this.noise;filter.type=kind;filter.frequency.setValueAtTime(frequency,time);filter.Q.value=.55;
    gain.gain.setValueAtTime(.00001,time);gain.gain.exponentialRampToValueAtTime(level,time+.08);gain.gain.exponentialRampToValueAtTime(.00001,time+duration);
    src.connect(filter);filter.connect(gain);gain.connect(this.effectsBus);src.start(time,.5);src.stop(time+duration+.03);
    src.addEventListener('ended',()=>{filter.disconnect();gain.disconnect()},{once:true});
  }
  private effect(kind:'brew'|'cook'|'serve'|'arrival',minimumGap:number){
    const time=this.context.currentTime;
    if(time-(this.lastSfx.get(kind)??-100)<minimumGap)return;
    this.lastSfx.set(kind,time);this.diagnostics.effects++;
    if(kind==='brew'){this.noiseEffect(time,1.2,800,.065);this.noiseEffect(time+.6,.8,1900,.035,'highpass');}
    else if(kind==='cook')this.noiseEffect(time,1.25,2400,.035,'highpass');
    else if(kind==='serve'){
      this.tone(91,time,.19,.04,'pluck',this.effectsBus);this.tone(98,time+.065,.12,.025,'pluck',this.effectsBus);
    }else{
      // Muted wooden footfalls at the open-front entrance, not a repeated shop bell.
      this.noiseEffect(time,.16,160,.1,'lowpass');this.noiseEffect(time+.23,.13,180,.08,'lowpass');
    }
  }
  dispose(){
    if(this.disposed)return;this.disposed=true;clearInterval(this.scheduler);
    for(const timer of this.disconnectTimers)clearTimeout(timer);this.disconnectTimers.clear();
    const now=this.context.currentTime;this.master.gain.cancelScheduledValues(now);this.master.gain.setTargetAtTime(0,now,.035);
    for(const source of this.sources)try{source.stop(now+.12)}catch{/* source already ended */}
    this.sources.clear();this.diagnostics.running=false;this.publish();
    setTimeout(()=>{if(this.context.state!=='closed')void this.context.close().catch(()=>{})},180);
  }
}

export function createCafeSoundscape():CafeSoundscape|null{
  if(typeof window==='undefined')return null;
  const AudioCtor=window.AudioContext??(window as Window & {webkitAudioContext?:typeof AudioContext}).webkitAudioContext;
  if(!AudioCtor)return null;
  try{return new CafeSoundscape(new AudioCtor())}catch{return null}
}
