import {chromium} from '@playwright/test';
process.env.PW_TEST_SCREENSHOT_NO_FONTS_READY='1';
const browser=await chromium.launch({executablePath:'/usr/bin/chromium',args:['--no-sandbox','--enable-unsafe-swiftshader','--disable-dev-shm-usage']});
try{
const page=await browser.newPage({viewport:{width:390,height:844},hasTouch:true});page.setDefaultTimeout(60000);await page.route(/fonts\.(googleapis|gstatic)\.com/,r=>r.abort());await page.goto('http://localhost:5173',{waitUntil:'domcontentloaded'});await page.getByRole('button',{name:'เดินเข้าร้าน',exact:true}).click();
// Reproducible photo fixture; actual stock, production, service and food geometry.
// Continuous walking is independently exercised by prototype-qa.mjs.
await page.evaluate(()=>{const h=window.__ONE_DAY_DEV__,g=h.store.getState().game;h.store.getState().replace({...g,minute:420,phase:'open',paused:true,events:[],settings:{...g.settings,arrivalsPerHour:0}});h.store.getState().dispatch({type:'visitor-order',menuId:'chicken-porridge'});h.store.getState().dispatch({type:'visitor-order',menuId:'thai-tea'});h.advance(35);const p=window.__ONE_DAY_PLAYER__;p.position={x:.15,z:6.25};p.cameraRevision++;});await page.waitForTimeout(1000);await page.getByRole('button',{name:'นั่งโต๊ะมะลิ',exact:true}).click();await page.evaluate(()=>window.__ONE_DAY_PLAYER__.view.pitch=-.35);await page.waitForTimeout(1000);await page.screenshot({path:'prototype-seating.png'});console.log('Clear seating captured');
await page.getByRole('button',{name:'ดื่มเครื่องดื่ม',exact:true}).click();await page.waitForTimeout(500);await page.screenshot({path:'prototype-drinking.png'});console.log('Drink captured');
}finally{await browser.close();}
