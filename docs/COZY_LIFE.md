# ONE DAY — Cozy Life iteration (5 November 2026)

This iteration implements the owner's **Cozy Realistic + Slow Living + Café Management** brief on the existing 5 × 50 m world. It is a browser simulation, with one business state shared by manager panels, customer FPV and controlled employees. No external backend, payment gateway, analytics or credentials were added.

## Playable features

| Brief | Implementation and how to play |
| --- | --- |
| Morning / golden hour / night / rain | Sun position and warm sunrise/sunset colours follow the simulation clock. The nearby shadow map follows the camera along the lot. Garden and bar point lights fade in at dusk. Rain crosses the full lot and changes ground roughness. Settings offers Realistic, Cozy Realistic and Dreamy Cozy plus independent nature/spatial/life/weather switches. |
| Slow living | New games start at 0.25×. The shop menu offers 0.25 / 0.5 / 1 / 2 / 5×. Camera walking and ambient animals use presentation time independently of business speed. Customers can sit, drink a delivered drink and watch the road; no purchase is required to sit quietly. |
| Interactive café | Choose an employee, select a work category, walk to the indicated station, then perform each timed action. Drinks and food require collection followed by four preparation/plating steps. Servers collect a real ready ticket at pickup and deliver it to its customer; tables produce dirty dishes, which can be washed at the sink. Opening/sign/garden tasks can also be done manually. Automatic staff still use the same orders, recipes and ledger. |
| NPC life | Customers retain names, preferences, visit history, affinity and referrals. Visits have reading/chatting/coffee/inspection/takeaway activities. Reading customers linger with a visible book. Manager/customer cards allow one greeting per guest per day. Disabling memory suppresses repeat/referral selection without deleting guest history. There are quiet periods; the existing low arrival rate and scheduled rushes remain. |
| Small moments | A cat walks and rests, a butterfly flutters in dry daylight, leaves drift and foliage sways. Staff take quiet water breaks; vehicles pass on the road. These are lightweight procedural models, and ambient behaviour never calls the restaurant RNG. |
| Decorating and gardening | Open **สวนและความสะอาด**. Pack or restore owned tables while retaining 3–5 active tables. Move clean, empty tables to valid garden locations; choose cream/olive/clay/no umbrella; buy Monstera/rubber/fern pots in reserved border slots; change garden light colour. A plan shows the current layout. |
| Shared circulation and budget | Furniture and pots are actual pathfinding/camera obstacles, keyed by the current state rather than a mutable global layout. The main 1.5 m path stays clear. Reject occupied tables, overlapping placements and purchases over cash/setup budget. Decoration purchases reduce cash exactly once in `decoration` transactions and are capital investment, separate from food COGS and operating profit. Garden/shade care provides a small capped comfort bonus. |
| Daily journal and progression | **รายงาน** now also opens **สมุดชีวิตร้าน** before the first day closes. It includes actual event history, personal notes, milestone progress, repeat visitors and a photo album, alongside existing daily accounts and CSV. Planted pots grow with elapsed days and shared garden moisture. |
| Photographing the café | **ถ่ายภาพ** hides the main HUD. Adjust lens and presentation time, select front/bar/garden viewpoints, drag the camera, or hide tools. Business time rests during photography and resumes its previous paused/running state on exit. Saving captures the actual WebGL scene to JPEG, not a generated concept image. The album stores up to 24 images locally and supports download/delete. |
| 3D sound | Web Audio inverse-distance panners locate the grinder/brewing at the bar, cooking in the kitchen, traffic by the road, birds/crickets in the garden and rain drops under the awning. Listener position and orientation follow the actual camera, with mirrored X converted back into simulation coordinates. Sound only starts after user entry and respects mute/visibility and volume settings. |
| Manager | Existing prices, purchases, menu availability, costs/profit and operations dashboard remain. Staff shift times are editable; accepted work finishes before employees leave a shift. Ken/Pun still share one wage budget. |

## Site fidelity

The 250 m² plot uses the owner's supplied 5 × 50 m dimensions. The working facade faces the road, the **side bar hatch faces the inspection business**, and the rear kitchen remains enclosed. The kiosk now has a muted pink roof. The inspection shed, right-hand neighbour, grey wall, pole and overhead cables are context objects outside the owned plot.

See [the dimensioned proposal](design-5x50/site-layout-v2.json) for the coordinate origin, 0–5 m entrance forecourt, 5–13 m café/apron, seating, garden and rear service zones. The code does not establish a surveyed road-to-kiosk setback or boundary elevations from one photograph. The surrounding buildings and internal distances remain design estimates. Current procedural people, vegetation and furnishings are game models; this is not a claim of photographic or measured 100% replication.

## State and save guarantees

- `GameState.life` adds optional journal, photo metadata, pots, light selection and dirty dishes. Old saves receive defaults without deleting IndexedDB, money, accepted tickets or history. `version:1` remains supported.
- Table positions, activation and umbrellas now survive `validateSave`; previously it always restored default table positions. Controlled manual tickets are safely released to automation on reload, retaining `stockConsumed` and existing COGS.
- `staff-work` and `staff-step` are engine actions. Each step checks the actual employee position; camera/HUD code cannot directly modify the ledger.
- Closed reports wait for washing as well as table cleaning, inspection, watering and sign removal. The existing forced-close timeout discloses unfinished washing in the inspection report.
- Photo JPEGs are stored separately in browser IndexedDB to keep game JSON exports small. Metadata travels in game exports; download images before moving browser/origin. Existing saves on a different deployment URL require the existing export/import flow.
- Plant/umbrella/light prices are editable-game budget assumptions, not supplier quotes. Growth follows shared garden moisture, not an individual botanical simulation.

## Performance and verification

The initial application JS was reduced from roughly **454 kB gzip** to **158 kB gzip**, with a separate ~293 kB gzip scene chunk. The 3D chunk still exceeds Vite's 500 kB uncompressed warning. Asset loads have local Suspense boundaries so a plant download cannot suspend the welcome/management UI. Details use instancing and the low quality tier lowers particles, leaves and shadow-map resolution.

Vitest: **97/97 passed**, including manual production/reload/once-only costs and payment, decoration budget, shared moved-table routes and save preservation, real dirty-dish washing, greetings, shifts/wages, journal continuity and spatial attenuation. TypeScript/Vite build passed. Browser and deployment evidence is recorded in HANDOFF after its actual completion.

Physical iPhone/Safari performance, exact site measurements and photorealism are not established by these tests. Dynamic person-to-person avoidance remains separate from the furniture collision/pathfinding delivered here; it must not be described as complete.
