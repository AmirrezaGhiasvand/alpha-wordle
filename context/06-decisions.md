# Decision log

Statuses: **confirmed** = requested by owner; **proposed** = planning recommendation; **implemented** = exists locally; **pending** = requires input or evaluation.

| ID | Status | Decision and reason |
| --- | --- | --- |
| D01 | Confirmed | Mobile-friendly website, hosted on GitHub Pages |
| D02 | Confirmed | Persian, standard five-letter/six-guess rules |
| D03 | Confirmed | Separate devices play the same puzzle; recording is external |
| D04 | Confirmed | Admin chooses/randomizes words, schedules future dates, and creates recording puzzles |
| D05 | Confirmed | Public play and future company branding |
| D06 | Confirmed | Pages + Supabase for genuine admin access, hidden answers, and shared game state |
| D07 | Implemented | React/TypeScript/Vite for the board, admin UI, and maintainable static build |
| D08 | Implemented | Hash routing avoids GitHub Pages deep-link rewrite requirements |
| D09 | Implemented | Asia/Tehran backend date; atomic lazy daily creation avoids reliance on a midnight CI job |
| D10 | Implemented | Anonymous player sessions and device-local statistics avoid player signup requirements |
| D11 | Implemented | Server-side guesses and immutable puzzle versions keep feedback/attempts consistent |
| D12 | Implemented | Random means selecting from a curated answer pool, with a reviewable candidate before publication |
| D13 | Implemented | Unlisted recording puzzles are independent of daily date; no live-room implementation |
| D14 | Confirmed | Alpha School logo/theme combined with familiar Wordle design; configurable CSS variables |
| D15 | Partial | Hazm MIT source filtered to 43,773 guesses; production editorial review/answer pool still pending |
| D16 | Pending | Final game name/custom word brief, admin identity, optional domain |
| D17 | Pending | Audience size, reachability, provider quotas/costs and retention targets |
| D18 | Confirmed | Use a proper modern Persian font: Vazirmatn, licensed IRANSans/IRANSansX, or a suitable modern alternative |
| D19 | Confirmed | Avoid AI slop: focused game interface, deliberate typography/spacing, restrained effects, and natural Persian copy |

| D20 | Implemented | Transactional PostgreSQL RPC replaces the proposed Edge Function layer |
| D21 | Implemented | Self-hosted variable Vazirmatn with SIL OFL notice |
| D22 | Confirmed | One recording-ready responsive layout only; remove recording-mode preferences and controls |
| D23 | Confirmed | Richer navy and blue/yellow palette; both light/dark themes; public game fits viewport without scrolling |
| D24 | Implemented | Public GitHub repository: AmirrezaGhiasvand/alpha-wordle |

| D25 | Confirmed | Header uses original Alpha logo/wordmark only; white light default, optional dark mode |
| D26 | Confirmed | Rounded tiles/navbar, subtle shadows and interaction animations, minimal styling |
| D27 | Implemented | Confirmed reset and post-game replay restart the same word; first saved result preserved; server round versions reject stale guesses |

| D28 | Implemented | Live answer pool: 340 selected common words, separate from 43,773 accepted guesses and 49 local demo fixtures |
| D29 | Implemented | Admin self-registration verifies the owner-approved private email allowlist before granting membership; email changes revoke enrollment-derived access |
| D30 | Implemented | Pages release checks real guest auth and the daily API; unit tests run with live connection values cleared |

| D31 | Implemented | Admin accepts an OTP code or an original project email verification link; custom email templates and redirect hosting are optional |

## Historical architecture alternative

Supabase is now approved. If the owner later requires zero services beyond GitHub, use repository/Actions administration and publish static puzzle data. This removes secure in-app administration and makes client-delivered answers inspectable, including scheduled data if shipped. Never claim that hashing a five-letter answer or hiding it in JavaScript protects it from inspection or enumeration. Revisit D06 and the definition of done explicitly if selecting this alternative.

## Change history

- 2026-11-20 (implementation): Repository created, app and backend source implemented, dictionary/license imported, and single-screen light/dark design verified in isolated browser tests. Deployment remains pending the hosted backend.

- 2026-11-20 (follow-up): Owner approved Supabase and supplied Alpha School as the branding source. Saved original logo assets and recorded the hybrid design specification. Brand review used source/CSS and the logo image; live browser review was unavailable.

- 2026-11-20: Initial plan recorded from the owner's answers. Recommendations remain proposals until the implementation direction is confirmed. No company details or infrastructure credentials are available.
