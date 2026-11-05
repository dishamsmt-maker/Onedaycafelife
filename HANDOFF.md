# ส่งต่องาน ONE DAY Café Life

## Latest: 4 November 2026 — QR retry and one-day verification

Based on PR #23 head `fcd95a7`; branch `fix/one-day-validation-20261104`. Fixed the confirmed CI failure by applying the Pages base only to production builds, and moved QR/POS channel assignment after successful order creation so rejected bundles do not lock future ordering. Added T3 UI-to-closing, mid-production persistence, remote-delivery, cancellation, duplicate assignment and static route regressions. QA screenshots now use test output directories.

Actually run: `npm ci` exit 0; `npm test` **54/54** (9 files), exit 0; `GITHUB_ACTIONS=true npm run build` exit 0, Pages prefix verified; original Chromium E2E suite **8/8** followed by the new T3 scenario **1/1**, both exit 0. This is nine scenarios across two runs. Existing large-bundle warning remains. No physical iPhone/Safari test, new hosted Preview, main merge or production deployment.

[Evidence mapped to issue #22's 24 gates](docs/verification-2026-11-04.md) and [physical layout A/B review](docs/layout-ab-review-2026-11-04.md) identify remaining device, visual, real-store and measurement gaps. Do not claim 24/24 acceptance or a real multi-device Café OS from these simulation tests.

GitHub metadata reports repository **public**. On 4 November 2026 the owner explicitly authorized pushing this prepared change and opening a Draft PR in the current public repository. That authorization resolves the private-before-push constraint for this change; it does not authorize merging or production deployment. Baseline tag remains unchanged.

## Previous: 30 October 2026 — service realism

Branch `feature/service-realism` starts from merged PR #4 (`9719cc5`). The user has explicitly authorized merge/publish and changed repository visibility to public; those instructions supersede the earlier private-only/no-publish constraints. Baseline tag is unchanged. See `docs/SERVICE_REALISM.md` for implementation and physical-animation limits.

This round actually ran: Vitest **46/46**, including four new service tests; production build with `GITHUB_ACTIONS=true` passed and emitted `/Onedaycafelife/` asset paths (existing large-bundle warning). Seven existing browser journeys passed in the full run. Its new eighth scenario was interrupted after decoding images and taking a scene screenshot because its original test fixture tried to open the menu through an already-open hub; this is not counted as a pass. After correcting the fixture and polishing phone/tray/ladder/stone visuals, the QR, counter and new image/scene tests were rerun: **3/3 passed in 1.6 minutes**. This covers eight distinct browser scenarios across the two runs, not a single final 8/8 suite run. All three WebP atlases decoded in Chromium and the actual menu/scene screenshots were inspected. The old rain-skip test now expects the requested daily plant round even in rain. Initial failing tests caught early-closing watering and the ten-minute floating-point boundary; both were fixed, not bypassed.

Tracked screenshots from this round were restored. No physical iPhone/Safari or FPS test was run. The final UI label-only change was exercised in the targeted browser run; the remote publishing build will type-check the final source. Publishing now verifies the public game HTML and all three menu atlas URLs after deployment. Local outbound requests to the Pages hostname remain restricted; the GitHub runner performs that external verification.

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

## 30 October 2026 — Living café operations (draft)

Branch `feature/living-cafe-operations` is based on PR #2 (`b905019`), which is still open; its PR should target `feature/table-qr-orders`. Remote main remains `a0cb5f4`; baseline tag object and peeled commit were rechecked unchanged. GitHub repository metadata confirms `private: true`.

Implemented stock collection trips, inventory-driven storage/production models, openable pot, takeaway positions, chair/color/fence changes, and an operations dashboard. See `docs/LIVING_CAFE.md` for exact scope and unfinished requests. Sign scheduling remains blocked on contradictory time instructions. This is not the complete requested visual redesign and has not been published.

Validation **run this round**: `npm test` 42/42 passed in 5 files (40 prior + 2 operations tests); `npm run build` exited 0 (TypeScript/Vite), JS 1,431.02 kB / gzip 413.25 kB, existing large-bundle warning; `npm run test:e2e` 7/7 passed in 5.1 minutes (6 prior + new dashboard purchase/plan test). New collection test checks once-only stock/COGS and save/resume; existing full-day and deterministic tests still pass. The referral fixture now seeds one satisfied guest rather than an eight-person rush because collecting ingredients adds real walking time; referral assertions remain unchanged. The first implementation run exposed that fixture issue and an idle shift-change issue; final results above are after those corrections.

Tracked screenshots produced by this browser run were restored. Browser checks use Chromium software rendering, not physical iPhone/Safari. No dependency installation, vulnerability audit, deployment or tag update was performed in this round. Existing Sites integration remains unavailable in this session; opening the original game URL does not load these changes.

Visual inspection also captured the open storage cabinet and garden without page errors. Bar stool seats were subsequently matched to black (color-only correction); the browser suite above preceded that final color change.

## 4 November 2026 — reference garden release

Current owner authorized continuing outstanding game work and deployment after verification. Recovered original 21-item brief and separate issue #22 QA tracker. Continue from PR #32 integration ancestor on `feature/reference-garden-finish`, without merging main or moving the baseline tag. See `docs/reference-release-2026-11-04.md` for implementation, test evidence and explicit open acceptance items. Do not claim all 21/24 complete or photorealistic/iPhone-certified.

## Full-site implementation — 4 November 2026

Branch `feature/full-site-5x50` continues from `9719106`. Current owner approved full5×50 design, bar interior, merge and deploy. Initial expanded-world validation: Vitest77/77, build passed. New tests cover full50m corridor/table routes, legacy migration idempotence/financial preservation, table5 production/payment, and actual morning plant round before opening. Browser suite currently running; do not count incomplete runs as passed. See docs/FULL_SITE_IMPLEMENTATION.md for remaining visual/navigation limitations.

Full-site local browser run:9/9 passed in4.2min before the authored-plant pass. A subsequent77/77 unit run passed after removing an experimental deadlocking avoidance approach. The added table5 UI scenario and latest authored assets require final browser/CI validation; do not count them passed until results arrive. Asset pass introduces a5.76MB attributed plant GLB and2MB generated leaf texture. Static detail meshes now use instancing.

## 4 November 2026 — CI diagnosis and reporting

GitHub Actions run 41860667615 at `2b39441` passed unit/build and 9/10 browser cases. `service-visuals` failed because its fixture advanced simulation and clicked through before the rendered clock/camera caught up after loading the authored plant. The targeted browser case passed after explicitly waiting for the clock and camera mode before opening the menu; this retains the image-decode and visible-menu assertions. A complete final-head browser run is still required.

Closing fallback now records incomplete watering and an unremoved sign in the daily inspection report instead of silently reporting routine completion. New regression passed. Full local unit suite 78/78 and build passed in this round. A real-browser full-site walking scenario has been added; its result must be recorded separately. The dynamic crowd-avoidance prototype was reverted due to deadlocks; no dynamic-avoidance completion claim is justified. Physical iPhone and final visual acceptance remain open.

Full-site browser walk from z=-0.4 to beyond49m passed in2.0 minutes using Chromium software rendering. This measures a browser journey, not physical-phone performance. The screenshot originally faced out of the rear boundary; the test is adjusted to look back toward the garden. Subsequently the left foliage was narrowed and two back-garden trees received collision boxes; 78/78 unit tests passed after this adjustment. Full final-head CI remains required.

Runtime capture review exposed instanced foliage being culled when the camera moved away from the origin. Recompute the leaves/trunks instance bounding spheres after populating matrices; subsequent local captures at front, bar and garden showed plants and no page errors. Visual comparison still falls well short of the owner’s reference; the current result remains a blockout and is not accepted as 80% similarity. Full crowd avoidance and workstation reservations remain incomplete. Do not merge/deploy as final until those requested items and final CI are resolved.

## 5 November 2026 — inspection-facing bar window and plant species

Owner clarified that the drink counter facing the inspection business must be open, while the rear kitchen stays enclosed. The left facade now has a 2.70m-wide opening from z7.40 to10.10, sill1.05m/head2.35m, dark frame and timber counter ledge kept within the bar footprint. The lower wall still blocks walking through it. Customer ordering now recognises both the front counter and side hatch; production/payment use the existing engine.

Plant additions use the existing22 planting/watering positions: three monstera, three rubber plants and five fern clusters have separate leaf silhouettes. Monstera has split margins and fenestration holes; rubber leaves are oval and glossier. Existing pots and routes are retained, so no save-counter migration is needed. These are authored procedural game models, not scanned botanical assets or proof of100% photo similarity.

Build passed; full unit suite79/79 passed before the added side-counter regression, then targeted full-site/service suite14/14 passed including that regression. Browser side-hatch order test is pending at this writing. Full crowd avoidance, physical-device verification and final visual acceptance remain open. Earlier owner authorization to merge/deploy persists; no new permission is required for those actions once validation and intended scope are complete.

The targeted side-hatch browser journey passed (1/1,52.3s): public approach, contextual menu, Thai-tea selection and one real counter-channel order. Captured actual window screenshot was inspected. This validates the requested hatch interaction, not all remaining game/visual acceptance items.

## 5 November 2026 — Cozy life systems

Owner repeatedly requested implementing the entire Cozy Realistic / Slow Living brief and checking before delivery. See [docs/COZY_LIFE.md](docs/COZY_LIFE.md) for the playable scope, shared state, save behaviour and explicit fidelity boundaries. Adds manual employee preparation/service/cleaning/washing, editable shifts, customer activities and greetings, quiet breaks, ambience animals/traffic, positional audio, decoration with real cash/collision, journal/progression and actual WebGL photo capture/album. New games run at0.25× with selectable0.25/0.5/1/2/5×.

Site context now includes the pink roof and neighbouring buildings/cables; road setback is still a proposal, not a measured survey. New and existing saves retain finances, and moved tables/decoration survive reload. No backend or real payment service has been added.

Actual verification so far:94/94 Vitest passed; TypeScript/Vite build passed. Initial JS505.93kB /158.30kB gzip, lazy Scene1053.39kB /293.46kB gzip. Earlier browser attempts caught a root-level asset suspension and an invalid literal newline in the existing Sky shader; these were fixed. Three targeted cozy browser flows passed; the manual-flow test initially asserted before the last2.2s action completed and now waits for the actual order status. A full16-case browser run is in progress; do not count it as passed before completion. Preserve the baseline tag and don't claim measured/photographic100% or physical-device approval.

Follow-up verification:97/97 unit/simulation tests and TypeScript/Vite build passed after fixing custom-shift return/duty hours, replanning abandoned manual trips, and using the same0.45m reach for manual and automatic delivery. The initial complete browser run passed15/16; the50m walk stayed atz=-0.4 because the fixture held movement before the lazy camera mounted and reset controls. Input readiness is now explicit in the UI, and camera journeys wait for active/enabled controls before starting. The focused6-case cozy/mobile/full-walk rerun is in progress. JPEG storage now retains pictures chronologically. Build:506.42kB/158.45kB gzip initial application;1053.50kB/293.50kB gzip scene. Do not describe the initial15/16 result as a full pass.

The6-case focused rerun passed4.6min, including the complete50m walk and independent two-finger phone input. CI atf41b5ca passed15/16: photo capture was attempted before the renderer registered ("กล้องยังไม่พร้อม"). Readiness is now published atomically with registering the photo renderer; both entry/capture buttons remain disabled until ready. Actual morning, golden-hour, night garden, light rain/bar and rear-boundary captures showed no JS/shader errors. Those captures exposed far-sky clipping atz49: the sky dome now follows the camera, and roofed bar positions are excluded from rain. Movement now preserves pace across slower frames with whole-segment collision checks and a bounded resume delta.100/100 tests and build passed; current focused3-case photo/walk/touch confirmation is running. Latest build:506.44kB/158.47kB gzip app;1053.94kB/293.69kB gzip scene. Captures used software rendering and do not establish phone FPS; the wide1100px capture reported1FPS/609draw calls/138337triangles atDPR0.7, so do not certify physical-device performance from this environment.

CI run41948260394 onab63623 completed successfully:100/100 units/build and16/16 browser cases. The focused photo/full-walk/touch rerun also passed3/3 in2.6min. `scripts/published-smoke.mjs` passed on the compiled production build at localhost4173. Four production-only lighting/weather captures (no development harness) passed with no JS/shader errors and the clock unchanged05:30; images and verification JSON are in `/workspace/designs/one-day-cozy-runtime/`. A final placement audit moved pot slots28/30 away from the garden counter and44/48 out of the rear building, and now rejects obstructed sites before spending. Regression checks all12 offered locations and the continuous public route.101/101 unit tests and build pass after this clearance fix. Its exact-head CI checks on PR34 are authoritative for release; do not confuse earlier run failures or an ancestor pass with the latest commit.

## 5 November 2026 — warm garden correction

Owner supplied an actual iPhone19:20 screenshot with dark tables/umbrellas and requested brighter lighting and abundant plants. Branch `fix/warm-garden-night` starts from merged maina4c2665. See docs/WARM_GARDEN.md. Adds warmer ambient/ground bounce, a bounded4/6 local-light pool under tables/bar/garden, instanced string lighting with supports,97 perimeter plant groups and improved leaf silhouettes/pigments. The22 watering beds and save/accounting data remain unchanged. Player purchase slots remain clear. Same-camera low-tier table-region image luma37.52→113.37; before/tuned captures showed no JS/shader errors and identical business state.105/105 units and build passed. Targeted night/mobile/side-window browser checks are running. Do not claim physical-phone FPS or that the full historical realism/crowd backlog is complete. Merge/deploy authorization from the owner persists; verify the exact final head before release.

Targeted browser validation passed3/3 in1.7min: independent phone walk/look, actual side-bar ordering, and a19:20 seating JPEG brightness/ledger regression. The test measures the previously dark table region above55/255 luma (old production37.5); the local matched-camera tuned capture measured113.37. Exact final-head CI and deployment are the release gate.
