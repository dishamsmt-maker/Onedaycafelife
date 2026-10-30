# Table QR and takeaway prototype

This iteration builds on `sites-v3-baseline`. It changes the playable customer journey; no real camera scanning, payment gateway, online ordering or backend is included.

## Try it

- Enter the cafe and let the clock reach opening time (06:30).
- Dine in: walk near a garden table, sit, then press **แตะ QR เพื่อสั่ง**. A table-specific menu opens. Confirm an item, then open **บิลและคิว** to follow kitchen/bar production and delivery. Pay after orders have resolved. Additional items share the current customer's bill.
- Takeaway: walk to the front counter, open the menu and confirm an item. Open the bill and press **ยืนยันชำระ … และเข้าคิว**. Production starts only after payment. Collect and close the bill after delivery; collection does not charge again. Takeaway never reserves a table.
- Existing saved games remain loadable. Previously accepted orders retain their legacy behavior; new player orders use the new channels.

## Data and accounting

`visitor-submit` carries a channel and request ID. The engine rejects duplicate IDs within a live bill, invalid channel transitions, unavailable menu items and table-QR submissions without a reserved table. The visitor UI requires the simulated scan before submitting a table order. Channel and request IDs are optional Customer fields so old saves remain compatible.

Counter prepayment records simulated sales once. The production scheduler excludes unpaid counter jobs, including bundle children. If a paid counter order is unfinished when the customer leaves or closing forces departure, its root price is refunded once; produced ingredient costs remain. Food/drink metrics subtract the corresponding refund entries. This is game accounting, not a financial reporting system for a real business.

## Scope and next steps

- NPC order-taking and staff task priorities retain the baseline behavior. This iteration focuses on the controllable player's two ordering channels.
- Cashier order-entry time and a separate front-counter worker queue are not yet simulated. Payment is a player confirmation, not an animated staff task.
- The table sign and QR icon simulate scanning; they do not encode a live URL. The bill tracks item states; it does not yet estimate a waiting time or explain every blocked-station cause.
- There is no new real-device Safari/FPS certification.
- Publishing still requires access to the original Sites project or another user-authorized hosting destination. Creating a PR does not publish this game.
