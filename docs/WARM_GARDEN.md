# Warm garden at night — 5 November 2026

The owner's iPhone screenshot at19:20 showed readable path lights but almost black seating, umbrella undersides and plants. The former garden lights were low along the fence, far from table surfaces, with weak ambient/ground bounce.

Changes:
- Continuous day/night ambient fill with a warmer ground hemisphere. Night remains a blue sky; daytime exposure is retained.
- Warm task lighting beneath umbrellas and at the bar, front and garden, using at most4 real local point lights on low quality or6 on high. The bounded pool follows the camera. Shared table positions determine lamp positions, including relocated tables.
- Instanced string lights and supports across the seating/garden; small tabletop lights and under-umbrella fittings provide visible fixtures.
-97 added decorative plant groups in perimeter beds: low fern clusters, larger Monstera and upright rubber plants. New potted groups avoid reserved player-purchase slots. These expand the existing22 care beds without resetting watering/save progress, adding paid purchases or modifying the ledger.
- Brighter leaf pigments, subtle leaf bounce and bent leaf geometry make vegetation legible in shade. Instancing and stable planting keys avoid per-frame/per-tick rebuilds of the whole garden.
- Disable text selection on the play HUD so a long touch does not select the ONE DAY heading while looking around. Management text fields retain normal input.

Evidence so far:
-105/105 unit/simulation tests and TypeScript/Vite build pass.
- Actual portrait390×844, low-quality captures at19:20 from the same camera are in `/workspace/designs/night-garden-before/seating.png` and `/workspace/designs/night-garden-tuned/seating.png`.
- Mean image luma in the same table/chair region increased from37.52 to113.37 on the0–255 image scale. This is an image-readability comparison, not a physical lux measurement or a phone display calibration.
- Both captures had no JS/shader errors and no changes to paused business state. The same view measured437 draw calls before and after; the richer vegetation increases triangles from114716 to158614. Software-renderer FPS is not physical-iPhone performance evidence.
- A browser regression captures an actual in-game JPEG and checks that the previously dark seating region is legible, with a bounded light pool and unchanged cash/stock/orders/ledger. Browser/CI outcomes and deployment are authoritative on this PR's final head.

The owner's 5×50 layout, inspection-facing bar window, enclosed kitchen, money, stock, shared table state and existing game saves remain intact. This is a lighting/landscaping iteration, not a claim of photorealistic100% replication or a real-device Safari certification.
