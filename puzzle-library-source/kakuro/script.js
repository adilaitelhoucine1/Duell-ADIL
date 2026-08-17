document.addEventListener('DOMContentLoaded', () => {
    const gridEl = document.getElementById('kakuro-grid');
    const newGameBtn = document.getElementById('new-game-btn');
    const checkBtn = document.getElementById('check-btn');
    const solveBtn = document.getElementById('solve-btn');
    // const notesToggle = document.getElementById('notes-toggle'); // Removed
    const difficultySelect = document.getElementById('difficulty-select');
    const numBtns = document.querySelectorAll('.num-btn');
    const messageArea = document.getElementById('message-area');
    const langSelect = document.getElementById('language');

    const translations = {
        en: {
            newGame: "New Game", check: "Check Solution", solve: "Show Solution", validate: "Validate Puzzle",
            noteMode: "Note Mode",
            msgCorrect: "🎉 Correct! You solved it!",
            msgMistakes: "Mistakes found!",
            msgIncomplete: "Puzzle not complete!",
            msgRevealed: "Solution revealed!",
            msgValid: "✅ Puzzle validated! (runs OK)",
            msgInvalid: "⚠️ Puzzle may have issues. Click Validate for details.",
            pdfStatus: "Generating... Please wait.",
            pdfDone: "Done!",
            puzzle: "Puzzle",
            solution: "Solution",
            confirmSolve: "Reveal the solution?",
            kakuroTitle: "Kakuro"
        },
        de: {
            newGame: "Neues Spiel", check: "Lösung prüfen", solve: "Lösung zeigen", validate: "Puzzle prüfen",
            noteMode: "Notiz-Modus",
            msgCorrect: "🎉 Richtig! Du hast es gelöst!",
            msgMistakes: "Fehler gefunden!",
            msgIncomplete: "Puzzle nicht vollständig!",
            msgRevealed: "Lösung aufgedeckt!",
            msgValid: "✅ Puzzle validiert! (Läufe OK)",
            msgInvalid: "⚠️ Puzzle hat evtl. Fehler. Klicke Validieren.",
            pdfStatus: "Generiere... Bitte warten.",
            pdfDone: "Fertig!",
            puzzle: "Rätsel",
            solution: "Lösung",
            confirmSolve: "Lösung aufdecken?",
            kakuroTitle: "Kakuro"
        },
        fr: {
            newGame: "Nouveau Jeu", check: "Vérifier", solve: "Montrer Solution", validate: "Valider Puzzle",
            noteMode: "Mode Notes",
            msgCorrect: "🎉 Correct ! Vous avez résolu !",
            msgMistakes: "Des erreurs trouvées !",
            msgIncomplete: "Puzzle incomplet !",
            msgRevealed: "Solution révélée !",
            msgValid: "✅ Puzzle validé ! (séries OK)",
            msgInvalid: "⚠️ Problèmes possibles. Cliquez sur Valider.",
            pdfStatus: "Génération... Veuillez patienter.",
            pdfDone: "Terminé !",
            puzzle: "Puzzle",
            solution: "Solution",
            confirmSolve: "Révéler la solution ?",
            kakuroTitle: "Kakuro"
        },
        it: {
            newGame: "Nuova Partita", check: "Controlla", solve: "Mostra Soluzione", validate: "Valida Puzzle",
            noteMode: "Modalità Note",
            msgCorrect: "🎉 Corretto! Hai risolto!",
            msgMistakes: "Trovati errori!",
            msgIncomplete: "Puzzle incompleto!",
            msgRevealed: "Soluzione svelata!",
            msgValid: "✅ Puzzle validato! (serie OK)",
            msgInvalid: "⚠️ Possibili problemi. Clicca Valida.",
            pdfStatus: "Generazione... Attendere prego.",
            pdfDone: "Fatto!",
            puzzle: "Puzzle",
            solution: "Soluzione",
            confirmSolve: "Rivela soluzione?",
            kakuroTitle: "Kakuro"
        }
    };
    
    let currentLang = 'en';

    // Game state
    let grid = [];           // 2D array of cell objects
    let solution = [];       // 2D array of solution values (null for black cells)
    let runs = [];           // Array of run objects { cells, sum, direction }
    let gridSize = 9;
    let selectedCell = null; // {r, c}

    // Cell types
    const CELL_BLACK = 'black';
    const CELL_WHITE = 'white';
    const CELL_SOLID = 'solid'; // Completely black, no clues

    initGame();

    newGameBtn.addEventListener('click', initGame);
    checkBtn.addEventListener('click', checkSolution);
    solveBtn.addEventListener('click', revealSolution);
    solveBtn.addEventListener('click', revealSolution);
    
    langSelect.addEventListener('change', (e) => {
        currentLang = e.target.value;
        updateUIText();
    });
    
    // Validation button
    const validatePuzzleBtn = document.getElementById('validate-puzzle-btn');
    if (validatePuzzleBtn) {
        validatePuzzleBtn.addEventListener('click', validateGeneratedPuzzle);
    }

    numBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            const val = btn.dataset.val;
            const action = btn.dataset.action;
            if (action === 'erase') handleInput(null);
            else handleInput(parseInt(val));
        });
    });

    document.addEventListener('keydown', (e) => {
        if (!selectedCell) return;
        
        const key = e.key;
        if (key >= '1' && key <= '9') handleInput(parseInt(key));
        if (key === 'Backspace' || key === 'Delete') handleInput(null);
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            e.preventDefault();
            moveSelection(key);
        }
    });

    function initGame() {
        updateUIText();
        const difficulty = difficultySelect.value;
        gridSize = difficulty === 'easy' ? 7 : difficulty === 'medium' ? 9 : 11;
        
        selectedCell = null;
        messageArea.textContent = '';
        
        generatePuzzle();
        renderGrid();
        
        // Auto-validate and show result
        autoValidatePuzzle();
    }
    
    function updateUIText() {
        const t = translations[currentLang];
        newGameBtn.textContent = t.newGame;
        checkBtn.textContent = t.check;
        solveBtn.textContent = t.solve;
        
        const valBtn = document.getElementById('validate-puzzle-btn');
        if (valBtn) valBtn.textContent = t.validate;
        

    }
    
    function autoValidatePuzzle() {
        // Quick validation check after generation
        let isValid = true;
        let errorCount = 0;
        
        for (const run of runs) {
            const values = [];
            let actualSum = 0;
            
            for (const cell of run.cells) {
                const val = solution[cell.r][cell.c];
                if (val === null) { isValid = false; errorCount++; continue; }
                values.push(val);
                actualSum += val;
            }
            
            if (new Set(values).size !== values.length) { isValid = false; errorCount++; }
            if (actualSum !== run.sum) { isValid = false; errorCount++; }
        }
        
        const t = translations[currentLang];
        if (isValid) {
            messageArea.textContent = t.msgValid;
            messageArea.style.color = '#388e3c';
        } else {
            messageArea.textContent = t.msgInvalid;
            messageArea.style.color = '#f57c00';
        }
    }

    function generatePuzzle() {
        // Initialize empty grid
        grid = [];
        solution = [];
        runs = [];

        for (let r = 0; r < gridSize; r++) {
            grid[r] = [];
            solution[r] = [];
            for (let c = 0; c < gridSize; c++) {
                grid[r][c] = { type: CELL_SOLID, hClue: null, vClue: null, value: null, notes: new Set() };
                solution[r][c] = null;
            }
        }

        // Create a Kakuro pattern
        createPattern();
        
        // Identify all runs
        identifyRuns();
        
        // Validate that all white cells are part of at least one run
        if (!validatePattern()) {
            generatePuzzle();
            return;
        }
        
        // Fill in solution using backtracking
        if (!solvePuzzle()) {
            // If solving fails, regenerate
            generatePuzzle();
            return;
        }
        
        // Calculate clues from solution
        calculateClues();
        
        // Validate the puzzle - ensure all clues match
        if (!validatePuzzle()) {
            generatePuzzle();
            return;
        }
        
        // Clear player values (keep solution separate)
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c].type === CELL_WHITE) {
                    grid[r][c].value = null;
                    grid[r][c].notes = new Set();
                }
            }
        }
    }
    
    function validatePattern() {
        // Ensure every white cell is part of at least one run of length >= 2
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c].type === CELL_WHITE) {
                    const inRun = runs.some(run => 
                        run.cells.some(cell => cell.r === r && cell.c === c)
                    );
                    if (!inRun) {
                        return false; // Orphan white cell found
                    }
                }
            }
        }
        return true;
    }
    
    function validatePuzzle() {
        // Verify every run's clue matches its solution sum
        for (const run of runs) {
            let actualSum = 0;
            const values = [];
            for (const cell of run.cells) {
                const val = solution[cell.r][cell.c];
                if (val === null) return false;
                actualSum += val;
                values.push(val);
            }
            
            // Check for duplicates
            if (new Set(values).size !== values.length) {
                return false;
            }
            
            // Check sum matches clue
            if (actualSum !== run.sum) {
                return false;
            }
        }
        return true;
    }

    function createPattern() {
        // Create a valid Kakuro pattern
        // First row and first column are always black (for clues)
        // We'll create a pattern that ensures valid runs
        
        // Mark borders as black
        for (let r = 0; r < gridSize; r++) {
            grid[r][0].type = CELL_BLACK;
            grid[0][r].type = CELL_BLACK;
        }

        // Create white cells with some black cells interspersed
        // Use a pattern that creates valid runs (2-9 cells)
        for (let r = 1; r < gridSize; r++) {
            for (let c = 1; c < gridSize; c++) {
                // Create white cells with occasional black cells
                const shouldBeBlack = shouldPlaceBlackCell(r, c);
                grid[r][c].type = shouldBeBlack ? CELL_BLACK : CELL_WHITE;
            }
        }

        // Ensure no isolated white cells and valid run lengths
        fixPattern();
    }

    function shouldPlaceBlackCell(r, c) {
        // Create a varied pattern
        // Avoid too many consecutive white cells
        // Avoid isolated white cells
        
        const rand = Math.random();
        
        // Corners tend to be black
        if (r === gridSize - 1 && c === gridSize - 1) return rand < 0.7;
        
        // Create some randomness with constraints
        // Check horizontal run length
        let hRunLen = 0;
        for (let cc = c - 1; cc >= 0 && grid[r][cc].type === CELL_WHITE; cc--) hRunLen++;
        
        // Check vertical run length
        let vRunLen = 0;
        for (let rr = r - 1; rr >= 0 && grid[rr][c].type === CELL_WHITE; rr--) vRunLen++;
        
        // Force black if run would be too long
        if (hRunLen >= 8 || vRunLen >= 8) return true;
        
        // More likely to be black at certain positions
        if ((r + c) % 5 === 0 && rand < 0.4) return true;
        if (hRunLen >= 4 && rand < 0.3) return true;
        if (vRunLen >= 4 && rand < 0.3) return true;
        
        // General probability
        return rand < 0.15;
    }

    function fixPattern() {
        // Fix isolated white cells and ensure minimum run length of 2
        let changed = true;
        let iterations = 0;
        
        while (changed && iterations < 100) {
            changed = false;
            iterations++;
            
            for (let r = 1; r < gridSize; r++) {
                for (let c = 1; c < gridSize; c++) {
                    if (grid[r][c].type === CELL_WHITE) {
                        // Check if this cell is isolated
                        const hasHNeighbor = 
                            (c > 1 && grid[r][c-1].type === CELL_WHITE) ||
                            (c < gridSize - 1 && grid[r][c+1].type === CELL_WHITE);
                        const hasVNeighbor = 
                            (r > 1 && grid[r-1][c].type === CELL_WHITE) ||
                            (r < gridSize - 1 && grid[r+1][c].type === CELL_WHITE);
                        
                        // A white cell needs to be part of at least one run of length >= 2
                        if (!hasHNeighbor && !hasVNeighbor) {
                            // Try to extend a neighbor
                            if (c < gridSize - 1 && grid[r][c+1].type !== CELL_WHITE) {
                                grid[r][c+1].type = CELL_WHITE;
                                changed = true;
                            } else if (r < gridSize - 1 && grid[r+1][c].type !== CELL_WHITE) {
                                grid[r+1][c].type = CELL_WHITE;
                                changed = true;
                            } else {
                                // Make this cell black
                                grid[r][c].type = CELL_BLACK;
                                changed = true;
                            }
                        }
                    }
                }
            }
        }
        
        // Convert cells that should have clues from SOLID to BLACK
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c].type === CELL_BLACK || grid[r][c].type === CELL_SOLID) {
                    // Check if this cell should have clues
                    const hasHClue = c < gridSize - 1 && grid[r][c+1].type === CELL_WHITE;
                    const hasVClue = r < gridSize - 1 && grid[r+1][c].type === CELL_WHITE;
                    
                    if (hasHClue || hasVClue) {
                        grid[r][c].type = CELL_BLACK;
                    } else {
                        grid[r][c].type = CELL_SOLID;
                    }
                }
            }
        }
    }

    function identifyRuns() {
        runs = [];
        
        // Horizontal runs
        for (let r = 0; r < gridSize; r++) {
            let runStart = -1;
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c].type === CELL_WHITE) {
                    if (runStart === -1) runStart = c;
                } else {
                    if (runStart !== -1 && c - runStart >= 2) {
                        const cells = [];
                        for (let cc = runStart; cc < c; cc++) {
                            cells.push({ r, c: cc });
                        }
                        runs.push({ cells, sum: 0, direction: 'h', clueCell: { r, c: runStart - 1 } });
                    }
                    runStart = -1;
                }
            }
            // Check end of row
            if (runStart !== -1 && gridSize - runStart >= 2) {
                const cells = [];
                for (let cc = runStart; cc < gridSize; cc++) {
                    cells.push({ r, c: cc });
                }
                runs.push({ cells, sum: 0, direction: 'h', clueCell: { r, c: runStart - 1 } });
            }
        }
        
        // Vertical runs
        for (let c = 0; c < gridSize; c++) {
            let runStart = -1;
            for (let r = 0; r < gridSize; r++) {
                if (grid[r][c].type === CELL_WHITE) {
                    if (runStart === -1) runStart = r;
                } else {
                    if (runStart !== -1 && r - runStart >= 2) {
                        const cells = [];
                        for (let rr = runStart; rr < r; rr++) {
                            cells.push({ r: rr, c });
                        }
                        runs.push({ cells, sum: 0, direction: 'v', clueCell: { r: runStart - 1, c } });
                    }
                    runStart = -1;
                }
            }
            // Check end of column
            if (runStart !== -1 && gridSize - runStart >= 2) {
                const cells = [];
                for (let rr = runStart; rr < gridSize; rr++) {
                    cells.push({ r: rr, c });
                }
                runs.push({ cells, sum: 0, direction: 'v', clueCell: { r: runStart - 1, c } });
            }
        }
    }

    function solvePuzzle() {
        // Find next empty white cell
        let emptyCell = null;
        for (let r = 0; r < gridSize && !emptyCell; r++) {
            for (let c = 0; c < gridSize && !emptyCell; c++) {
                if (grid[r][c].type === CELL_WHITE && solution[r][c] === null) {
                    emptyCell = { r, c };
                }
            }
        }
        
        if (!emptyCell) return true; // Solved!
        
        const { r, c } = emptyCell;
        const usedInRuns = getUsedNumbers(r, c);
        const candidates = [];
        
        for (let num = 1; num <= 9; num++) {
            if (!usedInRuns.has(num)) {
                candidates.push(num);
            }
        }
        
        // Shuffle for variety
        shuffleArray(candidates);
        
        for (const num of candidates) {
            solution[r][c] = num;
            
            if (isValidPartial(r, c) && solvePuzzle()) {
                return true;
            }
            
            solution[r][c] = null;
        }
        
        return false;
    }

    function getUsedNumbers(r, c) {
        const used = new Set();
        
        // Check all runs this cell belongs to
        for (const run of runs) {
            const inRun = run.cells.some(cell => cell.r === r && cell.c === c);
            if (inRun) {
                for (const cell of run.cells) {
                    if (solution[cell.r][cell.c] !== null) {
                        used.add(solution[cell.r][cell.c]);
                    }
                }
            }
        }
        
        return used;
    }

    function isValidPartial(r, c) {
        // Check all runs this cell belongs to
        for (const run of runs) {
            const inRun = run.cells.some(cell => cell.r === r && cell.c === c);
            if (!inRun) continue;
            
            const values = [];
            let hasEmpty = false;
            
            for (const cell of run.cells) {
                if (solution[cell.r][cell.c] !== null) {
                    values.push(solution[cell.r][cell.c]);
                } else {
                    hasEmpty = true;
                }
            }
            
            // Check for duplicates
            if (new Set(values).size !== values.length) {
                return false;
            }
            
            // If run is complete, check sum is valid (3-45 for runs of length 2-9)
            if (!hasEmpty) {
                const sum = values.reduce((a, b) => a + b, 0);
                const minSum = getMinSum(run.cells.length);
                const maxSum = getMaxSum(run.cells.length);
                if (sum < minSum || sum > maxSum) {
                    return false;
                }
            }
        }
        
        return true;
    }

    function getMinSum(length) {
        // Minimum sum for 'length' unique digits (1+2+3+...)
        let sum = 0;
        for (let i = 1; i <= length; i++) sum += i;
        return sum;
    }

    function getMaxSum(length) {
        // Maximum sum for 'length' unique digits (9+8+7+...)
        let sum = 0;
        for (let i = 0; i < length; i++) sum += (9 - i);
        return sum;
    }

    function calculateClues() {
        for (const run of runs) {
            let sum = 0;
            for (const cell of run.cells) {
                sum += solution[cell.r][cell.c];
            }
            run.sum = sum;
            
            // Store clue in the black cell
            const clueR = run.clueCell.r;
            const clueC = run.clueCell.c;
            
            if (clueR >= 0 && clueC >= 0) {
                if (run.direction === 'h') {
                    grid[clueR][clueC].hClue = sum;
                } else {
                    grid[clueR][clueC].vClue = sum;
                }
            }
        }
    }

    function shuffleArray(arr) {
        for (let i = arr.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [arr[i], arr[j]] = [arr[j], arr[i]];
        }
    }

    function renderGrid() {
        gridEl.innerHTML = '';
        gridEl.style.gridTemplateColumns = `repeat(${gridSize}, 48px)`;
        gridEl.style.gridTemplateRows = `repeat(${gridSize}, 48px)`;
        
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                const cellData = grid[r][c];
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                
                if (cellData.type === CELL_WHITE) {
                    cell.classList.add('white-cell');
                    
                    if (cellData.value !== null) {
                        cell.textContent = cellData.value;
                    } else if (cellData.notes.size > 0) {
                        cell.appendChild(renderNotes(cellData.notes));
                    }
                    
                    if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
                        cell.classList.add('selected');
                    }
                    
                    cell.addEventListener('click', () => {
                        selectedCell = { r, c };
                        renderGrid();
                    });
                    
                } else if (cellData.type === CELL_BLACK) {
                    cell.classList.add('black-cell');
                    
                    if (cellData.vClue !== null) {
                        const vClueSpan = document.createElement('span');
                        vClueSpan.className = 'clue-vertical';
                        vClueSpan.textContent = cellData.vClue;
                        cell.appendChild(vClueSpan);
                    }
                    
                    if (cellData.hClue !== null) {
                        const hClueSpan = document.createElement('span');
                        hClueSpan.className = 'clue-horizontal';
                        hClueSpan.textContent = cellData.hClue;
                        cell.appendChild(hClueSpan);
                    }
                    
                } else {
                    // CELL_SOLID
                    cell.classList.add('solid-black');
                }
                
                gridEl.appendChild(cell);
            }
        }
    }

    function renderNotes(notesSet) {
        const div = document.createElement('div');
        div.className = 'notes-grid';
        for (let i = 1; i <= 9; i++) {
            const span = document.createElement('span');
            span.className = 'note-num';
            if (notesSet.has(i)) span.textContent = i;
            div.appendChild(span);
        }
        return div;
    }

    function handleInput(val) {
        if (!selectedCell) return;
        
        const { r, c } = selectedCell;
        const cellData = grid[r][c];
        
        if (cellData.type !== CELL_WHITE) return;
        
        if (cellData.type !== CELL_WHITE) return;
        
        cellData.value = val;
        // if (val !== null) cellData.notes.clear(); // Removed
        
        renderGrid();
    }

    function moveSelection(key) {
        if (!selectedCell) return;
        
        let { r, c } = selectedCell;
        const dir = { 
            ArrowUp: [-1, 0], 
            ArrowDown: [1, 0], 
            ArrowLeft: [0, -1], 
            ArrowRight: [0, 1] 
        }[key];
        
        // Move to next white cell in direction
        let nr = r + dir[0];
        let nc = c + dir[1];
        
        while (nr >= 0 && nr < gridSize && nc >= 0 && nc < gridSize) {
            if (grid[nr][nc].type === CELL_WHITE) {
                selectedCell = { r: nr, c: nc };
                renderGrid();
                return;
            }
            nr += dir[0];
            nc += dir[1];
        }
    }

    function checkSolution() {
        let hasEmpty = false;
        let hasError = false;
        
        // Check all runs
        for (const run of runs) {
            const values = [];
            
            for (const cell of run.cells) {
                const val = grid[cell.r][cell.c].value;
                if (val === null) {
                    hasEmpty = true;
                } else {
                    values.push(val);
                }
            }
            
            // Check for duplicates
            if (new Set(values).size !== values.length) {
                hasError = true;
            }
            
            // Check sum only if complete
            if (!hasEmpty && values.length === run.cells.length) {
                const sum = values.reduce((a, b) => a + b, 0);
                if (sum !== run.sum) {
                    hasError = true;
                }
            }
        }
        
        const t = translations[currentLang];
        if (hasEmpty) {
            messageArea.textContent = t.msgIncomplete;
            messageArea.style.color = '#f57c00';
        } else if (hasError) {
            messageArea.textContent = t.msgMistakes;
            messageArea.style.color = '#d32f2f';
        } else {
            messageArea.textContent = t.msgCorrect;
            messageArea.style.color = '#388e3c';
        }
    }

    function revealSolution() {
        if (!confirm(translations[currentLang].confirmSolve)) return;
        
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c].type === CELL_WHITE) {
                    grid[r][c].value = solution[r][c];
                    grid[r][c].notes.clear();
                }
            }
        }
        
        renderGrid();
        messageArea.textContent = translations[currentLang].msgRevealed;
        messageArea.style.color = '#1a73e8';
    }

    function validateGeneratedPuzzle() {
        // Validate the generated puzzle against its solution
        let errors = [];
        let totalRuns = runs.length;
        let validRuns = 0;

        for (let i = 0; i < runs.length; i++) {
            const run = runs[i];
            const values = [];
            let actualSum = 0;

            for (const cell of run.cells) {
                const val = solution[cell.r][cell.c];
                if (val === null) {
                    errors.push(`Run ${i + 1} (${run.direction === 'h' ? 'H' : 'V'}): Cell [${cell.r},${cell.c}] has no solution`);
                    continue;
                }
                values.push(val);
                actualSum += val;
            }

            // Check for duplicates
            if (new Set(values).size !== values.length) {
                errors.push(`Run ${i + 1} (${run.direction === 'h' ? 'H' : 'V'}): Duplicates found: [${values.join(',')}]`);
            }

            // Check sum
            if (actualSum !== run.sum) {
                errors.push(`Run ${i + 1} (${run.direction === 'h' ? 'H' : 'V'}): Sum mismatch - Clue: ${run.sum}, Actual: ${actualSum} [${values.join('+')}]`);
            } else {
                validRuns++;
            }
        }

        // Check for orphan white cells
        let orphanCells = [];
        for (let r = 0; r < gridSize; r++) {
            for (let c = 0; c < gridSize; c++) {
                if (grid[r][c].type === CELL_WHITE) {
                    const inRun = runs.some(run => 
                        run.cells.some(cell => cell.r === r && cell.c === c)
                    );
                    if (!inRun) {
                        orphanCells.push(`[${r},${c}]`);
                    }
                }
            }
        }

        if (orphanCells.length > 0) {
            errors.push(`Orphan cells not in any run: ${orphanCells.join(', ')}`);
        }

        // Display result
        if (errors.length === 0) {
            messageArea.textContent = `✅ Puzzle is VALID! (${validRuns}/${totalRuns} runs verified)`;
            messageArea.style.color = '#388e3c';
            console.log('Puzzle validation passed!');
        } else {
            messageArea.textContent = `❌ Puzzle has ${errors.length} error(s)! Check console.`;
            messageArea.style.color = '#d32f2f';
            console.error('Puzzle validation errors:');
            errors.forEach(e => console.error('  - ' + e));
        }
        
        // Always log all runs for debugging
        console.log('=== ALL RUNS DEBUG ===');
        for (let i = 0; i < runs.length; i++) {
            const run = runs[i];
            const cellCoords = run.cells.map(c => `[${c.r},${c.c}]`).join(' ');
            const values = run.cells.map(c => solution[c.r][c.c]);
            const actualSum = values.reduce((a, b) => a + b, 0);
            const hasDupes = new Set(values).size !== values.length;
            const sumOK = actualSum === run.sum;
            console.log(`Run ${i+1} (${run.direction.toUpperCase()}): Clue=${run.sum}, Values=[${values.join(',')}]=${actualSum} ${sumOK ? '✓' : '✗'} ${hasDupes ? 'DUPE!' : ''} Cells: ${cellCoords}`);
        }
        console.log('======================');
    }

    /* --- PDF Export --- */
    
    const { jsPDF } = window.jspdf ? window.jspdf : { jsPDF: null };
    const pdfCountInput = document.getElementById('pdf-count');
    const pdfBtn = document.getElementById('pdf-btn');
    const pdfStatus = document.getElementById('pdf-status');

    if (pdfBtn) {
        pdfBtn.addEventListener('click', handlePDFExport);
    }

    async function handlePDFExport() {
        if (!jsPDF) {
            alert('jsPDF library not loaded.');
            return;
        }

        const count = parseInt(pdfCountInput.value) || 1;
        pdfStatus.textContent = translations[currentLang].pdfStatus;
        pdfStatus.style.display = 'block';
        pdfBtn.disabled = true;

        setTimeout(async () => {
            try {
                const doc = new jsPDF({ unit: 'pt', format: 'a4' });
                const difficulty = difficultySelect.value;
                const size = difficulty === 'easy' ? 7 : difficulty === 'medium' ? 9 : 11;

                const hideTitle = document.getElementById('pdf-hide-title').checked;

                for (let i = 0; i < count; i++) {
                    // Generate new puzzle for PDF
                    const pdfData = generatePuzzleForPDF(size);

                    // Page 1: Puzzle
                    drawKakuroPage(doc, pdfData, false, i + 1, size, hideTitle);
                    doc.addPage();

                    // Page 2: Solution
                    drawKakuroPage(doc, pdfData, true, i + 1, size, hideTitle);

                    if (i < count - 1) doc.addPage();
                }

                doc.save('kakuro_puzzles.pdf');
            } catch (err) {
                console.error(err);
                alert('Error generating PDF');
            } finally {
                pdfStatus.style.display = 'none';
                pdfBtn.disabled = false;
            }
        }, 100);
    }

    function generatePuzzleForPDF(size) {
        // Create a separate puzzle for PDF (don't affect current game)
        const pdfGrid = [];
        const pdfSolution = [];
        let pdfRuns = [];

        // Initialize
        for (let r = 0; r < size; r++) {
            pdfGrid[r] = [];
            pdfSolution[r] = [];
            for (let c = 0; c < size; c++) {
                pdfGrid[r][c] = { type: CELL_SOLID, hClue: null, vClue: null };
                pdfSolution[r][c] = null;
            }
        }

        // Create pattern
        for (let r = 0; r < size; r++) {
            pdfGrid[r][0].type = CELL_BLACK;
            pdfGrid[0][r].type = CELL_BLACK;
        }

        for (let r = 1; r < size; r++) {
            for (let c = 1; c < size; c++) {
                const rand = Math.random();
                let hRunLen = 0;
                for (let cc = c - 1; cc >= 0 && pdfGrid[r][cc].type === CELL_WHITE; cc--) hRunLen++;
                let vRunLen = 0;
                for (let rr = r - 1; rr >= 0 && pdfGrid[rr][c].type === CELL_WHITE; rr--) vRunLen++;

                const shouldBeBlack = 
                    hRunLen >= 8 || vRunLen >= 8 ||
                    ((r + c) % 5 === 0 && rand < 0.4) ||
                    (hRunLen >= 4 && rand < 0.3) ||
                    (vRunLen >= 4 && rand < 0.3) ||
                    rand < 0.15;

                pdfGrid[r][c].type = shouldBeBlack ? CELL_BLACK : CELL_WHITE;
            }
        }

        // Fix isolated cells
        let changed = true;
        let iter = 0;
        while (changed && iter < 100) {
            changed = false;
            iter++;
            for (let r = 1; r < size; r++) {
                for (let c = 1; c < size; c++) {
                    if (pdfGrid[r][c].type === CELL_WHITE) {
                        const hasHN = (c > 1 && pdfGrid[r][c-1].type === CELL_WHITE) ||
                                      (c < size - 1 && pdfGrid[r][c+1].type === CELL_WHITE);
                        const hasVN = (r > 1 && pdfGrid[r-1][c].type === CELL_WHITE) ||
                                      (r < size - 1 && pdfGrid[r+1][c].type === CELL_WHITE);
                        if (!hasHN && !hasVN) {
                            if (c < size - 1) { pdfGrid[r][c+1].type = CELL_WHITE; changed = true; }
                            else if (r < size - 1) { pdfGrid[r+1][c].type = CELL_WHITE; changed = true; }
                            else { pdfGrid[r][c].type = CELL_BLACK; changed = true; }
                        }
                    }
                }
            }
        }

        // Set BLACK/SOLID
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                if (pdfGrid[r][c].type === CELL_BLACK || pdfGrid[r][c].type === CELL_SOLID) {
                    const hasHClue = c < size - 1 && pdfGrid[r][c+1].type === CELL_WHITE;
                    const hasVClue = r < size - 1 && pdfGrid[r+1][c].type === CELL_WHITE;
                    pdfGrid[r][c].type = (hasHClue || hasVClue) ? CELL_BLACK : CELL_SOLID;
                }
            }
        }

        // Identify runs
        pdfRuns = [];
        for (let r = 0; r < size; r++) {
            let runStart = -1;
            for (let c = 0; c < size; c++) {
                if (pdfGrid[r][c].type === CELL_WHITE) {
                    if (runStart === -1) runStart = c;
                } else {
                    if (runStart !== -1 && c - runStart >= 2) {
                        const cells = [];
                        for (let cc = runStart; cc < c; cc++) cells.push({ r, c: cc });
                        pdfRuns.push({ cells, sum: 0, direction: 'h', clueCell: { r, c: runStart - 1 } });
                    }
                    runStart = -1;
                }
            }
            if (runStart !== -1 && size - runStart >= 2) {
                const cells = [];
                for (let cc = runStart; cc < size; cc++) cells.push({ r, c: cc });
                pdfRuns.push({ cells, sum: 0, direction: 'h', clueCell: { r, c: runStart - 1 } });
            }
        }
        for (let c = 0; c < size; c++) {
            let runStart = -1;
            for (let r = 0; r < size; r++) {
                if (pdfGrid[r][c].type === CELL_WHITE) {
                    if (runStart === -1) runStart = r;
                } else {
                    if (runStart !== -1 && r - runStart >= 2) {
                        const cells = [];
                        for (let rr = runStart; rr < r; rr++) cells.push({ r: rr, c });
                        pdfRuns.push({ cells, sum: 0, direction: 'v', clueCell: { r: runStart - 1, c } });
                    }
                    runStart = -1;
                }
            }
            if (runStart !== -1 && size - runStart >= 2) {
                const cells = [];
                for (let rr = runStart; rr < size; rr++) cells.push({ r: rr, c });
                pdfRuns.push({ cells, sum: 0, direction: 'v', clueCell: { r: runStart - 1, c } });
            }
        }

        // Solve
        function solvePDF() {
            let emptyCell = null;
            for (let r = 0; r < size && !emptyCell; r++) {
                for (let c = 0; c < size && !emptyCell; c++) {
                    if (pdfGrid[r][c].type === CELL_WHITE && pdfSolution[r][c] === null) {
                        emptyCell = { r, c };
                    }
                }
            }
            if (!emptyCell) return true;

            const { r, c } = emptyCell;
            const used = new Set();
            for (const run of pdfRuns) {
                if (run.cells.some(cell => cell.r === r && cell.c === c)) {
                    for (const cell of run.cells) {
                        if (pdfSolution[cell.r][cell.c] !== null) used.add(pdfSolution[cell.r][cell.c]);
                    }
                }
            }

            const candidates = [];
            for (let num = 1; num <= 9; num++) if (!used.has(num)) candidates.push(num);
            shuffleArray(candidates);

            for (const num of candidates) {
                pdfSolution[r][c] = num;
                let valid = true;
                for (const run of pdfRuns) {
                    if (!run.cells.some(cell => cell.r === r && cell.c === c)) continue;
                    const vals = run.cells.map(cell => pdfSolution[cell.r][cell.c]).filter(v => v !== null);
                    if (new Set(vals).size !== vals.length) { valid = false; break; }
                }
                if (valid && solvePDF()) return true;
                pdfSolution[r][c] = null;
            }
            return false;
        }

        // Validate pattern - ensure all white cells are in runs
        function validatePDFPattern() {
            for (let r = 0; r < size; r++) {
                for (let c = 0; c < size; c++) {
                    if (pdfGrid[r][c].type === CELL_WHITE) {
                        const inRun = pdfRuns.some(run => 
                            run.cells.some(cell => cell.r === r && cell.c === c)
                        );
                        if (!inRun) return false;
                    }
                }
            }
            return true;
        }

        // Validate that no orphan cells exist
        if (!validatePDFPattern()) {
            return generatePuzzleForPDF(size); // Retry
        }

        if (!solvePDF()) {
            return generatePuzzleForPDF(size); // Retry
        }

        // Calculate clues
        for (const run of pdfRuns) {
            run.sum = run.cells.reduce((acc, cell) => acc + pdfSolution[cell.r][cell.c], 0);
            const { r: clueR, c: clueC } = run.clueCell;
            if (clueR >= 0 && clueC >= 0) {
                if (run.direction === 'h') pdfGrid[clueR][clueC].hClue = run.sum;
                else pdfGrid[clueR][clueC].vClue = run.sum;
            }
        }

        // Final validation - verify all clues match
        function validatePDFPuzzle() {
            for (const run of pdfRuns) {
                let actualSum = 0;
                const values = [];
                for (const cell of run.cells) {
                    const val = pdfSolution[cell.r][cell.c];
                    if (val === null) return false;
                    actualSum += val;
                    values.push(val);
                }
                if (new Set(values).size !== values.length) return false;
                if (actualSum !== run.sum) return false;
            }
            return true;
        }

        if (!validatePDFPuzzle()) {
            return generatePuzzleForPDF(size); // Retry
        }

        return { grid: pdfGrid, solution: pdfSolution, runs: pdfRuns };
    }

    function drawKakuroPage(doc, data, isSolution, index, size, hideTitle) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();

        let startY = 100;

        // Header
        if (!hideTitle) {
            doc.setFontSize(18);
            doc.setTextColor(40);
            const t = translations[currentLang];
            // 'typeLabel' argument was "Puzzle"/"Solution" string, use mapped logic or argument
            const typeStr = isSolution ? t.solution : t.puzzle;
            doc.text(`${t.kakuroTitle} - ${typeStr} #${index}`, pageWidth / 2, 50, { align: 'center' });
        } else {
            startY = 50;
        }

        // Grid params
        const margin = 50;
        const availableWidth = Math.min(pageWidth - margin * 2, 450);
        const cellSize = availableWidth / size;
        const startX = (pageWidth - size * cellSize) / 2;

        // Draw cells
        for (let r = 0; r < size; r++) {
            for (let c = 0; c < size; c++) {
                const cellData = data.grid[r][c];
                const x = startX + c * cellSize;
                const y = startY + r * cellSize;

                if (cellData.type === CELL_WHITE) {
                    // White cell
                    doc.setFillColor(255, 255, 255);
                    doc.rect(x, y, cellSize, cellSize, 'F');

                    // Draw solution number if needed
                    if (isSolution && data.solution[r][c] !== null) {
                        doc.setFontSize(19);
                        doc.setTextColor(0);
                        doc.text(`${data.solution[r][c]}`, x + cellSize / 2, y + cellSize / 2 + 6, { align: 'center' });
                    }
                } else {
                    // Black cell - darker background
                    doc.setFillColor(25, 25, 25);
                    doc.rect(x, y, cellSize, cellSize, 'F');

                    if (cellData.type === CELL_BLACK) {
                        // Draw diagonal line (top-left to bottom-right)
                        doc.setDrawColor(110, 110, 110);
                        doc.setLineWidth(2);
                        doc.line(x, y, x + cellSize, y + cellSize);

                        // Draw clues
                        doc.setTextColor(255, 255, 255);
                        doc.setFontSize(15);

                        if (cellData.hClue !== null) {
                            // Top-right (horizontal clue) - more padding from top
                            doc.text(`${cellData.hClue}`, x + cellSize - 6, y + 16, { align: 'right' });
                        }
                        if (cellData.vClue !== null) {
                            // Bottom-left (vertical clue) - more padding from bottom
                            doc.text(`${cellData.vClue}`, x + 6, y + cellSize - 6);
                        }
                    }
                }
            }
        }

        // Draw grid lines (light grey)
        doc.setDrawColor(110, 110, 110);
        doc.setLineWidth(2.5);
        for (let i = 0; i <= size; i++) {
            const pos = i * cellSize;
            doc.line(startX + pos, startY, startX + pos, startY + size * cellSize);
            doc.line(startX, startY + pos, startX + size * cellSize, startY + pos);
        }

        // Outer border (grey)
        doc.setLineWidth(3.5);
        doc.rect(startX, startY, size * cellSize, size * cellSize, 'S');
    }
});
