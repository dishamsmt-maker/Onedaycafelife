# ONE DAY verification — 4 November 2026

Scope: continuation from PR #23 (`fcd95a7`) on `fix/one-day-validation-20261104`. No main merge, production deployment, real payment, or real-store inventory write.

## Confirmed CI failure and fix

GitHub Actions run 41792149574: test-build succeeded; browser-e2e had 7 passes and one failure. `service-visuals.spec.ts` failed fetching `/src/game/menuImages.ts`. Vite applied the GitHub Pages base to the development server whenever `GITHUB_ACTIONS` was set. The Pages prefix now applies only to build commands; dev tests use `/` both locally and on CI. The Pages production build retains `/Onedaycafelife/`.

Rejected bundle submissions also used to assign `orderChannel` before order creation succeeded. A rejected counter request could prevent subsequently seating at a table. Channel assignment now occurs with request ID assignment after success. Regression coverage repairs the invalid bundle and retries the same ID at table 3.

## Service story and evidence

The game story is table 3 → QR menu → kitchen queue → Na cooks → Ken serves → player pays → closing report. State flows through visitor/store → engine → rendered bill and report. This repository has no real Café OS backend, staff authentication, simultaneous-device KDS or payment gateway; these tests do not certify those systems.

- Unit journey observes the actual Na cook and Ken serve tasks, saves/loads after stock consumption, resubmits the same request, checks exact recipe deductions, checks a single sale/COGS row and reconciles closing cash. Closing twice does not duplicate reports or expenses.
- Browser journey clicks the table QR/menu, verifies T3 in the kitchen panel, observes actual staff tasks, pays from the bill, closes from the report panel and checks rendered closure and ledger reconciliation. Simulation time is advanced with the existing dev harness; walking to the initial chair is fixture setup.
- E2E screenshots now go into each test's output directory instead of overwriting historical tracked screenshots.

## Acceptance and remaining evidence

GitHub issue #22 contains the 24-item tracker. It explicitly describes itself as a reconstructed checklist rather than the original acceptance list. The source playtest brief contains 21 numbered requests. The table below maps evidence to issue #22 without claiming full acceptance.

The existing game includes full-day seeded simulation, bundles, refunds, prepaid pickup, save/resume, menu periods and business-ledger tests. Passing these does not establish every visual request, family behavior, dynamic collision avoidance, staff workload balance, physical phone performance or production readiness. Physical iPhone/Safari, real-store permissions/offline concurrency, and on-site clearances are not verified here.

Physical-layout comparison is in `layout-ab-review-2026-11-04.md`; it preserves the reported frontage/bar/inspection-center/residence arrangement and lists the measurements needed to compare 4 and 5 tables. It is not a construction drawing.

## Results

- `npm ci`: exit 0.
- `npm test`: 54/54 across 9 files, exit 0.
- `GITHUB_ACTIONS=true npm run build`: exit 0; Pages asset prefix retained. JS 1,442.52 kB / gzip 416.63 kB; existing large-chunk warning remains.
- `GITHUB_ACTIONS=true npm run test:e2e`: original suite 8/8 passed, exit 0 (3.8 minutes). New T3 journey then passed in a targeted run, exit 0 (44.2 seconds). Nine distinct browser scenarios passed across two runs, not a single 9/9 run. Closing screenshot visually inspected.
- No new hosted Preview or new remote CI pass is claimed.

## Issue #22 evidence map

“Automated” means the stated simulation behavior is tested here, not approval for real-store deployment. “Partial” leaves the gate open for the listed missing evidence.

| # | Gate | Current evidence / limitation |
| --- | --- | --- |
| 01 | Three modes | Partial: visitor, management and staff-control state tests; full three-mode UI journey not covered |
| 02 | Mobile movement/camera | Chromium touch E2E passed; physical iPhone pending |
| 03 | Arrival from street | Seeded arrivals tested; visual street-to-entry journey pending |
| 04 | Table selection/access | Table availability tests and T3 journey; all NPC seating visuals pending |
| 05 | Order/service | Automated: T3 QR → Na → Ken → bill |
| 06 | No duplicate payment | Automated: orderChannels, visitor and oneDayJourney |
| 07 | Leave before delivery | Automated: serviceGuards rejects abandoned delivery and creates no sale |
| 08 | Staff avoid obstacles | Static path segments tested for stations/table service; dynamic overlap and all animations pending |
| 09 | Ken/Pun service | Automated shift/shared-wage and reassignment checks; workload fairness remains unverified |
| 10 | No remote completion | Automated: injected exhausted route far from destination cannot complete |
| 11 | No duplicate assignment | Automated: observes task order IDs through Ken/Pun override changes |
| 12 | Concurrent customers | 20-person rush simulation passes; dynamic crowd avoidance not certified |
| 13 | QR ordering | Automated UI menu → kitchen queue for T3 |
| 14 | QR idempotency | Automated: duplicate, save/load, sold-out retry, invalid bundle retry and channel recovery |
| 15 | Sold-out rejection | Automated: no order, kitchen work, charge or consumed request ID; restock permits retry |
| 16 | POS/accounting | Automated simulation prepaid counter and dine-in bills; no real POS/payment integration |
| 17 | Kitchen/bar/bundles | Production and bundle tests; kitchen UI tested; simultaneous staff-device KDS not implemented |
| 18 | Once-only stock/COGS | Automated recipe deductions, persisted mid-production and unique COGS entries |
| 19 | Cancel/refund/waste | Automated unpaid cancellation, prepaid/bundle refunds and next-day spoilage; real recipe/expiry data unverified |
| 20 | Daily closing | Automated full seeded day plus T3 cash/ledger reconciliation and repeated close |
| 21 | Save/load/shared data | IndexedDB browser resume and simulation mid-production; all three UI mode transitions pending |
| 22 | Physical 4–5-table layout | A/B comparison prepared; dimensions/traffic measurements missing |
| 23 | Five staff/garden/schedule | Existing service and garden tests pass; complete physical animation/timing review pending |
| 24 | Build/tests/real phone | Build and automated results above; physical iPhone gate still open |
