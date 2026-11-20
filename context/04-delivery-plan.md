# Delivery plan

Milestones are sequential, with acceptance gates. No calendar commitment is made until branding, backend choice, and dictionary availability are established.

## 0. Planning and handoff — complete

- Capture confirmed scope and technical recommendations.
- Create persistent requirements, infrastructure, game/data, delivery, status, and decision documents.
- Keep proposed decisions visibly separate from confirmed requirements.

Delivered: this context folder. The subsequent implementation is tracked in `05-status-and-next-steps.md`.

## 1. Brand and technical foundation

Alpha School reference and Supabase choice are confirmed. Apply `07-brand-and-design.md`, choose repository and account ownership, check target-audience service reachability, and validate Pages fit. Review a licensed Persian dictionary source and define eligible answer policy. Establish a neutral, accessible layout if brand assets are still pending.

Scaffold React/TypeScript/Vite; add brand configuration, RTL shell, project-subpath routing, environment template, and local development instructions. Establish minimal CI and dependency lockfile.

Acceptance: local production build serves correctly from the intended subpath; one coherent mobile board/keyboard layout; branding changes through configuration; dictionary source and license recorded. Do not block the core prototype solely on the final logo.

## 2. Persian game engine and playable prototype

Implement normalization, dictionary validation, repeated-letter scoring, keyboard input, six-attempt game state, win/loss dialogs, and storage recovery. Use a clearly marked development fixture; never embed production answers.

Acceptance: core tests cover exact matches, duplicate letters, excess duplicate guesses, Arabic/Persian variants, `آ`, diacritics, invalid input, unknown words, sixth-guess win/loss, and terminal-state submission rejection. A Persian reader reviews keyboard order and word quality. Test touchscreen, physical Persian keyboard, and paste/IME handling.

## 3. Backend and shared daily puzzle

Implement database migrations, anonymous sessions, private answer storage, safe puzzle metadata, atomic daily resolution, attempt processing, idempotency, and local/server reconciliation. Add ownership policies and quota/abuse controls.

Acceptance: separate devices receive one shared daily puzzle; simultaneous first requests cannot create different answers; unauthorized reads cannot reveal answers/schedules; one player cannot read another's game; retries/concurrency cannot add extra attempts. Confirm rollover in Tehran time regardless of device timezone and clock settings.

## 4. Admin workflow and recording challenges

Implement admin authentication and membership checks, curated-word entry, random selection, drafts, schedule editing, preview, immutable publication, recording links, revocation, and audit events. Seed the first administrator through a controlled backend operation.

Acceptance: ordinary and anonymous users are denied every admin mutation, including direct API calls. Admin can schedule a date, get a random candidate, edit a future draft, and publish a recording link. Two devices opening that link receive the same puzzle; revoked links reject new starts; active games follow the documented retirement policy. Published answer changes are rejected.

## 5. Company finish and recording usability

Apply final logo, color palette, font, copy, and result branding. Use the recording-ready view as the only layout; add answer-free sharing, local statistics, instructions, reduced motion, and clear focus/error states. Check long company names and logo sizing on narrow screens.

Acceptance: play works at 320px width without horizontal overflow and on the actual recording setup. Test iOS Safari, Android Chrome, and desktop browsers. Board status is understandable beyond color, controls have Persian accessible labels, and recording view keeps the board readable. Share results contain no answer. Screen capture remains entirely external. Verify both themes fit the complete game without page scrolling and expose no recording-mode switch.

Required design review: verify a proper modern Persian font across the board, keyboard, dialogs, and admin UI, including its redistribution license. Check against the anti-slop requirements in `07-brand-and-design.md`: deliberate spacing and hierarchy, restrained branding, natural Persian copy, and no decorative template clutter.

## 6. Staging, deployment, and handoff

Run appropriate type/build checks, core tests, authorization/integration tests, and focused browser journeys. Rehearse timezone rollover, lost responses, expired sessions, backend outages, and insufficient answer pool. Review bundle/network output for credentials and answer leaks. Verify load expectations and service quotas.

Deploy backend changes, then use GitHub Actions to publish the frontend on Pages. Verify the live repository subpath, shared recording link, admin login callback, and mobile play. Rehearse backup restore/forward fix in a safe environment and document operational ownership.

Acceptance: live URL is verified; no placeholders remain in company branding; deployment, rollback, admin onboarding, word scheduling, recording preparation, and recovery instructions exist. Actual deployment status and verification evidence are recorded in the status document.

## Definition of done

The owner can open an authenticated admin screen, choose or randomly select an approved Persian five-letter word, schedule a daily puzzle, and publish a separate recording challenge. Public visitors can solve the same daily puzzle on different devices, complete six-attempt games, and share answer-free results. The company-branded mobile website runs on GitHub Pages, with backend access controls verified and a usable maintenance handoff.
