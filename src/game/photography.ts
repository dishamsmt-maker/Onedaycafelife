import Dexie, {type Table} from 'dexie';
import type {PhotoMemory} from './cozy';
export interface CafePhoto extends PhotoMemory {image:string;}
class PhotoAlbum extends Dexie {
 photos!:Table<CafePhoto,string>;
 constructor(){super('one-day-photo-album');this.version(1).stores({photos:'id,day'});}
}
const album=new PhotoAlbum();
let capture:(()=>string)|null=null;
export function registerPhotoRenderer(renderer:()=>string){capture=renderer;return ()=>{if(capture===renderer)capture=null}}
export async function takeCafePhoto(memory:PhotoMemory){
 if(!capture)throw new Error('กล้องยังไม่พร้อม ลองอีกครั้ง');
 const image=capture();if(!image.startsWith('data:image/'))throw new Error('ถ่ายภาพไม่สำเร็จ');
 const photo={...memory,image};await album.transaction('rw',album.photos,async()=>{await album.photos.put(photo);const photos=await album.photos.toArray();if(photos.length>24)await album.photos.bulkDelete(photos.slice(0,photos.length-24).map(p=>p.id));});return photo;
}
export const listCafePhotos=()=>album.photos.toArray();
export const deleteCafePhoto=(id:string)=>album.photos.delete(id);
