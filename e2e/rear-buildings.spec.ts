import {test,expect} from '@playwright/test';
test.use({viewport:{width:1280,height:800}});
test('rear pavilion and service block render with shared business data intact',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));page.on('console',m=>{if(m.type()==='error'&&m.text().includes('Shader Error'))errors.push(m.text())});
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();await page.getByRole('button',{name:'หยุดเวลา',exact:true}).click();
 await expect(page.getByRole('button',{name:'ถ่ายภาพ',exact:true})).toBeEnabled({timeout:60000});
 const before=await page.evaluate(()=>JSON.stringify((window as any).__ONE_DAY_DEV__.store.getState().game));
 await page.getByRole('button',{name:'ถ่ายภาพ',exact:true}).click();await page.getByLabel('ระยะภาพ',{exact:true}).fill('64');
 for(const [name,minute,x,z,yaw] of [['rear-day',750,1.45,26,2.8],['rear-evening',1105,1.45,26,2.8],['service-evening',1105,1.45,39.5,2.7]] as const){
  await page.getByLabel('เวลาแสงภาพถ่าย').fill(String(minute));
  await page.evaluate(({x,z,yaw})=>{const p=(window as any).__ONE_DAY_PLAYER__;p.position={x,z};p.view={yaw,pitch:.02};p.cameraRevision++},{x,z,yaw});
  await page.waitForTimeout(3000);
  await page.screenshot({path:info.outputPath(`${name}.png`),style:'.photo-controls,.touch-controls{visibility:hidden!important}'});
 }
 expect(await page.evaluate(()=>JSON.stringify((window as any).__ONE_DAY_DEV__.store.getState().game))).toBe(before);expect(errors).toEqual([]);
});
