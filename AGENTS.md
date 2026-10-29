# แนวทางสำหรับ Agent

## เริ่มงาน

- อ่าน `ARCHITECTURE.md`, `TASKS.md`, `HANDOFF.md` และคำสั่งผู้ใช้ล่าสุดก่อนแก้ไข
- ใช้ checkout ที่มีอยู่ งาน cloud แยกสภาพแวดล้อมอยู่แล้ว ไม่สร้าง worktree เว้นแต่ผู้ใช้ขอ
- ตรวจ `git status --short` และเก็บงานเดิมของผู้ใช้ไว้ ตรวจ remote `main` และ `sites-v3-baseline` แบบอ่านอย่างเดียวก่อนอ้าง baseline
- Baseline commit: `6dc7f2e88b3a38c4a95d348b1af43af73cc8fde5`; annotated tag object: `3668545e16bed8d41d8b28c0f455f5bd4018cf4b` อย่าย้าย ลบ หรือ force-push แท็กนี้
- ทำงานบน branch แยกจาก `main` และส่ง PR ตามขอบเขตที่ผู้ใช้อนุญาต ห้าม force-push หรือ merge เอง

## ขอบเขตและข้อมูลส่วนตัว

- งานเอกสารเปลี่ยนเฉพาะเอกสาร ห้ามเปลี่ยน Game Logic, tests, assets, dependency declarations หรือ lockfile เพื่อให้เอกสารหรือผลทดสอบดูผ่าน
- งานแก้เกมในอนาคตต้องมีคำขอครอบคลุมพฤติกรรมนั้นก่อน ไม่ถือรายการใน `TASKS.md` เป็นคำอนุญาตให้ลงมือทั้งหมด
- ห้าม Deploy หรือเรียกบริการ Sites จาก `.openai/hosting.json` โดยไม่มีคำสั่งชัดเจน; manifest เป็นข้อมูลโฮสต์เดิม ไม่ใช่สิทธิ์ Deploy
- อย่าเปลี่ยน repository visibility ตรวจว่าเป็น Private ก่อน Push; ใช้ metadata ที่เชื่อถือได้ หาก API ถูกบล็อกให้รายงานหลักฐานและความไม่แน่นอน ไม่ถือ 404 เพียงอย่างเดียวเป็นหลักฐานยืนยัน
- ห้าม commit `.env`, credentials, tokens, browser save exports หรือข้อมูลส่วนตัวจริง ห้ามพิมพ์ค่าของ secrets ใน log ใช้ authentication ที่ platform ให้และอย่าปิด TLS/integrity verification

## การพัฒนาและกติกาที่ต้องรักษา

- รากโปรเจกต์คือโฟลเดอร์ที่มี `package.json` ไม่ใช่พาธ `/workspace/sites/one-day` ในเอกสาร/สคริปต์เก่า ใช้ Node 22.12+ หรือ Node 24; ติดตั้งด้วย `npm ci`
- State ธุรกิจอยู่ใน `GameState` ผ่าน `act`/`tick` ใน `src/game/engine.ts`; camera/input ไม่ควรเขียนบัญชีโดยตรง การควบคุมพนักงานส่ง action ผ่าน store
- รักษา seeded determinism, เวลาขายเมนู, การตัดสต็อกครั้งเดียว, รายได้ครั้งเดียว, bundle ราคาแม่และงานผลิตลูก, เงินซื้อสต็อกแยกจาก COGS และงบเสิร์ฟ Ken/Pun รวมหนึ่งตำแหน่ง
- เซฟเดิมใช้ version 1 และ catalogVersion 2 การเปลี่ยน schema ต้องวางแผน migration และรักษาเงิน สต็อก ออร์เดอร์ และประวัติ ไม่ล้าง IndexedDB เพื่อแก้ปัญหา
- แยกเวลาจำลองออกจากแสง/เสียงและการเคลื่อนกล้อง ระวังพิกัด X ของโลกที่แสดงกลับด้านจาก simulation
- ไม่เพิ่ม backend, analytics หรือ external API โดยพลการ เกมปัจจุบันไม่ต้องใช้ API key

## การตรวจสอบและส่งต่อ

รันจากรากโปรเจกต์:

```sh
npm ci
npm test
npm run build
# สำหรับงาน browser/input/save/scene เมื่อมี Chromium
npm run test:e2e
```

- เลือก checks ตามการเปลี่ยนแปลง งานเอกสารตรวจ diff และ links; ถ้ารันทดสอบให้รายงานคำสั่ง จำนวน และ exit status จริง
- `npm run build` รวม `tsc -b` และ Vite; ไม่มี lint script ในปัจจุบัน
- Playwright ใช้ Chromium ที่ `/usr/bin/chromium` หรือ `CHROMIUM_PATH` และเริ่ม Vite port 5173 เอง; ปิด server ที่ตนเริ่มเมื่อเสร็จ
- E2E และ `scripts/prototype-qa.mjs` เขียนภาพชื่อเดียวกับภาพ tracked ตรวจ diff และคืนเฉพาะ outputs ที่การทดสอบรอบตนสร้างจากต้นฉบับที่เก็บไว้ก่อนรัน อย่า commit ภาพใหม่ในงานเอกสาร
- แยกผลรอบนี้ ผลย้อนหลัง ผลไม่ผ่าน และสิ่งที่ไม่ได้รัน ไม่รับรอง Safari/iPhone จริงจาก Chromium emulation
- ก่อน commit ตรวจว่า diff มีเฉพาะขอบเขตงาน ไม่รวม `node_modules/`, `dist/`, test artifacts หรือ `*.tsbuildinfo`
- อัปเดต handoff ด้วยข้อจำกัดจริง ส่งลิงก์ PR เฉพาะเมื่อสร้างสำเร็จ ไม่เรียก compare URL ว่า PR
