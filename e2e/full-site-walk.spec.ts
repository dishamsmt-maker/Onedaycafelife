import {test,expect} from '@playwright/test';
test('walks from the road entrance to the back of the fifty-metre garden',async({page},info)=>{
 test.setTimeout(240000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());await page.goto('/',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();await page.getByRole('button',{name:'หยุดเวลา',exact:true}).click();
 await page.evaluate(()=>{const p=(window as any).__ONE_DAY_PLAYER__;p.position.x=1.45;p.position.z=-.4;p.cameraRevision++;p.view.yaw=Math.PI;p.view.pitch=0;p.move.y=1;});
 try {await expect.poll(()=>page.evaluate(()=>(window as any).__ONE_DAY_PLAYER__.position.z),{timeout:200000,intervals:[1000]}).toBeGreaterThan(49);} finally {await page.evaluate(()=>{(window as any).__ONE_DAY_PLAYER__.move.y=0});}
 await page.evaluate(()=>{(window as any).__ONE_DAY_PLAYER__.view.yaw=0});
 await page.waitForTimeout(1000);expect(errors).toEqual([]);await page.screenshot({path:info.outputPath('rear-garden.png'),timeout:60000});
});
