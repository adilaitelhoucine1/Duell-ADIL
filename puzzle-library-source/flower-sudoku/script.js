document.addEventListener('DOMContentLoaded', () => {
    // --- Configuration ---
    // 5 Grids: TL, TR, BL, BR, Center
    // Coordinates in Global 15x15 space (Rows 0-14, Cols 0-14)
    // 5 Grids: Top, Bottom, Left, Right, Center
    // Coordinates in Global 15x15 space (Rows 0-14, Cols 0-14)
    // The "Flower" layout leaves the 4 corners (3x3) empty.
    const GRID_DEFS = [
        { id: 'T', r: [0, 8],  c: [3, 11] }, // Top Vertical
        { id: 'B', r: [6, 14], c: [3, 11] }, // Bottom Vertical
        { id: 'L', r: [3, 11], c: [0, 8]  }, // Left Horizontal
        { id: 'R', r: [3, 11], c: [6, 14] }, // Right Horizontal
        { id: 'C', r: [3, 11], c: [3, 11] }  // Center
    ];

    const translations = {
        en: { 
            newGame: "New Game", check: "Check", solve: "Solve", 
            msgCorrect: "🎉 Correct! You solved the Flower Sudoku!", msgIncomplete: "Grid not fully filled.", msgError: "Errors found!", 
            pdfStatus: "Generating..." 
        },
        de: { 
            newGame: "Neues Spiel", check: "Prüfen", solve: "Lösen", 
            msgCorrect: "🎉 Richtig! Du hast es gelöst!", msgIncomplete: "Nicht vollständig ausgefüllt.", msgError: "Fehler gefunden!", 
            pdfStatus: "Generiere..." 
        },
        fr: { 
            newGame: "Nouveau Jeu", check: "Vérifier", solve: "Résoudre", 
            msgCorrect: "🎉 Correct ! Vous avez gagné !", msgIncomplete: "Grille incomplète.", msgError: "Erreurs trouvées !", 
            pdfStatus: "Génération..." 
        },
        it: { 
            newGame: "Nuova Partita", check: "Controlla", solve: "Risolvi", 
            msgCorrect: "🎉 Corretto! Hai risolto il sudoku!", msgIncomplete: "Griglia incompleta.", msgError: "Errori trovati!", 
            pdfStatus: "Generazione..." 
        }
    };
    
    // --- State ---
    let solutionGrid = []; // 15x15 array of numbers
    let playerGrid = [];   // 15x15 array of { val: number|null, notes: Set, isClue: boolean }
    let selectedCell = { r: -1, c: -1 };
    let currentLang = 'en';

    // --- DOM Elements ---
    const flowerGridEl = document.getElementById('flower-grid');
    const loadingEl = document.getElementById('loading');
    const messageArea = document.getElementById('message-area');
    const newGameBtn = document.getElementById('new-game-btn');
    const checkBtn = document.getElementById('check-btn');
    const solveBtn = document.getElementById('solve-btn');
    const pdfBtn = document.getElementById('pdf-btn');
    const pdfStatus = document.getElementById('pdf-status');
    const langSelect = document.getElementById('language');
    const diffSelect = document.getElementById('difficulty');


    // --- Initialization ---
    initGame();

    // --- Event Listeners ---
    newGameBtn.addEventListener('click', () => {
        loadingEl.classList.remove('hidden');
        // Allow UI to update before blocking
        setTimeout(initGame, 50);
    });

    checkBtn.addEventListener('click', checkGame);
    solveBtn.addEventListener('click', revealSolution);
    pdfBtn.addEventListener('click', generatePDF);
    
    langSelect.addEventListener('change', (e) => {
        currentLang = e.target.value;
        updateUIText();
    });

    // Inputs
    document.querySelectorAll('.num-btn').forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = btn.dataset.val ? parseInt(btn.dataset.val) : null;
            if (btn.dataset.action === 'erase') handleInput(null);
            else handleInput(val);
        });
    });

    document.addEventListener('keydown', (e) => {
        if (selectedCell.r === -1) return;
        const key = e.key;
        if (key >= '1' && key <= '9') handleInput(parseInt(key));
        if (key === 'Backspace' || key === 'Delete') handleInput(null);
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight'].includes(key)) {
            e.preventDefault();
            moveSelection(key);
        }
    });

    // --- Game Logic ---

    function initGame() {
        // Create empty 15x15 grids
        solutionGrid = Array(15).fill().map(() => Array(15).fill(0));
        playerGrid = Array(15).fill().map(() => Array(15).fill().map(() => ({ val: null, notes: new Set(), isClue: false })));
        
        // Generate Solution
        if (generateFlowerSudoku(solutionGrid)) {
            // Apply Difficulty (Create clues)
            applyDifficulty();
            renderGrid();
            messageArea.textContent = "";
        } else {
            alert("Error generating puzzle. Please try again.");
        }
        loadingEl.classList.add('hidden');
    }

    // --- Generator ---
    
    function generateFlowerSudoku(grid) {
        // Backtracking generator
        return solve(grid, 0, 0);
    }

    function solve(grid, r, c) {
        if (r === 15) return true; // Reached end
        
        const nextC = (c === 14) ? 0 : c + 1;
        const nextR = (c === 14) ? r + 1 : r;

        // Skip void cells
        if (!isCellValid(r, c)) {
             return solve(grid, nextR, nextC);
        }

        // Optimized: randomized numbers
        const nums = shuffle([1, 2, 3, 4, 5, 6, 7, 8, 9]);

        for (let num of nums) {
            if (isValidPlacement(grid, r, c, num)) {
                grid[r][c] = num;
                if (solve(grid, nextR, nextC)) return true;
                grid[r][c] = 0;
            }
        }
        return false;
    }

    function isValidPlacement(grid, r, c, num) {
        // Check if cell is in ANY grid
        let isInGrid = false;
        for (let def of GRID_DEFS) {
            if (isInside(r, c, def)) {
                isInGrid = true;
                break;
            }
        }
        
        if (!isInGrid) return true; // Valid placement (ignored) but we shouldn't be here if we iterate correctly

        // Verify against ALL grids that contain this cell (r, c)
        for (let def of GRID_DEFS) {
            if (isInside(r, c, def)) {
                if (!checkSudokuRules(grid, def, r, c, num)) return false;
            }
        }
        return true;
    }

    function isInside(r, c, def) {
        return r >= def.r[0] && r <= def.r[1] && c >= def.c[0] && c <= def.c[1];
    }
    
    function isCellValid(r, c) {
        for (let def of GRID_DEFS) {
             if (isInside(r, c, def)) return true;
        }
        return false;
    }

    function checkSudokuRules(grid, def, r, c, num) {
        // Local coordinates within this 9x9 grid
        const localR = r - def.r[0];
        const localC = c - def.c[0];
        
        // Check Row
        for (let i = 0; i < 9; i++) {
            if (grid[def.r[0] + localR][def.c[0] + i] === num) return false;
        }

        // Check Column
        for (let i = 0; i < 9; i++) {
            if (grid[def.r[0] + i][def.c[0] + localC] === num) return false;
        }

        // Check 3x3 Box
        const boxR = Math.floor(localR / 3) * 3;
        const boxC = Math.floor(localC / 3) * 3;
        for (let i = 0; i < 3; i++) {
            for (let j = 0; j < 3; j++) {
                if (grid[def.r[0] + boxR + i][def.c[0] + boxC + j] === num) return false;
            }
        }
        
        return true;
    }

    function shuffle(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function applyDifficulty() {
        const diff = diffSelect.value;
        // Clue counts per 9x9 grid approximation
        // Easy: ~38 clues, Medium: ~30, Hard: ~24
        let chance;
        if (diff === 'easy') chance = 0.65;
        else if (diff === 'medium') chance = 0.47;
        else chance = 0.34;

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                if (Math.random() < chance) {
                    playerGrid[r][c].val = solutionGrid[r][c];
                    playerGrid[r][c].isClue = true;
                }
            }
        }
    }

    // --- Rendering ---

    function renderGrid() {
        flowerGridEl.innerHTML = '';
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                // Visualization helper: check validity
                if (!isCellValid(r, c)) {
                    cell.style.visibility = 'hidden';
                    // Or add a class 'void'
                    cell.classList.add('void');
                    flowerGridEl.appendChild(cell);
                    continue;
                }

                cell.dataset.row = r;
                cell.dataset.col = c;

                const pCell = playerGrid[r][c];
                if (pCell.val) {
                    cell.textContent = pCell.val;
                    if (pCell.isClue) cell.classList.add('clue');
                    else cell.classList.add('user-input');
                } else {
                    // Notes
                    if (pCell.notes.size > 0) {
                        const noteDiv = document.createElement('div');
                        noteDiv.className = 'notes-grid';
                        for (let n = 1; n <= 9; n++) {
                            const nSpan = document.createElement('span');
                            nSpan.className = 'note-num';
                            if (pCell.notes.has(n)) nSpan.textContent = n;
                            noteDiv.appendChild(nSpan);
                        }
                        cell.appendChild(noteDiv);
                    }
                }

                if (r === selectedCell.r && c === selectedCell.c) {
                    cell.classList.add('selected');
                } else if (r === selectedCell.r || c === selectedCell.c) {
                    cell.classList.add('highlighted');
                }

                // Check errors
                 if (pCell.val && pCell.val !== solutionGrid[r][c]) {
                     // Only show error if checked? Or immediate?
                     // Usually usually instant feedback or on check.
                     // We'll stick to 'Check' button for full validation, 
                     // but maybe visual style for error if 'Check' was pressed?
                     // For now, no auto error.
                 }

                cell.addEventListener('click', () => {
                    selectedCell = { r, c };
                    renderGrid();
                });
                
                flowerGridEl.appendChild(cell);
            }
        }
    }

    // --- Interaction ---

    function handleInput(val) {
        if (selectedCell.r === -1) return;
        const cell = playerGrid[selectedCell.r][selectedCell.c];
        
        if (cell.isClue) return;

        cell.val = val;
        // if (val !== null) cell.notes.clear(); // Notes logic removed
        renderGrid();
    }

    function moveSelection(key) {
        let { r, c } = selectedCell;
        if (key === 'ArrowUp') r = Math.max(0, r - 1);
        if (key === 'ArrowDown') r = Math.min(14, r + 1);
        if (key === 'ArrowLeft') c = Math.max(0, c - 1);
        if (key === 'ArrowRight') c = Math.min(14, c + 1);
        selectedCell = { r, c };
        renderGrid();
    }

    function checkGame() {
        let isCorrect = true;
        let isFull = true;

        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                if (playerGrid[r][c].val === null) isFull = false;
                else if (playerGrid[r][c].val !== solutionGrid[r][c]) {
                    isCorrect = false;
                    // Visual feedback
                    // We could mark errors
                }
            }
        }

        const t = translations[currentLang];
        if (!isFull) {
            messageArea.textContent = t.msgIncomplete;
            messageArea.style.color = '#f57c00';
        } else if (isCorrect) {
            messageArea.textContent = t.msgCorrect;
            messageArea.style.color = '#388e3c';
        } else {
            messageArea.textContent = t.msgError;
            messageArea.style.color = '#d32f2f';
        }
    }

    function revealSolution() {
        if (!confirm("Reveal solution?")) return;
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                playerGrid[r][c].val = solutionGrid[r][c];
                playerGrid[r][c].notes.clear();
            }
        }
        renderGrid();
    }

    function updateUIText() {
        const t = translations[currentLang];
        newGameBtn.textContent = t.newGame;
        checkBtn.textContent = t.check;
        solveBtn.textContent = t.solve;
    }

    // --- PDF Export ---
    async function generatePDF() {
        const count = parseInt(document.getElementById('pdf-count').value) || 1;
        const hideTitle = document.getElementById('pdf-hide-title').checked;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF({ unit: 'pt', format: 'a4' });
        
        pdfStatus.textContent = translations[currentLang].pdfStatus;
        pdfBtn.disabled = true;

        // Generate data for N puzzles
        // This makes UI freeze, so we use setTimeout
        setTimeout(() => {
            try {
                for (let i = 0; i < count; i++) {
                    const tempSol = Array(15).fill().map(() => Array(15).fill(0));
                    generateFlowerSudoku(tempSol);
                    
                    const puzGrid = Array(15).fill().map(() => Array(15).fill(null));
                    // Simple holes
                    const diff = diffSelect.value;
                    let chance = (diff === 'easy') ? 0.5 : (diff === 'medium') ? 0.4 : 0.32;
                    
                    for (let r = 0; r < 15; r++) {
                        for (let c = 0; c < 15; c++) {
                            if (Math.random() < chance) {
                                puzGrid[r][c] = tempSol[r][c];
                            }
                        }
                    }

                    if (i > 0) doc.addPage();
                    drawPDFPage(doc, puzGrid, `Puzzle #${i+1} (${diff})`, false, hideTitle);
                    doc.addPage();
                    drawPDFPage(doc, tempSol, `Solution #${i+1}`, true, hideTitle);
                }
                doc.save('flower-sudoku.pdf');
                pdfStatus.textContent = "";
            } catch(e) {
                console.error(e);
                pdfStatus.textContent = "Error";
            }
            pdfBtn.disabled = false;
        }, 100);
    }

    function drawPDFPage(doc, gridData, title, isSolution, hideTitle) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        let cellSize, startY, startX;

        if (hideTitle) {
            // Maximize space: 15 cells wide.
            // A4 width ~595pt.
            // Reduced again by ~10% (28 -> 25)
            cellSize = 25;
            startX = (pageWidth - (15 * cellSize)) / 2;
            startY = (pageHeight - (15 * cellSize)) / 2;
        } else {
            // Standard size with title
            cellSize = 28; // Increased from 20
            startX = (pageWidth - (15 * cellSize)) / 2;
            startY = 100;
            
            doc.setFontSize(16);
            doc.setTextColor(0);
            doc.text(title, pageWidth / 2, 50, { align: 'center' });
        }

        doc.setLineWidth(0.5);
        
        for (let r = 0; r < 15; r++) {
            for (let c = 0; c < 15; c++) {
                const x = startX + c * cellSize;
                const y = startY + r * cellSize;
                
                // Draw Cell
                // Check if valid
                let isValid = false;
                for (let def of GRID_DEFS) {
                    if (r >= def.r[0] && r <= def.r[1] && c >= def.c[0] && c <= def.c[1]) {
                        isValid = true;
                        break;
                    }
                }

                if (!isValid) continue;

                doc.setDrawColor(0); // Black borders
                
                // Draw number
                if (gridData[r][c] !== null && gridData[r][c] !== 0) {
                    doc.setFontSize(cellSize * 0.5);
                    // Bold for puzzle (clues), Normal for solution
                    doc.setFont('helvetica', isSolution ? 'normal' : 'bold');
                    doc.text(String(gridData[r][c]), x + cellSize/2, y + cellSize/2 + (cellSize * 0.2), { align: 'center' });
                }
                
                doc.rect(x, y, cellSize, cellSize);
            }
        }
        
        // Draw Thick Lines (3x3 blocks)
        doc.setLineWidth(1.5);
        // We can draw the outline of the 5 grids?
        // Or just draw grid lines where valid?
        
        // Vertical Thick Lines
        for (let c = 0; c <= 15; c += 3) {
             // Only draw if adjacent cells are valid?
             // Simplification: draw full lines then mask? No.
             // Draw segments
             for (let r = 0; r < 15; r++) {
                 // Check if this segment is a valid border
                 // A vertical line at x=c*cellSize (between col c-1 and c)
                 // It's visible if (r, c-1) or (r, c) is valid (actually 3x3 grid logic)
                 // This is getting complex for PDF.
                 // Alternative: Draw borders for each of the 5 area definitions
             }
        }

        // Simpler PDF Thick Lines: Draw the 5 squares
        GRID_DEFS.forEach(def => {
             const x = startX + def.c[0] * cellSize;
             const y = startY + def.r[0] * cellSize;
             const w = 9 * cellSize;
             const h = 9 * cellSize;
             doc.setDrawColor(0);
             doc.setLineWidth(1.5);
             doc.rect(x, y, w, h);
             
             // Internal 3x3 lines for this grid
             for (let i = 3; i < 9; i+=3) {
                 // Vert
                 doc.line(x + i*cellSize, y, x + i*cellSize, y + h);
                 // Horiz
                 doc.line(x, y + i*cellSize, x + w, y + i*cellSize);
             }
        });
    }
});
