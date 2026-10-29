import {test,expect,type Page} from '@playwright/test';
test.beforeEach(async({page})=>{await page.route(/fonts\.(googleapis|gstatic)\.com/,route=>route.abort());});
async function state(page:Page){return page.evaluate(()=>JSON.parse(JSON.stringify((window as any).__ONE_DAY_DEV__.store.getState().game)));}
async function advance(page:Page,minutes:number){await page.evaluate(m=>(window as any).__ONE_DAY_DEV__.advance(m),minutes);}
async function launch(page:Page){await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();await page.getByRole('button',{name:'หยุดเวลา',exact:true}).click();await expect(page.locator('canvas')).toBeVisible();await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();await page.getByRole('button',{name:'เปิดตั้งค่า',exact:true}).click();await page.getByLabel('คุณภาพภาพ',{exact:true}).selectOption('low');await page.getByRole('button',{name:'ย่อแผง',exact:true}).click();}
test('busy service, camera changes and IndexedDB resume preserve real state',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await launch(page);await advance(page,12);
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();await page.getByRole('button',{name:'เปิดออร์เดอร์',exact:true}).click();await page.getByLabel('เลือกหน้าจัดการ').selectOption('events');await page.getByRole('button',{name:'20 คน',exact:true}).click();
 let s=await state(page);expect(s.todayArrivals).toBeGreaterThanOrEqual(20);expect(s.tables.reduce((n:number,t:any)=>n+t.customerIds.length,0)).toBeLessThanOrEqual(12);
 await advance(page,22);s=await state(page);expect(s.orders.length).toBeGreaterThan(0);expect(s.orders.some((o:any)=>o.stockConsumed)).toBeTruthy();
 const signature=JSON.stringify({cash:s.cash,orders:s.orders,inventory:s.inventory,minute:s.minute,employees:s.employees});
 await page.getByRole('button',{name:'ย่อแผง',exact:true}).click();await page.getByRole('button',{name:'ดูร้าน',exact:true}).click();await page.getByRole('button',{name:'เดินชมร้าน',exact:true}).click();
 let after=await state(page);expect(JSON.stringify({cash:after.cash,orders:after.orders,inventory:after.inventory,minute:after.minute,employees:after.employees})).toBe(signature);
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();await page.getByRole('button',{name:'บันทึก',exact:true}).click();await expect(page.getByRole('status')).toContainText('บันทึก');await page.reload({waitUntil:'domcontentloaded'});
 await expect(page.getByRole('button',{name:'กลับมาที่ ONE DAY'})).toBeVisible();after=await state(page);
 expect(after.cash).toBe(s.cash);expect(after.inventory).toEqual(s.inventory);expect(after.orders).toEqual(s.orders);expect(new Set(after.ledger.map((t:any)=>t.id)).size).toBe(after.ledger.length);expect(errors).toEqual([]);
});
test('inventory purchase is a cash movement and menu edits affect actual simulation data',async({page})=>{
 await launch(page);await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();await page.getByRole('button',{name:'เปิดวัตถุดิบ',exact:true}).click();const before=await state(page);
 await page.getByRole('button',{name:/20 · ฿80/}).first().click();await expect.poll(async()=>(await state(page)).cash).toBe(before.cash-80);const after=await state(page);
 expect(after.cash).toBe(before.cash-80);expect(after.inventory.find((i:any)=>i.id==='egg').quantity).toBe(before.inventory.find((i:any)=>i.id==='egg').quantity+20);
 expect(after.ledger.filter((t:any)=>t.type==='cogs')).toHaveLength(0);
 await page.getByLabel('เลือกหน้าจัดการ').selectOption('menu');await page.getByRole('tab',{name:/กาแฟ/}).click();await page.getByRole('button',{name:'แก้ไขเมนู',exact:true}).click();await page.getByRole('spinbutton',{name:'ราคา ลาเต้เย็น',exact:true}).fill('55');
 expect((await state(page)).menu.find((m:any)=>m.id==='latte').price).toBe(55);
 await page.getByLabel('เลือกหน้าจัดการ').selectOption('settings');await page.getByLabel('สภาพอากาศ',{exact:true}).selectOption('rain');expect((await state(page)).weather).toBe('rain');
});
test('mobile starts with accessible scene and opens management on demand',async({page})=>{
 await page.setViewportSize({width:390,height:844});await launch(page);await expect(page.locator('.management-panel')).toHaveCount(0);
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();await page.getByRole('button',{name:'เปิดออร์เดอร์',exact:true}).click();await expect(page.locator('.management-panel')).toBeVisible();
 await page.getByRole('button',{name:'ย่อแผง',exact:true}).click();await expect(page.locator('.management-panel')).toHaveCount(0);
 await page.screenshot({path:'screenshot-mobile.png'});
});
