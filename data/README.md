# Persian dictionary inputs

`accepted-words.json` contains 43,773 five-letter lexical candidates filtered from the Hazm word list at the immutable commit recorded in `dictionary-source.json`. The upstream project is MIT licensed; its full notice is retained in `HAZM-LICENSE.txt`.

Filtering applies the game's normalization rules and rejects whitespace, joiners, mixed scripts, punctuation, and lengths other than five. This is a broad **accepted-guess** list, not a daily-answer list. Some entries may be obscure, inflected, names, or unsuitable for the company's audience; Persian editorial review remains required before launch.

`starter-answers.json` contains 49 original development fixtures. The fixed local demo answer is one of these words. They are deliberately not a production content calendar, and the 180-day exclusion rule will exhaust a pool this small. Populate and review a substantially larger eligible pool before running automatic public daily puzzles.

Run `npm run dictionary:sql` to generate `.local/accepted-guesses.sql` for database import. It inserts accepted guesses with `eligible=false` and preserves existing answer approvals. Run through owner-controlled database tooling after applying the migration. It never approves all imported words as answers.

To approve an editorially reviewed answer, use an owner-managed SQL operation such as:

```sql
update wordle_private.words set eligible=true
where dictionary_version=1 and word='REPLACE_WITH_REVIEWED_WORD';
```

The app's admin word picker accepts eligible answers only. Anonymous players cannot modify the dictionary. Do not remove words or change the meaning of an existing dictionary version while puzzles reference it; use a new schema/content migration when changing the normalization or versioning rules.

## Launch answers

`launch-answers.txt` contains 340 selected common five-letter words from the accepted-guess source, with names and sensitive/obscure candidates excluded during initial review. This pool exceeds the 180-day exclusion window. `npm run answers:sql` generates a separate approval update; importing the broad dictionary alone never approves answers. The 49 original demo fixtures remain for automated/local tests only and were not used to seed the live answer pool. Company-specific editorial review can refine future answers without changing an already published puzzle.
