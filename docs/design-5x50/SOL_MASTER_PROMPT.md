# ONE DAY Café Life — master implementation brief for Sol

## 0. Read this as the current owner-approved direction

The owner approved the proposed complete 5 × 50 m site and requests a playable game visually close to the supplied real-site photograph and ONE DAY warm tropical café reference. They explicitly authorized merge and deploy earlier in this conversation. This document is the design/handoff deliverable; implementation begins when Sol is asked to continue. Do not ask the owner to repeat already-granted permission. Respect current platform protections and report actual authorization failures without bypassing them.

This replaces the old 5 × 10 m footprint and three-table limit. Do not silently treat the old prototype as the final scope. Preserve the useful existing simulation and financial invariants. Build the full 50 m world, then refine its visual quality in a sensible order; do not deliver a detailed ten-metre scene with the rest inaccessible.

Read repository AGENTS.md, ARCHITECTURE.md, HANDOFF.md, TASKS.md, docs/playtest-2026-11-03-15-fixes.md (actually 21 requests), docs/reference-release-2026-11-04.md and current source. Inspect the latest remote state, open PR #33 and its ancestors before choosing a working branch. Earlier session checkout was `/workspace/Onedaycafelife`, branch `feature/reference-garden-finish`, latest known commit `9719106`; verify, do not assume it remains latest. Do not overwrite user work or move `sites-v3-baseline`.

## 1. Sources of truth and uncertainties

Design package beside this file:
- `site-concept.png`: exterior visual direction.
- `bar-concept.png`: interior visual direction.
- `site-layout-v2.json`: complete world zones, table centres and assumptions.
- `bar-layout.json`: equipment bounds, operator anchors and clearances.
- `dimensioned-plan.svg`: proportional complete site diagram.
- `bar-dimensioned.svg`: precise proposed bar blockout.

Priority: latest owner instructions → numerical layout and explicit decisions here → actual-site photo for existing context → concept renders for materials/atmosphere → older prototype.

The owner supplies width 5 m and depth 50 m: 250 m². All internal dimensions are proposed design dimensions, NOT a survey extracted from a single photograph. The actual road/property boundary, frontage levels, drainage outlet, pole foundation, kiosk dimensions, and rear buildings remain unmeasured. Model those uncertain portions as clearly documented assumptions. Do not invent measured precision or claim construction readiness. Concept renders may contain inconsistent geometry; use the numerical layout for the game.

Preserve the photo's inspection business and white fence on the left, right-side neighbour wall/house, utility pole and overhead cables as contextual assets. They are outside or on uncertain boundaries, not extra café floor area. Do not occupy the inspection driveway or imply ownership of the road verge. No tall planting against utility cables.

## 2. Full-site masterplan

Use 1 world unit = 1 m. Site coordinates: x=0 left fence, x=5 right boundary, z=0 assumed front property boundary, z=50 rear. Road is contextual geometry in front of z=0; its surveyed offset is unknown. The 5 m forecourt is INCLUDED in the 50 m depth.

| Zone | z range | Area | Use |
| A | 0–5 | 25 m² | Paved entry forecourt, flush drainage, welcome/menu signage and low edge planting |
| B | 5–13 | 40 m² | Café building and customer order/pickup apron |
| C | 13–25 | 60 m² | Five garden tables, four seats each, cream parasols |
| D | 25–40 | 75 m² | Continuous garden walk, planting, quiet rest points and three-seat garden counter |
| E | 40–50 | 50 m² | Existing rear/service context; provisional game blockout pending survey |

The smooth continuous main route is x=.30–1.80, clear width 1.50 m. Low planting occupies the narrow left edge; no leaf masses, pot colliders, signs, queues or chair pull-outs may consume the route. Rear route is provisional around existing structures and must stay navigable.

Kiosk outer envelope x=1.80–4.80, z=7–13: 3 × 6 m / 18 m². Front customer apron x=1.80–4.80, z=5–7: 3 × 2 m / 6 m². The .20 m space between building and x=5 is a sealed/finished service edge, not a person-width walking crevice. No plants squeezed behind the building. Do not create a door through the neighbour boundary.

Five table centres: x=3.30, z=14.20 / 16.60 / 19.00 / 21.40 / 23.80. Tops .80 × .80 m, cream parasols diameter 2.10 m, four slim black chairs per table. Keep existing internal table IDs t1/t2/t3 and add t4/t5; display T1–T5. Twenty table seats. Individual chair placement comes from JSON; validate real mesh, sitting, standing, service and pull-out envelopes, not just tabletop boxes. All five tables must be actually reachable, seatable and orderable.

Three additional black stools belong to a separate garden counter, x=4.25–4.80, z=27–30.20, stools at x=3.65 and z=27.60/28.60/29.60. They are optional rest/bar seats, not additional QR tables. This deliberately frees the narrow front counter for order/pickup instead of making staff hand drinks over seated customers. Maintain the reference's black-stool visual language.

## 3. Forecourt and exterior

Build a plausible transition from the photographed dirt frontage into the café: warm grey slip-resistant paving, smooth route, edge restraint containing garden gravel, flush linear drain inside the assumed property line, and low concrete planters framing the entrance. No invented steps, steep ramp, road widening or drainage gradients derived from the image. Levels and drainage are parameters awaiting survey.

Menu board stands off the route. Customer queue slots are inside the 3 × 2 m apron, do not spill into the main route, neighbour access or street. If slots are full, arrivals wait in valid designated forecourt spaces or decline entry; never stack everyone at one coordinate.

Architecture: warm cream walls, thin charcoal canopy, timber soffit, vertical timber counter detail, readable ONE DAY sign, black slender metalwork, cream parasols. Maintain the grey neighbour wall requested earlier. Add believable ground contact, planter bases, door frames, roof thickness, gutter/downpipe context and restrained lived-in equipment. Do not widen the lot visually to fit furniture.

## 4. Bar interior — exact proposed organisation

Local bar coordinates u=0–3 left→right, v=0–6 front→rear. Convert to site x=1.8+u, z=7+v. Wall thickness .10 m. Width budget:
.10 wall + .65 workbench + 1.50 clear aisle + .65 workbench + .10 wall = 3.00 m.

Front counter u=.10–2.90, v=.10–.75, height1.05 m; left PICK UP and right ORDER / PAY. POS screen and cash drawer face staff. Main workbenches height .90 m. Proposed clear interior height about2.7 m; exterior roof/canopy proportions must be checked against the reference. These heights are design choices, not site measurements.

Left workbench u=.10–.75:
- v=1.00–2.25 espresso machine, grinder, tamping and cup shelf;
- v=2.25–3.45 tea/cold drinks/ice and milk fridge under bench;
- v=3.45–4.30 packing/pass station.

Right workbench u=2.25–2.90:
- v=1.00–2.75 clean ingredient preparation;
- v=2.75–4.20 compact induction/griddle/cooking under extraction hood;
- v=4.20–5.20 ingredient refrigeration/storage.

Rear workbench v=5.25–5.90:
- dishwash/dirty landing u=.10–1.20;
- separate handwash u=1.35–1.90;
- clean utensil storage u=2.00–2.90.

Left sliding staff door spans v=4.35–5.25, clear .90 m. It cannot swing into the main path. Staff yield at the crossing; nobody queues in the doorway. Proposed rear dish-return hatch opens towards the garden service approach and lands on the dirty side; keep dirty dishes away from the front pickup and handwash/clean storage.

Ham normally works the front-left drink line; Na works right prep/cooking. Alee supports only when an actual workspace is available. Ken/Pun collect from the front pickup without entering the central aisle for every plate. Position anchors and equipment bounds are in JSON. Capacity-one stations alone are insufficient: reserve rear wet area, central crossing, doorway and appliance-door clearance where operator bodies overlap. Two primary workers fit; do not routinely pack all five employees into this room.

Use stainless on work surfaces and equipment, warm timber on customer-facing surfaces, matte cream walls, washable-looking warm neutral floor, closed undercounter storage. Keep plants away from hot/prep/wet work surfaces. Include handles, cabinet doors, realistic machine scale, small bevels, fittings and believable shelf contents. Do not replace close-up equipment with unrelated floating cubes.

## 5. Visual target and asset pipeline

Target approximately80/100 on an agreed visual review rubric; this is a design acceptance score, not a pixel similarity claim:
- building silhouette/composition/proportion25;
- light/shadow/colour25;
- material richness20;
- planting/furniture/detail20;
- overall spatial atmosphere10.

Compare actual game captures, not generated marketing images. Use fixed camera bookmarks and consistent lens/exposure: road-facing front, left garden entry, customer at counter, inside bar, seated at T3, long garden toward rear and reverse view toward café. Capture daylight and blue-hour evening. Reference renders are concept targets, never proof the game renders that way.

Replace inadequate primitive close-up assets with authored GLB/glTF models and PBR materials. Use properly licensed assets or custom authored assets; record source/licence and optimisations. Do not silently buy assets or claim assets exist before importing/verifying them. Procedural geometry is acceptable when its actual appearance reaches the target, not merely because it is easy to produce.

Materials need correct scale, colour-space, roughness, normal detail and restrained reflections: timber grain, concrete/plaster, varied gravel, stone/paver edges, ceramic, stainless, black painted steel. Fine gravel mostly uses material detail with limited near-camera stones; never model every stone as a separate object. No single flat green material for all vegetation. Include species-distinct leaf geometry/cards, alpha masks where appropriate, stems, layered sizes and subtle colour variation. Use plant clusters and instancing, not thousands of separate React meshes.

Evening: warm2700–3000K practical lights, cool blue sky, legible signs, gentle pools of light on paths/plants. Daytime must remain natural. Use baked indirect light/AO for static architecture plus limited dynamic key/actor shadows. Avoid hundreds of shadow-casting point lights. Bake workflows must support the selected light presets; prevent permanent baked night light in a daylight scene. Rain changes plausible surface roughness and particles without altering the order clock. First-person has a complete roof; management view may use deliberate cutaway.

Asset structure proposal: public/assets/{architecture,furniture,plants,props,characters,textures}; typed asset manifest includes bounding box, material tier, LOD variants and attribution. Share materials/geometry; dispose resources correctly; avoid new object allocation per actor per frame. Cache/load zones by distance with no pauses in business simulation.

## 6. System architecture and invariants

Continue React + TypeScript + Vite + React Three Fiber/Three.js + Zustand. Retain engine act/tick and IndexedDB save path until an explicit migration is implemented. Extract the monolithic scene gradually; do not rewrite everything simply to change rendering.

Suggested responsibilities:
- world/layout: one typed source for site bounds, zones, walls, furniture, seats, doors and station anchors;
- world/navigation: static walkability, clearance, paths, station/seat reservations, local avoidance;
- simulation: business state, orders, inventory, workers, customer lifecycle, day reports;
- scene: zone geometry, assets, lighting, weather, animation and camera;
- UI: visitor/staff/manager modes, menu, bill, queue, inventory, finance and saves;
- persistence: validation, version migration, backup/export/import;
- tests/QA: business invariants, navigation scenarios, browser journeys, screenshots and performance.

Generate collision and nav geometry from the same layout as visible objects. Existing rendering mirrors simulation X: introduce explicit tested toRender/toSimulation transforms and choose one canonical world convention; never copy coordinates across systems with ad-hoc sign flips.

Keep seeded deterministic simulation and snapshot isolation. Cameras/animation must not directly create revenue, stock or orders. Animation consumes real task states. Rendering quality, lighting presets and camera motion must not change the business clock. Define time-unit conversions explicitly; recalibrate staff travel/queue/production timing for50m instead of retaining speeds tuned to10m. Movement and arrival events must agree; no delivery completion while the person is visibly across the room.

Retain existing menu and operating periods, valid bundle behaviour, stock-once, COGS-once, sale-once and refund-once. Preserve combined Ken/Pun wage budget unless owner changes it. Do not add the previously withdrawn fried-sausage menu. Maintain existing customer/server routines and the blue inspection sign independently of café sign maintenance.

## 7. Navigation, customers and staff

Use separate access masks for customers, employees and controlled visitors. Staff can enter work zones; customers and children cannot walk through the bar/kitchen, neighbour site, road traffic or solid planting. Model actor capsule width, furniture clearances, chair approach/seat/stand positions, door state, workstation operator position and waiting slots.

Implement collision-safe routing and local avoidance with deterministic priority/yield rules. Replan around temporarily blocked corridors; detect no-progress deadlocks and choose a reachable waiting point, not teleportation. Avoidance must consider moving and stationary people. Test opposing actors in1.5m paths, staff through .9m door, people pulling out chairs, server carrying a tray, and children with guardians. Avoid making every actor wait forever on a globally shared lock. Release every reservation on completion/cancellation/leave/control switch.

Families arrive occasionally, have real reserved seating, stay within a bounded guardian proximity while walking, wait when separated and depart together. Never remove the guardian from the simulation while their dependent child remains behind without an escort. The existing family prototype shares departure state but does not yet guarantee this spatial behaviour; finish it.

Character variety: women/men, hair styles, modest/hijab clothing, office/inspection-worker/casual outfits, occasional shorts and child proportions. Keep animation plausible and efficient. Staff name tags are small chest badges; no floating debug/status text. Hands/trays/cups/food appear only for actual task transitions. Avoid drinks floating beside empty hands.

Ken/Pun share service and table clearing fairly under sustained workload (target40–60%), help during rush, keep manual override, and never share one order assignment. Verify fairness on more than one seed and workload; do not manufacture fake tasks to make percentages pass.

Alee waters the actual plant set before opening and after closing, retrieves/returns equipment, and finishes each round once. Existing morning schedule can overrun06:30: resolve the opening-prep timeline explicitly (e.g. an earlier prep start) and update UI/tests honestly; do not mark watered plants without walking/working. Rain behaviour follows the owner's requested routine. Closing completes cleanup and legitimate transactions; a timeout must report unfinished work rather than silently certify all maintenance complete.

## 8. Back-office scope

Deliver the GAME management system: menu/price editing, ingredient inventory and purchasing, production queue by station, dine-in QR, prepaid takeaway, service status, staff assignment, cancellations/refunds/waste, daily reports and ledger reconciliation. Show these through readable manager UI. Customer UI exposes choices, prices and bill state, not internal implementation details. QR remains an in-game interaction unless separately integrating a real service.

The repository also has an isolated Café OS prototype. Keep its domain boundaries and tests; do not present it as a deployed multi-device real POS. This brief does not authorize making real charges, sending real customer notifications or adding external analytics. If later building a real-store service, use a separate authenticated API/database and a deliberate bridge; simulation money and game saves must never become real transactions.

## 9. Save migration

Do not reset IndexedDB to make the new world work. Preserve cash, stock, ledger, orders, customer history and day reports. Add a deliberate world/layout version independently of catalog version. Keep t1–t3 identifiers, add t4/t5 once, migrate actor positions, reservations and in-progress task routes into reachable new locations. Validate unfinished cooking/serving, bundle children, family links, mid-watering counters, controlled staff and old saves without optional fields. A second migration must be idempotent. Failed import leaves the current game intact and reports the error.

If translating old positions globally would put actors inside walls, map by semantic station/table/role and recompute paths. Do not fabricate completed service, refund, free stock or revenue during migration. Save UI must surface failures and permit export backup.

## 10. Performance and controls

Mobile browser remains primary; desktop keyboard/mouse also works. Preserve independent move/look pointers, release/reset on blur and mode switch, audio unlock, orientation/viewport behaviour, and save/resume after backgrounding.

Initial profiling targets, not prior guarantees: stable30FPS on the named target phone at medium quality; aim around<=250 visible draw calls and<=300k visible triangles on the mobile tier. Establish actual GPU/frame-time/memory measurements before treating budgets as achievable. Keep texture sizes/asset downloads proportional to visible detail; use KTX2/Basis where supported with tested fallback, Meshopt/Draco only with a deliberate loader pipeline, shared material atlases and LOD. Do not reduce quality until the game becomes visually unlike the agreed references just to hit a score.

Implement low/medium/high settings, capped DPR, frustum culling and zone-based asset detail. CPU simulation covers all50m even when far meshes are unloaded. Avoid repeated expensive pathfinding for every actor every frame; cache static topology and invalidate locally. Do not use a high-end desktop screenshot as proof of iPhone quality/performance. If no physical phone is available, report emulation separately and leave that device claim open.

## 11. Delivery sequence — continue autonomously within approved scope

1. Audit current branch/PR state, source and recovered21/24 checklists. Create an evidence map of done/partial/missing/superseded items. Latest5×50 plan and5tables supersede old footprint/table-count instructions. Treat real-device and real-POS claims separately.
2. Implement full50m typed blockout, world transforms, static collision, station/seat anchors and migration. Walk front-to-rear in all permitted modes before detailed art.
3. Bring front, bar interior and one garden table to target visual quality using actual runtime captures. Iterate internally; owner already approved the concept, so do not create an automatic new approval stop after every stage.
4. Extend the approved visual system over all five zones, complete plants/furniture, rear provisional service area, day/evening/rain settings, and character presentation.
5. Complete navigation/reservations/avoidance, staff workflows, guardian behaviour, five-table service and management UI. Maintain financial invariants and old saves.
6. Profile and optimise on available devices; run complete final tests and record evidence on the immutable release commit.
7. Update documentation/PR to describe the final implementation, then merge/deploy within the owner's granted authorization after required checks pass. Verify the actual published URL. If credentials/platform protection block a necessary operation, report the exact failure and keep the concrete work reviewable. Never change repository visibility or bypass a protection to force release.

Do not stop after writing a plan, after passing build alone, after a pretty screenshot, or after a preview URL exists. Deliver the playable integrated game and honestly enumerate any hard external constraints.

## 12. Acceptance gates

- Entire5×50m world accessible as intended; no invisible10m clamp; camera bounds and touch interaction work throughout.
- Five tables actually seat20 customers with collision-safe service/stand-up flows; garden stools do not create phantom table capacity.
- Accurate bar width budget and usable workstations; visible equipment and nav obstacles agree; fronts of POS and cabinet doors face correct operators.
- Front apron, route and neighbour driveway remain clear under queues; all fixed-angle captures show intended building, materials, planting and lighting.
- Day/evening screenshots from actual runtime reviewed against supplied references, with explicit remaining visual gaps. No unsupported80% claim.
- Full journeys: front→table5→QR→kitchen/bar→delivery→consume→pay→leave→clear; takeaway order→prepay→produce→collect→exit; failed/sold-out/duplicate/retried request; cancellation/refund; mixed food/drink bundle; switching all three modes.
- Full simulated day(s), rush/quiet, closing, paired staff workload, two plant rounds, sign schedule and family spatial escort. Reconcile sales/refunds/COGS/stock/cash/wages/reports exactly once.
- Import/export, legacy migration, mid-task save/resume and IndexedDB failure do not corrupt state.
- Run npm ci, npm test, npm run build, npm run test:e2e and meaningful new regression tests. Keep errors/failures visible, repair causes, do not weaken assertions to manufacture success. Report counts and commands from this release, not old README claims.
- Production build tested at its real base path. Published HTML, JS, textures, models and menu images load; play start/movement/menu/order/save flows on actual deployment where access permits. CI success/build READY is not proof of playability by itself.

## 13. Required final handoff

Provide playable URL + deployment target/commit, actual runtime screenshots of exterior/bar/garden, architecture/layout changes, migrations performed, test/performance evidence, full21/24 disposition with superseded items explained, and genuine remaining constraints. Keep the update understandable in Thai. Never call incomplete navigation, a missing physical-device run, or a real-store POS prototype complete.
