# Living café operations — work in progress

Historical scope of PR #3. The later service-realism iteration supersedes its sign, watering, fridge and QR limitations; see `SERVICE_REALISM.md`.

This branch builds on PR #2 (`feature/table-qr-orders`). It is not deployed at the existing Sites address.

## Implemented

- Black chairs with backs pointing away from each table; darker skin for Ken/Pun, cream boundary wall and white garden fence. Existing shop footprint, plants and lighting remain procedural 3D.
- Openable stock cabinet with separate vegetable, meat/frozen, drink, fresh-food and dry-goods shelves. Models disappear at zero stock and shrink with remaining stock; labels show exact game quantities. Models are representative containers, not a physical item per unit. Dry goods are a shared storage abstraction, not a refrigeration simulation.
- Production now walks to storage, deducts the recipe once, carries ingredients to the kitchen/bar, prepares, and hands the order to service. A partially completed collection survives save/load. The additional walking time reduces throughput relative to the previous version.
- Openable pot shows the current cooking job; preparation progress controls food/filled-drink visuals. These are staged procedural animations, not a hands-on recipe minigame.
- Takeaway NPCs wait in the front lane and carry their drink when leaving; the existing service task still controls delivery. No dynamic crowd avoidance has been added.
- Removed WC / STAFF door visuals and stopped new restroom visits. Old saved restroom trips can finish.
- Separate Dashboard in the game menu: waiting, working, planned and known next-hour issues. Low stock uses actual inventory; buying stock changes cash and inventory through the existing engine. Planning is a checklist, not automatic staff reassignment. Only announced events and menu cutoffs are forecast.
- Fixed idle off-duty servers remaining at their station rather than heading to rest after a shift change.

## Remaining / decisions

- Alee's additional ONE DAY sign on the ตรอ. sign is pending clarification: remove at 10:30 versus display during drinks-only hours 10:30–17:00 conflict in the request. Neither existing sign nor its timing is replaced speculatively.
- Keep the original shop footprint for this iteration; the reference's 5 × 50 m layout is not implemented.
- Taking manual control of a staff member still pauses that member's AI. Production is currently viewed by watching automatic staff in the scene, not by manually operating each cooking utensil.
- No completed-issue history, FIFO stock lots, actual QR camera, payment service, cloud backend or multi-device synchronization.
- No claim of photorealism, iPhone/Safari performance, or live deployment. Build output requires a working publishing integration before the old URL changes.
