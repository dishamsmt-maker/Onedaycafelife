import {test,expect} from '@playwright/test';
test('19:20 seating stays legible with a bounded light pool and an unchanged restaurant ledger',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Shader Error'))errors.push(m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();await expect(page.getByTestId('walk-joystick')).toBeVisible();
 const before=await page.evaluate(()=>{const w=window as any,s=w.__ONE_DAY_DEV__.store.getState().game;w.__ONE_DAY_DEV__.store.getState().replace({...s,minute:1160,phase:'open',paused:true,events:[],weather:'sunny'});return JSON.stringify({cash:s.cash,ledger:s.ledger,inventory:s.inventory,orders:s.orders,tables:s.tables})});
 await expect(page.locator('.play-clock span')).toHaveText('19:20');await page.getByRole('button',{name:'ถ่ายภาพ',exact:true}).click();await page.getByLabel('ระยะภาพ',{exact:true}).fill('75');
 await page.evaluate(()=>{const p=(window as any).__ONE_DAY_PLAYER__;p.position={x:1.45,z:25.5};p.view={yaw:0,pitch:0};p.cameraRevision++});
 await expect.poll(()=>page.evaluate(()=>{const l=(window as any).__ONE_DAY_CAFE_LIGHTS__;return l?.active&&l?.pool===4&&l?.assigned.includes('t5')&&l?.settled})).toBe(true);
 await page.getByRole('button',{name:'บันทึกภาพร้าน',exact:true}).click();await expect(page.getByRole('status')).toContainText('เก็บภาพในสมุดชีวิตร้านแล้ว');
 await page.screenshot({path:info.outputPath('night-seating.png'),style:'.photo-controls,.touch-controls{visibility:hidden!important}'});
 await page.getByRole('button',{name:'ออกจากโหมดภาพถ่าย',exact:true}).click();await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();await page.getByRole('button',{name:'เปิดรายงาน',exact:true}).click();
 const img=page.locator('.photo-album img').first();await img.scrollIntoViewIfNeeded();await expect(img).toBeVisible();
 const luma=await img.evaluate(async(el:HTMLImageElement)=>{await el.decode();const c=document.createElement('canvas');c.width=el.naturalWidth;c.height=el.naturalHeight;const ctx=c.getContext('2d')!;ctx.drawImage(el,0,0);const data=ctx.getImageData(0,Math.floor(c.height*400/844),Math.floor(c.width*145/390),Math.floor(c.height*300/844)).data;let sum=0;for(let i=0;i<data.length;i+=4)sum+=.2126*data[i]+.7152*data[i+1]+.0722*data[i+2];return sum/(data.length/4)});
 // Old production rendered the same dark chair/table area at luma 37.5/255.
 expect(luma).toBeGreaterThan(55);
 const after=await page.evaluate(()=>{const s=(window as any).__ONE_DAY_DEV__.store.getState().game;return JSON.stringify({cash:s.cash,ledger:s.ledger,inventory:s.inventory,orders:s.orders,tables:s.tables})});expect(after).toBe(before);expect(errors).toEqual([]);
});
