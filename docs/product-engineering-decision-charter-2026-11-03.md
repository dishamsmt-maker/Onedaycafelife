# ONE DAY — Product & Engineering Decision Charter
Date: 2026-11-03
Status: Owner direction for future planning and feature-branch reviews; not deployment approval.

## North star
Build ONE DAY as a genuine, small-business startup MVP: a playable, credible 3D café simulation and a separately safeguarded real-café operating system. Each iteration must produce measurable operational or user value AND create evidence of real engineering practice and learning. Do not confuse project complexity with demonstrated individual coding proficiency.

## Decision priorities
1. Real café value first: order accuracy, service time, ease of staff work, stock visibility, profit clarity, mobile usability.
2. Preserve V2 gameplay and the three operating modes; keep exactly T01–T03 customer tables and existing real-site constraints.
3. Build verifiable engineering quality: maintainable architecture, tests, reproducible bug reports, reviewable changes, observability, privacy and safe data handling.
4. Demonstrate ownership: for each significant task record problem, alternatives, design choice, human work vs AI-assisted work, risks, test results and measured outcomes. Avoid claiming proficiency based only on AI-generated code.
5. Use AI pragmatically: begin with simple reliable logic/statistics; add ML only when justified by real data and validation.
6. Minimize spend and complexity. Prefer direct GitHub edits when suitable. Before any Codex usage, explain why it is needed, likely scope, and request owner approval. Never imply GitHub edits consume Codex quota.
7. Feature branch -> draft PR -> evidence and owner review -> merge/deploy only after explicit approval. Do not deploy or modify production automatically.
8. Separate synthetic game data from real transactions. No real POS, prices, payment capture or halal claims until separately verified and approved.

## Definition of done for each feature
- Acceptance criteria tied to customer/staff/business benefit.
- Code review notes and regression impact.
- Automated tests where feasible; mobile/browser smoke test and screenshots for visual changes.
- Explicit pass/fail/untested labels; do not mark complete merely because code was committed.
- Engineering learning note: concepts applied, what the owner can explain, and what remains AI-assisted.

## Portfolio evidence track
Keep an honest engineering case study: requirements -> system design -> PR/commit -> tests -> observed outcome -> lessons. Distinguish game prototype from live café software. Track outcomes only with measured, sourced figures; do not fabricate revenue gains, customer counts or seniority claims.

## Current delivery tracks
A. Game: 18 owner playtest changes plus six cross-cutting recommendations, with PR #19 as the review thread.
B. Café OS: staged QR ordering/POS, staff workflow, stock and analytics. See docs/cafe-os-owner-roadmap-2026-11-03.md.
C. Learning: TypeScript/React/Three.js, Python, database design, debugging, testing, system design and applied ML through actual tasks.

## Pre-task decision note (required)
State: goal; benefit; Codex YES/NO/UNDETERMINED; risk; verification plan; owner decision needed (if any). Stop for owner approval before Codex, merge or deploy.
