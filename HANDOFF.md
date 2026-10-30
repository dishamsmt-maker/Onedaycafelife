# ส่งต่องาน ONE DAY Café Life

วันที่ 29 ตุลาคม 2026 (Asia/Bangkok) — งานรอบนี้เป็นเอกสารเท่านั้น

## Baseline และสถานะ

- Repository: `dishamsmt-maker/Onedaycafelife`; root ปัจจุบัน `/workspace/Onedaycafelife`
- ตรวจ remote ก่อนเริ่ม: `main` = `6dc7f2e88b3a38c4a95d348b1af43af73cc8fde5`
- `sites-v3-baseline` annotated tag object = `3668545e16bed8d41d8b28c0f455f5bd4018cf4b`; peeled commit = `6dc7f2e88b3a38c4a95d348b1af43af73cc8fde5`
- Branch เอกสาร: `docs/developer-handoff` สร้างจาก `origin/main`; ไม่ย้ายแท็ก ไม่เปลี่ยน Game Logic และไม่ Deploy
- เพิ่มเฉพาะ `AGENTS.md`, `ARCHITECTURE.md`, `TASKS.md`, `HANDOFF.md` โดยอ่าน engine/store/persistence/visitor/world, UI/scene/input/audio, manifests, tests และ QA scripts
- Source baseline เดิมนำจาก `one-day-cafe-life/source/` ของ ZIP SHA256 `adb30806c8874482acce8de36a459c1569c2e4d94530820cdae10e3628cfe8b6` (ข้อมูลย้อนหลังจากรอบนำเข้า)

## ผลที่รันจริงในรอบเอกสารนี้

รันวันที่ 29 ตุลาคม 2026 เวลาประมาณ 21:28 น. (Asia/Bangkok), Node 24.19.0/npm 11.9.0, จากราก repository โดยใช้ dependencies ที่ติดตั้งจาก lockfile ในรอบก่อน ไม่ได้รัน `npm ci` ซ้ำ:

| คำสั่ง/การตรวจ | ผลรอบนี้ |
| --- | --- |
| `git ls-remote` + fetch main | main และ peeled tag ตรง baseline ข้างต้น |
| `npm test` | exit 0; 3 files, 34/34 passed (engine 18, periods 10, visitor 6); ไม่มี failed/skipped |
| `npm run build` | exit 0; TypeScript และ Vite 7.3.7 ผ่าน, 2,164 modules; JS 1,415.56 kB (gzip 408.23 kB), warning chunk >500 kB |
| ตรวจ baseline files ด้วย Git object bytes | source/lockfile/assets เดิมทั้ง 58 ไฟล์ไม่เปลี่ยน |
| ตรวจเอกสารและ diff | เพิ่ม Markdown 4 ไฟล์เท่านั้น; `git diff --cached --check` ผ่านก่อน commit |

ไม่ได้รัน `npm run test:e2e` ใหม่: งานนี้เปลี่ยนเฉพาะเอกสารและไม่มี browser code เปลี่ยน จึงแยกผล browser เดิมไว้ด้านล่าง ไม่สร้าง screenshots ใหม่

## ผลย้อนหลัง — ไม่ใช่การรันใหม่รอบนี้

รอบนำเข้า ZIP ก่อนหน้านี้ติดตั้ง `npm ci` สำเร็จ, Vitest 34/34 ผ่าน, Playwright Chromium 4/4 ผ่าน และ production build ผ่าน (Vite 7.3.7 พร้อมคำเตือน bundle ใหญ่) รอบนั้นตรวจ SHA256 ของ source 58 ไฟล์กับ manifest และคืนภาพที่ tests เขียนทับก่อน commit ผลเหล่านี้ไม่รับรองอุปกรณ์ iPhone จริง และภาพ PNG ที่ติด baseline เป็นหลักฐานเก่า

README เดิมบางช่วงกล่าว 28 tests ขณะที่ส่วน prototype กล่าว 34; ใช้ผล runner ของแต่ละรอบเป็นหลัก อย่านับตามข้อความเก่าอย่างเดียว

## เริ่มพัฒนาต่อ

ใช้ checkout ที่มีอยู่ ไม่ต้องสร้าง worktree; จาก root repository:

```sh
npm ci
npm test
npm run build
npm run dev -- --port 5173
```

Browser ต้องรองรับ WebGL 2 และ IndexedDB ใช้ Node 22.12+ หรือ Node 24 ใน environment นี้มี Node 24.19.0/npm 11.9.0 หากต้องทดสอบ browser ให้หยุด dev server ที่ตนเริ่มเมื่อเสร็จ แล้วใช้ `npm run test:e2e` ซึ่ง start Vite เอง; Chromium อยู่ `/usr/bin/chromium` หรือกำหนด `CHROMIUM_PATH` ก่อนรัน ตรวจ tracked screenshots ก่อน/หลังและอย่าทิ้ง outputs ปนในงานเอกสาร

ไม่มี backend หรือ API key สำหรับเกม ไม่ได้ย้ายเซฟส่วนตัว: IndexedDB ผูก browser/origin ต้อง export จาก browser เดิมแล้ว import เอง `.openai/hosting.json` เป็น manifest เก่า ห้ามใช้เป็นคำสั่ง Deploy

## ข้อจำกัดและสิ่งที่ต้องทำต่อ

- Unit/build ไม่รับรอง Safari, touch/audio บน iPhone จริง, thermal/memory, FPS หรือความสมจริงทางภาพ; E2E เดิมเป็น Chromium emulation
- ไม่มี browser/E2E, device QA, prototype QA script, dependency vulnerability audit หรือ production behavior test ใหม่ในรอบเอกสารนี้
- GitHub API ถูก proxy ปฏิเสธระหว่างเตรียม PR แม้ Git read ใช้งานได้ บันทึกร่างเพิ่มเฉพาะ `api.github.com` ใน Environment Settings แล้ว; การบันทึกร่างไม่เท่ากับ apply/publish และยังไม่ยืนยันว่า API credentials มีสิทธิ์สร้าง PR
- สถานะ visibility จากรอบก่อน: ผู้ใช้แจ้งเปลี่ยนเป็น Private, public page ตอบ 404 และ authenticated Git อ่านได้ เป็นหลักฐานประกอบ ไม่ใช่ API metadata ยืนยันสถานะ Private รอบนี้
- ขั้นตอนถัดไป: ให้ network policy อนุญาต GitHub API แล้วตรวจ metadata/สิทธิ์และสร้าง PR ของ branch เอกสารเข้า `main` หากยังถูกบล็อกต้องรายงานตามจริง ห้ามอ้าง compare link ว่า PR ที่สร้างแล้ว
- งานพัฒนาหลัง review เอกสารเรียงใน `TASKS.md`; ยังไม่แก้ปัญหา backlog ใน PR นี้

## 30 October 2026 — QR / takeaway iteration

PR #1 has since merged into main (`a0cb5f4`). GitHub API access was restored and repository privacy verified. The earlier network-blocker paragraphs above describe the documentation round, not current API connectivity.

Branch `feature/table-qr-orders` adds player table-QR ordering, a bill/queue sheet and prepaid counter pickup. See `docs/QR_TAKEAWAY.md` for the playable steps, accounting choices and limits. The baseline tag is preserved. NPC/cashier scheduling enhancements remain separate future work.

Publishing is currently blocked: this session has no Sites deployment tool, and GitHub Pages/deployment APIs return HTTP 403 (integration permissions). The version must not be described as available at the old game URL until deployment and an external request are verified.

Validation actually run for this iteration: Vitest 40/40 passed (34 existing + 6 new channel/payment/refund tests); TypeScript + Vite build passed, with the existing large-chunk warning; Playwright 6/6 passed (4 existing + 2 new QR/counter journeys). The final browser run took 5.3 minutes. An earlier browser run was deliberately interrupted while correcting new test fixtures; it is not counted as a pass. Generated tracked screenshots were restored. No deployment or real-device testing was performed.
