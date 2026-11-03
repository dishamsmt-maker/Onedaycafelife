# ONE DAY playtest — 15 requested fixes (2026-11-03)

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
