# DUEL Puzzle Book Builder

Run the local server, then open the builder URL:

```powershell
npm start
```

Open `http://127.0.0.1:4173`. Replicate does not support direct browser requests from a `file://` page, so AI generation requires the local server. The rest of the builder remains local.

## Book structure

The cycle sequence remains unchanged:

1. Fixed pages once.
2. Niche theme.
3. Guide.
4. Complete activity rotated 90 degrees right.
5. The same complete activity rotated 90 degrees left.

After all cycles, the builder appends a dynamic solution section to the main PDF and ZIP. Each solution page holds up to four real stored answers, so the page count is `ceil(solvable activities / 4)`. Competitive activities are excluded. A solutions-only PDF remains available as an optional export.

Solution sheets use clean answer tiles, lossless PNG embedding, and a 360 DPI PDF path. The on-screen assembled-book previews use lossless 110 DPI thumbnails so fine grids and letters remain crisp when the interface is zoomed.

## Puzzle library

- `puzzles/core.js` - registry, seeded random helpers, validation contract, and drawing API.
- `puzzles/catalog.js` - the 20 scanned families plus the two custom activity cards.
- `puzzles/logic.js` - Sudoku, Maze, Binoxo, and Crack the Code.
- `puzzles/word.js` - Word Search, Number Search, and Anagram.
- `puzzles/math.js` - Number Pyramid and Math Matrix.
- `puzzles/xo.js` - three quality-checked XO tactical boards per page.
- `puzzles/activities.js` - Dots & Boxes and the AI-ready Draw the Object activity.
- `puzzles/replicate-content.js` - Replicate content adapter, JSON validation, and safe normalization.
- `server.js` - dependency-free local static server and Replicate proxy.
- `puzzles/solution-pages.js` - lazy, dynamic four-answer pagination and rendering.
- `puzzles/AUDIT.md` - enabled/pending quality audit.
- `puzzles/PREMIUM_INTERIOR_AUDIT.md` - page-by-page visual findings and corrections.
- `puzzle-library-source/` - unchanged extracted archive for future adapters.

Every selectable generator must return an explicit validation record and pass its validator. Solvable puzzles store answer keys; competitive/open-ended activities explicitly declare that they have no answer key. Archive types that do not meet the quality contract remain visible but disabled.

## AI Content Studio

Select the activity types, puzzle count, and difficulty, then enter a niche, choose the audience/age and interior language, choose a tone, and add optional direction. Enter a fresh Replicate API token only when generating. The local proxy runs the fixed official `google/gemini-2.5-flash` model and applies the returned titles, instructions, footers, Word Search banks, Anagram banks, and Draw the Object prompts without changing puzzle mechanics or book order. Book-level introduction and guide copy can also be downloaded as JSON.

The token stays in the masked input and request memory only. It is forwarded through the local proxy in the `Authorization: Bearer` header and is excluded from model inputs, generated records, downloads, browser storage, source code, and logs. Do not paste a real token into source files or publish it with the app.

Run the repeatable quality suite with:

```powershell
node .\puzzles\tests\quality.test.js
node .\puzzles\tests\replicate-content.test.js
node .\puzzles\tests\server.test.js
node .\puzzles\tests\index-static.test.js
```
