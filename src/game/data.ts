import type { Employee, Ingredient, MenuItem, Settings } from './types';

/** All prices, throughput and demand are editable gameplay assumptions, not quotes. */
export const DEFAULT_SETTINGS: Settings = {
  seed: 240628, arrivalsPerHour: 5.5, patience: 28,
  hamWage: 450, naWage: 450, aleeWage: 350, serverWage: 400,
  monthlyRent: 4500, dailyUtilities: 90, autoRestock: false,
  rainChance: .35, prepMultiplier: 1, setupBudget: 100000, openingCash: 10000,
};

export const INITIAL_INVENTORY: Ingredient[] = [
  { id: 'chicken', name: 'เนื้อไก่', unit: 'กก.', quantity: 4, unitCost: 95, storage: 'fridge', expiresDay: 4, reorder: 1 },
  { id: 'shrimp', name: 'กุ้ง', unit: 'กก.', quantity: 2, unitCost: 210, storage: 'fridge', expiresDay: 3, reorder: .5 },
  { id: 'seabass', name: 'ปลากะพง', unit: 'กก.', quantity: 2, unitCost: 220, storage: 'fridge', expiresDay: 3, reorder: .5 },
  { id: 'egg', name: 'ไข่ไก่', unit: 'ฟอง', quantity: 40, unitCost: 4, storage: 'fridge', expiresDay: 12, reorder: 10 },
  { id: 'milk', name: 'นมสด', unit: 'ลิตร', quantity: 8, unitCost: 48, storage: 'fridge', expiresDay: 5, reorder: 2 },
  { id: 'vegetables', name: 'ผักและต้นหอม', unit: 'กก.', quantity: 2, unitCost: 45, storage: 'fridge', expiresDay: 4, reorder: .4 },
  { id: 'rice', name: 'ข้าวสาร', unit: 'กก.', quantity: 8, unitCost: 35, storage: 'dry', expiresDay: 90, reorder: 2 },
  { id: 'beans', name: 'เมล็ดกาแฟ', unit: 'กก.', quantity: 2, unitCost: 480, storage: 'dry', expiresDay: 31, reorder: .4 },
  { id: 'tea', name: 'ชาไทย', unit: 'กก.', quantity: 1, unitCost: 180, storage: 'dry', expiresDay: 90, reorder: .2 },
  { id: 'green-tea', name: 'ชาเขียว', unit: 'กก.', quantity: .8, unitCost: 240, storage: 'dry', expiresDay: 90, reorder: .2 },
  { id: 'cocoa', name: 'ผงโกโก้', unit: 'กก.', quantity: .8, unitCost: 230, storage: 'dry', expiresDay: 90, reorder: .2 },
  { id: 'bread', name: 'ขนมปัง', unit: 'แผ่น', quantity: 40, unitCost: 3, storage: 'dry', expiresDay: 4, reorder: 10 },
  { id: 'sugar', name: 'น้ำตาล', unit: 'กก.', quantity: 3, unitCost: 30, storage: 'dry', expiresDay: 180, reorder: .5 },
  { id: 'butter', name: 'เนย', unit: 'กก.', quantity: .8, unitCost: 220, storage: 'fridge', expiresDay: 15, reorder: .15 },
  { id: 'water', name: 'น้ำดื่มขวด', unit: 'ขวด', quantity: 48, unitCost: 5, storage: 'dry', expiresDay: 180, reorder: 12 },
  { id:'squid',name:'ปลาหมึก',unit:'กก.',quantity:1.5,unitCost:160,storage:'fridge',expiresDay:3,reorder:.4 },
  { id:'sausage',name:'ไส้กรอกไก่',unit:'ชิ้น',quantity:40,unitCost:6,storage:'fridge',expiresDay:8,reorder:10 },
  { id:'dressing',name:'น้ำสลัด',unit:'กก.',quantity:1.5,unitCost:110,storage:'fridge',expiresDay:12,reorder:.3 },
  { id:'cheese',name:'ชีส',unit:'กก.',quantity:1.5,unitCost:220,storage:'fridge',expiresDay:10,reorder:.3 },
  { id:'fries',name:'มันฝรั่งแช่แข็ง',unit:'กก.',quantity:4,unitCost:85,storage:'fridge',expiresDay:30,reorder:1 },
  { id:'nuggets',name:'นักเก็ตไก่',unit:'ชิ้น',quantity:80,unitCost:3,storage:'fridge',expiresDay:30,reorder:20 },
  { id:'oil',name:'น้ำมันพืช',unit:'ลิตร',quantity:4,unitCost:48,storage:'dry',expiresDay:90,reorder:1 },
  { id:'chocolate',name:'ซอสช็อกโกแลต',unit:'กก.',quantity:1,unitCost:160,storage:'dry',expiresDay:60,reorder:.2 },
  { id:'caramel',name:'ซอสคาราเมล',unit:'กก.',quantity:1,unitCost:170,storage:'dry',expiresDay:60,reorder:.2 },
  { id:'lime',name:'น้ำมะนาว',unit:'ลิตร',quantity:2,unitCost:80,storage:'fridge',expiresDay:7,reorder:.5 },
  { id:'honey',name:'น้ำผึ้ง',unit:'กก.',quantity:1,unitCost:180,storage:'dry',expiresDay:90,reorder:.2 },
  { id:'redSyrup',name:'น้ำแดง',unit:'ลิตร',quantity:1.5,unitCost:65,storage:'dry',expiresDay:90,reorder:.3 },
  { id:'peachSyrup',name:'ไซรัปพีช',unit:'ลิตร',quantity:1.5,unitCost:140,storage:'dry',expiresDay:90,reorder:.3 },
  { id:'soda',name:'โซดา',unit:'ขวด',quantity:48,unitCost:5,storage:'dry',expiresDay:180,reorder:12 },
];
export function servicePeriod(minute:number):'breakfast'|'day'|'evening'|'closed' {return minute<390||minute>=1230?'closed':minute<630?'breakfast':minute<1020?'day':'evening';}
export function menuAvailable(item:MenuItem,minute:number){const period=servicePeriod(minute);return item.enabled&&!item.hidden&&period!=='closed'&&(item.period==='all-day'||(item.period??(item.evening?'evening':item.kind==='drink'?'all-day':'breakfast'))===period);}
const food = (id:string,name:string,en:string,price:number,duration:number,recipe:Record<string,number>,visual:MenuItem['visual']='porridge',period:MenuItem['period']='breakfast'):MenuItem=>({id,name,en,price,duration,recipe,period,visual,kind:'food',enabled:true});
const drink = (id:string,name:string,en:string,price:number,duration:number,recipe:Record<string,number>,visual:MenuItem['visual']='coffee'):MenuItem=>({id,name,en,price,duration,recipe,period:'all-day',visual,kind:'drink',enabled:true});
const bundle=(id:string,name:string,en:string,price:number,components:{menuId:string;quantity:number}[],period:MenuItem['period']='breakfast',visual:MenuItem['visual']='eggs'):MenuItem=>({id,name,en,price,duration:0,recipe:{},components,period,visual,kind:'food',enabled:true});
export const INITIAL_MENU:MenuItem[]=[
 food('chicken-porridge','ข้าวต้มไก่','Chicken rice porridge',45,4,{rice:.075,chicken:.09,vegetables:.015}),
 food('chicken-egg','ข้าวต้มไก่ใส่ไข่','Chicken & egg porridge',55,4.5,{rice:.075,chicken:.09,egg:1,vegetables:.015}),
 food('shrimp-porridge','ข้าวต้มกุ้ง','Shrimp rice porridge',65,4.8,{rice:.075,shrimp:.08,vegetables:.015}),
 food('fish-porridge','ข้าวต้มปลากะพง','Sea bass rice porridge',70,4.8,{rice:.075,seabass:.08,vegetables:.015}),
 food('seafood-porridge','ข้าวต้มทะเล','Seafood rice porridge',85,5.2,{rice:.075,shrimp:.04,seabass:.04,squid:.04,vegetables:.015}),
 bundle('morning-set','Morning Set','Soft-boiled eggs & toast',59,[{menuId:'boiled-egg',quantity:2},{menuId:'breakfast-toast',quantity:1}]),
 bundle('american-set','American Set','Eggs, chicken sausage & toast',69,[{menuId:'american-plate',quantity:1}]),
 bundle('one-day-set','ONE DAY Set','Chicken porridge & Thai tea',75,[{menuId:'chicken-porridge',quantity:1},{menuId:'thai-tea',quantity:1}],'breakfast','porridge'),
 bundle('special-set','Special Set','Chicken egg porridge & latte',89,[{menuId:'chicken-egg',quantity:1},{menuId:'latte',quantity:1}],'breakfast','porridge'),
 food('egg-salad','สลัดไข่ต้ม','Boiled egg salad',59,3,{egg:2,vegetables:.12,dressing:.025},'salad'),
 food('chicken-egg-salad','สลัดไก่และไข่','Chicken & egg salad',79,4,{chicken:.09,egg:1,vegetables:.12,dressing:.025},'salad'),
 drink('latte','ลาเต้เย็น','Iced latte',45,2.5,{beans:.018,milk:.16,sugar:.01}),
 drink('americano','อเมริกาโน','Americano',40,2,{beans:.018}),
 drink('espresso','เอสเพรสโซเย็นแบบไทย','Thai iced espresso',45,2,{beans:.018,milk:.09,sugar:.015}),
 drink('caramel-macchiato','คาราเมลมัคคิอาโต้','Caramel macchiato',45,2.7,{beans:.018,milk:.16,caramel:.02}),
 drink('mocha','มอคค่า','Mocha',50,2.8,{beans:.018,milk:.14,cocoa:.012,sugar:.015}),
 drink('signature','ONE DAY Signature','ONE DAY Signature',55,3,{beans:.018,milk:.17,caramel:.025,sugar:.01}),
 drink('thai-tea','ชาไทยเย็น','Iced Thai tea',35,2,{tea:.012,milk:.1,sugar:.02},'tea'),
 drink('green-tea','ชาเขียวเย็น','Iced green tea',35,2,{'green-tea':.012,milk:.1,sugar:.02},'tea'),
 drink('hot-tea','ชาร้อน','Hot tea',35,1.5,{tea:.008},'tea'),
 drink('lemon-tea','ชามะนาว','Lemon tea',35,2,{tea:.01,lime:.03,sugar:.025},'tea'),
 drink('cocoa','โกโก้','Cocoa',40,2.3,{cocoa:.02,milk:.15,sugar:.02},'milk'),
 drink('fresh-milk','นมสดเย็น','Fresh milk',35,1.5,{milk:.22,sugar:.015},'milk'),
 drink('pink-milk','นมชมพู','Pink milk',35,1.8,{milk:.2,redSyrup:.025},'milk'),
 drink('lime-soda','มะนาวโซดา','Lime soda',35,1.5,{lime:.035,soda:1,sugar:.025},'soda'),
 drink('honey-lemon','น้ำผึ้งมะนาว','Honey lemon',40,1.8,{lime:.035,honey:.025},'soda'),
 drink('peach-soda','พีชโซดา','Peach soda',40,1.5,{peachSyrup:.03,soda:1},'soda'),
 food('toast','ขนมปังปิ้งเนยนม','Butter milk toast',35,2.5,{bread:2,butter:.015,milk:.025,sugar:.01},'toast','evening'),
 food('chocolate-toast','ขนมปังปิ้งช็อกโกแลต','Chocolate toast',40,2.7,{bread:2,butter:.015,chocolate:.025},'toast','evening'),
 food('chicken-cheese-toast','ขนมปังปิ้งหน้าไก่ชีส','Chicken cheese toast',45,3.5,{bread:2,butter:.01,chicken:.04,cheese:.025},'toast','evening'),
 food('fries','เฟรนช์ฟรายส์','French fries',39,4,{fries:.15,oil:.025},'fries','evening'),
 food('nuggets','นักเก็ตไก่ 5 ชิ้น','Chicken nuggets · 5 pieces',45,4,{nuggets:5,oil:.02},'snack','evening'),
 food('grilled-sausage','ไส้กรอกไก่ย่าง','Grilled chicken sausage',45,3.5,{sausage:2},'snack','evening'),
 food('cheese-fries','ชีสฟรายส์','Cheese fries',49,4.5,{fries:.15,oil:.025,cheese:.04},'fries','evening'),
 bundle('snack-box','ONE DAY Snack Box','Fries, nuggets & chicken sausage',89,[{menuId:'snack-box-plate',quantity:1}],'evening','snack'),
 bundle('tea-toast-set','ชุดชาไทยและขนมปัง','Thai tea & butter milk toast',65,[{menuId:'toast',quantity:1},{menuId:'thai-tea',quantity:1}],'evening','toast'),
 bundle('tea-break-combo','Tea Break Combo','Thai tea & fries',69,[{menuId:'fries',quantity:1},{menuId:'thai-tea',quantity:1}],'evening','fries'),
 // Production-only definitions never appear on the customer menu.
 {...food('boiled-egg','ไข่ลวก','Soft-boiled egg',15,2,{egg:1},'eggs'),hidden:true,enabled:false},
 {...food('breakfast-toast','ขนมปังมื้อเช้า','Breakfast toast',0,2,{bread:2,butter:.01},'toast'),hidden:true,enabled:false},
 {...food('american-plate','ไข่ดาว ไส้กรอกไก่ ขนมปัง','American breakfast plate',0,4,{egg:2,sausage:1,bread:2,butter:.01},'eggs'),hidden:true,enabled:false},
 {...food('snack-box-plate','ชุดของกินเล่น','Snack box plate',0,5,{fries:.1,nuggets:3,sausage:1,oil:.025},'snack','evening'),hidden:true,enabled:false},
 {...drink('water','น้ำดื่ม','Bottled water',10,.3,{water:1},'soda'),hidden:true,enabled:false},
];

export const INITIAL_EMPLOYEES: Employee[] = [
  { id: 'ham', name: 'แฮม · Ham', gender: 'male', role: 'ผู้จัดการ / บาริสต้า', position: [1.4, 2.0], task: null, hours: 0, tasksDone: 0, available: true },
  { id: 'ken', name: 'เคน · Ken', gender: 'male', role: 'พนักงานเสิร์ฟ · กะเช้า', position: [-.4, 3.5], task: null, hours: 0, tasksDone: 0, available: true },
  { id: 'na', name: 'นา · Na', gender: 'female', role: 'แม่ครัว / บาริสต้า', position: [1.13, 4.5], task: null, hours: 0, tasksDone: 0, available: true },
  { id: 'alee', name: 'อาลี · Alee', gender: 'male', role: 'สวนและดูแลร้าน / บาริสต้า', position: [-.1, 8.8], task: null, hours: 0, tasksDone: 0, available: true },
  { id: 'pun', name: 'ปัน · Pun', gender: 'male', role: 'พนักงานเสิร์ฟ · กะบ่าย', position: [1.0, 9.3], task: null, hours: 0, tasksDone: 0, available: false },
];

export const TASK_LABELS: Record<string, string> = {
  cook: 'ทำอาหาร', brew: 'เตรียมเครื่องดื่ม', serve: 'บริการลูกค้า', clean: 'เก็บและเช็ดโต๊ะ',
  inspect: 'ตรวจสวนและความสะอาด', garden: 'ดูแลสวน', rest: 'พักนอกเวร', manage: 'ดูแลหน้าร้าน',
};
