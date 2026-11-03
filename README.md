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


## 2026-11-01 — Café OS MVP: three-table QR contract (proposal)

**Scope:** This is a standalone, pure TypeScript input-validation module for the **real café MVP**, not a game feature and **not** a deployed ordering system. It never reads or writes the game state, browser saves, customer records, payments or stock.

- `src/cafe-os/tableQr.ts`: strict table IDs `T01`, `T02`, `T03`; `/order?table=T01` style relative QR paths; rejects duplicate/unknown query keys and invalid tables.
- `src/tests/cafeTableQr.test.ts`: valid QR round trips and invalid/ambiguous input cases.
- **Implementation commit:** `354f20daa3169104e1ee49eeb5a7557b29725dd9`; **test commit:** `0706473288bff516d92b712dadb4a817cb0a528c`.
- **Verification command:** `npm ci && npm test && npm run build`. GitHub PR checks, if available, are the evidence for actual pass/fail; this README section does not claim a test was run locally.
- **Limits:** QR codes are not secrets and do not prove a customer is physically seated. Real POS/KDS, menu pricing, employee permissions, server-side table validation, order deduplication, and payment reconciliation are **not implemented** by this change. Do not accept or charge real orders with this module alone.
- **Game:** no gameplay/UI changes, no merge, and no public deployment in this proposal.


## 2026-11-01 — Café OS TASK-016: idempotent draft-order inbox (proposed PR)

**Purpose:** Separate, server-oriented order acceptance contract for the **real café**. This is a **pure in-memory prototype**, not a live POS, server endpoint, KDS, database, inventory, payment processor, or game update. It imports only `src/cafe-os/tableQr.ts` from TASK-015; it NEVER reads `src/game/` or the game's IndexedDB saves.

- `src/cafe-os/orderIntake.ts`: `createCafeDraftInbox()` accepts one exact-shaped request with a client-generated `requestId` (16–128 ASCII letters/digits/`_`/`-`), table `T01`–`T03` and 1–20 `{menuId,quantity}` lines. Menu identifiers are *syntactically* checked only; prices and recipes remain unconfirmed. Quantities must be integers 1–20; duplicate menu IDs and unknown fields (including client prices, roles and payment flags) fail validation.
- Retrying an identical `requestId` + normalized order returns the **same draft order** with `duplicate: true` and adds no second record. Reusing that key for a different table, menu or quantity fails with `idempotency_conflict`. Item order in the request does not change its meaning.
- Accepted lines are copied and frozen to prevent caller mutations from changing the in-memory record. Generated IDs use the explicitly temporary `LOCAL-000001` format.
- `src/tests/cafeOrderIntake.test.ts`: success, retry, reordering, collision, invalid input, isolation and restart limitation tests.
- `.github/workflows/pr-checks.yml`: check PRs targeting **any base branch**, so a dependent PR can be tested without merging; workflow runs tests and TypeScript/Vite build, **never deploys**.
- **Implementation commit:** `aad065a80cf69e9d2157afc8b9fad31fe7356c7a`; **test commit:** `e5a260efa425a890fd8b484543fdecde2ea32348`.
- **Verification (GitHub Actions, commit `0ee7c716`):** [`Validate pull requests` run #41259741455](https://github.com/dishamsmt-maker/Onedaycafelife/actions/runs/41259741455) reported `npm ci` success, **57/57 Vitest tests passed (8 files)** and **`npm run build` succeeded**. The production build warns that the JS bundle exceeds 500 kB; Node/action deprecation warnings also remain. Recheck CI after any later commit. Real phone and browser E2E tests have NOT been performed by this change.
- **Dependency:** TASK-016 branches from PR #7 (TASK-015), so its PR must be reviewed **against the TASK-015 branch** first. Do not merge or deploy either without owner approval. If PR #7 is merged or its branch removed, retarget/rebase TASK-016 and rerun CI.

**Critical production gaps:** This inbox is volatile and loses all requests on process restart; it does not provide cross-process concurrency protection, authenticated sessions, rate limits, authoritative menu/price verification, stock reservation, server-generated durable IDs, database transactions or delivery to KDS. Before accepting any real customer order, implement database uniqueness on `(shop_id, request_id)`, atomically persist order and outbox event, verify table/menu/price server-side, and enforce staff authorization. **QR table IDs are public locators, not authentication.**


## 2026-11-01 — Café OS TASK-017: fictional ingredient unit costing (PR proposal)

**Role:** Finance & Inventory Analyst. **Scope:** pure, testable ingredient-cost estimator for *fictional sample data only*. This is NOT a live inventory system, purchase record, production recipe, price recommendation, or game feature. The ONE DAY V2 real menu prices, portion sizes, recipes, supplier invoices, waste, tax and payment fees are **unconfirmed**.

- `src/cafe-os/sampleRecipeCost.ts`: strict sample-only estimator accepting a pack's integer cost in **satang**, positive integer pack quantity and recipe usage in matching base units `g`, `ml`, `piece`. For 1 kg enter 1000 g; for 1 L enter 1000 ml. No implicit cross-unit conversions.
- The estimator computes **ingredient cost only**, using exact `bigint` rational arithmetic and half-up rounding once at the **total**. All results carry `status: 'UNVERIFIED_SAMPLE_ONLY'`; invalid input, missing ingredient, mismatched units and unsafe result overflow are rejected. No stock mutation, profit, selling price, tax, labour or overhead calculations.
- `src/tests/cafeSampleRecipeCost.test.ts`: fictional chicken/rice example and precision/validation regression tests. All numeric test prices are **invented fixtures** and must not be used for purchasing or setting menu prices.
- **Implementation commit:** `01b278b68b9cd9b6a637072a894dce6b13ca0295`; **test commit:** `96b7bd6101b1c1176443c102b3350481c2c46d67`.
- **Verified GitHub Actions (2026-11-01, commit `eab99006`):** [`Validate pull requests` run #41278961561](https://github.com/dishamsmt-maker/Onedaycafelife/actions/runs/41278961561) completed successfully: `npm ci` passed; **65/65 Vitest tests passed (9 files)**; TypeScript/Vite production build passed. The existing >500 kB JS chunk warning remains. Recheck CI after any subsequent commit. No browser E2E or physical inventory testing is claimed.
- **Dependency:** TASK-017 is a stacked PR based on TASK-016 PR #8; PR #8 itself depends on QR PR #7. Review in order and rerun checks after any rebase. Do not merge or deploy without explicit owner approval.
- **Game:** no game code, controls or public site changed in this round; the game remains isolated from real café accounting.

**Next production prerequisites:** approved supplier purchase unit and invoice cost, measured recipe yield/portions and waste, permissions, verified menu prices, a persistent stock ledger with auditable adjustments, and server-side authoritative calculation. Never treat an unverified sample estimate as the café's real cost.


## 2026-11-02 — Café OS TASK-020: V2 menu candidate review contract (PR proposal)

**Role:** Product / Operations Analyst. **Source-of-truth caution:** 37 public menu candidates were manually transcribed from the game V2 reference in `src/game/data.ts`, but game prices, quantities, recipes and simulated availability **are not café business facts**. The real ONE DAY menu and prices still require the owner's explicit confirmation. This file does not import or synchronize any game state.

- `src/cafe-os/menuDraft.ts`: a standalone, immutable 37-item candidate list; all names/IDs have `source: GAME_V2_REFERENCE_ONLY` and `reviewStatus: PENDING`. Every candidate has `priceSatang: null`, `recipeVersion: null`, and `approvalReference: null`. **Zero candidates are approved or sellable.** Hidden game-only production components are excluded.
- User-specified launch constraints are separately labeled `USER_SPECIFIED_PLAN_NOT_OPERATIONALLY_VERIFIED`: tables T01–T03 and hours 06:30–20:30. These are plans, not proof of operating hours or an active POS.
- `validateCafeMenuCatalog(input)` validates exact field names, unique IDs, bounded Thai/English names, category, source, review state and safe integer satang values. Draft entries carrying prices or recipes fail closed. The synthetic `OWNER_CONFIRMED` + `APPROVED` contract requires a recipe version and review reference, but this is **structural validation only**: no backend or real human approval is proven by a string.
- `listStructurallyApprovedMenuItems` returns an empty array for the supplied catalog and is **NOT** authorization to publish, take orders or charge customers.
- `src/tests/cafeMenuDraft.test.ts`: 8 test cases covering the 37-item draft, zero approved, launch plan, duplicate/invalid input, fail-closed review states and synthetic structural approval.
- **Implementation commit:** `df126aaf88208d103af348cbac7eb01acb96ed76`; **validation hardening:** `eff33bea8d460dc87fa313162f9286c206defa07`; **test commit:** `97d67b1bb503f666095d48117b0d62b49aa7084c`.
- **Verified CI at commit `c5cb7055` (2026-11-02, Asia/Bangkok):** [`GitHub Actions #41349502572`](https://github.com/dishamsmt-maker/Onedaycafelife/actions/runs/41349502572) completed successfully: `npm ci` passed, **73/73 Vitest tests (10 files)** passed, and `npm run build` (TypeScript/Vite) succeeded. Existing JavaScript chunk >500 kB warning remains. Recheck the latest commit after this documentation update. No Playwright E2E, real phone or physical café testing is claimed.
- **Dependency:** stacked on TASK-017 PR #9 → TASK-016 PR #8 → TASK-015 PR #7. Review in that order; do not merge/deploy without explicit owner approval.
- **Game lane:** no game code, visual controls, or public deployment changed. Do not import `src/game/data.ts` into Café OS.

**Before real QR/POS use:** owner must confirm each item name, inclusion, selling price, portion and recipe, availability periods, allergens, and halal suitability; staff must verify the data in an authenticated server-side menu/version workflow. Confirmed menu revisions must be immutable for already accepted orders. Public GitHub contains no customer data, real supplier invoices or secrets.


## 2026-11-02 — Café OS TASK-021: fail-closed menu review gate (proposed)

**Role:** Software Architect / QR-POS. **Scope:** one small, dependency-free, in-memory *structural* gate before the TASK-016 draft-order inbox. This is NOT a customer-facing order endpoint, authenticated owner approval, payment authorization, durable POS, KDS, or inventory deduction. Game state and real customer/transaction data are never accessed.

- `src/cafe-os/orderIntake.ts`: exposes the existing pure request parser as `parseCafeDraftOrderRequest` so the menu gate can reuse strict payload validation; existing inbox behavior is unchanged. **Refactor commit:** `d1e7dabff28261d80683e7c58b215c8855923b2e`.
- `src/cafe-os/menuReviewGate.ts`: `createCafeMenuReviewGate(catalog)` validates the entire menu structure, snapshots structurally approved IDs, rejects unknown and `PENDING` menu IDs before any order enters the in-memory inbox, and preserves the existing request-ID deduplication behavior. **Implementation commit:** `e70cfc3ec74f872663f5b1b59b307a762f55e2ed`.
- `src/tests/cafeMenuReviewGate.test.ts`: 9 cases for 37 pending V2 items, invalid catalogs, synthetic structural approval, mixed catalogs, unknown/mixed line items, malformed requests, retry, conflicts, and post-construction catalog mutation. **Test commit:** `02462120da17299addb7a7866c6dbf68150e6a71`.
- **Verified CI (2026-11-02, commit `fed5702f`):** [`GitHub Actions run #41375076404`](https://github.com/dishamsmt-maker/Onedaycafelife/actions/runs/41375076404) completed successfully: `npm ci` succeeded, **82/82 Vitest tests (11 files) passed**, and `npm run build` (TypeScript/Vite) succeeded. The existing JS chunk >500 kB and Node/action deprecation warnings remain. Recheck CI for this documentation-only commit; no E2E, real-device or production POS testing is claimed. **Verification commands:** `npm ci && npm test && npm run build`.
- **Game lane:** no change to game code, existing controls, UI, intro, or public deployment; separate PR #6 and #10 remain pending review.
- **Dependency:** TASK-021 is stacked on TASK-020 PR #12 → #9 → #8 → #7. Review the small diff against PR #12 first. Do not merge or deploy without explicit owner approval.

**Safety boundaries:** All 37 real-café V2 candidates remain `PENDING`; zero have verified prices or recipes. Synthetic `APPROVED` fixtures in tests only demonstrate structure and **do not prove actual owner approval**. A malicious client can forge approval fields in this prototype; the catalog MUST be loaded from an authenticated server-side source of truth. The in-memory inbox loses orders on restart and cannot protect across processes; before accepting real orders implement durable database idempotency, immutable menu versions and authoritative price/stock validation, staff authorization, audit logs, and atomic order/outbox transactions. Never connect this test gate directly to a public QR order endpoint.


## 2026-11-02 — Café OS TASK-022: simulated ingredient availability preflight (proposed)

**Role:** Finance & Inventory Analyst. **Scope:** one small, isolated, **read-only** ingredient availability check using **fictional test stock and fictional recipes only**. This is NOT real inventory, a reservation, a purchasing tool, a sellability decision, an authenticated endpoint, or a POS/KDS integration. No data is imported from the game or from customers.

- `src/cafe-os/simulatedStockPreflight.ts`: `createCafeSimulatedStockPreflight(stock, recipes)` validates strict stock and per-serving recipe fixtures in integer `g`, `ml` or `piece` units. `check(order)` reuses TASK-016's strict draft request parser, sums ingredient requirements across **all** dishes and quantities, then compares against an immutable snapshot of fictional on-hand stock. Fail-closed results distinguish malformed requests/fixtures, missing recipes/ingredients, unit mismatch, and insufficient stock. Every result is labeled `SIMULATED_ONLY`.
- `src/tests/cafeSimulatedStockPreflight.test.ts`: 10 tests covering enough stock, aggregated shortages, exact/zero stock, unknown menu, missing ingredients, unit mismatch, malformed requests, invalid fixture shapes, snapshot isolation, and **no deduction** on repeated checks.
- **Implementation commit:** `e5f8e38e9895456d083ff60912c82c833367ad08`; **test commit:** `abd9897d2e48d25331030eeec4ae36aa688e4b58`.
- **Verified CI on commit `48ec5ce835124facc7f42f6a29343dbb69cb75f8` (2026-11-02):** [GitHub Actions #41403630748](https://github.com/dishamsmt-maker/Onedaycafelife/actions/runs/41403630748) passed `npm ci`, **92/92 Vitest tests across 12 files**, and `npm run build` (TypeScript/Vite). Existing >500 kB JS chunk warning and Node/action deprecation warnings remain. **Verification commands:** `npm ci && npm test && npm run build`. Recheck CI after this documentation update. No device E2E or real physical inventory testing is claimed.
- **PR dependency:** TASK-022 is stacked on TASK-021 PR #13 → #12 → #9 → #8 → #7; review the diff against #13. Do not merge or deploy without explicit owner approval.
- **Game lane:** no changes to game code, 3D modes, controls, UI, intro, or public website in this Finance-focused round. No playable game update is claimed.

**Production safety:** A successful preflight is NOT a menu approval. The 37 V2 café menu candidates remain PENDING, with no verified selling prices or recipes. This checker is deliberately **not wired to** the draft inbox/menu gate; it neither accepts orders nor reserves stock. Multiple simultaneous checks can each report enough stock because no inventory is deducted. Before production, verify menu approval and recipe versions server-side, authenticate staff, persist stock lots and ledger movements, and atomically reserve/decrement stock with durable order creation and an outbox event in a database transaction. Do not commit real supplier prices, customer records, payments, credentials or inventory counts to this public repository.


## 2026-11-03 — Café OS TASK-025: owner menu approval checklist (PR proposal)

**Role:** Product / Operations Analyst. **Deliverable:** `docs/cafe-menu-approval-checklist-task025.csv` — 37 rows transcribed directly from the standalone `src/cafe-os/menuDraft.ts` candidate catalog on TASK-022's branch (the original reference is game V2, not real sale data). This is an editable review worksheet, **not** an approved menu or a POS import.

- Every row is `ownerReviewStatus=PENDING`, `halalReviewStatus=UNVERIFIED`, `source=GAME_V2_REFERENCE_ONLY`. All owner decisions, real prices, recipe versions, ingredient quantities, supplier/halal evidence, allergens, item-specific service hours, reviewer, review date, and approval references start **blank**. No simulated game price or recipe is copied. The café-wide 06:30–20:30 plan is not treated as item-level service hours.
- Owner should first decide **includeInRealMenu** per item, then confirm real price (THB), measured serving size, recipe ingredient quantities and units, allergen disclosure, supplier provenance and halal suitability, and item-level start/end hours. Review `PENDING` rows offline. Do not change `ownerReviewStatus` to `APPROVED` without authenticated owner sign-off and an auditable approval reference; an edited CSV is **not proof of approval**.
- This checklist is deliberately disconnected from real QR/POS/KDS, inventory, payments and all game state. It contains no customer records, supplier invoices, secrets or real transactions. Production menu approval requires a protected server-side review workflow, immutable versions and validated prices before real orders can be accepted.
- **Review checklist (each of 37 rows):** [ ] name/category [ ] include/exclude [ ] selling price [ ] portion [ ] recipe ingredients/units [ ] allergens [ ] halal source evidence [ ] item hours [ ] owner sign-off/reference. Shop plan: T01–T03, 06:30–20:30, still not an operating certification.
- **Worksheet data commit:** `e58f4b0bc8b5bc118bc0e2b2836c53331fc731d1`. **GitHub Actions CI verified at README commit `c27598d77688b1401534f8577aa3bd123de628a0`:** run #41534086137 passed `npm ci`, **92/92 Vitest tests across 12 files**, and `npm run build` (TypeScript/Vite). Existing bundle >500 kB and deprecation warnings remain. This verification precedes the present README-only clarification; recheck latest CI. **Local structural check performed before writing:** source regex matched 37 unique IDs; category distribution porridge=5, breakfast_set=4, salad=2, drink=16, snack=10; 37/37 rows PENDING and halal UNVERIFIED; 0 owner prices and 0 approved rows. This checks worksheet completeness only, **not** `npm test`, TypeScript build, actual ingredient halal status or human approval.
- **Verification commands for reviewer after checkout:** `npm ci && npm test && npm run build`. No local Node tests claimed in this round; check PR CI after it runs. No game code, playable preview, deployment or merge.
- **Dependency:** stacked on TASK-022 PR #14 (itself on #13 → #12 → #9 → #8 → #7). Review parent PRs first and re-run CI after rebase/retarget. Public `main` is unchanged.


## 2026-11-03 — Café OS TASK-026: offline menu worksheet structural validator (PR proposal)

**Role:** Software Architect / QR-POS. **Scope:** standalone, fail-closed **offline** validation of the 37-row owner review CSV from TASK-025. This is not a POS import, authenticated approval, halal certification, inventory operation, customer order, payment, or game update.

- `scripts/validate-cafe-menu-approval.mjs`: checks exact 19-column header, 37-row count, unique IDs, valid categories, source lineage, PENDING/REJECTED/APPROVED decisions, positive selling price, portion, recipe/version, allergen text, halal review status and evidence, item hours within the **planned** 06:30–20:30 shop window, reviewer/date/reference. Handles quoted CSV commas/newlines; invalid or pending rows block with exit code 1. **An `ok: true` result means structural completeness only, never genuine owner authorization.** The original 37-row worksheet is expected to fail with 37 PENDING rows.
- `scripts/validate-cafe-menu-approval.test.mjs`: 6 dependency-free Node built-in tests with synthetic, explicitly non-real prices, recipes and approval references; `package.json` now runs these after Vitest in `npm test`.
- **Local verification:** `node --test scripts/validate-cafe-menu-approval.test.mjs` passed **6/6** using Node 22.16.0 on 2026-11-03. The locally tested validator and test-file Git blob SHAs match the files uploaded to the PR branch. **Not locally run:** `npm ci`, Vitest suite, production build, device E2E (this runner cannot resolve github.com to install dependencies); check GitHub CI for the PR head before considering approval.
- **Manual check:** `node scripts/validate-cafe-menu-approval.mjs docs/cafe-menu-approval-checklist-task025.csv` is **expected to exit 1** while owner decisions remain PENDING. This is a safety check, not a failure of the game.
- **Safety limits:** CSV rows can be forged; this validator cannot authenticate a reviewer, prove ingredient origin or halal compliance, validate real supplier documentation, or authorize sales. It does not compare IDs to an authenticated master menu and is not connected to QR, POS, KDS, payment, stock, or game state. Require a protected server-side approval and immutable recipe/menu versions before live orders. No secrets, customer records, real transactions, or supplier prices are committed.
- **PR dependency:** based on TASK-025 PR #16, which is stacked on PR #14 → #13 → #12 → #9 → #8 → #7. Do not merge or deploy without owner approval. No change to public game URL or its 3D modes/UI.
