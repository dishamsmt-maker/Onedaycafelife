# Full-site 5 × 50 m implementation

Owner approved the design and authorized implementation, merge and deployment. Approved proposal lives in `docs/design-5x50/`. Site dimensions supplied by the owner; kiosk, frontage, levels and rear buildings remain design assumptions, not measured survey data.

World layout now covers 250 m², main public route through all 50 m, 5 tables / 20 seats, front apron, 3 × 6 m galley kiosk and garden stool bar. Stations, physical bench/wall obstacles and tables use the same centred world coordinate system (site X minus 2.5 m); rendering still mirrors X explicitly. Public visitors cannot enter the work areas or rear staff area. Staff enter the kiosk through its side opening. Collision-aware routes are cached and copied to preserve simulation snapshot isolation.

New games initialise employees at new stations and begin prep at 05:30, allowing the actual plant round before 06:30 opening. Travel speeds are calibrated for the longer distances and satisfaction allows ten rather than six simulated minutes before the wait penalty. Normal shared wages remain unchanged. Full-day and duplicate stock/payment tests retain financial assertions.

`layoutVersion: 2` is independent of save version 1 and catalog version 2. Legacy migration preserves bills, stock, cash and ledger, keeps t1–t3, adds t4/t5, maps seated actors by table and workers by station, recalculates walking routes and maps the old17-plant progress onto22 plants. Existing IndexedDB is not deleted. Migration is tested for idempotence.

Scene has the new cream/wood kiosk, split order/pickup counter, 1.5m galley aisle, appliance/prep/wash areas, roof in first-person, paved forecourt/drain, fence, grey boundary, utility-pole context, full garden path, tables and rear placeholder service block. It remains procedural blockout/material work: no claim of photorealism, final authored GLB/PBR assets, fully solved person-to-person avoidance, or iPhone performance. Station/door dynamic reservations and final furniture clearance refinement remain open. Bar stool interaction and fully resolved rear measured layout are not complete.

Validation is recorded in HANDOFF.md for each actual run. Existing browser fixtures now refer to the moved table/counter coordinates; the public-circulation regression walks the full50m corridor. Restroom round-trip allowance accounts for the longer route. Capacity assertions now use20 rather than12 because there are five tables. Business and transaction assertions are preserved.
