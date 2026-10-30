# โครงสร้างระบบ ONE DAY Café Life

การเปลี่ยนแปลงหลัง baseline: ดู `docs/QR_TAKEAWAY.md` และ `docs/SERVICE_REALISM.md` สำหรับช่องทางสั่ง งานป้าย/รดน้ำ การเรียกพนักงาน และภาพขั้นตอนผลิตที่เพิ่มภายหลัง เนื้อหาด้านล่างเป็นภาพระบบ ณ baseline

อ่านจาก source ที่ baseline `6dc7f2e88b3a38c4a95d348b1af43af73cc8fde5` วันที่ 29 ตุลาคม 2026 เอกสารนี้อธิบาย implementation ที่มีอยู่ ไม่ใช่แผนระบบใหม่

## Runtime และการไหลของข้อมูล

แอปเป็น React 19 + TypeScript + Vite ฝั่ง browser ใช้ React Three Fiber/drei/Three.js แสดง WebGL และ Zustand สอง stores ไม่มี backend แอป ระบบ login หรือ server database ใน source นี้

```text
main.tsx → App.tsx → useGame (store.ts) → act / tick (engine.ts)
                ↘ Scene / HUD / MenuCatalog ← GameState
TouchControls → touchControls → CameraRig → useVisitor → dispatch actions
App → saveGame / loadGame / validateSave → Dexie → browser IndexedDB
App → AmbientAudio → CafeSoundscape → Web Audio
```

`src/main.tsx` mount App ใน React StrictMode; `App.tsx` โหลดเซฟก่อนเริ่ม interval 100 ms แล้วเรียก `step()` ของ store แต่ละครั้งเพิ่ม 0.1 × speed นาทีเกม หาก paused หรือ closed จะไม่เดิน simulation `tick` แบ่งเป็นขั้นไม่เกิน 0.1 นาทีและจำกัดคำขอหนึ่งครั้งไม่เกิน 1,440 นาที

## แผนที่ไฟล์

| ตำแหน่ง | หน้าที่จริง |
| --- | --- |
| `src/game/types.ts` | GameState, actions, order/customer/staff/ledger/report types |
| `src/game/data.ts` | Settings, inventory, 37 public menu items และพนักงานตั้งต้น; servicePeriod/menuAvailable |
| `src/game/engine.ts` | สร้างเกม, seeded RNG, customer demand, งานพนักงาน, production, stock, ledger, reports และ actions |
| `src/game/store.ts` | Store ธุรกิจ: dispatch, step, replace; dev harness สำหรับ integration tests |
| `src/game/world.ts` | ผังร้าน 5 × 10 เมตร, สถานี, 3 โต๊ะ × 4 ที่, obstacles, collision, grid pathfinding |
| `src/game/visitor.ts` | Store บทบาทผู้เล่น, นั่ง/ลุก, สั่ง/กิน/จ่าย, เปลี่ยนพนักงานที่ควบคุม และ feedback |
| `src/game/touchControls.ts` | mutable camera/input state แยกจากธุรกิจและ subscriber notifications |
| `src/game/persistence.ts` | Dexie save/load/delete, validation และปรับเซฟเก่า |
| `src/game/menuImages.ts` | พิกัด crop ของภาพ atlas ใน `public/menu/` |
| `src/components/Scene.tsx` | procedural shop/people/plants/weather, lighting, Canvas และ adaptive resolution |
| `CameraRig.tsx`, `TouchControls.tsx` | first-person/iso camera, desktop input, จอยและ look surface ต่าง pointer |
| `VisitorHud.tsx`, `FirstPersonHands.tsx`, `FoodModels.tsx` | interaction ผู้เล่น, มือและอาหาร/เครื่องดื่ม procedural |
| `MenuCatalog.tsx` และ CSS | รายการเมนู/ภาพ/รายละเอียด แยกบริบทลูกค้าจากการจัดการ |
| `src/App.tsx` | welcome, management panels, clock/speed, save/import/export, CSV และ UI preferences |
| `src/game/audio.ts`, `AmbientAudio.tsx` | เสียงสังเคราะห์ด้วย Web Audio และ lifecycle ตาม interaction/visibility |

## Simulation และธุรกิจ

เริ่มวัน 06:25 แบบหยุดเวลา วงจร phase คือ preparing → open (06:30) → closing (20:30 หรือ action ปิดร้าน) → closed เมื่อเคลียร์งานตาม engine จากนั้น next-day รักษาเงิน/ประวัติและเริ่มวันใหม่ เกมเล่นหลายวันได้ ไม่ใช่แคมเปญ 30 วันที่กำหนดจบ

- อาหารเช้า 06:30–ก่อน 10:30, เครื่องดื่ม 06:30–ก่อน 20:30, ของกินเล่น 17:00–ก่อน 20:30 งานที่รับก่อน cutoff ทำต่อได้
- ลูกค้ามีงบ ความอดทน ความชอบ กลุ่ม ซื้อกลับ/นั่งร้าน ความจำและ referrals; จำกัด active customers 36 คน ที่นั่งรวม 12 ที่
- พนักงาน Ham, Na, Alee, Ken, Pun รับ task เดินและทำงานทีละอย่าง ใช้ collision grid คงที่ ไม่ใช่ระบบหลบคนแบบ crowd simulation; `findPath` ค้นบน grid 0.25 เมตรด้วย queue จำกัดจำนวนรอบ
- Ken รับเวรอัตโนมัติก่อน 14:00 แล้ว Pun รับต่อ; ค่าจ้างแต่ละคนครึ่งหนึ่งของ `serverWage` รวมหนึ่งงบ
- งานผลิตทั่วไปผ่าน waiting → walking → preparing → ready → serving → completed หรือ cancelled; bundle ใช้ root ราคาเดียวและ child production orders ราคา 0 สถานะ root สรุปจากงานลูก
- `consume` ตัดวัตถุดิบเมื่อเริ่มผลิตและบันทึก COGS โดยไม่ลดเงินสดซ้ำ; `stockConsumed` ป้องกันตัดซ้ำ การซื้อเพิ่ม stock ลด cash เป็น purchase ไม่ใช่ COGS
- เงินขายเกิดตอนจ่าย/ออกจากร้านตามกติกา `leave`; รายการที่เสิร์ฟแล้วอาจมีรายได้แม้อีกรายการยกเลิก แต่ชุดที่ไม่ครบไม่สร้างยอดขายชุด ป้องกันรายการบัญชีซ้ำด้วย orderId/type และ paid
- ปิดวันคิด wages/rent/utility และสรุปรายงานครั้งเดียว เมื่อเปิดวันใหม่ตัด stock หมดอายุเป็น spoilage และ auto-restock หากเปิดไว้ สต็อกยังเป็นยอดรวมต่อ ingredient ไม่แยกล็อต FIFO
- `getMetrics` แยก actual profit จาก estimatedProfit ที่เผื่อค่าแรง/ดำเนินงาน ราคาสูตรและค่าใช้จ่ายเป็นสมมติฐานเกม ไม่ใช่ระบบบัญชีธุรกิจจริง

## ผู้เล่น ภาพและเสียง

บทบาทลูกค้าเดินจากหน้าร้านไปเคาน์เตอร์และสวนในฉากต่อเนื่อง สั่งผ่าน engine เดียวกับ NPC นั่งใกล้โต๊ะที่พร้อม กิน/ดื่มรายการเสิร์ฟแล้ว และจ่ายเมื่อรายการคลี่คลาย การเปลี่ยนเป็นพนักงานพัก AI ของคนนั้นและส่ง `control-move` กลับไปยัง simulation; ปล่อยบทบาทแล้ว AI ทำต่อ

โลกที่ render กลับด้าน X จาก simulation: `CameraRig` แปลงเครื่องหมายก่อน collision และ dispatch ตำแหน่ง ห้ามคัดลอกค่าพิกัดระหว่างสองระบบโดยไม่แปลง จอย/การมองเก็บแยก pointer และ reset เมื่อ blur, visibility เปลี่ยน หรือ control ถูกซ่อน

Scene ใช้ procedural geometry และ texture ที่สร้างในโค้ด ภาพเมนูใช้ PNG/WebP atlas ไม่ได้มีโมเดล GLB ที่ซ่อนอยู่ first-person มีหลังคาเต็ม ส่วน iso ตัดหลังคาให้เห็นภายใน มี quality/shadows และ adaptive DPR ประมาณ 0.7–1 (low) หรือถึง 1.5 (high); ไม่ใช่หลักฐานรับรอง FPS บนอุปกรณ์จริง

แสง preset และเสียงสามารถ override ช่วงเวลาได้ แต่ไม่ได้เปลี่ยนนาฬิกาขายเมนู Web Audio เริ่มหลังผู้ใช้เปิดเสียง/interaction และจัด lifecycle ตาม visibility มี fallback หาก browser ไม่รองรับ

## Persistence และขอบเขตเครือข่าย

Dexie database `one-day-cafe-v1`, schema version 1, table `saves`, record `current` เก็บ GameState แบบ structuredClone พร้อม updatedAt ไม่ได้ sync cloud เซฟผูกกับ browser/origin การย้าย URL ไม่ย้ายเซฟอัตโนมัติ ต้อง export/import จาก browser เดิม

`validateSave` ตรวจ version/โครงสร้างบางส่วน/finite values/duplicate order และ transaction IDs/stock จากนั้นปรับ catalog เป็น version 2 รักษาราคาและ enabled ของ catalog v2, เก็บเมนูเก่าที่เลิกขายเพื่อจบ tickets, เติม ingredient ใหม่ด้วย quantity 0, ปรับตำแหน่ง/เส้นทาง และยกเลิก staff control โหลดแล้ว paused ไม่ใช่ full schema validator

App autosave ทุก 30 วินาทีหลังเข้าเกม บันทึกตอนปิดวัน และพยายามบันทึกเมื่อ pagehide/ซ่อนหน้า มี manual save, JSON export/import และ reports CSV; บาง autosave failures ถูก catch เงียบ จึงไม่รับรองว่าปิดแท็บแล้วข้อมูลจะบันทึกสำเร็จเสมอ

ไม่มี API key ที่เกมต้องใช้ CSS ขอ Google Fonts และมี fallback; E2E block font requests `.openai/hosting.json` เก็บ identifiers ของ Sites เดิมและระบุ static directory `dist` ไม่ได้ย้าย domain/access policy/deployment history มา GitHub

## Tooling และหลักฐาน

`npm ci` ใช้ lockfile; `npm test` ใช้ Vitest 3 เฉพาะ `src/tests/**/*.test.ts` (18 engine + 10 periods + 6 visitor); `npm run build` รัน TypeScript แล้ว Vite; `npm run test:e2e` ใช้ Playwright Chromium 4 tests และเริ่ม dev server port 5173; dev-only globals ช่วยขยับ simulation โดยไม่รอเวลาจริง ไม่ควรใช้เป็น production API

`e2e/` เขียนทับ screenshots ที่ tracked บางภาพ; `scripts/` เป็น QA utilities ไม่ใช่ทั้งหมดอยู่ใน npm test บางไฟล์ยังใช้ชื่อปุ่มและพาธเดิม ตรวจแต่ละไฟล์ก่อนใช้ ไม่มี CI workflow, lint script หรือ device test automation ที่ tracked ใน baseline นี้
