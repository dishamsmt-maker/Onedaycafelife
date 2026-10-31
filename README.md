# ONE DAY · ร้านเล็ก เรื่องราวทุกวัน

เกมบริหารร้านอาหารเช้า กาแฟ และของกินเล่นในหาดใหญ่ อิงร้านตัวอย่าง 5 × 10 เมตร เล่นต่อเนื่องวันต่อวัน รุ่นนี้ออกแบบให้เล่นบนโทรศัพท์ด้วยจอยสัมผัสและลากมอง มีแถบจัดการด้านล่างและแผงเลื่อนสำหรับเมนู สต็อก ทีมงาน และบัญชี

## เปิดเกม

```bash
cd /workspace/sites/one-day
npm ci
npm run dev
```

เปิด URL ที่ Vite แสดง ต้องใช้เบราว์เซอร์ที่รองรับ WebGL 2 และ IndexedDB; แนะนำ Safari/Chrome รุ่นปัจจุบัน และ Node.js 22.12+ สำหรับพัฒนา

```bash
npm run build       # TypeScript + production build
npm test            # กติกาจำลอง 28 กรณี
npm run test:e2e     # Playwright; ใช้ CHROMIUM_PATH กำหนดที่อยู่ Chromium ถ้าจำเป็น
npm run preview     # ดู dist/ ในเครื่อง
```

## เล่นบนโทรศัพท์

- กดเริ่มเช้าวันแรก / กลับมาที่ร้านของเรา เพื่อเริ่มเวลาและเสียงบรรยากาศ
- มุมบริหาร: ลากหมุน บีบนิ้วซูม แตะพนักงาน โต๊ะ หรือสถานีเพื่อดูข้อมูล
- กดเดินชมร้าน: ลากจอยซ้ายเพื่อเดิน และใช้อีกนิ้วลากฝั่งขวาเพื่อมอง ทำพร้อมกันได้
- เข้าใกล้ตู้เย็น บาร์ ครัว หรือสวน แล้วกดปุ่มสำรวจ ปุ่มใช้ได้เฉพาะเมื่ออยู่ใกล้
- ปล่อยนิ้ว หยุดสัมผัส สลับกล้อง หรือเปิดแผงจัดการจะล้างคำสั่งเดิน ไม่เดินค้าง
- บนคอมพิวเตอร์ใช้ WASD และลากเมาส์มอง หรือ E สำรวจได้ด้วย ไม่ต้องจับเมาส์ด้วย Pointer Lock
- หยุด/เดินเวลาและความเร็ว 1×, 2×, 5× อยู่ใต้ฉาก โดย 1× ประมาณหนึ่งนาทีเกมต่อวินาทีจริง
- แถบล่างเปิดหน้าร้าน คลัง ทีมงาน บัญชี และเมนู; เลือกแผงอื่นจากรายการด้านบนของแผง หรือปุ่มตั้งค่าด้านบน
- เลือกแสงตามเวลา/เช้า/กลางวัน/ค่ำได้ ปุ่มนี้ชมบรรยากาศและเปลี่ยนเพลงตามช่วงที่เลือก **เวลาขายเมนูยังยึดนาฬิกาเกม**

## กะและเมนูตามภาพ

| ช่วง | เวลารับออร์เดอร์ | รายการ |
| --- | --- | --- |
| อาหารเช้า | 06:30–10:30 | ข้าวต้ม 5 แบบ ชุดอาหาร 4 ชุด สลัด 2 แบบ |
| เครื่องดื่ม | 06:30–20:30 | กาแฟ ชา นม และเครื่องดื่มสดชื่น 16 รายการ |
| ของกินเล่น | 17:00–20:30 | ขนมปัง ของทอด ไส้กรอกไก่ และชุดรวม 10 รายการ |

เริ่มวัน 06:25 น. เมื่อ 06:30 จะเปิดบริการ กลางวันขายเครื่องดื่มอย่างเดียว ไม่มีอาหารเช้าใหม่หลัง10:30 แต่รายการที่รับแล้วจะทำต่อ ช่วงเย็นเปิดของกินเล่นทั้งหมด ปิดรับคนใหม่20:30 และเคลียร์งานก่อนสรุปวัน

เมนูภาพแตะดูรายละเอียด สูตร ราคา และเวลาขายได้ ปุ่มแก้ไขเมนูเปิดช่องปรับราคาและพักขาย ภาพอาหาร/เครื่องดื่มเป็นภาพประกอบต้นฉบับที่สร้างสำหรับเกม บางชุดและของทอดใช้ภาพตัวแทนร่วมกัน ไม่ใช่ภาพรับรองอาหารจริงของร้าน สูตร ONE DAY Signature และส่วนผสมที่โปสเตอร์ไม่ระบุเป็นสมมติฐานเพื่อเล่น

ชุดอาหารเป็นบิลแม่หนึ่งราคาและงานผลิตย่อย เช่น ONE DAY Set ส่งข้าวต้มให้ครัวและชาไทยให้บาร์ คิดเงินราคาชุดครั้งเดียว ตัดวัตถุดิบจากงานย่อยครั้งเดียว หากชุดไม่ครบและถูกยกเลิกจะไม่สร้างยอดขายชุดปลอม แต่ต้นทุนที่ใช้แล้วคงอยู่ ระดับความหวานของลูกค้าปรับน้ำตาลที่เติมจริง

## งานพนักงานและลูกค้า

| คน | งาน |
| --- | --- |
| Ham — ชาย | ผู้จัดการ/บาริสต้า อยู่หลังเคาน์เตอร์ขณะประจำบาร์ |
| Na — หญิง | ครัว/บาริสต้าสำรอง เป็นพนักงานหญิงเพียงคนเดียว |
| Alee — ชาย | ต้นไม้ ทางเดิน ความสะอาด และช่วยบาร์ |
| Ken — ชาย | รับออร์เดอร์ เสิร์ฟ เก็บโต๊ะ กะเช้า |
| Pun — ชาย | รับช่วงกะบริการ เดินออกจากจุดพักก่อนทำงาน |

ทีมใส่เสื้อครีม ผ้ากันเปื้อนเขียวเข้ม ONE DAY และกางเกงเข้ม ลูกค้าแต่งตัวต่างกัน พนักงานเดินหลบสิ่งกีดขวางคงที่ไปสถานี ทำงานทีละอย่าง และจองสถานีผลิต บาร์/ครัวมีเวลาผลิตจริง ไม่ได้สร้างสินค้าเมื่อกดปุ่ม

Ken/Pun แชร์งบเสิร์ฟหนึ่งตำแหน่ง แบ่งคนละ50% ตัวอย่างงบ400บาทจ่ายคนละ200บาท รวม400บาท เป็นกติกาจำลองที่แก้ได้

ลูกค้ามีเหตุผลที่มา งบ ความอดทน และความชอบ มีทั้งนั่งสวนและซื้อกลับ ชื่อเสียง อากาศ เวลา และการบอกต่อมีผลต่อการมา ร้านมีโต๊ะ3ชุด12ที่ และจำกัดจำนวนคนรอ ปุ่มเรียก12/20คนในแผงเรื่องราวใช้ทดลองคิวจริง

ความทรงจำรายบุคคลเก็บจำนวนครั้ง ความผูกพัน และคนที่แนะนำมา รีวิวมาจากเวลารอและบริการ ลูกค้านั่งนานบางคนเดินไปห้องน้ำทีละคนแล้วกลับที่เดิม ของบนโต๊ะและแก้วมาจากรายการที่เสิร์ฟจริง คนซื้อกลับถือถุงหลังรับของ

**นก กรง และระบบดูแลนกถูกนำออกแล้ว** Alee ตรวจสวนและความสะอาดแทน

## บรรยากาศและเสียง

ร้านมีผนังสีครีม ไม้ หลังคาชาร์โคล เคาน์เตอร์และช่องบริการตามภาพ ทางเดินหิน/กรวด พื้นเชื่อมถนน ขอบทาง และต้นไม้สองด้าน ไฟป้าย ไฟแขวน ไฟทางเดิน และไฟสวนเด่นช่วงค่ำ มุมบริหารตัดหลังคาบางส่วนเพื่อเห็นงาน มุมเดินชมแสดงหลังคาครบ

แสงอาทิตย์ ฟ้า เงา ไฟร้าน และฝนเปลี่ยนในฉากสามมิติจริง โหมดชมแสงไม่เปลี่ยนเงิน ออร์เดอร์ สต็อก หรือเวลา พืชได้ความชื้นจากฝน Aleeไม่รดน้ำซ้ำเมื่อไม่จำเป็น

เพลงบรรเลงต้นฉบับสังเคราะห์ด้วย WebAudio มีทำนอง/การเรียบเรียงต่างกันสามช่วงและค่อยๆเปลี่ยน เสียงชง เสิร์ฟ เข้าร้าน และฝนเกิดตามกิจกรรมและจำกัดความถี่ ปรับเพลงและเสียงกิจกรรมแยกกันได้ เสียงเริ่มหลังผู้เล่นแตะ; ถ้าSafariยังไม่ยอมเล่นให้แตะปุ่มเปิดเสียงอีกครั้ง ซ่อนแท็บแล้วเสียงหยุด

## เงินและสมมติฐาน

- งบจัดร้านเพิ่มเติม **100,000บาท** เป็นบริบทการลงทุน แยกจากเงินสดร้านเริ่มต้นตัวอย่าง **10,000บาท** ไม่บวกเป็นรายได้หรือเงินสดใช้ได้ซ้ำ
- ขายเมื่อลูกค้าชำระบิล รายการขายมีIDกันซ้ำ
- ซื้อวัตถุดิบ: ลดเงินสด เพิ่มคลัง ไม่ใช่ต้นทุนขายทันที
- เริ่มผลิต: ลดของจริงและบันทึกต้นทุนครั้งเดียว ไม่ให้สต็อกติดลบ
- ของหมดอายุ: ลดคลังและบันทึกของเสีย ไม่หักเงินสดซ้ำ
- กำไรขั้นต้น = ยอดขาย − ต้นทุนผลิต; กำไรดำเนินงาน = ยอดขาย − ต้นทุนผลิต − ของเสีย − ค่าจ้าง − ค่าเช่า/ดำเนินงาน
- ระหว่างวัน HUD กันค่าแรงและดำเนินงานเต็มวันไว้ก่อน; ปิดวันจึงลงรายการค่าใช้จ่ายจริง
- รายงานรายวันและCSVมาจากledgerจริง เงินปิดวันกระทบยอดเงินเปิดวันกับcashDelta

ราคา สูตร ค่าแรง ค่าเช่า4,500บาท/เดือน ค่าน้ำไฟ และความต้องการเป็นตัวอย่างที่แก้ได้ ไม่ใช่ราคาผู้ขายหรือการรับรองผลธุรกิจจริง ข้อมูลตั้งต้นอยู่ `src/game/data.ts` ขนาดร้าน/สถานีอยู่ `src/game/world.ts`

## บันทึกและอัปเดต

Dexie/IndexedDB `one-day-cafe-v1` เก็บข้อมูลบนเบราว์เซอร์เครื่องนั้น บันทึกทุก30วินาที ตอนซ่อนหน้า และเมื่อปิดวัน มีบันทึก/โหลดและส่งออก/นำเข้าJSONในตั้งค่า เก็บไฟล์สำรองก่อนล้างข้อมูลเว็บ

เซฟเก่าจะเปลี่ยนเป็นแค็ตตาล็อกใหม่โดยรักษาเงิน ledger สต็อกเดิม และออร์เดอร์ค้าง เมนูเก่าที่เลิกขายยังใช้ปิดงานที่รับไว้ได้ วัตถุดิบใหม่ที่ไม่เคยมีในเซฟเริ่มที่0และต้องซื้อ ไม่แจกสต็อกเพิ่มเมื่ออัปเดต ข้อมูลดูแลนกถูกตัดออก เซฟโหลดด้วยสถานะหยุดเวลา

ปิดร้านแล้วกดเปิดวันถัดไปและเดินเวลาต่อได้เรื่อยๆ ไม่มีโหมด30วันและไม่มีรีเซ็ตอัตโนมัติ หากขอปิดร้านขณะหยุดเวลา ต้องเดินเวลาเพื่อให้ทีมเคลียร์งาน

## ตรวจงานและข้อจำกัด

Vitest28กรณีผ่าน: วงจรขาย สต็อก บาริสต้า เวรและเงินเดือนร่วม ลูกค้าพร้อมกัน อากาศ บันทึก บัญชีปิดวัน seeded determinism ความจำลูกค้า เมนูตรงเวลา bundleจริง ห้องน้ำ และเซฟเก่า Playwright ผ่าน4กรณี (รวมการรันซ้ำกรณีโหลดบันทึกหลังเพิ่มเวลารอสำหรับsoftware rendering): ปุ่มจัดการ/สต็อก/ราคา, กล้องและโหลดบันทึกช่วงลูกค้าแน่น, หน้าจอมือถือ และจอยสัมผัสสองนิ้ว/แสง/เมนู/เพลงผ่าน Chromium emulation

ข้อจำกัด: โมเดลคนและการเคลื่อนไหวยังเป็น procedural ไม่ใช่งานสแกนคน/โมชั่นแคปเจอร์; ยังไม่หลบคนต่อคนแบบฝูงชน; เมนูบางรายการใช้ภาพตัวแทนร่วม; สต็อกยังไม่แยกล็อตFIFO; ห้องน้ำแสดงบริบทประตูและการเดินไปใช้ ไม่ทำรายละเอียดภายใน; ไม่ได้ตรวจบนiPhoneจริงทุกเจเนอเรชัน ความเหมือนภาพต้นแบบเป็นเป้าหมายด้านองค์ประกอบ ไม่รับรองด้วยเปอร์เซ็นต์

พัฒนาต่อ: ทดสอบบนเครื่องโทรศัพท์จริงและปรับGPU, เพิ่มการหลบคน/โต๊ะรายกลุ่ม, ปรับคน/ท่าทางละเอียด, แยกล็อตวัตถุดิบ และภาพเฉพาะทุกรายการ

## October 2026 — playable first-person prototype

This update keeps the existing React/Three.js simulation and save database. It does **not** switch to 2D or replace the restaurant with photographs. The three prototype locations are connected by a continuous walkable scene:

- **A, entrance:** start outside the storefront, walk from the roadside forecourt into the public aisle. The compact operating footprint remains 5 × 10 m.
- **B, counter:** approach the side of the coffee counter, open the menu and order. Orders reserve an available garden table and enter the existing cook/bar/service queues. If no table is free, pickup is at the counter.
- **C, seating:** approach a garden table and use the contextual sit action. Eye height changes from 1.62 m to 1.12 m; looking still works. Prepared food appears on the assigned table. Eat/drink buttons consume served items and animate camera-relative hands. Pay records completed sales once; standing restores the previous walkable position.

The left thumbstick and right look surface accept separate pointers. WASD and mouse drag remain available on desktop. The customer cannot enter the bar, kitchen or Pun's rest area. The character selector allows control of Ham, Na, Alee, Ken or Pun; the controlled employee's AI pauses and resumes when control is released. Selecting a different character changes perspective to that character; this is not how the three customer locations are connected.

The game now opens with a full-screen scene and small clock/pause/menu controls. **ดูแลร้าน** opens management on demand. **ตั้งค่า → ภาพและบรรยากาศ** contains the light presets. Menu photos have unique crops for all 37 public menu entries. The nine new food photos are illustrative menu art, not proof of 3D rendering. Customer menu details hide business recipe/cost explanations; the management catalog retains editing.

Scene updates include a complete first-person roof and wood soffit, curated perimeter planting instead of dense giant leaves, garden fence, continuous foreground, rounded character silhouettes, ceramic food geometry, rice/soup/toast texture details, ice/foam layers, explicit food consumption and adaptive pixel density. Isometric mode deliberately cuts away the roof. Rain, time, finances and saves continue using the previous simulation.

### Verification and limits

Run `npm test` for 34 simulation tests, including six visitor-specific tests. Run `npm run test:e2e` for browser/touch checks. `node scripts/prototype-qa.mjs` walks the real camera from A to B to C, orders chicken porridge and Thai tea, waits for service, consumes a drink and checks the ฿80 payment; it writes `prototype-entrance.png`, `prototype-counter.png`, and `prototype-seating.png` from the actual WebGL application. It requires the development server on port 5173 and Chromium.

**The models remain authored procedural geometry, not final architectural visualization assets.** Characters are more rounded but are not scanned or rigged realistic humans. Surface color/bump maps are procedural; there is no production baked AO, KTX2 texture pipeline, complete LOD asset hierarchy or physical reflection probe system yet. No real iPhone was available here, so 30 FPS, memory/thermal behavior and Safari audio/touch behavior are not certified. Browser viewport and multi-touch emulation are useful checks but not substitutes for device testing.

The reference photo's cream building, dark canopy, wood counters, cream umbrellas, gravel/pavers and warm practical lights guide this prototype. Its photorealistic vegetation, material richness and human detail are not yet matched. Table coordinates retain the playable existing layout; measured clearances and the final cafe interior plan require a proper next pass. The physical site's full measured plan is not supplied.

Next priorities: test on the user's iPhone; review A/B/C captures; refine chair/aisle clearances; replace key close-up character and plant assets with optimized authored models; bake lighting/AO and validate frame time/memory before increasing scene complexity.

The visitor test also checks that, after delivery, employees remain clear of the seated customer: servers approach the table edge and return to the service point. Menu atlas downloads use WebP (about 985 KB total); original PNG sources remain available for asset editing. Browser QA blocks external font requests to avoid the test runner waiting on Google Fonts; the Thai/system fallback remains usable.


## 2026-11-01 — Touch focus safety (proposed, not deployed)

- **Before:** Touch movement/look state could remain held if the browser lost focus or the tab was hidden without a normal pointer-up event.
- **After:** `src/game/touchControls.ts` clears movement, look and interaction on window `blur` and on `visibilitychange` when the document is hidden. The existing `reset()` method handles both cases and notifies subscribers.
- **Scope:** Browser camera controls only; no changes to customer orders, ledger, staff, inventory, save data or 3D scene.
- **Regression coverage:** `src/tests/touchControls.test.ts` adds two Vitest cases for focus loss and backgrounding.
- **Verify locally:** Run `npm ci && npm test && npm run build`; then on mobile hold the virtual joystick, switch apps/tabs, return and confirm the character does not continue moving.
- **Limitations:** GitHub Actions pull-request validation completed successfully for commit `47458e9`: **48 Vitest tests passed (7 files)** and the TypeScript/Vite production build succeeded ([CI run](https://github.com/dishamsmt-maker/Onedaycafelife/actions/runs/41245825323)). Real-device Safari/Chrome behavior and the live Sites deployment are not yet verified. This change is on a feature branch and requires PR approval before merging/deploying.
