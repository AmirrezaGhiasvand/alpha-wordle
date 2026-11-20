# Friend matches

Implemented 2026-11-21. GitHub Pages serves the same React app; Supabase stores room membership, secret words, attempts, and results. No extra hosting, email, or external messaging service is required.

## Player flow

1. Choose the people icon in the navbar and create a room.
2. Copy the invitation link and send it outside the app. The second participant opens it on their device/browser.
3. Each player chooses a valid five-letter Persian dictionary word for the other. Selection locks immediately. The same accepted dictionary is used as manual admin challenges, including words outside the curated random pool.
4. When both words are locked, the existing board opens automatically. Players guess independently; six attempts each.
5. Both finish before the final winner is shown. A solved word scores its guess count; failure scores seven. Lower wins, equal draws. Opponent progress counts update while the page is visible.
6. Reload resumes the same seat through the guest Auth session. A new room creates a rematch; resets are intentionally unavailable in a competitive round. Daily statistics are separate.

## Infrastructure and privacy

`20261120203924_friend_rooms.sql` creates two private RLS-protected tables and the authenticated `friend_api` RPC. The app never reads these tables directly. `friend_rooms` stores a hashed 256-bit invitation token, host, creation time, and expiry. `friend_players` stores exactly two distinct users/seats, a dictionary-validated locked word, attempts, request IDs, and status. Foreign keys are indexed.

Actions: `create`, `join`, `view`, `choose`, `guess`. All require an authenticated guest/member identity; all except joining require an existing seat. A room row lock serializes joins, word locking, and scoring. Create retries reuse a token, word retries reuse the same word, and guess retries reuse a request ID. Turn checks reject outdated guesses. Limits: 20 creations per user per day, two seats, six guesses, seven days of availability. Expiry denies access; it does not automatically delete rows.

The view exposes only the participant's chosen word, own attempts, opponent readiness/attempt count/status, and the relative winner. The target answer is returned only after that participant finishes. It does not return user IDs, invitation hashes, or the opponent's guess history. Only the first invited visitor can claim the second seat. Browser storage clearing cannot recover a seat, and cross-device account recovery is outside this guest-only feature.

The frontend uses the shared playing surface. A three-second visible-page polling loop updates readiness and results without blocking guesses. Mutation/version and route guards discard stale polling replies. There is no Realtime subscription or public table publication.

## Verification and maintenance

- Backend tests execute real migration SQL in PGlite: membership, direct access denial, two-seat limits, idempotency, locked dictionary words, secrecy, start barrier, scoring, failure/tie cases, reset denial, and expiry.
- Frontend tests cover invite parsing, choosing and submitting through the existing board, waiting/polling, and separation from daily statistics.
- Hosted two-browser verification covers the full room journey, winner agreement, and reload. The lobby and board were checked at 11 viewport sizes in both themes; daily layout/replay checks remain in CI.
- Secrets and live test fixtures stay in ignored `.local/`; never commit guest sessions or unpublished challenge tokens. Test rooms are removed by their isolated test host identity after live verification.
- Future maintenance: real-device Safari and regional connectivity checks; add retention cleanup only with an explicit retention policy. Abandoned rooms naturally become unavailable after seven days.
