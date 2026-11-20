# Alpha School × Wordle design direction

Updated: 2026-11-20. Scope: implemented local design and maintained brand reference. Latest requirements below supersede earlier optional-mode styling.

## Latest confirmed design

- Original Alpha logo and wordmark only in the header; no separate product-name text. This preserves the website artwork's typography exactly.
- White light theme by default, with an optional dark theme and saved user preference. Alpha blue/yellow remain restrained accents.
- A compact rounded navbar, rounded board tiles/keyboard keys, fine borders, gentle shadows, and brief input/reveal/dialog transitions. No decorative gradients, continuous motion, or effects unrelated to interaction. Respect reduced motion.
- One responsive layout for everyday play and external recording; no recording-mode switch. Full board and keyboard fit the viewport. Secondary dialogs/admin content can scroll internally.
- Reset in the navbar, with confirmation during an active game. Play Again after completion restarts the same shared word and preserves previously recorded statistics.
- Vazirmatn remains self-hosted for UI text under its SIL OFL license. The website's separate IRANYekanX/Lahze binaries are not redistributed without reuse rights.
- 22 viewport/theme checks and a win/replay/reset/reload browser journey pass; desktop/mobile screenshots were inspected. Real-device Safari review remains pending.

## Original confirmed direction

The owner approved GitHub Pages + Supabase and supplied [Alpha School](https://alphaschool.ir/) as the company reference. Combine the familiar Wordle playing surface with Alpha School identity. Keep the game immediately recognizable and readable during external recording.

## Observed brand evidence

The website logo combines a blue Persian wordmark with a blue/yellow symbol. The header's inline symbol uses `#11538D` and `#F9DC08`. The site's CSS includes primary blue `#006FEE`, banner blue `#064E8C`, banner yellow `#FFDF45`, pale blue `#E6F1FE`, and near-black `#171717`. Its font declarations include `iranyekanxFont` and `lahzeFont`. These are observed implementation values, not an official brand manual. [Company website](https://alphaschool.ir/)

Saved references:

- [Original website logo](brand-reference/alpha-logo.png): transparent PNG, 111 × 40 pixels; preserve proportions.
- [Original inline header symbol](brand-reference/alpha-header-mark.svg): vector mark extracted without altering paths or colors.
- [Source manifest](brand-reference/sources.json): source URLs, retrieval date, asset hashes, and observed palette.

The PNG was visually inspected. The live browser was unavailable, so rendered desktop/mobile site layout has not been verified. Source inspection identified the brand values; headless prototype screenshots have since been reviewed, while a full live-company-site visual comparison remains pending. No website font binaries were downloaded; font redistribution rights remain unverified. Choose a licensed Persian font before shipping. The small PNG should not be enlarged for large video overlays; use the vector symbol beside live Persian brand text or obtain a higher-resolution wordmark if needed.

## Hybrid design specification

| Element | Planned treatment |
| --- | --- |
| Overall structure | Compact header, one central five-column/six-row board, Persian keyboard below |
| Header | Alpha logo/mark, working title, help/statistics/settings icons, subtle blue divider |
| Board | Flat square tiles, bold isolated Persian letters, crisp borders, narrow consistent gaps |
| Empty tiles | White fill, neutral border; active row uses a restrained blue border |
| Input | Rightmost cell is first logical letter; tile lettering remains visually isolated |
| Feedback | Correct green, present yellow, absent gray; keyboard mirrors the same meanings |
| Brand expression | Alpha blue buttons and headings, yellow highlights, pale-blue supporting surfaces |
| Dialogs | Rounded company-themed panels around instructions, results, and admin forms |
| Animation | Brief entry feedback and sequential tile reveals; respect reduced motion |
| Results | Familiar attempt distribution and answer-free grid with Alpha branding |
| Default playing view | Largest board fitting available space, persistent small logo, minimal secondary information; no alternate mode |

Keep familiar game feedback colors rather than recoloring correct tiles blue. The approved hybrid direction does not fix exact tile hex values; those below are proposed implementation tokens. Branding should frame the board while preserving clear gameplay semantics. Use original implementation and icons; do not copy NYT logos, proprietary fonts, or source assets. The live NYT Wordle page could not be inspected in this session; this specification describes the requested familiar layout, not a pixel comparison with its current release.

## Proposed theme tokens

| Token | Value | Use |
| --- | --- | --- |
| `brand-primary` | `#11538D` | Header identity, primary controls |
| `brand-accent` | `#F9DC08` | Small highlights; dark blue text |
| `brand-link` | `#006FEE` | Focus treatments and selected controls where contrast passes |
| `brand-soft` | `#E6F1FE` | Supporting panel backgrounds |
| `surface` | `#FFFFFF` | Playing surface |
| `text-primary` | `#171717` | Main text and empty tile letters |
| `tile-border` | `#D4D4D4` | Empty tile border |
| `tile-correct` | `#538D4E` | Correct letter/place, white text |
| `tile-present` | `#F9DC08` | Present letter/wrong place, dark text |
| `tile-absent` | `#787C7E` | Absent letter, white text |

Check actual text/background contrast and non-color status cues during implementation, especially disabled controls and small labels. Share text uses conventional green/yellow/gray emoji so puzzle results remain understandable across messaging apps.

## Responsive layout and Persian typography

- **Required:** use a proper modern Persian font throughout the interface, including board letters, keyboard, dialogs, and admin screens. Prefer Vazirmatn for the initial implementation; IRANSans/IRANSansX or another modern Persian family is acceptable with appropriate licensing. Do not ship with an Arabic-oriented or Latin system fallback as the intended Persian typography. Verify the selected font's license before bundling and self-host approved files.
- Review Persian glyph shapes, weight, spacing, numeral style, and line height in context. Avoid artificial letter spacing in connected Persian text and do not synthesize bold when a real weight is available. Font fallbacks are for loading failures only.
- Use a narrow centered play area, approximately 500–560px maximum width on desktop. Keep the game prominent without recreating the company's marketing homepage.
- Target tiles around 56–62px where height allows; reduce smoothly on small screens. Test a 320px-wide device and short landscape viewports. Size tiles to the available frame and reflow landscape screens; the complete playing surface must fit without page scrolling. Dialog/admin content can scroll internally.
- Fit the Persian alphabet through reviewed keyboard rows with explicit Enter/Delete controls and comfortable touch targets. Confirm row layout with a Persian reader; do not mirror key positions accidentally with CSS direction.
- Size letters for recording legibility and prevent clipping of Persian glyphs/diacritics. Body and control text use readable Persian typography; the English Wordle title font is not required.
- Keep public game links, puzzle IDs, and brand signature visible enough for participants to confirm the same challenge. Hide admin navigation from ordinary player views; authorization remains server enforced.

## Required design language: avoid generic AI styling

The owner explicitly requires a deliberate, polished interface without AI slop. Use precise typography, consistent spacing, a clear visual hierarchy, and the familiar game layout. Make each decorative choice serve play, accessibility, or Alpha School identity.

- Keep the play surface flat and focused. Use blue and yellow purposefully; avoid decorative gradients, glowing elements, glass effects, floating blobs, and oversized shadows.
- Keep tiles crisp and controls consistent. Avoid unnecessary card containers, excessive pill shapes, decorative badges, random emoji, and oversized marketing headlines.
- Use concise, natural Persian copy. Avoid generic motivational slogans, filler text, invented metrics, and decorative labels with no useful information.
- Use restrained motion that communicates input, feedback, or completion. Avoid continuous animation and attention-seeking effects.
- Check the actual interface for optical alignment, balanced whitespace, readable letterforms, icon consistency, and compact mobile usability. A generic dashboard or landing-page template does not meet this brief.

These are acceptance requirements for the prototype and final design, not optional polish.

## Product copy and open choices

Historical working name (removed from interface): **واژه آلفا**. This is a placeholder, not a confirmed company product name. Default labels describe today's puzzle, recording challenge, attempts, rules, and sharing in Persian. Use encouraging, concise copy suitable for Alpha School's audience; no copied marketing paragraphs are needed.

Implemented: the themed local game with licensed Vazirmatn, responsive viewport fitting, and light/dark themes. Still pending: final game name, company word policy, optional higher-resolution wordmark, and hosted integration/real-device review.

Logo refinement (2026-11-20): added `public/alpha-mark-dark.svg`, preserving the original vector paths and yellow accent while changing blue fills to a pale foreground. Both logo variants have transparent backgrounds and identical dimensions/viewBox. Removed all dark-theme logo padding/background plates. Browser checks assert equal rendered logo size, zero padding, and transparency across both themes at all 11 tested viewport sizes.

Logo update (2026-11-20): the owner requested a completely white dark-theme logo. All dark-logo path fills are now #FFFFFF, including the former yellow accents. Transparency, original paths, viewBox, and dimensions remain unchanged; this supersedes the earlier two-color dark variant.
