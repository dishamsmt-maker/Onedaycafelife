# Rear reference structures — 6 November 2026

Added two visible rear structures from the owner's reference board:

- A timber garden pavilion centred at z32.8m, approximately3m wide ×3.4m deep, with charcoal pitched roof, timber soffits, four columns, ridge/fascia, garden-house sign, lanterns and warm light strips. It is an open pavilion rather than an enclosed playable room.
- The existing rear service block at x0.2..2.2/z43.5..48.5 now has a projecting dark roof, timber soffit, framed front opening, small front landing, side restroom door, ventilation panel and wall lamps. This replaces the featureless box; its solid existing collision footprint remains. Interior bathroom gameplay was not added.

Dimensions/locations are interpreted from the image within the existing playable5×50m site, not surveyed dimensions. The continuous left public walkway remains open. Rendered pavilion columns and navigation share `PAVILION_POSTS`; collision prevents crossing columns. Existing tree and planting positions remain intact. Decorative rain excludes both roofs. Existing bounded nearby light pool serves the garden/service zone; no unbounded new point lights.

No save schema, finance, production or table changes. Current routes remain traversable around the new posts. Tests verify column collision, the entire rear corridor, paths into the pavilion and to the restroom, and actual browser walking from the entrance through z49. Final visual test takes day/evening pavilion and evening service-block screenshots and asserts identical paused business state and no JS/shader errors.

Results:106/106 unit tests, build exit0 (existing chunk warning); browser result and screenshots recorded in HANDOFF. Not deployed; repository instructions still prohibit push to the currently public repository.
