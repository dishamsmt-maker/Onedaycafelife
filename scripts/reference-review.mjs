import {chromium} from '@playwright/test';
import {mkdir} from 'node:fs/promises';
const output='test-results/reference-review';await mkdir(output,{recursive:true});
const browser=await chromium.launch({executablePath:process.env.CHROMIUM_PATH||'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:1280,height:850}});const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());await page.goto('http://127.0.0.1:5173',{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();
 await page.evaluate(()=>{const h=window.__ONE_DAY_DEV__;h.store.getState().replace({...h.store.getState().game,paused:true,weather:'sunny'});});
 for(const [label,minute] of [['day',750],['evening',1150]]){
 await page.evaluate(minute=>{const h=window.__ONE_DAY_DEV__;h.store.getState().replace({...h.store.getState().game,minute});const p=window.__ONE_DAY_PLAYER__;p.position.x=0;p.position.z=-3;p.view.yaw=Math.PI;p.view.pitch=0;},minute);
 await page.waitForTimeout(2200);await page.screenshot({path:`${output}/front-${label}.png`});
 }
 console.log(JSON.stringify({errors,output}));if(errors.length)process.exitCode=1;
}finally{await browser.close()}
