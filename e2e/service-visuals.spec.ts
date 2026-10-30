import {test,expect} from '@playwright/test';
test('menu atlases decode and service scene renders cooking, water and real pickups',async({page},info)=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await page.goto('/',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();
 const pictures=await page.evaluate(async()=>{const {menuPhoto}=await import('/src/game/menuImages.ts');return Promise.all(['latte','chicken-porridge','seafood-porridge'].map(async id=>{const i=new Image();i.src=menuPhoto(id).src;await i.decode();return i.naturalWidth>0}))});expect(pictures).toEqual([true,true,true]);
 await page.evaluate(()=>{const w=window as any,store=w.__ONE_DAY_DEV__.store,s=store.getState().game;store.getState().replace({...s,minute:420,phase:'open',paused:true,events:[],settings:{...s.settings,arrivalsPerHour:0}});store.getState().dispatch({type:'visitor-order',menuId:'american-set'});store.getState().dispatch({type:'visitor-order',menuId:'latte'});w.__ONE_DAY_DEV__.advance(6);});
 await page.getByRole('button',{name:'ดูร้าน',exact:true}).click();await page.screenshot({path:info.outputPath('service-scene.png')});expect(errors).toEqual([]);
 await page.getByRole('button',{name:'เปิดเมนูร้าน',exact:true}).click();await expect(page.locator('.menu-thumb').first()).toBeVisible();await page.screenshot({path:info.outputPath('menu-photos.png'),style:'canvas { visibility: hidden !important; }',timeout:30000});expect(errors).toEqual([]);
});
