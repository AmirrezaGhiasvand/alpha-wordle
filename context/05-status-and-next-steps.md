# Current status and next steps

Last updated: 2026-11-20. Phase: implemented local app; source published; hosted backend pending.

## Current state

| Item | Status |
| --- | --- |
| Workspace | E:/wordle; React/TypeScript/Vite application implemented |
| Repository | https://github.com/AmirrezaGhiasvand/alpha-wordle; public, owner-authorized |
| Architecture | GitHub Pages frontend + Supabase Auth/PostgreSQL; backend not connected yet |
| Game | Persian normalization, six attempts, duplicate-letter scoring, keyboard/paste, saved demo progress |
| Design | One recording-ready layout; navy dark default and blue-tinted light theme; no mode switch |
| Typography | Self-hosted variable Vazirmatn; SIL OFL license included |
| Branding | Original Alpha artwork; symbol export for header/favicon; blue/yellow theme |
| Player features | Results, local statistics, answer-free sharing, high contrast, light/dark preference persistence |
| Admin | Email OTP, curated/manual/random word choice, drafts, dates, challenge links, revoke/retire UI implemented |
| Backend | SQL migration with private tables and authenticated transactional RPC; locally tested, not applied to hosted Supabase |
| Dictionary | 43,773 Hazm-derived accepted guesses; MIT license/provenance retained; editorial review pending |
| Answers | 49 original development fixtures; expand/review the production pool before launch |
| Validation | 32 automated tests and 22 viewport/theme layout checks passed; production build passed |
| Visual review | Headless Chrome screenshots inspected at desktop and mobile sizes; real iOS/Safari review pending |
| Hosting | CI and Pages workflows prepared; deploy waits for Supabase repository variables |
| Live deployment | None; repository creation is separate from site deployment |

## Latest user requirements

Use less white, more Alpha color, and both light and dark modes. Fit the public game into one screen on phones and desktop without scrolling. Make the former recording layout the only layout. These supersede the earlier optional recording-mode design.

The board now sizes to its available container using viewport/container units; landscape phones place the board beside the keyboard. This is one responsive layout, not a user-selectable alternate mode. Dialogs and admin forms can scroll internally so content stays accessible; the game document does not scroll.

## Verification evidence

- `npm test`: 32 passing tests across engine, dictionary, player UI, and PostgreSQL-compatible migration/authorization checks using PGlite.
- `npm run test:layout`: 22 passing checks, both themes at 320x480, 320x568, 360x640, 390x844, 430x932, 768x1024, 1280x720, 1440x900, 1920x1080, 844x390, and 568x320.
- Layout checks assert document bounds, full tile/key visibility, board/frame containment, no board/keyboard overlap, Vazirmatn use, and absence of a recording-mode switch.
- `npm run build`: passes. The lazy development dictionary chunk produces a size advisory; it is loaded only when a local-demo guess needs validation.
- Latest dependency installation audit: zero vulnerabilities.
- Tests use a fresh isolated headless browser, not a personal profile. They do not validate hosted Supabase Auth or independent concurrent production connections.

## Immediate next steps

1. Monitor the GitHub CI run; source push and remote commit are verified.
2. Connect/select the owner's Supabase project. Apply the migration, configure anonymous guest sign-in and admin OTP, and add the verified admin UUID through owner-controlled SQL.
3. Import accepted guesses with `npm run dictionary:sql`; review/approve a production answer pool large enough for the 180-day exclusion rule. Development fixtures are not a production calendar.
4. Set the public Supabase URL/publishable key as GitHub Actions repository variables. Enable Pages Actions hosting and deploy when backend checks pass.
5. Verify live mobile play, hosted authorization, OTP delivery, daily rollover, recording links/revocation, traffic controls, and backup recovery.

Never repeat the Supabase or GitHub repository authorization question: both are already approved. Never put privileged secrets into browser config or Git history.

## Session history

- Initial planning and Alpha brand research were recorded earlier in this folder.
- First implementation produced the app, transactional SQL backend, dictionary tooling, and tests; a workspace helper failure prevented its final context reconciliation.
- Current session restored file access, authenticated GitHub through its existing credential helper, created the authorized repository, and replaced the layout with the required one-screen light/dark design. Historical context has been reconciled to the implemented state.

## Publication result

Source pushed to `origin/main` and independently verified through GitHub API. Implementation commit: `6356ab84ea07`. Pages Actions hosting is configured. The Pages workflow was skipped as intended because Supabase variables are absent. CI was running when last checked; its result can be viewed at https://github.com/AmirrezaGhiasvand/alpha-wordle/actions. Local verification remains 32 tests, 22 layout checks, and a passing production build.
