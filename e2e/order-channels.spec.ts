import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();
 await page.evaluate(()=>{const w=window as any,s=w.__ONE_DAY_DEV__.store.getState().game;w.__ONE_DAY_DEV__.store.getState().replace({...s,minute:420,phase:'open',paused:true,events:[],settings:{...s.settings,arrivalsPerHour:0}})});
});
test('seated customer must tap table QR and can follow the bill to payment',async({page})=>{
 await page.evaluate(()=>{const w=window as any;w.__ONE_DAY_PLAYER__.position={x:1.25,z:6.35};w.__ONE_DAY_VISITOR__.getState().sit('t1')});
 await expect(page.getByRole('button',{name:'สแกน QR บนโต๊ะ'})).toBeVisible();
 const blocked=await page.evaluate(()=>(window as any).__ONE_DAY_VISITOR__.getState().order('thai-tea'));expect(blocked).toBe(false);
 await page.getByRole('button',{name:'สแกน QR บนโต๊ะ'}).click();
 await expect(page.getByRole('heading',{name:'เมนู QR · โต๊ะมะลิ'})).toBeVisible();
 await page.getByRole('tab',{name:/กาแฟ/}).click();
 await page.getByRole('button',{name:'ดูเมนู ชาไทยเย็น',exact:true}).click();
 await page.getByRole('button',{name:'สั่ง ชาไทยเย็น · ฿35',exact:true}).click();
 await page.getByRole('button',{name:/บิลและคิว · 1/}).click();
 await expect(page.getByRole('dialog',{name:'บิลและคิว'})).toContainText('รอคิวผลิต');
 await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.advance(35));
 await page.getByRole('button',{name:'ชำระเงินและปิดบิล ฿35',exact:true}).click();
 await expect(page.getByRole('dialog',{name:'บิลและคิว'})).toHaveCount(0);
});
test('counter customer pays before production then collects without a second charge',async({page})=>{
 await page.evaluate(()=>{const w=window as any;w.__ONE_DAY_PLAYER__.position={x:.2,z:1.65};w.__ONE_DAY_VISITOR__.getState().order('thai-tea')});
 await page.getByRole('button',{name:/บิลและคิว · 1/}).click();
 await expect(page.getByRole('dialog',{name:'บิลและคิว'})).toContainText('รอชำระก่อนผลิต');
 await page.getByRole('button',{name:'ยืนยันชำระ ฿35 และเข้าคิว'}).click();
 const cash=await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.cash);
 await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.advance(35));
 await page.getByRole('button',{name:'รับสินค้าและปิดบิล'}).click();
 expect(await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.cash)).toBe(cash);
});
