import {test,expect} from '@playwright/test';
test('inspection-facing bar window opens menu and accepts an actual counter order',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();await page.getByRole('button',{name:'หยุดเวลา',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>{const p=(window as any).__ONE_DAY_PLAYER__;return p.active&&p.enabled})).toBe(true);
 await page.evaluate(()=>{const w=window as any,h=w.__ONE_DAY_DEV__,s=h.store.getState().game;h.store.getState().replace({...s,minute:750,phase:'open',paused:true,events:[],settings:{...s.settings,arrivalsPerHour:0}});const p=w.__ONE_DAY_PLAYER__;p.position.x=1.3;p.position.z=8.65;p.cameraRevision++;p.view.yaw=Math.PI/2;p.view.pitch=-.08;});
 await expect(page.locator('.play-clock span')).toHaveText('12:30');
 await page.getByRole('button',{name:'ดูเมนูและสั่งอาหาร',exact:true}).click();
 await expect(page.getByRole('heading',{name:'เมนูซื้อกลับ · สั่งหน้าเคาน์เตอร์'})).toBeVisible();
 await page.getByRole('button',{name:'ดูเมนู ชาไทยเย็น',exact:true}).click();await page.getByRole('button',{name:'สั่ง ชาไทยเย็น · ฿35',exact:true}).click();
 const result=await page.evaluate(()=>{const s=(window as any).__ONE_DAY_DEV__.store.getState().game;return{orders:s.orders.length,channel:s.customers.find((c:any)=>c.player)?.orderChannel}});
 expect(result).toEqual({orders:1,channel:'counter'});expect(errors).toEqual([]);
 await page.screenshot({path:info.outputPath('inspection-facing-window.png'),timeout:60000});
});
