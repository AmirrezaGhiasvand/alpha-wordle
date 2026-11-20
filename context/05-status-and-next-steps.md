# Current status and next steps

Updated: 2026-11-20. Phase: deployed and verified.

## Verified implementation

- Repository: https://github.com/AmirrezaGhiasvand/alpha-wordle (public, main branch).
- Site URL: https://amirrezaghiasvand.github.io/alpha-wordle/ (HTTP 200, guest play verified).
- Supabase: project darstcsugjxjgpmeotxl, https://darstcsugjxjgpmeotxl.supabase.co.
- GitHub Actions public URL/publishable-key variables are configured. No privileged key is in source or the browser.
- Four migrations applied: initial schema, replay rounds, verified admin enrollment, and lookup indexes.
- Dictionary: 43,773 accepted guesses; a separate selected launch pool of 340 eligible answers. The 49 demo fixtures are not the live answer pool.
- Anonymous sign-in is enabled and the live daily puzzle API is verified.
- Hosted smoke tests passed for a shared puzzle across two users, isolated progress, valid guesses, resets, denial of admin access, and protected private tables.
- Owner-approved admin email is stored only in the private database enrollment table. A confirmed email automatically receives admin membership; a changed/unverified email loses enrollment-derived membership. User-editable profile data cannot grant access.
- Original Alpha logo and wordmark, all-white transparent dark variant, identical theme sizing, white-default/dark themes, licensed self-hosted Vazirmatn, rounded tiles, subtle shadows/motion, one viewport-fitted layout.
- Reset/replay operate per player and round; the shared answer and prior recorded result remain unchanged.
- All demo/test-version interface text is removed.

## Validation

- 39 local tests passed (engine, dictionary, admin enrollment, authorization, replay, UI).
- Existing 22 viewport/theme checks and win/replay/reset/reload browser journey passed before production configuration. Live-site checks are performed after publication.
- Production build with real Supabase public configuration passes.
- `npm run check:backend` passes against the live project.
- All private tables have RLS and no direct anon/authenticated table grants.
- Supabase advisors: missing foreign-key indexes were fixed. Default-deny private tables intentionally have no RLS policies. Authenticated execution of the narrowly scoped security-definer RPC is intentional and protected by UID/ownership/admin checks. Password leak protection is a dashboard advisory; this app uses email OTP rather than passwords.

## Release and remaining user step

The user enabled anonymous sign-ins and supplied the admin email. They do not have a separate host/mail server, so the admin form now accepts default Supabase email links as well as OTP codes; custom templates are optional. Only project-origin verification links of type email/magiclink/signup are accepted; redirects are ignored. The owner must sign in at `#/admin`, request an email, then enter its code or copy/paste the original link without opening it. Email verification activates the privately approved role. Do not claim the owner has completed verification until observed.

Next user action: open the live admin page and verify the approved email using its code or original confirmation link. No custom templates or separate website host are required. Real-device Safari testing, email delivery capacity, and backup/retention operations remain maintenance follow-ups.

## Decisions for future sessions

No recording-mode toggle; one default layout. Keep the dark logo all white and transparent. Never expose answers before a round ends, put privileged keys into frontend config, or publish the fixed local demo as a live puzzle. The backend preflight is required before Pages publication.

Supabase skills were installed from supabase/agent-skills and read during setup. They are available for subsequent turns. The Supabase MCP server is now connected and authenticated; do not repeat the prior MCP setup/restart or key requests.

## Deployment result

GitHub Pages release e6b3552 completed successfully (Actions run 44769022356). CI also passed. Live checks at desktop 1440x900 and mobile 390x844 verified real Supabase play, a submitted guess, reset, both themes with equal logo dimensions, no scrolling, font loading, and admin login screen. Follow-up release fbc52bc also deployed successfully (Pages run 44769904194, CI run 44769904248). Its deployed bundle contains default-email-link admin verification. The live desktop/mobile smoke tests were repeated successfully after this release. Owner email verification remains a user sign-in step, not a completed agent action.
