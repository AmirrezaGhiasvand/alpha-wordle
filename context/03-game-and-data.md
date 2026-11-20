# Game and data design

## Persian text contract

- Render the document with `lang="fa"` and right-to-left direction. Place the first logical letter in the rightmost board cell. Test cursor/input and keyboard behavior independently of layout direction.
- Use one shared normalization specification for dictionary ingestion, admin selection, and player input; backend normalization is authoritative.
- Normalize Unicode to NFC, convert Arabic `ي` to Persian `ی` and `ك` to `ک`, remove combining vowel marks and tatweel, and trim surrounding whitespace. Preserve `آ` as distinct from `ا`.
- Reject internal whitespace, zero-width joiners/non-joiners, punctuation, digits, mixed scripts, and unsupported letters for launch. Do not silently turn compound words into a different spelling. Explicitly enumerate the allowed Persian alphabet, including `آ`, in implementation.
- After normalization, require exactly five allowed letters. With this restricted alphabet each accepted letter occupies one Unicode code point; never use unvalidated string length as the game rule.
- Mobile composition/paste must finish normalization before submission. Invalid or unknown guesses display a Persian message without using an attempt.
- Maintain a broad licensed accepted-guess dictionary and a curated answer subset. All answers must also be accepted guesses. No invented AI-generated dictionary entries.

Editorial review is required: the word pool and handling of spelling variants are not yet validated by a Persian reviewer. Include examples for each normalization rule and rejection category during implementation.

## Scoring and keyboard

Use the standard two-pass repeated-letter algorithm: mark exact matches, then assign present/absent marks from the unmatched answer letter counts. Consume each remaining occurrence at most once. Keyboard statuses only improve from absent to present to correct. Never reveal an answer in share text, page metadata, URLs, or open puzzle responses.

Accept six valid guesses; a correct guess wins immediately, otherwise the sixth ends the game. Reveal the answer after the game ends. Server-side scoring and stored attempt count remain authoritative; client scoring tests can exercise the same pure rules with fixtures.

## Daily and recording puzzle lifecycle

1. Admin creates a draft by typing a curated word or requesting random selection; preview is local to the admin workflow.
2. Validate normalized length, allowed guesses, curated answer policy, scheduling conflicts, and exclusions.
3. Admin schedules a daily date or publishes a recording challenge. Daily dates are unique; puzzle identifiers and rules versions are immutable.
4. For a new day without a scheduled puzzle, a database transaction resolves one eligible random word and inserts the unique daily record. Concurrent first requests must return the same puzzle. Random generation excludes recently used daily answers and reserved upcoming answers; an empty pool is an explicit admin-resolvable error.
5. Resolve date using the backend clock in `Asia/Tehran`; return server time and next rollover timestamp. Treat ISO date strings as identifiers; Persian calendar display is presentation only.
6. A page opened across midnight checks the current puzzle when resuming or starting. Preserve a started old puzzle and offer today's game separately; never mix guesses between IDs.
7. Lock a published puzzle's answer, dictionary version, and rules. Editing an unused future draft is allowed; transactions prevent editing a puzzle while it is being activated. Emergency replacement creates a new ID and retains existing attempts.
8. Recording links use high-entropy opaque tokens, independent of the word and daily date. Same token resolves the same immutable puzzle across devices. Mark links as unlisted; they are shareable access capabilities, not authenticated private rooms. Revocation blocks new starts; existing games may finish unless the admin explicitly disables the puzzle for all play.

## Logical data model

| Entity | Main fields / constraints |
| --- | --- |
| dictionary_versions | ID, provenance/license, normalization version, approved status |
| words | ID, dictionary version, normalized text, accepted-guess flag, answer eligibility, tags/exclusions |
| puzzles | ID, daily/recording kind, nullable daily date, secret answer reference, dictionary/rules version, state, revision, publish time; unique daily date for active daily records |
| recording_access | Puzzle ID, token hash, revoked time; raw token shown only when created |
| admin_memberships | Auth user ID, role; server-managed only |
| games | ID, user ID, puzzle ID, attempt count, outcome, timestamps; unique user/puzzle |
| attempts | Game ID, attempt index, normalized guess, feedback, idempotency key; unique game/index and game/key |
| admin_audit | Actor, action, affected puzzle, timestamp; redact answers and tokens from general logs |

Draft and scheduled answer data is private. Public responses project only safe puzzle metadata. Guess-validation lookup should answer whether one submitted word is accepted, without exposing the curated answer pool. Admin-defined company words must be inserted into a reviewed dictionary revision before use.

## API responsibilities (proposed contracts)

| Operation | Behavior |
| --- | --- |
| Resolve daily | Returns ID, rules, server time, rollover, availability; no answer |
| Resolve recording token | Resolves authorized unlisted puzzle; stores no raw token in logs |
| Start/resume game | Authenticated guest identity; creates once or returns own existing game |
| Submit guess | Verifies identity, ownership, puzzle status, normalized word, turn, and idempotency key; atomically stores attempt and result |
| Get own game | Returns guesses/feedback/outcome; includes answer only for a finished game |
| Admin list/preview | Requires admin; returns draft/scheduled puzzle details |
| Admin randomize | Requires admin; chooses from eligible curated words; never publishes implicitly |
| Admin save/schedule/publish | Requires admin; validates date and expected revision to prevent lost updates |
| Admin revoke/retire | Requires admin; records audit event and applies documented access behavior |

When a response is lost, retrying the same submission returns the stored result. Concurrent submissions cannot consume the same turn twice or exceed six attempts. Invalid words and stale state return explicit error codes, allowing the client to refresh safely.

## Device state and recording flow

Browser cache keys include deployment namespace, puzzle ID, and schema version. Store only the player's own game and preferences. Reconcile against the backend after refresh; cached data cannot overwrite server attempts. Recover gracefully from corrupt storage, storage denial, or an expired guest session. Explain that cleared sessions may lose access to saved games.

For recording: admin prepares and previews a recording puzzle, copies its link, then sends it to participants outside the app. Participants independently open it on their own devices. Confirm the puzzle identifier before recording. The owner captures each screen using their external recording setup. A fresh browser profile can be used for rehearsal; production statistics must not be silently reset. The answer-aware admin should not be assumed to participate blind.
