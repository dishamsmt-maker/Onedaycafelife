import {test,expect} from '@playwright/test';
async function enter(page:import('@playwright/test').Page){
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 page.on('pageerror',e=>console.log('BROWSER ERROR:',e.message));
 await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();
 await expect(page.locator('.play-header')).toBeVisible({timeout:60000});
 await page.evaluate(()=>{const w=window as any,s=w.__ONE_DAY_DEV__.store.getState().game;w.__ONE_DAY_DEV__.store.getState().replace({...s,minute:750,phase:'open',paused:true,events:[],settings:{...s.settings,arrivalsPerHour:0}})});
 await expect(page.locator('.play-clock span')).toHaveText('12:30');
}
test('photo time and zoom leave the shared restaurant unchanged and save a real photograph',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
 await page.getByRole('button',{name:'เดินเวลา',exact:true}).click();
 await page.getByRole('button',{name:'ถ่ายภาพ',exact:true}).click();
 const before=await page.evaluate(()=>{const s=(window as any).__ONE_DAY_DEV__.store.getState().game;return {minute:s.minute,cash:s.cash,ledger:s.ledger,inventory:s.inventory}});
 await page.getByLabel('เวลาแสงภาพถ่าย').fill('1035');await page.getByLabel('ระยะภาพ',{exact:true}).fill('55');
 await page.getByRole('button',{name:'หน้าร้าน',exact:true}).click();
 await expect(page.locator('.play-header')).toBeHidden();
 await page.getByRole('button',{name:'บันทึกภาพร้าน',exact:true}).click();await expect(page.getByRole('status')).toContainText('เก็บภาพในสมุดชีวิตร้านแล้ว');
 await page.screenshot({path:info.outputPath('cozy-golden-front.png')});
 const after=await page.evaluate(()=>{const s=(window as any).__ONE_DAY_DEV__.store.getState().game;return {minute:s.minute,cash:s.cash,ledger:s.ledger,inventory:s.inventory}});expect(after).toEqual(before);
 await page.getByRole('button',{name:'ออกจากโหมดภาพถ่าย',exact:true}).click();
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();await page.getByRole('button',{name:'เปิดรายงาน',exact:true}).click();
 const image=page.locator('.photo-album img');await expect(image).toHaveCount(1);expect(await image.evaluate((el:HTMLImageElement)=>el.complete&&el.naturalWidth>100)).toBe(true);
 expect(errors).toEqual([]);
});
test('manager decorates and moves a table, then reloads the same layout and balanced cash',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
 const cash=await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.cash);
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();await page.getByRole('button',{name:'เปิดสวนและความสะอาด',exact:true}).click();
 await page.getByLabel('ระยะโต๊ะจากหน้าที่ดิน').fill('32');await page.getByRole('button',{name:'ย้ายโต๊ะ',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.tables[0].position[1])).toBe(32);
 await page.getByRole('button',{name:'ซื้อและปลูก · ฿450',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.cash)).toBe(cash-450);
 await page.getByLabel('เลือกหน้าจัดการ').selectOption('settings');await page.getByRole('button',{name:'บันทึกเกมลงเครื่อง',exact:true}).click();
 await expect(page.getByRole('status')).toContainText('บันทึก ONE DAY แล้ว');await page.reload();
 await expect(page.getByRole('button',{name:'กลับมาที่ ONE DAY',exact:true})).toBeEnabled();
 const loaded=await page.evaluate(()=>{const s=(window as any).__ONE_DAY_DEV__.store.getState().game;return {position:s.tables[0].position,cash:s.cash,pots:s.life.pots,investment:s.ledger.filter((t:any)=>t.type==='decoration').reduce((n:number,t:any)=>n+t.amount,0)}});
 expect(loaded.position).toEqual([.8,32]);expect(loaded.cash).toBe(cash-450);expect(loaded.pots).toHaveLength(1);expect(loaded.investment).toBe(450);expect(errors).toEqual([]);
 await page.screenshot({path:info.outputPath('cozy-save-resume.png')});
});
test('staff picks real ingredients and completes the drink in separate timed actions',async({page})=>{
 await enter(page);
 await page.evaluate(()=>{const w=window as any;w.__ONE_DAY_DEV__.store.getState().dispatch({type:'visitor-seat',tableId:'t1'});w.__ONE_DAY_DEV__.store.getState().dispatch({type:'visitor-order',menuId:'thai-tea'});w.__ONE_DAY_VISITOR__.getState().setRole('ham')});
 await page.getByRole('button',{name:'ชงเครื่องดื่ม',exact:true}).click();
 const moveToWork=async()=>page.evaluate(()=>{const w=window as any,s=w.__ONE_DAY_DEV__.store.getState().game,e=s.employees.find((e:any)=>e.id==='ham');e.position=[...e.task.target];w.__ONE_DAY_DEV__.store.getState().replace({...s});w.__ONE_DAY_PLAYER__.position={x:-e.position[0],z:e.position[1]};w.__ONE_DAY_PLAYER__.cameraRevision++});
 await moveToWork();await page.getByRole('button',{name:'ทำขั้นตอน · หยิบวัตถุดิบ',exact:true}).click();
 await expect.poll(()=>page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.orders[0].stockConsumed)).toBe(true);
 await moveToWork();
 for(const label of ['บด / ตวงชา','สกัด / แช่ชา','เติมน้ำและนมตามสูตร','จัดแก้วพร้อมส่งมอบ']){const button=page.getByRole('button',{name:`ทำขั้นตอน · ${label}`,exact:true});await expect(button).toBeEnabled();await button.click();await expect(button).toHaveCount(0);}
 await expect.poll(()=>page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.orders[0].status)).toBe('ready');
 const result=await page.evaluate(()=>{const s=(window as any).__ONE_DAY_DEV__.store.getState().game;return {status:s.orders[0].status,cogs:s.ledger.filter((t:any)=>t.type==='cogs').length,sales:s.ledger.filter((t:any)=>t.type==='drink-sale').length}});expect(result).toEqual({status:'ready',cogs:1,sales:0});
 await page.evaluate(()=>{const w=window as any;w.__ONE_DAY_VISITOR__.getState().setRole('customer');w.__ONE_DAY_DEV__.advance(30)});
 expect(await page.evaluate(()=>(window as any).__ONE_DAY_DEV__.store.getState().game.orders[0].status)).toBe('completed');
});
test('sound listener follows the camera into the garden and cozy switches persist',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await enter(page);
 await expect.poll(()=>page.evaluate(()=>(window as any).__ONE_DAY_AUDIO__?.running)).toBe(true);
 await page.evaluate(()=>{const p=(window as any).__ONE_DAY_PLAYER__;p.position={x:1.45,z:30};p.cameraRevision++});
 await expect.poll(()=>page.evaluate(()=>(window as any).__ONE_DAY_AUDIO__?.listener?.z)).toBeGreaterThan(29);
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();await page.getByRole('button',{name:'เปิดตั้งค่า',exact:true}).click();
 await page.getByRole('button',{name:'Dreamy Cozy',exact:true}).click();await page.getByLabel('เสียงตามตำแหน่ง 3D',{exact:true}).uncheck();
 await expect.poll(()=>page.evaluate(()=>(window as any).__ONE_DAY_AUDIO__?.spatial)).toBe(false);
 expect(await page.evaluate(()=>JSON.parse(localStorage.getItem('one-day-cozy')??'{}'))).toMatchObject({style:'dreamy',spatial:false});expect(errors).toEqual([]);
});
