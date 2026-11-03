# ONE DAY playtest — 18 requested fixes (2026-11-03)

Implement on this feature branch only. Do not change original V2 site, main branch, or production deployment before review. Preserve three modes, T01–T03, mobile joystick, staff routines, halal menu and existing service flows. **No fried-sausage menu addition** (user withdrew it).

## Visual and environment
1. Remove two floating nonfunctional tables beside Na in kitchen; retain real kitchen worktops and three customer tables.
2. Remove floating debug/status labels above pots and coffee machine (Serving, Preparing, Waiting, counters); keep internal status logic; manager dashboard can show operational metrics.
3. Rotate POS/cash register so screen and cash drawer face staff, not customers; retain counter placement.
4. Make T01–T03 QR menus small (~7cm square) flat stickers flush on tabletop, aligned with table plane, tappable to open menu; no floating upright cards.
5. Remove all tall trees and large trees; retain low planting.
6. Move entire bar structure to right boundary wall eliminating walkable crevice; remove plants in crevice, update collisions/navmesh, preserve staff access. Replant with low/medium Monstera and tropical foliage.
7. Attach readable small left-chest name badges Ham, Ken, Na, Alee, Pun to uniforms, not overhead text; no badges on customers.
8. Redesign customer tables/chairs to balanced modern tropical minimal: light wood, cream metal, cream/sage seating, exactly T01–T03; modest waiting seat near pickup.
9. Implement occasional realistic takeaway path: walk in, order, wait standing or sitting at Coffee Pick-up, receive actual cup, exit; vary demand, not constant queue.
10. Diversify customer clothing by role: office wear, vehicle inspection workers, casual, different silhouettes/hair/accessories, optimized for mobile.
11. Solar-powered fixed warm-white illumination on vehicle inspection (ตรอ.) sign from dusk through night, independent of cafe lights; no blinking.
12. Ken and Pun share serving, table clearing, order work fairly (~40–60% when enough work); alternate, both help when busy, no duplicate orders or collisions.
13. Alee waters actual plants with watering can and visible water before opening and after closing; walk to each plant, return equipment, avoid idle loop.
14. Recolor entire right-side relative's-house boundary wall from cream to neutral matte gray.
15. Diversify customer models across women and men, different hair lengths/styles, modest/hijab options, ages, builds; avoid all short-haired male-looking customers.

## Verification
- Screenshots at identical camera angles before/after for kitchen, POS, QR tables, bar/right wall, garden, customer outfits and sign at night.
- Video or reproducible test of full takeaway order and delivery, Ken/Pun shift balance, Alee watering twice per day.
- Confirm mobile performance, walkable collision, three game modes, and no regressions.
- Preview deploy only after code changes and tests; user approves PR before merge to main or replacing production. Keep original V2 URL untouched.

## Additional playtest requests (2026-11-03)
16. **Collision and navigation for every person:** Fix Alee walking into the right wall and all staff/customer NPCs walking through walls, furniture, counters, trees or other solid objects. Rebuild/update collision shapes and navigation routes after bar relocation; avoid NPC overlap and deadlocks; verify routes in all three modes. Do not fake this by only changing animations.
17. **More casual outfit variations:** Both women and men customers may sometimes wear shorts, with suitable shirts/shoes; mix with office attire, uniforms, dresses/skirts, long trousers, and modest clothing. Do not force every customer into the same silhouette.
18. **Family visits with children:** Occasionally spawn age-appropriate child customer NPCs accompanied by a parent/guardian (e.g. child arriving with mother). Children remain near their adult, walk at child-appropriate pace, wait/sit safely, and leave together. No unaccompanied child wandering into kitchen/bar, roads, or vehicle inspection zone. Scale models and animation/collisions appropriately. Keep visits occasional and plausible, not constant.

## Added acceptance tests
- Run Alee watering routes and customer/staff routes near the moved right-side bar, walls, tables and pickup point: zero clipping through solids or persistent walking into walls.
- Observe customer variety including shorts on different genders and at least one parent-child visit during a sufficiently long simulated playtest; child and guardian arrive and leave together.

## User-approved game director priorities (2026-11-03)
The user explicitly approves implementing **all 18 items above plus the following**, on this branch, before review:
19. **End-to-end transactional service loop:** customer arrives, orders, payment/accounting is recorded correctly once, kitchen/bar prepares real items, Ken/Pun deliver or takeaway pickup occurs, customer consumes or leaves, table cleared. All 3D animations/props must be driven by actual engine order states, not unrelated loops. Check refunds/cancellations and stock depletion.
20. **Believable daily lifecycle:** morning opening/prep and Alee watering, dynamic rush/quiet periods based on location, vehicle inspection customers and office commuters, afternoon lull, evening lighting, closing/cleanup. Staff break/idle tasks and cleanup (including wiping tables) only when appropriate; no permanently full house.
21. **Operational fidelity and one-day QA:** simulate full day; reconcile arrivals, orders, revenue, stock, task assignment, staff utilization, and end-of-day report; validate no phantom sales or duplicate service. Include before/after matched screenshots, reproducible tests and mobile performance check.

### Implementation order and release gate
P0: navigation/collision (16), order-to-service/accounting loop (19), full-day state transitions (20). P1: all other requested visual/behavior fixes (1–15,17–18). P2: one-day QA and evidence (21). This is an implementation brief, **not proof of completed code**. Work only on feature branch; open draft PR, deploy preview separately, do not merge or change V2 until user approves.
