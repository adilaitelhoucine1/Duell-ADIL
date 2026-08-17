document.addEventListener('DOMContentLoaded', () => {
    // Check if jspdf is loaded
    const { jsPDF } = window.jspdf ? window.jspdf : { jsPDF: null };

    const gridEl = document.getElementById('sudoku-grid');
    const newGameBtn = document.getElementById('new-game-btn');
    const checkBtn = document.getElementById('check-btn');
    const solveBtn = document.getElementById('solve-btn');
    // const notesToggle = document.getElementById('notes-toggle'); // Removed
    const numParams = document.querySelectorAll('.num-btn');
    const messageArea = document.getElementById('message-area');
    
    // PDF UI
    const pdfCountInput = document.getElementById('pdf-count');
    const pdfBtn = document.getElementById('pdf-btn');
    const pdfStatus = document.getElementById('pdf-status');
    const langSelect = document.getElementById('language');

    const translations = {
        en: {
            newGame: "New Game", check: "Check Solution", solve: "Show Solution",
            noteMode: "Note Mode",
            msgCorrect: "Correct! You Win!",
            msgMistakes: "Mistakes found.",
            msgIncomplete: "Grid not full.",
            msgRevealed: "Solution Revealed",
            pdfStatus: "Generating... Please wait.",
            pdfDone: "Done!",
            puzzle: "Puzzle",
            solution: "Solution",
            confirmSolve: "Reveal solution?",
            killerTitle: "Killer Sudoku"
        },
        de: {
            newGame: "Neues Spiel", check: "Lösung prüfen", solve: "Lösung zeigen",
            noteMode: "Notiz-Modus",
            msgCorrect: "Richtig! Gewonnen!",
            msgMistakes: "Fehler gefunden.",
            msgIncomplete: "Gitter nicht voll.",
            msgRevealed: "Lösung aufgedeckt",
            pdfStatus: "Generiere... Bitte warten.",
            pdfDone: "Fertig!",
            puzzle: "Rätsel",
            solution: "Lösung",
            confirmSolve: "Lösung aufdecken?",
            killerTitle: "Killer Sudoku"
        },
        fr: {
            newGame: "Nouveau Jeu", check: "Vérifier", solve: "Montrer la Solution",
            noteMode: "Mode Notes",
            msgCorrect: "Correct ! Vous avez gagné !",
            msgMistakes: "Des erreurs trouvées.",
            msgIncomplete: "Grille incomplète.",
            msgRevealed: "Solution Révélée",
            pdfStatus: "Génération... Veuillez patienter.",
            pdfDone: "Terminé !",
            puzzle: "Puzzle",
            solution: "Solution",
            confirmSolve: "Révéler la solution ?",
            killerTitle: "Killer Sudoku"
        },
        it: {
            newGame: "Nuova Partita", check: "Controlla", solve: "Mostra Soluzione",
            noteMode: "Modalità Note",
            msgCorrect: "Corretto! Hai Vinto!",
            msgMistakes: "Trovati errori.",
            msgIncomplete: "Griglia incompleta.",
            msgRevealed: "Soluzione Svelata",
            pdfStatus: "Generazione... Attendere prego.",
            pdfDone: "Fatto!",
            puzzle: "Puzzle",
            solution: "Soluzione",
            confirmSolve: "Rivela soluzione?",
            killerTitle: "Killer Sudoku"
        }
    };
    
    let currentLang = 'en';

    let solution = [];
    let playerGrid = []; // stores { val: num|null, notes: Set }
    let cages = []; // Array of { id, sum, cells: [{r,c}] }
    let cellCageMap = []; // 9x9 storing cageId per cell
    let selectedCell = null; // {r, c}

    initGame();

    newGameBtn.addEventListener('click', initGame);
    checkBtn.addEventListener('click', checkGame);
    solveBtn.addEventListener('click', revealSolution);
    solveBtn.addEventListener('click', revealSolution);
    pdfBtn.addEventListener('click', handlePDFExport);
    
    langSelect.addEventListener('change', (e) => {
        currentLang = e.target.value;
        updateUIText();
    });

    // Numpad listeners
    numParams.forEach(btn => {
        btn.addEventListener('click', (e) => {
            const val = btn.dataset.val;
            const action = btn.dataset.action;
            if (action === 'erase') handleInput(null);
            else handleInput(parseInt(val));
        });
    });

    // Keyboard support
    document.addEventListener('keydown', (e) => {
        if (!selectedCell) return;
        
        const key = e.key;
        if (key >= '1' && key <= '9') handleInput(parseInt(key));
        if (key === 'Backspace' || key === 'Delete') handleInput(null);
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) moveSelection(key);
        if (key === 'Backspace' || key === 'Delete') handleInput(null);
        if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(key)) moveSelection(key);
    });

    function initGame() {
        const data = generatePuzzleData();
        solution = data.solution;
        cages = data.cages;
        cellCageMap = data.map;
        
        // Init Player Grid
        playerGrid = Array(9).fill().map(() => Array(9).fill().map(() => ({ val: null, notes: new Set() })));
        
        selectedCell = null;
        if(messageArea) messageArea.textContent = '';
        if(messageArea) messageArea.textContent = '';
        updateUIText();
        renderGrid();
    }
    
    function updateUIText() {
        const t = translations[currentLang];
        newGameBtn.textContent = t.newGame;
        checkBtn.textContent = t.check;
        solveBtn.textContent = t.solve;
        
        checkBtn.textContent = t.check;
        solveBtn.textContent = t.solve;
    }

    function generatePuzzleData() {
        const board = generateSudoku();
        const generatedCages = generateCages(board);
        // Map cags
        const map = Array(9).fill().map(() => Array(9).fill(-1));
        generatedCages.forEach((cage, idx) => {
            cage.cells.forEach(pos => {
                map[pos.r][pos.c] = idx;
            });
        });
        return { solution: board, cages: generatedCages, map: map };
    }

    /* --- Logic --- */

    function generateSudoku() {
        const board = Array(9).fill().map(() => Array(9).fill(0));
        fillSudoku(board);
        return board;
    }

    function fillSudoku(board) {
        const empty = findEmpty(board);
        if (!empty) return true;
        
        const [r, c] = empty;
        const nums = shuffle([1,2,3,4,5,6,7,8,9]);
        
        for (let num of nums) {
            if (isValid(board, r, c, num)) {
                board[r][c] = num;
                if (fillSudoku(board)) return true;
                board[r][c] = 0;
            }
        }
        return false;
    }

    function findEmpty(board) {
        for(let r=0; r<9; r++) 
            for(let c=0; c<9; c++) 
                if (board[r][c] === 0) return [r,c];
        return null;
    }

    function isValid(board, r, c, num) {
        for(let i=0; i<9; i++) {
            if (board[r][i] === num) return false;
            if (board[i][c] === num) return false;
        }
        const br = Math.floor(r/3)*3;
        const bc = Math.floor(c/3)*3;
        for(let i=0; i<3; i++)
            for(let j=0; j<3; j++)
                if (board[br+i][bc+j] === num) return false;
        return true;
    }

    function shuffle(arr) {
        return arr.sort(() => Math.random() - 0.5);
    }

    function generateCages(board) {
        const assigned = Array(9).fill().map(() => Array(9).fill(null));
        const newCages = [];
        let cageCount = 0;

        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                if (assigned[r][c]) continue;
                
                // 1. Determine Target Size (2 to 5)
                let size;
                const seed = Math.random();
                if (seed < 0.35) size = 2;       // 35%
                else if (seed < 0.65) size = 3;  // 30%
                else if (seed < 0.85) size = 4;  // 20%
                else size = 5;                   // 15%

                const cageCells = [];
                // Temp mark as assigned to prevent self-overlap during growth
                assigned[r][c] = { temp: true }; 
                cageCells.push({r,c});
                
                // 2. Grow Cage
                let attempts = 0;
                while(cageCells.length < size && attempts < 15) {
                    attempts++;
                    // Pick random cell from current cage to grow from
                    const base = cageCells[Math.floor(Math.random()*cageCells.length)];
                    const neighbors = [
                        {r: base.r-1, c: base.c}, {r: base.r+1, c: base.c},
                        {r: base.r, c: base.c-1}, {r: base.r, c: base.c+1}
                    ];
                    // Filter for valid unassigned neighbors
                    const validN = neighbors.filter(n => 
                        n.r>=0 && n.r<9 && n.c>=0 && n.c<9 && !assigned[n.r][n.c]
                    );
                    
                    if (validN.length === 0) continue;
                    
                    const pick = validN[Math.floor(Math.random()*validN.length)];
                    assigned[pick.r][pick.c] = { temp: true };
                    cageCells.push(pick);
                }
                
                // 3. Check for Size 1 (Orphan Check)
                if (cageCells.length === 1) {
                    // Start Merge Strategy
                    const neighbors = [
                        {r, c: c-1}, {r: r-1, c},
                        {r, c: c+1}, {r: r+1, c}
                    ];
                    
                    // Find a valid neighbor cage to merge into
                    let targetCage = null;
                    let bestLen = 99;

                    for (let n of neighbors) {
                        if (n.r>=0 && n.r<9 && n.c>=0 && n.c<9) {
                            const neighborObj = assigned[n.r][n.c];
                            // Must be a real cage, not temp (though temp shouldn't happen for prev cells loops)
                            // But since we scan TL to BR, unassigned future cells are null.
                            // Previously assigned cells are real cage objects.
                            if (neighborObj && !neighborObj.temp) {
                                // Prefer merging into smaller cages ??
                                // neighborObj is a reference to the cage object in newCages
                                if (neighborObj.cells.length < bestLen) {
                                    bestLen = neighborObj.cells.length;
                                    targetCage = neighborObj;
                                }
                            }
                        }
                    }

                    if (targetCage) {
                        // Merge
                        targetCage.cells.push({r,c});
                        targetCage.sum += board[r][c];
                        assigned[r][c] = targetCage;
                        continue; // Done with this cell, moved to next
                    } else {
                        // Needs to be a new cage (rare edge case: completely isolated start? Should not happen in scan)
                        // Or if we picked a seed that couldn't grow and no neighbors exist?
                        // At (0,0) if stuck, no previous neighbors.
                        // Force it to stay size 1 or retry? 
                        // It will likely be size 1. But with size 2-5 logic, (0,0) will grab (0,1) or (1,0) unless logic fails.
                        // Just fallthrough to create, but we tried our best.
                    }
                }

                // 4. Finalize New Cage
                const sum = cageCells.reduce((acc, pos) => acc + board[pos.r][pos.c], 0);
                const newCage = {
                    id: cageCount++,
                    sum: sum,
                    cells: cageCells 
                };
                newCages.push(newCage);

                // Update assigned grid with real cage reference
                cageCells.forEach(pos => {
                    assigned[pos.r][pos.c] = newCage;
                });
            }
        }
        return newCages;
    }

    /* --- Rendering --- */

    function renderGrid() {
        gridEl.innerHTML = '';
        
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                const cell = document.createElement('div');
                cell.className = 'cell';
                cell.dataset.r = r;
                cell.dataset.c = c;
                
                const pCell = playerGrid[r][c];
                if (pCell.val !== null) {
                    cell.textContent = pCell.val;
                } else {
                    if (pCell.notes.size > 0) {
                        cell.appendChild(renderNotes(pCell.notes));
                    }
                }

                // Grid Data Attributes
                cell.dataset.row = r;
                cell.dataset.col = c;

                // Cage Classes for pseudo-element borders
                const cageId = cellCageMap[r][c];
                const cage = cages[cageId];
                
                if (r===0 || cellCageMap[r-1][c] !== cageId) cell.classList.add('cage-border-top');
                if (r===8 || cellCageMap[r+1][c] !== cageId) cell.classList.add('cage-border-bottom');
                if (c===0 || cellCageMap[r][c-1] !== cageId) cell.classList.add('cage-border-left');
                if (c===8 || cellCageMap[r][c+1] !== cageId) cell.classList.add('cage-border-right');

                // Sum Label
                const sorted = [...cage.cells].sort((a,b) => (a.r - b.r) || (a.c - b.c));
                if (sorted[0].r === r && sorted[0].c === c) {
                    const sumSpan = document.createElement('span');
                    sumSpan.className = 'cage-sum';
                    sumSpan.textContent = cage.sum;
                    cell.appendChild(sumSpan);
                }

                if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
                    cell.classList.add('selected');
                }

                cell.addEventListener('click', () => {
                    selectedCell = {r,c};
                    renderGrid();
                });

                gridEl.appendChild(cell);
            }
        }
    }

    function renderNotes(notesSet) {
        const div = document.createElement('div');
        div.className = 'notes-grid';
        for(let i=1; i<=9; i++) {
            const span = document.createElement('span');
            span.className = 'note-num';
            if (notesSet.has(i)) span.textContent = i;
            div.appendChild(span);
        }
        return div;
    }

    /* --- Interaction --- */
    function handleInput(val) {
        if (!selectedCell) return;
        
        const {r,c} = selectedCell;
        const pCell = playerGrid[r][c];



        pCell.val = val;
        // if (val) pCell.notes.clear(); // Notes logic removed
        
        renderGrid();
    }

    function moveSelection(key) {
        let { r, c } = selectedCell;
        if (key === 'ArrowUp') r = Math.max(0, r - 1);
        if (key === 'ArrowDown') r = Math.min(8, r + 1);
        if (key === 'ArrowLeft') c = Math.max(0, c - 1);
        if (key === 'ArrowRight') c = Math.min(8, c + 1);
        selectedCell = { r, c };
        renderGrid();
    }

    function checkGame() {
        let isFull = true;
        let isCorrect = true;
        
        for(let r=0; r<9; r++) for(let c=0; c<9; c++) if (playerGrid[r][c].val === null) isFull = false;
        
        if (!isFull) {
            messageArea.textContent = translations[currentLang].msgIncomplete;
            messageArea.style.color = '#d32f2f';
            return;
        }

        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                if (playerGrid[r][c].val !== solution[r][c]) {
                    isCorrect = false;
                }
            }
        }

        // Cage sums check (implicit if solution correct, but valid logic)
        cages.forEach(cage => {
            let currentSum = 0;
            cage.cells.forEach(pos => {
                currentSum += (playerGrid[pos.r][pos.c].val || 0);
            });
            if (currentSum !== cage.sum) isCorrect = false;
        });

        if (isCorrect) {
            messageArea.textContent = translations[currentLang].msgCorrect;
            messageArea.style.color = '#388e3c';
        } else {
            messageArea.textContent = translations[currentLang].msgMistakes;
            messageArea.style.color = '#d32f2f';
        }
    }

    function revealSolution() {
        if (!confirm(translations[currentLang].confirmSolve)) return;
        for(let r=0; r<9; r++) {
            for(let c=0; c<9; c++) {
                playerGrid[r][c].val = solution[r][c];
                playerGrid[r][c].notes.clear();
            }
        }
        renderGrid();
        messageArea.textContent = translations[currentLang].msgRevealed;
    }

    /* --- PDF Export (Vector) --- */
    
    async function handlePDFExport() {
        if (!jsPDF) {
            alert('jsPDF library not loaded.');
            return;
        }

        const count = parseInt(pdfCountInput.value) || 1;
        const hideTitle = document.getElementById('pdf-hide-title').checked;
        pdfStatus.textContent = translations[currentLang].pdfStatus;
        pdfStatus.style.display = 'block';
        pdfBtn.disabled = true;

        // Use setTimeout to allow UI to update
        setTimeout(async () => {
            try {
                const doc = new jsPDF({ unit: 'pt', format: 'a4' });
                
                for(let i=0; i < count; i++) {
                    // Generate new puzzle
                    const pData = generatePuzzleData();
                    
                    // Page 1: Puzzle
                    drawPage(doc, pData, false, i + 1, "Puzzle", hideTitle);
                    doc.addPage();
                    
                    // Page 2: Solution
                    drawPage(doc, pData, true, i + 1, "Solution", hideTitle);
                    
                    if (i < count - 1) doc.addPage();
                }

                doc.save('killer_sudoku_collection.pdf');
            } catch (err) {
                console.error(err);
                alert('Error generating PDF');
            } finally {
                pdfStatus.style.display = 'none';
                pdfBtn.disabled = false;
            }
        }, 100);
    }

    function drawPage(doc, data, isSolution, index, type, hideTitle) {
        const pageWidth = doc.internal.pageSize.getWidth();
        const pageHeight = doc.internal.pageSize.getHeight();
        
        let startY = 100;

        // Header
        if (!hideTitle) {
            doc.setFontSize(18);
            doc.setTextColor(40);
            const t = translations[currentLang];
            // 'type' argument was passed as "Puzzle" or "Solution" string literal in handlePDFExport, need to map or pass boolean
            // Let's rely on isSolution boolean
            const typeStr = isSolution ? t.solution : t.puzzle;
            doc.text(`${t.killerTitle} - ${typeStr} #${index}`, pageWidth / 2, 50, { align: 'center' });
        } else {
            startY = 40; // less margin if no title
        }
        
        // Grid Params
        const margin = 40;
        const availableWidth = pageWidth - (margin * 2);
        const cellSize = availableWidth / 9;
        const startX = margin;

        // Draw Cages (Dashed Inset) - ONLY FOR PUZZLE
        if (!isSolution) {
            
            const inset = 5; // Increased gap as requested

            for (let r=0; r<9; r++) {
                for (let c=0; c<9; c++) {
                    const cageId = data.map[r][c];
                    const x = startX + c * cellSize;
                    const y = startY + r * cellSize;
                    
                    const hasTop = (r === 0 || data.map[r-1][c] !== cageId);
                    const hasBottom = (r === 8 || data.map[r+1][c] !== cageId);
                    const hasLeft = (c === 0 || data.map[r][c-1] !== cageId);
                    const hasRight = (c === 8 || data.map[r][c+1] !== cageId);

                    // 1. Draw Dashed Lines
                    doc.setLineWidth(1);
                    doc.setLineDashPattern([3, 2], 0); // Dashed
                    doc.setDrawColor(80, 80, 80); 

                    // Top
                    if (hasTop) {
                        const start = hasLeft ? x + inset : x;
                        const end = hasRight ? x + cellSize - inset : x + cellSize;
                        doc.line(start, y + inset, end, y + inset);
                    }
                    // Bottom
                    if (hasBottom) {
                        const start = hasLeft ? x + inset : x;
                        const end = hasRight ? x + cellSize - inset : x + cellSize;
                        doc.line(start, y + cellSize - inset, end, y + cellSize - inset);
                    }
                    // Left
                    if (hasLeft) {
                        const start = hasTop ? y + inset : y;
                        const end = hasBottom ? y + cellSize - inset : y + cellSize;
                        doc.line(x + inset, start, x + inset, end);
                    }
                    // Right
                    if (hasRight) {
                        const start = hasTop ? y + inset : y;
                        const end = hasBottom ? y + cellSize - inset : y + cellSize;
                        doc.line(x + cellSize - inset, start, x + cellSize - inset, end);
                    }

                    // 2. Draw Solid Corners ("Line to cross for corners") -> NOW DASHED as requested
                    // "Cutted lines" style for the corners - [3, 2] matches the main cage lines
                    doc.setLineDashPattern([3, 2], 0); 
                    doc.setLineWidth(1);

                    const L_LEN = 3; // Length of corner legs

                    // Grid-safe border check helper within scope
                    const checkBorder = (rr, cc, side) => {
                        if (rr<0 || rr>8 || cc<0 || cc>8) return true; // Edge of grid is border
                        const myId = data.map[rr][cc];
                        if (side === 'top') return (rr===0 || data.map[rr-1][cc] !== myId);
                        if (side === 'bottom') return (rr===8 || data.map[rr+1][cc] !== myId);
                        if (side === 'left') return (cc===0 || data.map[rr][cc-1] !== myId);
                        if (side === 'right') return (cc===8 || data.map[rr][cc+1] !== myId);
                        return false;
                    };

                    // --- Outer Corners (Convex) ---
                    // TL
                    if (hasTop && hasLeft) {
                        doc.line(x + inset, y + inset + L_LEN, x + inset, y + inset);
                        doc.line(x + inset, y + inset, x + inset + L_LEN, y + inset);
                    }
                    // TR
                    if (hasTop && hasRight) {
                        doc.line(x + cellSize - inset - L_LEN, y + inset, x + cellSize - inset, y + inset);
                        doc.line(x + cellSize - inset, y + inset, x + cellSize - inset, y + inset + L_LEN);
                    }
                    // BL
                    if (hasBottom && hasLeft) {
                        doc.line(x + inset, y + cellSize - inset - L_LEN, x + inset, y + cellSize - inset);
                        doc.line(x + inset, y + cellSize - inset, x + inset + L_LEN, y + cellSize - inset);
                    }
                    // BR
                    if (hasBottom && hasRight) {
                        doc.line(x + cellSize - inset - L_LEN, y + cellSize - inset, x + cellSize - inset, y + cellSize - inset);
                        doc.line(x + cellSize - inset, y + cellSize - inset, x + cellSize - inset, y + cellSize - inset - L_LEN);
                    }

                    // --- Inner Corners (Concave bridges) ---
                    // 1. Top-Left-Out-Horizontal: Top Border turns Up
                    if (hasTop && !hasLeft && !checkBorder(r, c-1, 'top')) {
                         // L at (x - inset, y + inset) -> Up, Right
                         doc.line(x - inset, y + inset, x - inset, y); // Up to grid line
                         doc.line(x - inset, y + inset, x, y + inset); // Right to start of top border
                    }
                    // 2. Top-Left-Out-Vertical: Left Border turns Left
                    if (hasLeft && !hasTop && !checkBorder(r-1, c, 'left')) {
                         // L at (x + inset, y - inset) -> Down, Left
                         doc.line(x + inset, y - inset, x + inset, y); // Down
                         doc.line(x + inset, y - inset, x, y - inset); // Left
                    }

                    // 3. Top-Right-Out-Horizontal: Top Border turns Up (at Right)
                    if (hasTop && !hasRight && !checkBorder(r, c+1, 'top')) {
                        // L at (x + sz + inset, y + inset) -> Up, Left
                        doc.line(x + cellSize + inset, y + inset, x + cellSize + inset, y); // Up
                        doc.line(x + cellSize + inset, y + inset, x + cellSize, y + inset); // Left
                    }
                    // 4. Top-Right-Out-Vertical: Right Border turns Right (at Top)
                    if (hasRight && !hasTop && !checkBorder(r-1, c, 'right')) {
                        // L at (x + sz - inset, y - inset) -> Down, Right
                        doc.line(x + cellSize - inset, y - inset, x + cellSize - inset, y); // Down
                        doc.line(x + cellSize - inset, y - inset, x + cellSize, y - inset); // Right
                    }

                    // 5. Bottom-Left-Out-Horizontal: Bottom Border turns Down
                    if (hasBottom && !hasLeft && !checkBorder(r, c-1, 'bottom')) {
                        // L at (x - inset, y + sz - inset) -> Down, Right
                        doc.line(x - inset, y + cellSize - inset, x - inset, y + cellSize); // Down
                        doc.line(x - inset, y + cellSize - inset, x, y + cellSize - inset); // Right
                    }
                    // 6. Bottom-Left-Out-Vertical: Left Border turns Left (at Bottom)
                    if (hasLeft && !hasBottom && !checkBorder(r+1, c, 'left')) {
                        // L at (x + inset, y + sz + inset) -> Up, Left
                        doc.line(x + inset, y + cellSize + inset, x + inset, y + cellSize); // Up
                        doc.line(x + inset, y + cellSize + inset, x, y + cellSize + inset); // Left
                    }

                    // 7. Bottom-Right-Out-Horizontal: Bottom Border turns Down (at Right)
                    if (hasBottom && !hasRight && !checkBorder(r, c+1, 'bottom')) {
                        // L at (x + sz + inset, y + sz - inset) -> Down, Left
                        doc.line(x + cellSize + inset, y + cellSize - inset, x + cellSize + inset, y + cellSize); // Down
                        doc.line(x + cellSize + inset, y + cellSize - inset, x + cellSize, y + cellSize - inset); // Left
                    }
                    // 8. Bottom-Right-Out-Vertical: Right Border turns Right (at Bottom)
                    if (hasRight && !hasBottom && !checkBorder(r+1, c, 'right')) {
                        // L at (x + sz - inset, y + sz + inset) -> Up, Right
                        doc.line(x + cellSize - inset, y + cellSize + inset, x + cellSize - inset, y + cellSize); // Up
                        doc.line(x + cellSize - inset, y + cellSize + inset, x + cellSize, y + cellSize + inset); // Right
                    }
                }
            }
        }

        // Draw Grid Lines (Solid)
        doc.setLineDashPattern([], 0); // Solid
        doc.setDrawColor(0);
        
        for (let i=0; i<=9; i++) {
            const pos = i * cellSize;
            
            // Layout: 0,1,2 (thin), 3 (thick)
            if (i % 3 === 0) doc.setLineWidth(2.5);
            else doc.setLineWidth(0.5);
            
            // Vert
            doc.line(startX + pos, startY, startX + pos, startY + 9 * cellSize);
            // Horz
            doc.line(startX, startY + pos, startX + 9 * cellSize, startY + pos);
        }

        // Draw Content (Numbers & Sums)
        doc.setTextColor(0);
        for (let r=0; r<9; r++) {
            for (let c=0; c<9; c++) {
                const cx = startX + c * cellSize;
                const cy = startY + r * cellSize;
                
                // Sum (Top-Left) - Only show in puzzle, NOT solution
                if (!isSolution) {
                    const cageId = data.map[r][c];
                    const cage = data.cages[cageId];
                    
                    // Find top-left of cage
                    let minR = 99, minC = 99;
                    cage.cells.forEach(ce => {
                        if (ce.r < minR) { minR = ce.r; minC = ce.c; }
                        else if (ce.r === minR && ce.c < minC) { minC = ce.c; }
                    });
                    
                    if (r === minR && c === minC) {
                        doc.setFont('helvetica', 'normal');
                        doc.setFontSize(15);
                        // Moved down to +18 to avoid touching top border
                        // Increased left padding to +7 as requested
                        doc.text(`${cage.sum}`, cx + 7, cy + 18);
                        doc.setFont('helvetica', 'normal');
                    }
                }

                // Number
                if (isSolution) {
                    doc.setFontSize(20);
                    doc.text(`${data.solution[r][c]}`, cx + cellSize/2, cy + cellSize/2 + 7, { align: 'center' });
                }
            }
        }
        
    }

});
