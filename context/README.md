# Project context

Last updated: 2026-11-20. Phase: local app implemented; hosted Supabase backend verified; Pages release in progress.

Build a company-customizable Persian word game inspired by Wordle. Players use separate devices to solve the same five-letter puzzle in six attempts. The owner records externally and can select, randomly generate, schedule, and share puzzles.

## Read order

1. [Requirements](01-requirements.md): confirmed scope, defaults, and pending inputs.
2. [Architecture and infrastructure](02-architecture.md): hosting, backend, security, and deployment.
3. [Game and data design](03-game-and-data.md): Persian rules, puzzle lifecycle, and API contracts.
4. [Delivery plan](04-delivery-plan.md): implementation sequence and acceptance criteria.
5. [Current status and next steps](05-status-and-next-steps.md): project handoff and immediate actions.
6. [Decision log](06-decisions.md): rationale and unresolved choices.
7. [Alpha School design](07-brand-and-design.md): logo sources, palette, and Wordle hybrid direction.

## Working agreement

- Requirements describe the intended product; actual capabilities and verification are tracked in `05-status-and-next-steps.md`.
- User-confirmed requirements take precedence over proposed defaults.
- Keep implementation progress and next actions current in `05-status-and-next-steps.md` after each meaningful work session.
- Record changed technical decisions in `06-decisions.md`, and update the affected specification.
- Keep credentials, admin sessions, unpublished answers, and private recording links out of this folder and Git history.
- Company: Alpha School, using https://alphaschool.ir/ as the supplied brand reference. Product name and custom word policy remain pending.
- The user requested GitHub Pages. Do not create a Sites-hosted project or change hosting implicitly.

## Confirmed infrastructure

The implemented mobile-friendly React/TypeScript frontend targets GitHub Pages. A confirmed Supabase backend supplies admin authentication, private puzzle storage, and server-side game checks. This supports a real in-app admin screen while keeping the public website on GitHub Pages. The owner confirmed Supabase on 2026-11-20. The GitHub repository and Supabase database are provisioned, with live guest/game checks passing. See the status file for the current release result.

The GitHub-only alternative remains documented for historical tradeoffs; it is not the selected direction.
