# 24-item acceptance audit — 6 November 2026

Source: issue #22, a reconstructed checklist, checked against main `e297d92446d5779092aaf54629518507152b573c`. Work branch: `fix/acceptance-24-20261106`.

Playable existing deployment: https://dishamsmt-maker.github.io/Onedaycafelife/ . Local changes in this audit have not been deployed.

## Scope and results

`npm ci` exit 0. `npm test` exit 0: **105/105**, 19 files. `npm run build` exit 0 after the capacity fix; existing >500 kB chunk warning remains. `npm run test:e2e`: exit 0, **17/17** in one run (12.1 minutes), Chromium software WebGL. The final added three-mode test passed separately (**1/1**, 53.3 seconds) with explicit scene readiness and a visually inspected rendered storefront screenshot. These are separate runs, not one 18/18 suite. No physical iPhone or surveyed site is available in this environment.

The overview used the obsolete fixed 12-seat denominator despite the five-table migration. It now totals capacities of enabled tables. Added a browser journey through customer, all five staff, management and save/resume, asserting unchanged cash, inventory, orders and ledger, and release of manual staff control after reload.

## Evidence disposition

Passing a simulation test certifies the game behavior described, not real payments, multi-device KDS, measured construction clearances or physical-device performance.

| # | Evidence in current repository | Remaining acceptance limitation |
|---|---|---|
|01|New three-mode browser journey; visitor/cozyLife units|Passed in the separate three-mode browser run|
|02|mobile.spec multi-touch, independent look and audio|Physical iPhone/Safari unavailable|
|03|full-site-walk.spec continuous 50 m public walk; seeded arrivals|NPC visual review remains distinct from player walk|
|04|fullSite/visitor units; T3 and T5 browser ordering|Every NPC seating animation not exhaustively verified|
|05|order-channels browser, oneDayJourney|Game-only service|
|06|visitor/orderChannels/oneDayJourney once-only payments|Game-only payments|
|07|serviceGuards abandonment regression|Simulation evidence|
|08|serviceGuards static route segments, fullSite corridor|Dynamic person-to-person avoidance remains unimplemented|
|09|service/cozyLife shared service, shifts and wages|Complete animation/workload visual review remains open|
|10|serviceGuards remote-completion regression|Simulation evidence|
|11|serviceGuards duplicate assignment regression|Simulation evidence|
|12|engine rush simulation|Dynamic crowd avoidance remains unimplemented|
|13|T3/T5 QR browser journeys|Single-browser game|
|14|soldOutQr/orderChannels retry and idempotency|Simulation evidence|
|15|soldOutQr rejects stock shortages and allows restock retry|Simulation evidence|
|16|cafeOsOrderCore/visitor/accounting tests|No real POS/payment integration|
|17|periods/engine bundles; kitchen browser view|No multi-device KDS|
|18|oneDayJourney production persistence, exact COGS|Simulation evidence|
|19|engine/orderChannels refunds, spoilage and cancellations|Real recipe/expiry data not verified|
|20|engine full seeded day; oneDayJourney repeated closing|Simulation evidence|
|21|game.spec IndexedDB; new three-mode journey|Passed in the separate three-mode browser run|
|22|fullSite/layoutPlanning, five tables and continuous route|No surveyed inspection-centre vehicle turning geometry|
|23|service garden round; cozyLife manual work/schedules|Complete visual animation review remains open|
|24|105 units + build; browser suite below|Physical iPhone/Safari unavailable|

No 24/24 completion claim is made. Real crowd avoidance and external store systems are implementation gaps, not merely tests awaiting owner approval. The current repository's AGENTS.md requires private visibility before push; GitHub metadata returned `isPrivate: false`, so this audit preserves local changes without pushing or changing visibility.

Final screenshot: `/tmp/oneday-three-modes-final-20261106/three-modes-customer-all-f-4281c-are-the-same-saved-business/three-modes-resume.png`. Existing 17-test screenshots are in `test-results/`. Both are local QA outputs, excluded from commits.
