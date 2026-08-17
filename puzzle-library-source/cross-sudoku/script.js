document.addEventListener('DOMContentLoaded', () => {
    // Check if jspdf is loaded
    const { jsPDF } = window.jspdf ? window.jspdf : { jsPDF: null };

    // Grid indices: 0=center, 1=top, 2=bottom, 3=left, 4=right
    const GRID_CENTER = 0, GRID_TOP = 1, GRID_BOTTOM = 2, GRID_LEFT = 3, GRID_RIGHT = 4;
    
    // DOM Elements
    const gridElements = {
        0: document.getElementById('grid-center'),
        1: document.getElementById('grid-top'),
        2: document.getElementById('grid-bottom'),
        3: document.getElementById('grid-left'),
        4: document.getElementById('grid-right')
    };
    const newGameBtn = document.getElementById('new-game-btn');
    const checkBtn = document.getElementById('check-btn');
    const solveBtn = document.getElementById('solve-btn');
    // const notesToggle = document.getElementById('notes-toggle'); // Removed
    const difficultySelect = document.getElementById('difficulty');
    const numBtns = document.querySelectorAll('.num-btn');
    const messageArea = document.getElementById('message-area');
    const pdfBtn = document.getElementById('pdf-btn');
    const pdfCountInput = document.getElementById('pdf-count');
    const pdfStatus = document.getElementById('pdf-status');
    const langSelect = document.getElementById('language');

    // Game State
    let solutions = []; // 5 solution grids (9x9 each)
    let playerGrids = []; // 5 player grids with {val, notes, isClue}
    let selectedCell = null; // {gridId, row, col}

    // Level constants
    const DIFFICULTY_CLUES = {
        easy: 0.65,
        medium: 0.47,
        hard: 0.34
    };

    const translations = {
        en: {
            newGame: "New Game", check: "Check", solve: "Solution",
            msgCorrect: "🎉 Correct! You solved the Cross Sudoku!",
            msgIncomplete: "Grid not fully filled.", 
            msgError: "Some numbers are incorrect.",
            pdfStatus: "Generating...",
            pdfDone: "Done!",
            puzzle: "Puzzle",
            solution: "Solution",
            confirmSolve: "Reveal the solution?"
        },
        de: {
            newGame: "Neues Spiel", check: "Prüfen", solve: "Lösung",
            msgCorrect: "🎉 Richtig! Du hast das Cross Sudoku gelöst!",
            msgIncomplete: "Gitter nicht vollständig ausgefüllt.", 
            msgError: "Einige Zahlen sind falsch.",
            pdfStatus: "Generiere...",
            pdfDone: "Fertig!",
            puzzle: "Rätsel",
            solution: "Lösung",
            confirmSolve: "Lösung anzeigen?"
        },
        fr: {
            newGame: "Nouveau Jeu", check: "Vérifier", solve: "Solution",
            msgCorrect: "🎉 Correct ! Vous avez résolu le Cross Sudoku !",
            msgIncomplete: "Grille incomplète.", 
            msgError: "Certains nombres sont incorrects.",
            pdfStatus: "Génération...",
            pdfDone: "Terminé !",
            puzzle: "Puzzle",
            solution: "Solution",
            confirmSolve: "Révéler la solution ?"
        },
        it: {
            newGame: "Nuova Partita", check: "Controlla", solve: "Soluzione",
            msgCorrect: "🎉 Corretto! Hai risolto il Cross Sudoku!",
            msgIncomplete: "Griglia incompleta.", 
            msgError: "Alcuni numeri sono errati.",
            pdfStatus: "Generazione...",
            pdfDone: "Fatto!",
            puzzle: "Puzzle",
            solution: "Soluzione",
            confirmSolve: "Rivela la soluzione?"
        }
    };
    
    let currentLang = 'en';

    // Initialize
    initGame();

    // Event Listeners
    newGameBtn.addEventListener('click', initGame);
    checkBtn.addEventListener('click', checkGame);
    solveBtn.addEventListener('click', revealSolution);
    solveBtn.addEventListener('click', revealSolution);
    pdfBtn.addEventListener('click', handlePDFExport);
    
    langSelect.addEventListener('change', (e) => {
        currentLang = e.target.value;
        updateUIText();
    });

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
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) {
            e.preventDefault();
            moveSelection(key);
        }
    });

    function initGame() {
        const difficulty = difficultySelect.value;
        const data = generateCrossSudoku(difficulty);
        solutions = data.solutions;
        playerGrids = data.playerGrids;
        selectedCell = null;
        messageArea.textContent = '';
        updateUIText();
        renderAllGrids();
    }
    
    function updateUIText() {
        const t = translations[currentLang];
        newGameBtn.textContent = t.newGame;
        checkBtn.textContent = t.check;
        solveBtn.textContent = t.solve;
    }

    function generateCrossSudoku(difficulty) {
        const sols = [];
        const players = [];
        
        sols[GRID_CENTER] = generateSudoku();
        sols[GRID_TOP] = generateConstrainedGrid(sols[GRID_CENTER], 'top');
        sols[GRID_BOTTOM] = generateConstrainedGrid(sols[GRID_CENTER], 'bottom');
        sols[GRID_LEFT] = generateConstrainedGrid(sols[GRID_CENTER], 'left');
        sols[GRID_RIGHT] = generateConstrainedGrid(sols[GRID_CENTER], 'right');

        const clueRatio = DIFFICULTY_CLUES[difficulty];
        
        for (let g = 0; g < 5; g++) {
            players[g] = Array(9).fill().map(() => 
                Array(9).fill().map(() => ({ val: null, notes: new Set(), isClue: false }))
            );
            
            const cellsToReveal = Math.floor(81 * clueRatio);
            const indices = shuffle([...Array(81).keys()]);
            
            for (let i = 0; i < cellsToReveal; i++) {
                const idx = indices[i];
                const r = Math.floor(idx / 9);
                const c = idx % 9;
                players[g][r][c].val = sols[g][r][c];
                players[g][r][c].isClue = true;
            }
        }

        syncOverlapClues(players, sols);
        return { solutions: sols, playerGrids: players };
    }

    function syncOverlapClues(players, sols) {
        // Top-Center overlap: center rows 0-2 = top rows 6-8
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 9; c++) {
                if (players[GRID_CENTER][r][c].isClue || players[GRID_TOP][r + 6][c].isClue) {
                    players[GRID_CENTER][r][c].val = sols[GRID_CENTER][r][c];
                    players[GRID_CENTER][r][c].isClue = true;
                    players[GRID_TOP][r + 6][c].val = sols[GRID_TOP][r + 6][c];
                    players[GRID_TOP][r + 6][c].isClue = true;
                }
            }
        }
        
        // Bottom-Center overlap: center rows 6-8 = bottom rows 0-2
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 9; c++) {
                if (players[GRID_CENTER][r + 6][c].isClue || players[GRID_BOTTOM][r][c].isClue) {
                    players[GRID_CENTER][r + 6][c].val = sols[GRID_CENTER][r + 6][c];
                    players[GRID_CENTER][r + 6][c].isClue = true;
                    players[GRID_BOTTOM][r][c].val = sols[GRID_BOTTOM][r][c];
                    players[GRID_BOTTOM][r][c].isClue = true;
                }
            }
        }
        
        // Left-Center overlap: center cols 0-2 = left cols 6-8
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 3; c++) {
                if (players[GRID_CENTER][r][c].isClue || players[GRID_LEFT][r][c + 6].isClue) {
                    players[GRID_CENTER][r][c].val = sols[GRID_CENTER][r][c];
                    players[GRID_CENTER][r][c].isClue = true;
                    players[GRID_LEFT][r][c + 6].val = sols[GRID_LEFT][r][c + 6];
                    players[GRID_LEFT][r][c + 6].isClue = true;
                }
            }
        }
        
        // Right-Center overlap: center cols 6-8 = right cols 0-2
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 3; c++) {
                if (players[GRID_CENTER][r][c + 6].isClue || players[GRID_RIGHT][r][c].isClue) {
                    players[GRID_CENTER][r][c + 6].val = sols[GRID_CENTER][r][c + 6];
                    players[GRID_CENTER][r][c + 6].isClue = true;
                    players[GRID_RIGHT][r][c].val = sols[GRID_RIGHT][r][c];
                    players[GRID_RIGHT][r][c].isClue = true;
                }
            }
        }
    }

    function generateSudoku() {
        const board = Array(9).fill().map(() => Array(9).fill(0));
        fillSudoku(board);
        return board;
    }

    function fillSudoku(board, row = 0, col = 0) {
        if (row === 9) return true;
        
        const nextRow = col === 8 ? row + 1 : row;
        const nextCol = col === 8 ? 0 : col + 1;
        
        if (board[row][col] !== 0) {
            return fillSudoku(board, nextRow, nextCol);
        }
        
        const nums = shuffle([1,2,3,4,5,6,7,8,9]);
        
        for (const num of nums) {
            if (isValidPlacement(board, row, col, num)) {
                board[row][col] = num;
                if (fillSudoku(board, nextRow, nextCol)) return true;
                board[row][col] = 0;
            }
        }
        return false;
    }

    function generateConstrainedGrid(centerGrid, position) {
        const board = Array(9).fill().map(() => Array(9).fill(0));
        
        if (position === 'top') {
            // Top grid rows 6-8 = Center rows 0-2
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 9; c++) {
                    board[r + 6][c] = centerGrid[r][c];
                }
            }
        } else if (position === 'bottom') {
            // Bottom grid rows 0-2 = Center rows 6-8
            for (let r = 0; r < 3; r++) {
                for (let c = 0; c < 9; c++) {
                    board[r][c] = centerGrid[r + 6][c];
                }
            }
        } else if (position === 'left') {
            // Left grid cols 6-8 = Center cols 0-2
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 3; c++) {
                    board[r][c + 6] = centerGrid[r][c];
                }
            }
        } else if (position === 'right') {
            // Right grid cols 0-2 = Center cols 6-8
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 3; c++) {
                    board[r][c] = centerGrid[r][c + 6];
                }
            }
        }
        
        fillSudoku(board);
        return board;
    }

    function isValidPlacement(board, row, col, num) {
        for (let c = 0; c < 9; c++) {
            if (board[row][c] === num) return false;
        }
        for (let r = 0; r < 9; r++) {
            if (board[r][col] === num) return false;
        }
        const boxRow = Math.floor(row / 3) * 3;
        const boxCol = Math.floor(col / 3) * 3;
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 3; c++) {
                if (board[boxRow + r][boxCol + c] === num) return false;
            }
        }
        return true;
    }

    function shuffle(arr) {
        const a = [...arr];
        for (let i = a.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [a[i], a[j]] = [a[j], a[i]];
        }
        return a;
    }

    // Rendering - Only render non-overlapping cells for outer grids
    function renderAllGrids() {
        renderGrid(GRID_CENTER, 0, 8, 0, 8); // Full 9x9
        renderGrid(GRID_TOP, 0, 5, 0, 8);    // Rows 0-5 only (6 rows)
        renderGrid(GRID_BOTTOM, 3, 8, 0, 8); // Rows 3-8 only (6 rows)
        renderGrid(GRID_LEFT, 0, 8, 0, 5);   // Cols 0-5 only (6 cols)
        renderGrid(GRID_RIGHT, 0, 8, 3, 8);  // Cols 3-8 only (6 cols)
    }

    function renderGrid(gridId, rowStart, rowEnd, colStart, colEnd) {
        const gridEl = gridElements[gridId];
        gridEl.innerHTML = '';
        
        for (let r = rowStart; r <= rowEnd; r++) {
            for (let c = colStart; c <= colEnd; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                // Use display index for CSS (0-based for the displayed portion)
                cell.dataset.row = r - rowStart;
                cell.dataset.col = c - colStart;
                // Store actual grid coordinates
                cell.dataset.actualRow = r;
                cell.dataset.actualCol = c;
                cell.dataset.grid = gridId;
                
                const pCell = playerGrids[gridId][r][c];
                
                if (pCell.val !== null) {
                    cell.textContent = pCell.val;
                    if (pCell.isClue) cell.classList.add('clue');
                } else if (pCell.notes.size > 0) {
                    cell.appendChild(renderNotes(pCell.notes));
                }
                
                if (selectedCell && selectedCell.gridId === gridId && 
                    selectedCell.row === r && selectedCell.col === c) {
                    cell.classList.add('selected');
                } else if (selectedCell && selectedCell.gridId === gridId) {
                    if (selectedCell.row === r || selectedCell.col === c) {
                        cell.classList.add('highlighted');
                    }
                }
                
                cell.addEventListener('click', () => {
                    selectedCell = { gridId, row: r, col: c };
                    renderAllGrids();
                });
                
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
        
        const { gridId, row, col } = selectedCell;
        const pCell = playerGrids[gridId][row][col];
        
        if (pCell.isClue) return;
        
        pCell.val = val;
        // if (val !== null) pCell.notes.clear(); // Notes removed
        
        // Sync to overlapping cell
        syncOverlapValue(gridId, row, col, pCell);
        renderAllGrids();
    }

    function syncOverlapValue(gridId, row, col, pCell) {
        // Center to outer grids
        if (gridId === GRID_CENTER) {
            if (row < 3) {
                // Syncs with top grid row 6+
                const otherCell = playerGrids[GRID_TOP][row + 6][col];
                if (!otherCell.isClue) {
                    otherCell.val = pCell.val;
                    otherCell.notes = new Set(pCell.notes);
                }
            }
            if (row >= 6) {
                // Syncs with bottom grid row 0-2
                const otherCell = playerGrids[GRID_BOTTOM][row - 6][col];
                if (!otherCell.isClue) {
                    otherCell.val = pCell.val;
                    otherCell.notes = new Set(pCell.notes);
                }
            }
            if (col < 3) {
                // Syncs with left grid col 6+
                const otherCell = playerGrids[GRID_LEFT][row][col + 6];
                if (!otherCell.isClue) {
                    otherCell.val = pCell.val;
                    otherCell.notes = new Set(pCell.notes);
                }
            }
            if (col >= 6) {
                // Syncs with right grid col 0-2
                const otherCell = playerGrids[GRID_RIGHT][row][col - 6];
                if (!otherCell.isClue) {
                    otherCell.val = pCell.val;
                    otherCell.notes = new Set(pCell.notes);
                }
            }
        }
        // Outer grids to center (these cells shouldn't be visible but keep data in sync)
        else if (gridId === GRID_TOP && row >= 6) {
            const centerCell = playerGrids[GRID_CENTER][row - 6][col];
            if (!centerCell.isClue) {
                centerCell.val = pCell.val;
                centerCell.notes = new Set(pCell.notes);
            }
        }
        else if (gridId === GRID_BOTTOM && row < 3) {
            const centerCell = playerGrids[GRID_CENTER][row + 6][col];
            if (!centerCell.isClue) {
                centerCell.val = pCell.val;
                centerCell.notes = new Set(pCell.notes);
            }
        }
        else if (gridId === GRID_LEFT && col >= 6) {
            const centerCell = playerGrids[GRID_CENTER][row][col - 6];
            if (!centerCell.isClue) {
                centerCell.val = pCell.val;
                centerCell.notes = new Set(pCell.notes);
            }
        }
        else if (gridId === GRID_RIGHT && col < 3) {
            const centerCell = playerGrids[GRID_CENTER][row][col + 6];
            if (!centerCell.isClue) {
                centerCell.val = pCell.val;
                centerCell.notes = new Set(pCell.notes);
            }
        }
    }

    function moveSelection(key) {
        if (!selectedCell) return;
        let { gridId, row, col } = selectedCell;
        
        if (key === 'ArrowUp') row = Math.max(0, row - 1);
        if (key === 'ArrowDown') row = Math.min(8, row + 1);
        if (key === 'ArrowLeft') col = Math.max(0, col - 1);
        if (key === 'ArrowRight') col = Math.min(8, col + 1);
        
        selectedCell = { gridId, row, col };
        renderAllGrids();
    }

    function checkGame() {
        let isFull = true;
        let isCorrect = true;
        
        for (let g = 0; g < 5; g++) {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    if (playerGrids[g][r][c].val === null) {
                        isFull = false;
                    } else if (playerGrids[g][r][c].val !== solutions[g][r][c]) {
                        isCorrect = false;
                    }
                }
            }
        }
        
        const t = translations[currentLang];
        if (!isFull) {
            messageArea.textContent = t.msgIncomplete;
            messageArea.style.color = '#f57c00';
            return;
        }
        
        if (isCorrect) {
            messageArea.textContent = t.msgCorrect;
            messageArea.style.color = '#388e3c';
        } else {
            messageArea.textContent = t.msgError;
            messageArea.style.color = '#d32f2f';
        }
    }

    function revealSolution() {
        if (!confirm(translations[currentLang].confirmSolve)) return;
        
        for (let g = 0; g < 5; g++) {
            for (let r = 0; r < 9; r++) {
                for (let c = 0; c < 9; c++) {
                    playerGrids[g][r][c].val = solutions[g][r][c];
                    playerGrids[g][r][c].notes.clear();
                }
            }
        }
        
        renderAllGrids();
        messageArea.textContent = '';
    }

    /* --- PDF Export --- */
    async function handlePDFExport() {
        if (!jsPDF) {
            alert('jsPDF library not loaded.');
            return;
        }

        const count = parseInt(pdfCountInput.value) || 1;
        const hideTitle = document.getElementById('pdf-hide-title').checked;
        const difficulty = difficultySelect.value;
        pdfStatus.textContent = translations[currentLang].pdfStatus;
        pdfBtn.disabled = true;

        setTimeout(() => {
            try {
                const doc = new jsPDF({ unit: 'pt', format: 'a4' });
                
                for (let i = 0; i < count; i++) {
                    const puzzleData = generatePuzzleForPDF(difficulty);
                    
                    // Puzzle page
                    drawCrossSudokuPage(doc, puzzleData, false, i + 1, difficulty, hideTitle);
                    doc.addPage();
                    
                    // Solution page
                    drawCrossSudokuPage(doc, puzzleData, true, i + 1, difficulty, hideTitle);
                    
                    if (i < count - 1) doc.addPage();
                }

                const t = translations[currentLang];
                doc.save('cross_sudoku_collection.pdf');
                pdfStatus.textContent = t.pdfDone;
                setTimeout(() => { pdfStatus.textContent = ''; }, 2000);
            } catch (err) {
                console.error(err);
                pdfStatus.textContent = 'Error!';
            } finally {
                pdfBtn.disabled = false;
            }
        }, 100);
    }

    function generatePuzzleForPDF(difficulty) {
        const sols = [];
        sols[GRID_CENTER] = generateSudoku();
        sols[GRID_TOP] = generateConstrainedGrid(sols[GRID_CENTER], 'top');
        sols[GRID_BOTTOM] = generateConstrainedGrid(sols[GRID_CENTER], 'bottom');
        sols[GRID_LEFT] = generateConstrainedGrid(sols[GRID_CENTER], 'left');
        sols[GRID_RIGHT] = generateConstrainedGrid(sols[GRID_CENTER], 'right');

        const clueRatio = DIFFICULTY_CLUES[difficulty];
        const clues = [];
        
        for (let g = 0; g < 5; g++) {
            clues[g] = Array(9).fill().map(() => Array(9).fill(false));
            const cellsToReveal = Math.floor(81 * clueRatio);
            const indices = shuffle([...Array(81).keys()]);
            
            for (let i = 0; i < cellsToReveal; i++) {
                const idx = indices[i];
                const r = Math.floor(idx / 9);
                const c = idx % 9;
                clues[g][r][c] = true;
            }
        }

        // Sync overlap clues
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 9; c++) {
                if (clues[GRID_CENTER][r][c] || clues[GRID_TOP][r + 6][c]) {
                    clues[GRID_CENTER][r][c] = true;
                    clues[GRID_TOP][r + 6][c] = true;
                }
            }
        }
        for (let r = 0; r < 3; r++) {
            for (let c = 0; c < 9; c++) {
                if (clues[GRID_CENTER][r + 6][c] || clues[GRID_BOTTOM][r][c]) {
                    clues[GRID_CENTER][r + 6][c] = true;
                    clues[GRID_BOTTOM][r][c] = true;
                }
            }
        }
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 3; c++) {
                if (clues[GRID_CENTER][r][c] || clues[GRID_LEFT][r][c + 6]) {
                    clues[GRID_CENTER][r][c] = true;
                    clues[GRID_LEFT][r][c + 6] = true;
                }
            }
        }
        for (let r = 0; r < 9; r++) {
            for (let c = 0; c < 3; c++) {
                if (clues[GRID_CENTER][r][c + 6] || clues[GRID_RIGHT][r][c]) {
                    clues[GRID_CENTER][r][c + 6] = true;
                    clues[GRID_RIGHT][r][c] = true;
                }
            }
        }

        return { solutions: sols, clues };
    }

    function drawCrossSudokuPage(doc, data, isSolution, index, difficulty, hideTitle) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        // Grid parameters
        // Standard: cellSize = 18. width = 15*18 = 270.
        // We want bigger. Page width ~595.
        // If hideTitle, we can use almost full page. 
        // 15 cells wide. 
        
        let cellSize, startY, centerX;

        if (hideTitle) {
             // Reduced again by ~10% (28 -> 25)
             cellSize = 25;
             centerX = pageWidth / 2;
             // Height: 15 * 32 = 480. Centered.
             const totalGridHeight = 15 * cellSize;
             startY = (pageHeight)/2; 
        } else {
            // Header
            doc.setFontSize(14);
            doc.setTextColor(0);
            const t = translations[currentLang];
            const title = isSolution 
                ? `${t.solution} #${index}` 
                : `${t.puzzle} #${index} (${difficulty})`;
            doc.text(title, pageWidth / 2, 30, { align: 'center' });

            cellSize = 26; // Increased from 18 to fill more space while keeping title
            centerX = pageWidth / 2;
            startY = 380; // Adjusted Y center
        }
        
        const gridSize9 = cellSize * 9;
        const gridSize6 = cellSize * 6;
        const centerY = startY;
        
        // Draw grids - only non-overlapping portions for outer grids
        // Center: full 9x9
        drawGridPortion(doc, data, GRID_CENTER, 0, 8, 0, 8, 
            centerX - gridSize9/2, centerY - gridSize9/2, cellSize, isSolution);
        
        // Top: rows 0-5 (6 rows)
        drawGridPortion(doc, data, GRID_TOP, 0, 5, 0, 8,
            centerX - gridSize9/2, centerY - gridSize9/2 - gridSize6, cellSize, isSolution);
        
        // Bottom: rows 3-8 (6 rows)
        drawGridPortion(doc, data, GRID_BOTTOM, 3, 8, 0, 8,
            centerX - gridSize9/2, centerY + gridSize9/2, cellSize, isSolution);
        
        // Left: cols 0-5 (6 cols)
        drawGridPortion(doc, data, GRID_LEFT, 0, 8, 0, 5,
            centerX - gridSize9/2 - gridSize6, centerY - gridSize9/2, cellSize, isSolution);
        
        // Right: cols 3-8 (6 cols)
        drawGridPortion(doc, data, GRID_RIGHT, 0, 8, 3, 8,
            centerX + gridSize9/2, centerY - gridSize9/2, cellSize, isSolution);
    }

    function drawGridPortion(doc, data, gridId, rowStart, rowEnd, colStart, colEnd, startX, startY, cellSize, isSolution) {
        const numRows = rowEnd - rowStart + 1;
        const numCols = colEnd - colStart + 1;
        
        doc.setTextColor(0);
        
        // Draw numbers
        for (let r = rowStart; r <= rowEnd; r++) {
            for (let c = colStart; c <= colEnd; c++) {
                const displayRow = r - rowStart;
                const displayCol = c - colStart;
                const x = startX + displayCol * cellSize;
                const y = startY + displayRow * cellSize;
                
                const val = data.solutions[gridId][r][c];
                const isClue = data.clues[gridId][r][c];
                
                if (isSolution || isClue) {
                    doc.setFontSize(cellSize * 0.55);
                    if (isClue && !isSolution) {
                        doc.setFont('helvetica', 'bold');
                    } else {
                        doc.setFont('helvetica', 'normal');
                    }
                    doc.text(`${val}`, x + cellSize/2, y + cellSize/2 + (cellSize * 0.2), { align: 'center' });
                }
            }
        }

        // Draw grid lines
        doc.setDrawColor(0);
        doc.setLineDashPattern([], 0);
        
        for (let i = 0; i <= numCols; i++) {
            const actualCol = colStart + i;
            if (actualCol % 3 === 0) {
                doc.setLineWidth(1.5);
            } else {
                doc.setLineWidth(0.5);
            }
            doc.line(startX + i * cellSize, startY, startX + i * cellSize, startY + numRows * cellSize);
        }
        
        for (let i = 0; i <= numRows; i++) {
            const actualRow = rowStart + i;
            if (actualRow % 3 === 0) {
                doc.setLineWidth(1.5);
            } else {
                doc.setLineWidth(0.5);
            }
            doc.line(startX, startY + i * cellSize, startX + numCols * cellSize, startY + i * cellSize);
        }
    }
});
