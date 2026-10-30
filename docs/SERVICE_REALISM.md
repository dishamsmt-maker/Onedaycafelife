# Service realism iteration

The latest user instruction replaces the previous drinks-only sign schedule: the extra café sign is mounted in the morning and evening, removed at midday and closing. `signWanted` uses simulation time; only Alee's completed ladder task changes the mounted state. This may wait for her current task, or manual control to be released. The blue inspection sign is independent.

`GARDEN_PLANTS` now supplies both the 17 café plants drawn by the scene and the daily watering route. Each plant has a nearest reachable stopping point; the five distant background trees are scenery. Completion persists via `wateredCount`, resets each new day, and increases real soil moisture. The morning routine runs even during rain as explicitly requested, replacing the earlier rain-skip expectation. World navigation remains a fixed grid.

NPC dine-in customers hold a phone and submit orders from their table after a short scan period. The playable customer uses the QR button and camera-relative phone. This is a game simulation and does not request a device camera. Saved table names migrate to T1–T3 without changing table IDs or bills.

After an unresolved order has waited more than 10 simulation minutes, its customer raises a question once. The active server walks to the customer and acknowledges it between deliveries. No free completion, stock, money or patience bonus is created by the reply. Responses and sign work appear in notices.

Ready leaf orders appear at pickup; the existing engine switches that order to serving at pickup, the same menu model is carried on the server tray, and it appears at the table only after delivery. Bundle children retain their original accounting rules. Kitchen graphics add a pan/griddle, current meal, openable pot and prepared plates. Drink recipe families select preparation, grinding/extraction or tea/cocoa mixing, milk, ice, soda and finishing. These are procedural staged animations driven by actual job progress, not a physical fluid or finger simulation. Ingredients still deduct exactly once at collection; visual stages do not change the ledger.

The fridge removes text labels entirely. Ingredient color and shape vary by ID, empty ingredients disappear, and quantity affects their visible fill. Exact quantities remain available in inventory management. Cash register and queue screen read current game state; decorative notes in the cash drawer are representative.

Menu images already use Vite's BASE_URL from PR #4. The browser regression decodes all three atlases and captures the actual menu. Publishing now checks the game HTML and all three atlas URLs from the GitHub runner, because the cloud workspace's outbound policy blocks direct requests to the Pages host.

The game remains procedural 3D on the original footprint. No new external backend or payment service, photorealistic assets or real-device performance guarantees are included.
