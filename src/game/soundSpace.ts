export const SOUND_SOURCES={bar:[-.35,1.2,8.65],kitchen:[1.8,1.1,10.4],road:[0,.5,-3],garden:[1,2.5,30],awning:[.5,2.6,7]} as const;
export type SoundZone=keyof typeof SOUND_SOURCES;
/** Same inverse-distance curve used by the Web Audio panners. */
export function soundAttenuation(distance:number,ref=3,rolloff=1.5){return ref/(ref+rolloff*Math.max(0,Math.min(80,distance)-ref));}
