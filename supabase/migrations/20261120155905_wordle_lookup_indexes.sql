create index games_puzzle_id_idx on wordle_private.games(puzzle_id);
create index puzzles_dictionary_answer_idx on wordle_private.puzzles(dictionary_version,answer);
