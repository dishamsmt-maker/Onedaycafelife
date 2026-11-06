import {test,expect} from '@playwright/test';

test('customer, all five staff and management share the same saved business',async({page},info)=>{
 const errors:string[]=[];
 page.on('pageerror',error=>errors.push(error.message));
 await page.route(/fonts\.(googleapis|gstatic)\.com/,route=>route.abort());
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();
 await page.getByRole('button',{name:'หยุดเวลา',exact:true}).click();
 const snapshot=()=>page.evaluate(()=>{
  const s=(window as any).__ONE_DAY_DEV__.store.getState().game;
  return {cash:s.cash,inventory:s.inventory,orders:s.orders,ledger:s.ledger,day:s.day,minute:s.minute};
 });
 const before=await snapshot();
 for(const [id,name] of [['ham','Ham'],['na','Na'],['alee','Alee'],['ken','Ken'],['pun','Pun']]){
  await page.getByRole('button',{name:'เลือกตัวละคร',exact:true}).click();
  await page.locator('.role-list').getByRole('button',{name:new RegExp(name)}).click();
  await expect(page.locator('.visitor-story')).toContainText('TEAM ONE DAY');
  expect(await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.employees.find((e:any)=>e.controlled)?.id??null)).toBe(id);
  expect(await snapshot()).toEqual(before);
 }
 await page.getByRole('button',{name:'เลือกตัวละคร',exact:true}).click();
 await page.locator('.role-list').getByRole('button',{name:'ลูกค้า',exact:true}).click();
 await expect(page.locator('.visitor-story')).toContainText('TABLE & TAKEAWAY');
 await page.getByRole('button',{name:'ดูร้าน',exact:true}).click();
 await expect(page.locator('.app-shell')).toHaveClass(/camera-iso/);
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();
 await page.getByRole('button',{name:'เปิดตั้งค่า',exact:true}).click();
 await page.getByLabel('เลือกหน้าจัดการ').selectOption('overview');
 await expect(page.locator('.mini-grid')).toContainText('/ 20');
 await page.getByLabel('เลือกหน้าจัดการ').selectOption('settings');
 await page.getByRole('button',{name:'บันทึกเกมลงเครื่อง',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('บันทึก ONE DAY แล้ว');
 await page.reload();
 await page.getByRole('button',{name:'กลับมาที่ ONE DAY',exact:true}).click();
 await page.getByRole('button',{name:'หยุดเวลา',exact:true}).click();
 // Resume starts the clock, so compare immutable business data, not elapsed time.
 const after=await snapshot();
 expect({...after,minute:before.minute}).toEqual(before);
 expect(await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.employees.find((e:any)=>e.controlled)?.id??null)).toBeNull();
 await expect(page.getByRole('button',{name:'ถ่ายภาพ',exact:true})).toBeEnabled({timeout:60000});
 await page.evaluate(()=>new Promise<void>(resolve=>requestAnimationFrame(()=>requestAnimationFrame(()=>resolve()))));
 expect(errors).toEqual([]);
 await page.screenshot({path:info.outputPath('three-modes-resume.png')});
});
