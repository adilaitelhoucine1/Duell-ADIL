# Puzzle generator — fixed version

The completed generator is `kdp-generator.html`. It is still a single-file browser application, so the full HTML, CSS, JavaScript, puzzle generators, and PDF renderers are together in that file.

## What was changed

- The central generator now contains 20 working game types. The original list had 21 entries; Crossword was removed as requested.
- Added the four games that were missing from the central generator: Jigsaw Sudoku, True or False, Guess the Flag, and Flag Match.
- Jigsaw Sudoku and True or False are now real generators instead of the original “Coming Soon” placeholder pages.
- Added `Select All Games` and `Clear All` buttons with a live `x of 20 games selected` counter.
- All primary puzzle values now use one shared bold style and one shared target size (18 pt by default).
- Dense layouts such as Cross Sudoku and Flower Sudoku use the same target, but the helper safely reduces a value only when the physical cell cannot contain it.
- Kakuro clues, Killer Sudoku cage sums, and Calcudoku cage labels now use the same large 18 pt target instead of unrelated tiny multipliers (with safe fitting for multi-digit clues).
- Futoshiki `<`/`>` symbols, Sum Puzzle `+`/`=` symbols and row/column labels were enlarged separately so they remain readable between cells.
- The shared font helper is used by Sudoku, Flower Sudoku, Cross Sudoku, Killer Sudoku, Kakuro, Futoshiki, Calcudoku, Binoxo, Sum Puzzle, Number Search, Number Pyramid, Math Matrix, Crack the Code, Word Search, Crossword numbering, and maze markers.
- Step 3 now has puzzle-number controls for target size, color, and font family.
- Step 3 accepts multiple PNG/JPG background images (up to 48, 8 MB each).
- Every generated page—number pages and game pages—gets a background from a shuffled random cycle. With multiple images, the same image is not used on two adjacent pages.
- Uploaded backgrounds are converted to low-opacity PNG data before PDF rendering. This keeps text and grid lines readable and avoids depending on optional PDF transparency support.
- Background strength (4–30%) and layout (`Cover page` or `Repeat as pattern`) can be changed in Step 3.
- Preview and export reuse the exact background assigned when pages are built, so the exported PDF matches the preview.

## Quick start

1. Open `kdp-generator.html` in a modern browser.
2. Choose the book size and games.
   Use `Select All Games` to enable all 20 available games at once.
3. In Step 3, select all desired background photos at once, or add them in several batches.
4. Keep `Background Strength` near 8–15% for most photos.
5. Adjust `Puzzle Number Style` if desired, generate the preview, and export the PDF.

The page loads jsPDF 2.5.1 from cdnjs, so an internet connection is required when the page is first opened. The optional Gemini word-generation feature also requires internet access and a Gemini API key. No package installation or build command is required.

If a browser restricts local files, serve the folder as a static site. From this folder, either of these common options works if installed:

```powershell
py -m http.server 8000
```

```powershell
npx serve .
```

Then open the local URL shown in the terminal and choose `kdp-generator.html`.

## Where to customize the look

Search `kdp-generator.html` for:

```javascript
const VISUAL_STYLE = {
```

This is the central code-level style block. Its sections control:

- `page`: paper color, default image opacity, cover/tile mode, tile size, and image resolution.
- `fonts`: base font, shared puzzle target size, minimum fit size, clue target size, and title size.
- `colors`: puzzle values, titles, grid lines, Kakuro blocks, and Kakuro clues.
- `borders.scale`: multiplies shared grid/border widths (`1.25` makes them 25% heavier).

For ordinary use, the Step 3 controls are easier and override puzzle font family, size, color, background opacity, and background layout without editing the source.

The central rendering helpers are directly below the `SHARED HELPERS FOR GAME MODULES` comment:

- `drawPageBackground(...)` controls photo placement.
- `puzzleValueFontSize(...)` performs the safe physical fit check.
- `applyPuzzleValueStyle(...)` applies the common bold font and color.
- `gridLineWidth(...)` applies the global border scale.

## Background image notes

- Supported formats: PNG and JPG/JPEG.
- Maximum collection: 48 images.
- Maximum file size: 8 MB per image.
- `Cover page` is best for photos; `Repeat as pattern` is best for seamless patterns or small illustrations.
- Images are downsampled in memory before PDF generation to keep output size manageable. Change `VISUAL_STYLE.page.maxImagePixels` if higher resolution or smaller files are more important.
- Backgrounds are stored only in browser memory for the current session; the source photos are not modified.

## Verification performed

- Inline JavaScript syntax check passed with Node.js.
- Full 48-page preview generation passed for Kakuro, Killer Sudoku, and Flower Sudoku.
- PDF modal rendering passed for all three affected games with no browser console errors.
- Multiple JPG upload passed with two images.
- A game page rendered successfully with the faded photo background and readable grid/clue values.
