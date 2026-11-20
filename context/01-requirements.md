# Requirements

## Confirmed by the owner

| Area | Requirement |
| --- | --- |
| Experience | Wordle-like game; separate devices, same puzzle |
| Platform | Mobile-friendly website |
| Language | Persian |
| Rules | Standard five-letter word, six guesses |
| Recording | External recording software |
| Admin | Choose a word, generate a random word, schedule future words, create recording puzzles |
| Audience | Public players can play |
| Hosting | Deploy the website on GitHub Pages |
| Backend | Supabase approved by owner |
| Typography | Proper modern Persian font, such as Vazirmatn or appropriately licensed IRANSans/IRANSansX |
| Design quality | Deliberate Wordle/Alpha hybrid; avoid generic AI styling, decorative clutter, and filler copy |
| Branding | Customize for Alpha School using https://alphaschool.ir/; hybrid Wordle/Alpha visual design |
| Documentation | Persistent context folder covering infrastructure, plan, status, and next steps |

## Proposed launch scope

- Persian interface, instructions, right-to-left layout, physical keyboard and on-screen Persian keyboard.
- Daily puzzle shared by all visitors; date selected by backend in `Asia/Tehran`.
- Guest play without email registration; technical anonymous sessions support server-side attempts.
- Saved progress on the current browser/device, win/loss state, and local statistics.
- Copy/share an answer-free result grid with puzzle identifier and link.
- Separate recording puzzles with stable links, so recording is independent of the daily rollover.
- One default recording-ready playing view with a large readable board and restrained animation; no alternate layout or mode switch.
- Both dark navy and blue-tinted light themes; less white and purposeful Alpha color.
- Public game fits one screen without scrolling on mobile and desktop; secondary dialogs/admin content may scroll internally.
- Responsive layout with high-contrast status cues and reduced-motion support.
- Admin dashboard for drafts, random selection, preview, scheduling, recording links, publication, and retirement.
- Brand configuration for logo, name, colors, licensed Persian font, instructions, and result footer.

## Boundaries

No live room, synchronized start, video capture, voice chat, public leaderboard, prize system, payments, or native mobile app is needed for launch. Other players' live progress is not shown. A shared puzzle link provides the common challenge; participants coordinate through the recording workflow outside the app.

Player progress and statistics do not synchronize across devices in the launch plan. Clearing browser storage can allow another attempt through a new guest identity. This is a casual game, not an enforceable competition.

## Defaults that need validation during implementation

| Topic | Proposed default |
| --- | --- |
| Backend | Supabase confirmed; account/project setup pending |
| Reset | Midnight in Asia/Tehran |
| Difficulty | Standard mode; later guesses need not reuse previous clues |
| Dictionary | Separate broad accepted-guess list and smaller curated answer list |
| Random generation | Random selection from approved answers, not AI-created words |
| Repeats | Exclude previous 180 daily answers when the curated pool permits; never silently weaken this rule |
| Missing daily word | Resolve one random answer transactionally on the first request of the day |
| Active daily puzzle | Lock content once published; emergency replacement uses a distinct puzzle identifier |
| Recording links | Unlisted, high-entropy links; possession of the link grants play access |
| Player analytics | No third-party analytics at launch |
| History | Existing started puzzles can be resumed; no public archive browser initially |

## Inputs to obtain next

The owner supplied Alpha School (https://alphaschool.ir/) and approved Supabase. Original logo assets and palette references are saved; see `07-brand-and-design.md`. Still establish the final game name, any company words/exclusions, GitHub account/repository, domain preference, administrator identity, and expected audience size before provisioning.

Validate dictionary licensing and editorial policy before public launch. Decide whether names, loanwords, inflections, and company terms qualify. Five-letter rules still apply to custom answers unless the owner changes scope.
