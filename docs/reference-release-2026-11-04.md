# Recovered requests and reference garden release — 4 November 2026

The current owner instruction authorizes continuing the outstanding game work and deploying after verification. This supersedes older preview-only/no-deploy notes for this release. Main and the baseline tag remain unchanged; publish the release branch through the existing Pages workflow.

## Source of the requests

`docs/playtest-2026-11-03-15-fixes.md` actually contains 21 owner requests, despite its filename. GitHub issue #22 contains a separate reconstructed 24-point QA gate, explicitly not the original acceptance list. PR #32 is the most recent integration ancestor used here. Do not confuse the old main deployment with these later changes.

## Implemented in this release

- Integrate the existing service/QR/ledger/navigation regression work from PR #32 without merging main.
- Replace rounded foliage blobs with instanced folded pointed leaves, low tropical planting, natural green variation, and concrete pots. Keep garden and watering destinations sourced from the same plant list.
- Cream building, dark canopy, wood counter, black chairs and cream umbrellas remain aligned with the latest reference. Gray boundary wall retains the earlier explicit request. Gravel now has individually shaded stones; pavers have continuous mineral texture instead of small repeated tile patterns. Warm garden lights and the solar inspection sign light are independent fixtures.
- Remove floating pot, cooking and coffee status text. Production and stock logic remain active. Rotate the POS/cash drawer toward staff. Attach small staff name badges at the chest. Add customer female hair, modest head covering, shorts and office clothing variations.
- Ken/Pun help with backlogs and select the less-loaded server. The seeded rush test requires the smaller share of completed tasks to be at least 40%, with no duplicate assignments or sale entries. Existing automatic primary shift and manual server override remain available. Shared daily wage is unchanged.
- Add the second plant-watering round while closing and gate normal closure on its completion. Counter progress is serialized; saves with the original morning counter remain compatible. Morning watering still starts at the existing 06:25 game start and can run past opening. Do not claim that every plant is watered before 06:30.
- Add occasional accompanied child customers, reserving a seat at the guardian's table and sharing their departure lifecycle. Children use a smaller rendered model and existing order/stock/payment rules. No independent unsupervised child arrival is generated.
- Require unit tests, production build and browser suite in the publishing job. After deployment, verify HTML/menu atlas responses and play start/pause/management/return in mobile Chromium against the actual published URL. Upload browser evidence.

## Remaining acceptance limits — do not report 21/21 or 24/24

The scene is authored procedural geometry, not photorealistic architectural assets. Static navigation has regression coverage, but dynamic person-to-person avoidance, all chair clearances, family proximity on every path, and persistent overlap/deadlock review remain incomplete. The bar has not been moved wholesale against the external house boundary; doing so requires a coordinated station/world/collision/layout migration. The world still has three tables on its original 5 × 10 m footprint. Four/five-table measured layout and vehicle turning space require site measurements. No physical iPhone/Safari, thermal or FPS measurements were available. Café OS code in the integration ancestor is an isolated prototype, not a live multi-device POS/payment backend.

## Verification

Before this release: local ancestor suite 70/70. After service/visual/family additions: full local suite 73/73 and production build passed. The stricter 40–60 workload assertion initially exposed imbalance (26.7% share); scheduling was corrected and the targeted service + engine suite passed 25/25. Early-close tests now allow 90 simulated minutes for the additional physical watering route, preserving ledger/wage assertions.

The authoritative final release result is the Pages workflow on the release commit: it runs the full suite before deployment and production smoke after deployment. Local browser development tests may span HMR changes, so use the immutable workflow head for final certification. Chromium mobile emulation is not physical iPhone evidence. The existing >500 kB JavaScript bundle warning remains.

Use `node scripts/reference-review.mjs` with a dev server on port 5173 for real WebGL day/evening captures under `test-results/reference-review/`. Generated outputs remain ignored and do not overwrite historical screenshots.
