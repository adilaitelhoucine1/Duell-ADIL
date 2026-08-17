# Puzzle library audit

Source scanned: `gamesIdeas-complete.zip` (42 files, 20 puzzle families). Per the interior redesign request, True or False was removed from the active catalog and replaced by XO Tactics, so the UI still contains 20 cards.

The builder only enables a family after its adapter returns a validated activity record. Solvable families must store a real answer key; competitive activities must explicitly declare that an answer key does not apply. The original source has been preserved unchanged in `puzzle-library-source/`.

## Enabled and quality-certified

| Puzzle | Quality gate |
| --- | --- |
| Sudoku | Backtracking solver confirms exactly one solution. |
| Maze | Perfect-maze construction and endpoint path validation. |
| Binoxo | Backtracking solver confirms exactly one solution. |
| Dots & Boxes | Competitive 5 x 5 dot grid and maximum-box rules are validated; no false answer key is produced. |
| Draw the Object | Prompt sanitization and judging rules are validated; no false answer key is produced. |
| Crack the Code | Exhaustive candidate check confirms one code. |
| Word Search | Every displayed word and its coordinates are verified. |
| Number Search | Every displayed number and its coordinates are verified. |
| Anagram | Every scramble has exactly the same letter multiset as its answer. |
| XO Tactics | Each page has three legal boards; exhaustive move checks confirm exactly one winning move per board. |
| Number Pyramid | The complete addition tree is recomputed and checked. |
| Math Matrix | Backtracking confirms one grid matches all row/column sums. |

## Scanned but disabled pending a certified adapter

- Jigsaw Sudoku
- Kakuro
- Sum Puzzle
- Cross Sudoku
- Killer Sudoku
- Flower Sudoku
- Futoshiki
- Calcudoku
- Guess the Flag
- Flag Match

These are kept visible in the UI as part of the scanned catalog. They are not selectable because their archive implementations do not yet provide the same puzzle + answer + automated quality contract. Flag games also depend on external image data, so they are not suitable for reliable offline PDF generation yet.
