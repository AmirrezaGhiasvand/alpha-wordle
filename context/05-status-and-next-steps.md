# Current status and next steps

Updated: 2026-11-21. Phase: friend-match backend deployed; frontend release in progress.

## Play with a friend

- Added a people icon in the navbar. Create a room, copy its `#/friend/<64-hex-token>` invitation, and open it on the second player's device/browser.
- Each participant locks a five-letter dictionary word for the other. Both must choose before either can guess. The existing board, keyboard, pending feedback, and short reveal animation are reused.
- Six attempts each. Fewer successful guesses wins; a solved word beats a failure; equal successful scores or two failures draw. Results appear after both finish. Friend matches cannot reset and do not alter daily statistics; a new room starts a rematch.
- Private `friend_rooms` and `friend_players` tables have RLS, no direct client grants, indexed foreign keys, two-seat uniqueness, and a seven-day expiry. `friend_api` checks membership and locks each room transactionally. Invitations are cryptographically random; only SHA-256 hashes are stored. Chosen target answers and opponent guesses are never sent before the relevant player finishes.
- Visible rooms poll every three seconds without blocking guess submissions. No overlapping polling requests; stale responses cannot overwrite mutations or route changes. Progress survives reload in the same browser's guest session. Clearing browser storage loses that seat.
- Room creation is idempotent and limited to 20 per user per day; word locking and guesses are retry-safe. A third player receives a room-full error. The invitation grants the first second player a seat, so share it privately.
- Migration `20261120203924_friend_rooms.sql` applied to hosted Supabase after local PostgreSQL tests. See [friend implementation](09-friend-matches.md).
- Validation: 53 tests pass, production build passes, original 22 viewport/theme checks pass, and a real hosted-backend match in two isolated browser contexts passes create/invite/choose/guess/winner/reload. Friend lobby and board pass 44 viewport/theme checks, with no lobby scrolling at the supported sizes.
- Advisors reviewed: intentional default-deny private RLS and authenticated security-definer RPCs, matching the existing architecture; no missing foreign-key indexes. See [RPC advisor explanation](https://supabase.com/docs/guides/database/database-linter?lint=0029_authenticated_security_definer_function_executable) and [default-deny RLS notice](https://supabase.com/docs/guides/database/database-linter?lint=0008_rls_enabled_no_policy).

Next step: verify GitHub Actions publication and repeat the two-player browser journey at the public Pages URL. Real-device Safari and regional network testing remain maintenance follow-ups.

## Verified implementation

- Repository: https://github.com/AmirrezaGhiasvand/alpha-wordle (public, main branch).
- Site URL: https://amirrezaghiasvand.github.io/alpha-wordle/ (HTTP 200, guest play verified).
- Supabase: project darstcsugjxjgpmeotxl, https://darstcsugjxjgpmeotxl.supabase.co.
- GitHub Actions public URL/publishable-key variables are configured. No privileged key is in source or the browser.
- Six migrations applied: initial schema, replay rounds, verified admin enrollment, lookup indexes, manual dictionary answers, and friend rooms.
- Dictionary: 43,773 accepted guesses; a separate selected launch pool of 340 eligible answers. The 49 demo fixtures are not the live answer pool.
- Anonymous sign-in is enabled and the live daily puzzle API is verified.
- Hosted smoke tests passed for a shared puzzle across two users, isolated progress, valid guesses, resets, denial of admin access, and protected private tables.
- Owner-approved admin email is stored only in the private database enrollment table. A confirmed email automatically receives admin membership; a changed/unverified email loses enrollment-derived membership. User-editable profile data cannot grant access.
- Original Alpha logo and wordmark, all-white transparent dark variant, identical theme sizing, white-default/dark themes, licensed self-hosted Vazirmatn, rounded tiles, subtle shadows/motion, one viewport-fitted layout.
- Reset/replay operate per player and round; the shared answer and prior recorded result remain unchanged.
- All demo/test-version interface text is removed.

## Validation

- 53 local tests passed (engine, dictionary, admin enrollment, authorization, replay, friend rooms, UI).
- Existing 22 viewport/theme checks and win/replay/reset/reload browser journey passed before production configuration. Live-site checks are performed after publication.
- Production build with real Supabase public configuration passes.
- `npm run check:backend` passes against the live project.
- All private tables have RLS and no direct anon/authenticated table grants.
- Supabase advisors: missing foreign-key indexes were fixed. Default-deny private tables intentionally have no RLS policies. Authenticated execution of the narrowly scoped security-definer RPC is intentional and protected by UID/ownership/admin checks. Password leak protection is a dashboard advisory; this app uses email OTP rather than passwords.

## Release and remaining user step

The user enabled anonymous sign-ins and supplied the admin email. They do not have a separate host/mail server, so the admin form accepts default Supabase email links as well as OTP codes; custom templates are optional. Only project-origin verification links of type email/magiclink/signup are accepted; redirects are ignored. A verified approved owner account and admin membership have since been observed in the private database.

No admin setup action is pending. Real-device Safari testing, email delivery capacity, and backup/retention operations remain maintenance follow-ups.

## Decisions for future sessions

No recording-mode toggle; one default layout. Keep the dark logo all white and transparent. Never expose answers before a round ends, put privileged keys into frontend config, or publish the fixed local demo as a live puzzle. The backend preflight is required before Pages publication.

Supabase skills were installed from supabase/agent-skills and read during setup. They are available for subsequent turns. The Supabase MCP server is now connected and authenticated; do not repeat the prior MCP setup/restart or key requests.

## Deployment result

GitHub Pages release e6b3552 completed successfully (Actions run 44769022356). CI also passed. Live checks at desktop 1440x900 and mobile 390x844 verified real Supabase play, a submitted guess, reset, both themes with equal logo dimensions, no scrolling, font loading, and admin login screen. Follow-up release fbc52bc also deployed successfully (Pages run 44769904194, CI run 44769904248). Its deployed bundle contains default-email-link admin verification. The live desktop/mobile smoke tests were repeated successfully after this release. Owner email verification remains a user sign-in step, not a completed agent action.

Latency/custom-link fix (2026-11-20): reproduced a token parsing off-by-one: `#/p/` has length 4, but the client sliced at 5, dropping the first hex character. Added shared route/link helpers and regression coverage. One baseline live submission took 315 ms for the RPC and configured a further 760 ms reveal; database RPC execution averages about 5 ms in current statistics, so no speculative database changes were made. Replaced 3D flips with a 140 ms transform/opacity reveal plus 15 ms stagger (200 ms total), scoped to the newly confirmed row only. Stable row keys preserve DOM, and resumed rows do not animate. Pending row/submit-spinner feedback is immediate; scoring and six-attempt authority remain on the server. Added tests for generated custom-link round trips, delayed replies, preserved retry IDs, and stable rows. Local tests: 44 passing; build passing. A single temporary live verification challenge was created to verify the complete route with the hosted API and was retired after successful post-release checks; existing user challenges were not modified. Release 1840f49 deployed successfully (Pages run 44774851640), and CI run 44774850957 passed. Live browser checks confirmed the complete 64-character token, 200 ms reveal, stable previous rows, and no reveal replay on reload. Pending DOM feedback updated in 1 ms in the live browser measurement; this is UI state timing, not server/network latency. Original network verification remains authoritative. All 44 tests and the production build pass.

Manual-answer selection fix (2026-11-21): the owner reported that the valid dictionary word تخفیف was rejected for a challenge. It exists with eligible=false; the old admin_save check incorrectly applied the curated random-pool restriction to manual choices. Applied migration 20261120203123_manual_dictionary_answers.sql: manual choices accept any existing normalized five-letter dictionary entry; random suggestions and automatic daily selection still use eligible=true. No dictionary entries were globally approved or removed. Verified live create/open/solve with this word inside a rolled-back transaction; no test challenge persisted. All 45 tests and the build pass. Admin help text now explains the manual/random distinction.
