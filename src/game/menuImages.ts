/** Original photographic menu illustrations, not screenshots of the 3D game.
 * Every public dish has its own image; only the snack box uses the mixed platter.
 */
const food:Record<string,number>={'chicken-porridge':0,'chicken-egg':1,'shrimp-porridge':2,'fish-porridge':3,'morning-set':4,'american-set':5,'egg-salad':6,'chicken-egg-salad':7,'toast':8,'chocolate-toast':9,'chicken-cheese-toast':10,'snack-box':11};
const individualFood:Record<string,number>={'seafood-porridge':0,'one-day-set':1,'special-set':2,'fries':3,'nuggets':4,'grilled-sausage':5,'cheese-fries':6,'tea-toast-set':7,'tea-break-combo':8};
const drinks:Record<string,number>={'latte':0,'americano':1,'espresso':2,'caramel-macchiato':3,'mocha':4,'signature':5,'thai-tea':6,'green-tea':7,'hot-tea':8,'lemon-tea':9,'cocoa':10,'fresh-milk':11,'pink-milk':12,'lime-soda':13,'honey-lemon':14,'peach-soda':15};
export function menuPhoto(id:string):{src:string;position:string;size:string}{
 if(id in individualFood){
   const i=individualFood[id],crop=.303,cx=(i%3+.5)/3;
   // The source uses 3 equal-width columns; the last photographic row is taller.
   const cy=[.160,.479,.819][Math.floor(i/3)];
   return{src:'/menu/individual-food-atlas.webp',position:`${(cx-crop/2)/(1-crop)*100}% ${(cy-crop/2)/(1-crop)*100}%`,size:`${100/crop}% ${100/crop}%`};
 }
 const drink=id in drinks;const i=(drink?drinks[id]:food[id])??0;
 // Generated sheet rows have small height differences; crop inside each cell.
 const crop=drink?.225:.215, cx=(i%4+.5)/4;
 const centers=drink?[.122,.370,.617,.869]:[.115,.347,.582,.850];
 const cy=centers[Math.floor(i/4)];
 return{src:drink?'/menu/drinks-atlas.webp':'/menu/food-atlas.webp',position:`${(cx-crop/2)/(1-crop)*100}% ${(cy-crop/2)/(1-crop)*100}%`,size:`${100/crop}% ${100/crop}%`};
}
