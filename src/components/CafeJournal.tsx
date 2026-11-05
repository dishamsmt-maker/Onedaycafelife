import {useEffect,useState} from 'react';
import {useGame} from '../game/store';
import {progression} from '../game/cozy';
import {listCafePhotos,deleteCafePhoto,type CafePhoto} from '../game/photography';
import type {GameState} from '../game/types';
export default function CafeJournal({state}:{state:GameState}){
 const [note,setNote]=useState(''),[photos,setPhotos]=useState<CafePhoto[]>([]),[error,setError]=useState('');
 const dispatch=useGame(s=>s.dispatch),progress=progression(state);
 useEffect(()=>{let live=true;listCafePhotos().then(p=>{if(live)setPhotos(p.reverse())}).catch(()=>{if(live)setError('เปิดอัลบั้มไม่ได้ · ภาพที่ดาวน์โหลดไว้ยังใช้ได้')});return()=>{live=false}},[]);
 return <section className="cafe-journal" aria-label="สมุดชีวิตร้าน"><h3>สมุดชีวิตร้าน · {progress.stage}</h3><p>ส่งมอบ {progress.completed} รายการ · ลูกค้ากลับมาซ้ำ {progress.regulars} คน</p><div className="journal-milestones">{progress.milestones.map(m=><span key={m.label} className={m.done?'achieved':''}>{m.done?'✓':'○'} {m.label}</span>)}</div>
 <form onSubmit={e=>{e.preventDefault();dispatch({type:'journal-note',text:note});setNote('')}}><label htmlFor="journal-note">วันนี้อยากจดอะไรไว้</label><textarea id="journal-note" maxLength={240} value={note} onChange={e=>setNote(e.target.value)} placeholder="แสงเย็นวันนี้สวยมาก…"/><button className="button secondary" disabled={!note.trim()}>เก็บความทรงจำ</button></form>
 <h3>ภาพจากร้านของคุณ</h3>{error&&<p role="status">{error}</p>}{!photos.length&&<p className="hint">เปิดโหมดถ่ายภาพแล้วกดบันทึกภาพ รูปจะอยู่ในอัลบั้มของเบราว์เซอร์นี้</p>}<div className="photo-album">{photos.map(photo=><figure key={photo.id}><img src={photo.image} alt={photo.caption} loading="lazy"/><figcaption>วันที่ {photo.day} · {photo.caption}</figcaption><a href={photo.image} download={`ONE-DAY-${photo.id}.jpg`}>ดาวน์โหลด</a><button onClick={async()=>{try{await deleteCafePhoto(photo.id);setPhotos(p=>p.filter(x=>x.id!==photo.id))}catch{setError('ลบภาพไม่ได้ ลองอีกครั้ง')}}}>ลบรูป</button></figure>)}</div>
 <h3>เหตุการณ์ที่ผ่านมา</h3>{[...(state.life?.journal??[])].reverse().slice(0,80).map(n=><div key={n.id} className="notice-row"><span>วันที่ {n.day}<br/>{Math.floor(n.minute/60).toString().padStart(2,'0')}:{Math.floor(n.minute%60).toString().padStart(2,'0')}</span><p>{n.text}</p></div>)}
 <p className="hint">สมุดและข้อมูลภาพอยู่ในเซฟเกม รูปภาพเก็บแยกในเครื่องสูงสุด 24 รูป ดาวน์โหลดรูปก่อนย้ายเครื่องหรือล้างข้อมูลเว็บ</p>
 </section>;
}
