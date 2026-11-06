# ONE DAY Agent Operating Contract

This document defines three **roles**, not three independently running agents. Execution requires an explicit ChatGPT/Codex runner or scheduled invocation; GitHub does not execute AI roles by itself.

## Scope and ownership
- **Cafe OS (50%)**: QR ordering, idempotent POS, KDS state transitions, stock reservation/consumption, refunds and closeout. Keep real orders, money, inventory and database strictly isolated from the simulation. Shared menu/recipe schemas may be imported as immutable reference data.
- **Site Designer (30%)**: audit real roadside entry, inspection station car corridor, right-side bar, drainage, power and 4–5 table accessibility. Unmeasured dimensions and prices remain unconfirmed. No claim that 5 tables fit until field verification.
- **Game Engineer (20%)**: preserve mobile V2 and three-mode state; one customer T3 order must propagate through Na preparation, Ken delivery, manager revenue and simulated stock. NPC collision and restricted areas are acceptance gates.

## Single backlog and execution order
1. Audit existing PR #21 and stacked PRs #22–33 before edits; never overwrite another agent's feature branch.
2. Deliver one full-day vertical slice: open → QR T3 → KDS → prepare → serve → pay → stock → closeout; verify cancel, duplicate and out-of-stock paths.
3. Check mobile touch controls, customer kitchen/bar/rest access restrictions, and NPC navigation.
4. Audit all original 24 acceptance items as one release set; report each as verified, failed, or unverified. Do not infer completion from source changes.
5. After MVP: furniture drag/drop, A/B layouts, event-log replay and bottleneck analysis.

## Git governance
- Each role writes on its own `feature/agent-cafe-os-*`, `feature/agent-site-*`, or `feature/agent-game-*` branch and opens a **draft PR**.
- Integration is a separate draft PR; never auto-merge main or production deploy.
- Before each edit: fetch current branch head, inspect relevant source and active PRs; do not rewrite the V2 UI.
- CI: `npm ci && npm test && npm run build && npm run test:e2e`; add mobile viewport checks and manual iPhone verification where available. Unrun tests must be labeled unrun.
- No unsupported claims about active Astra/Sol/Codex sessions, measured conversion, real traffic, or game performance.

## Hourly run handoff
1. Read current open PRs, latest commits and the shared backlog.
2. Select highest-risk vertical-slice blocker; implement code and tests when tool access allows.
3. Commit to role-specific feature branch and open/update draft PR.
4. Report commit, PR, verified preview, pass/fail/unrun tests, 24-item acceptance and newly added tasks, blocker, next action.
5. Owner reviews a consolidated before/after and test evidence once the whole acceptance set passes.

This contract alone does **not** schedule or spawn independent workers.
