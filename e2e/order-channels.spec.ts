import {test,expect} from '@playwright/test';
test.beforeEach(async({page})=>{
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();
 await page.evaluate(()=>{const w=window as any,s=w.__ONE_DAY_DEV__.store.getState().game;w.__ONE_DAY_DEV__.store.getState().replace({...s,minute:420,phase:'open',paused:true,events:[],settings:{...s.settings,arrivalsPerHour:0}})});
});
test('seated customer must tap table QR and can follow the bill to payment',async({page})=>{
 await page.evaluate(()=>{const w=window as any;w.__ONE_DAY_PLAYER__.position={x:-.8,z:14.2};w.__ONE_DAY_VISITOR__.getState().sit('t1')});
 await expect(page.getByRole('button',{name:'สแกน QR บนโต๊ะ'})).toBeVisible();
 const blocked=await page.evaluate(()=>(window as any).__ONE_DAY_VISITOR__.getState().order('thai-tea'));expect(blocked).toBe(false);
 await page.getByRole('button',{name:'สแกน QR บนโต๊ะ'}).click();
 await expect(page.getByRole('heading',{name:'เมนู QR · T1'})).toBeVisible();
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
 await page.evaluate(()=>{const w=window as any;w.__ONE_DAY_PLAYER__.position={x:.1,z:6.6};w.__ONE_DAY_VISITOR__.getState().order('thai-tea')});
 await page.getByRole('button',{name:/บิลและคิว · 1/}).click();
 await expect(page.getByRole('dialog',{name:'บิลและคิว'})).toContainText('รอชำระก่อนผลิต');
 await page.getByRole('button',{name:'ยืนยันชำระ ฿35 และเข้าคิว'}).click();
 const cash=await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.cash);
 await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.advance(35));
 await page.getByRole('button',{name:'รับสินค้าและปิดบิล'}).click();
 expect(await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.cash)).toBe(cash);
});

for(const n of [3,5])test(`table ${n} QR appears in kitchen queue and closes with reconciled payment`, async ({page}, info) => {
 const errors:string[]=[]; page.on('pageerror', e=>errors.push(e.message));
 const before=await page.evaluate((n)=>{
  const w=window as any; w.__ONE_DAY_PLAYER__.position={x:-.8,z:14.2+(n-1)*2.4};
  if(!w.__ONE_DAY_VISITOR__.getState().sit(`t${n}`))throw new Error('Table 3 seating failed');
  const s=w.__ONE_DAY_DEV__.store.getState().game;
  return {cash:s.cash,chicken:s.inventory.find((i:any)=>i.id==='chicken').quantity};
 },n);
 await page.getByRole('button',{name:'สแกน QR บนโต๊ะ'}).click();
 await expect(page.getByRole('heading',{name:`เมนู QR · T${n}`})).toBeVisible();
 await page.getByRole('button',{name:'ดูเมนู ข้าวต้มไก่',exact:true}).click();
 await page.getByRole('button',{name:'สั่ง ข้าวต้มไก่ · ฿45',exact:true}).click();
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();
 await page.getByRole('button',{name:'เปิดออร์เดอร์',exact:true}).click();
 await page.getByLabel('เลือกหน้าจัดการ').selectOption('kitchen');
 await expect(page.locator('.management-panel')).toContainText('ข้าวต้มไก่');
 await expect(page.locator('.management-panel')).toContainText(`T${n}`);
 const service=await page.evaluate(()=>{
  const w=window as any;let na=false,ken=false;
  for(let i=0;i<600;i++){
   w.__ONE_DAY_DEV__.advance(.1);
   const s=w.__ONE_DAY_DEV__.store.getState().game;
   na ||= s.employees.some((e:any)=>e.id==='na'&&e.task?.kind==='cook');
   ken ||= s.employees.some((e:any)=>e.id==='ken'&&e.task?.kind==='serve');
   if(s.orders[0].status==='completed')return {na,ken,cash:s.cash,chicken:s.inventory.find((i:any)=>i.id==='chicken').quantity,cogs:s.ledger.filter((t:any)=>t.type==='cogs').length};
  }
  throw new Error('Order did not complete within 60 simulated minutes');
 });
 expect(service).toMatchObject({na:true,ken:true,cash:before.cash,cogs:1});
 expect(service.chicken).toBeCloseTo(before.chicken-.09,8);
 await page.getByRole('button',{name:'ย่อแผง',exact:true}).click();
 await page.getByRole('button',{name:/บิลและคิว · 1/}).click();
 await page.getByRole('button',{name:'ชำระเงินและปิดบิล ฿45',exact:true}).click();
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();
 await page.getByRole('button',{name:'เปิดออร์เดอร์',exact:true}).click();
 await page.getByLabel('เลือกหน้าจัดการ').selectOption('reports');
 await page.getByRole('button',{name:'ปิดร้านเมื่อพร้อม',exact:true}).click();
 await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.advance(90));
 await expect(page.locator('.management-panel')).toContainText('จบวันแล้ว ขอบคุณทีมงาน');
 const result=await page.evaluate(()=>{
  const s=(window as any).__ONE_DAY_DEV__.store.getState().game;
  return {phase:s.phase,reports:s.reports,sales:s.ledger.filter((t:any)=>t.type==='food-sale').length,cash:s.cash,delta:s.ledger.reduce((n:number,t:any)=>n+t.cashDelta,0)};
 });
 expect(result.phase).toBe('closed');expect(result.reports).toHaveLength(1);
 expect(result.reports[0].revenue).toBe(45);expect(result.sales).toBe(1);
 expect(result.cash).toBeCloseTo(before.cash+result.delta,8);expect(errors).toEqual([]);
 await page.screenshot({path:info.outputPath(`table-${n}-closing.png`),style:'canvas { visibility: hidden !important; }'});
});
