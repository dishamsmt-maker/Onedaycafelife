import {chromium,expect} from '@playwright/test';
import {mkdir,writeFile} from 'node:fs/promises';
const url=process.env.GAME_URL;if(!url)throw new Error('GAME_URL required');
const out='test-results/published';await mkdir(out,{recursive:true});
const browser=await chromium.launch({args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{
 const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});
 const errors=[];page.on('pageerror',e=>errors.push(e.message));
 await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());
 await page.goto(url,{waitUntil:'domcontentloaded'});
 await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click({timeout:60000});
 await expect(page.locator('canvas')).toBeVisible();
 await page.getByRole('button',{name:'หยุดเวลา',exact:true}).click();
 await page.getByRole('button',{name:'เปิดเมนูเกม',exact:true}).click();
 await page.getByRole('button',{name:'เปิดออร์เดอร์',exact:true}).click();
 await expect(page.locator('.management-panel')).toBeVisible();
 await page.getByRole('button',{name:'ย่อแผง',exact:true}).click();
 await page.screenshot({path:`${out}/live-mobile.png`});
 if(errors.length)throw new Error(errors.join('\n'));
 await writeFile(`${out}/result.json`,JSON.stringify({url,passed:true,errors,checked:['load','start','WebGL canvas','pause','management panel','return to game']},null,2));
 console.log('Published mobile-browser smoke passed:',url);
}finally{await browser.close()}
