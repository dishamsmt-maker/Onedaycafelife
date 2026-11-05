# ONE DAY Café OS — owner-approved roadmap (2026-11-03)

Scope: REAL café MVP first; game V2 playtest changes tracked separately in PR #19. This document authorizes planning and implementation on feature branches only, NOT production launch, real payments, menu approval, or merge.

## Phase 1: usable phone-first MVP
- T01–T03 QR menu and ordering, plus separate takeaway/pickup orders. QR labels physically flat and small.
- Order state machine: placed -> accepted -> preparing (kitchen/bar routing) -> ready -> served/picked-up -> paid -> closed/cancelled; timestamps, role-based access, unique IDs, no double fulfillment.
- Ham: owner/manager dashboard; Na: kitchen/drinks; Ken/Pun: shared service queue; Alee: assigned operational tasks.
- Staff confirmation before fulfillment; manual fallback when offline; audit log and basic privacy controls.
- Prices, menu, halal suitability, recipes, and payment configuration remain UNAPPROVED until owner explicitly verifies; do not treat game catalog as real café menu.
- Payment record only at MVP; no live payment gateway or actual charging without separate approval.

## Phase 2: operations
- Inventory ledger with recipe-linked deductions only after verified recipe data, reorder alerts, daily closing reconciliation, cost and gross-margin reporting.
- Workload balancing and wait-time indicators; order pickup station flow.
- Daily sales and hourly demand dashboard, using actual real-store data only.

## Phase 3: AI and retention
- Simple statistical forecasting first, ML only when data volume/quality supports it.
- Privacy-conscious loyalty via optional opt-in; no unnecessary personal data.
- Export aggregated/anonymized real data into a separate simulation dataset; never write synthetic game transactions into real sales or inventory.

## Physical service design
- Right-side bar flush against wall; no walkable rear gap; keep staff clearance and safe circulation.
- Clear coffee pickup point and compact waiting seat, preserve 3 dine-in tables, unobstructed inspection-center traffic and walkway.

## Acceptance / release gates
1. Test order lifecycle for dine-in, pickup, cancellations, duplicate prevention, simultaneous staff access and offline recovery.
2. Verify phone usability, permission boundaries, inventory arithmetic, and data separation.
3. Obtain owner sign-off on actual menu/prices, halal evidence, workflow and deployment.
4. Feature-branch PR, screenshots and test evidence; no automatic merge or production deployment.
