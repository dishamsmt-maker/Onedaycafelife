import {test,expect} from '@playwright/test';
test('operations dashboard plans actual shortages and clears them after restock',async({page})=>{
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();
 await page.evaluate(()=>{const w=window as any,store=w.__ONE_DAY_DEV__.store,s=store.getState().game;store.getState().replace({...s,paused:true,inventory:s.inventory.map((i:any)=>i.id==='chicken'?{...i,quantity:0}:i)})});
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();
 await page.getByRole('button',{name:'เปิดDashboard ปัญหา',exact:true}).click();
 const dashboard=page.getByRole('region',{name:'Dashboard ปัญหาร้าน'});await expect(dashboard).toContainText('เนื้อไก่หมด');
 await dashboard.getByRole('button',{name:'เพิ่มในแผน',exact:true}).first().click();
 await expect(dashboard.getByRole('heading',{name:'วางแผนจะทำ · 1'})).toBeVisible();
 await dashboard.getByRole('button',{name:'ซื้อเติมสต็อก'}).first().click();await expect(dashboard).not.toContainText('เนื้อไก่หมด');
});
