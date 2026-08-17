document.addEventListener('DOMContentLoaded', () => {
    const gridContainer = document.getElementById('grid-container');
    const difficultySelect = document.getElementById('difficulty');
    const newGameBtn = document.getElementById('new-game-btn');
    const checkBtn = document.getElementById('check-btn');
    const solveBtn = document.getElementById('solve-btn');
    const maxNumSpan = document.getElementById('max-num');
    const messageArea = document.getElementById('message-area');

    // PDF Elements
    const pdfCountInput = document.getElementById('pdf-count');
    const pdfBtn = document.getElementById('pdf-btn');
    const pdfContainer = document.getElementById('pdf-export-container');

    let gridSize = 5;
    let selectedCell = null;
    let currentGame = null; // { solution, playerBoard, constraints, gridSize }

    initGame();

    newGameBtn.addEventListener('click', () => initGame());
    difficultySelect.addEventListener('change', () => initGame());
    
    checkBtn.addEventListener('click', checkSolution);
    solveBtn.addEventListener('click', revealSolution);
    if(pdfBtn) pdfBtn.addEventListener('click', generatePDF);

    // Keyboard support for input
    document.addEventListener('keydown', handleKeyInput);

    function initGame() {
        gridSize = parseInt(difficultySelect.value);
        if(maxNumSpan) maxNumSpan.textContent = gridSize;
        if(messageArea) messageArea.textContent = '';
        
        currentGame = generateGameData(gridSize);
        // Initialize player interactions
        selectedCell = null;
        
        renderMainGrid();
    }

    function generateGameData(size) {
        // 1. Generate core Latin Square
        const solutionBoard = generateLatinSquare(size);
        
        // 2. Generate Constraints (Inequalities)
        const constraints = generateConstraints(solutionBoard, size);
        
        // 3. Prepare Player Board
        let revealPct = 0.4;
        if (size === 5) revealPct = 0.35;
        if (size === 6) revealPct = 0.25;
        
        const playerBoard = createPuzzle(solutionBoard, revealPct);
        
        return {
            gridSize: size,
            solutionBoard,
            playerBoard, // stores {val, fixed}
            constraints
        };
    }

    /* --- Core Generation Logic --- */
    
    function generateLatinSquare(n) {
        let board = Array(n).fill().map(() => Array(n).fill(0));
        solveLatinSquare(board, 0, 0, n);
        const map = shuffleArray([1,2,3,4,5,6].slice(0, n));
        for(let r=0; r<n; r++) {
            for(let c=0; c<n; c++) {
                board[r][c] = map[board[r][c]-1];
            }
        }
        return board;
    }

    function solveLatinSquare(board, row, col, n) {
        if (row === n) return true;
        
        const nextCol = (col + 1) % n;
        const nextRow = nextCol === 0 ? row + 1 : row;

        const nums = shuffleArray([1,2,3,4,5,6].slice(0, n));

        for (let num of nums) {
            if (isValid(board, row, col, num, n)) {
                board[row][col] = num;
                if (solveLatinSquare(board, nextRow, nextCol, n)) return true;
                board[row][col] = 0;
            }
        }
        return false;
    }

    function isValid(board, row, col, num, n) {
        for(let c=0; c<n; c++) if (board[row][c] === num) return false;
        for(let r=0; r<n; r++) if (board[r][col] === num) return false;
        return true;
    }

    function shuffleArray(array) {
        for (let i = array.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [array[i], array[j]] = [array[j], array[i]];
        }
        return array;
    }

    function generateConstraints(board, n) {
        let horz = Array(n).fill().map(() => Array(n-1).fill(null));
        let vert = Array(n-1).fill().map(() => Array(n).fill(null));

        const density = 0.45;

        for(let r=0; r<n; r++) {
            for(let c=0; c<n-1; c++) {
                if (Math.random() < density) {
                    horz[r][c] = board[r][c] > board[r][c+1] ? '>' : '<';
                }
            }
        }
        for(let r=0; r<n-1; r++) {
            for(let c=0; c<n; c++) {
                if (Math.random() < density) {
                    vert[r][c] = board[r][c] > board[r+1][c] ? 'v' : '^'; 
                }
            }
        }

        return { horz, vert };
    }

    function createPuzzle(solution, revealRate) {
        let pBoard = solution.map(row => row.map(val => ({ val: 0, fixed: false })));
        
        for(let r=0; r<solution.length; r++) {
            for(let c=0; c<solution.length; c++) {
                if (Math.random() < revealRate) {
                    pBoard[r][c] = { val: solution[r][c], fixed: true };
                }
            }
        }
        return pBoard;
    }

    /* --- Rendering --- */
    function renderMainGrid() {
        if (!gridContainer) return;
        renderGridToContainer(currentGame, gridContainer, false, true);
    }

    function renderGridToContainer(gameData, container, showSolution, interactive) {
        const { gridSize, playerBoard, solutionBoard, constraints } = gameData;
        
        container.innerHTML = '';
        if (!container.className.includes('grid-container')) {
            container.className = 'grid-container'; // Reuse CSS
             // Ensure grid layout styles are applied if stripped
             container.style.display = 'grid';
             container.style.gap = '0';
             container.style.background = 'white';
             container.style.padding = '20px';
             container.style.borderRadius = '12px';
             container.style.boxShadow = '0 10px 20px rgba(0,0,0,0.1)';
        }

        let template = '';
        for(let i=0; i<gridSize; i++) {
            template += 'auto ';
            if (i < gridSize-1) template += 'auto ';
        }
        container.style.gridTemplateColumns = template;
        
        for (let r=0; r<gridSize; r++) {
            for (let c=0; c<gridSize; c++) {
                // Cell
                const cell = document.createElement('div');
                cell.className = 'cell';
                
                let val = 0;
                let isFixed = false;
                
                if (showSolution) {
                    val = solutionBoard[r][c];
                    isFixed = true; // Visually style as fixed or just text
                } else {
                    val = playerBoard[r][c].val;
                    isFixed = playerBoard[r][c].fixed;
                }

                if (isFixed) {
                   cell.className += ' fixed'; 
                } else if (val !== 0) {
                    cell.className += ' user-input';
                }

                if (val !== 0) cell.textContent = val;

                if (interactive) {
                    cell.dataset.r = r;
                    cell.dataset.c = c;
                    cell.addEventListener('click', onCellClick);
                    if (selectedCell && selectedCell.r === r && selectedCell.c === c) {
                        cell.classList.add('selected');
                    }
                }
                
                container.appendChild(cell);

                // Horizontal Inequality
                if (c < gridSize - 1) {
                    const ineqDiv = document.createElement('div');
                    ineqDiv.className = 'inequality horizontal';
                    const sign = constraints.horz[r][c];
                    ineqDiv.textContent = sign || ''; 
                    container.appendChild(ineqDiv);
                }
            }

            // Vertical Inequalities row
            if (r < gridSize - 1) {
                for (let c=0; c<gridSize; c++) {
                    const ineqDiv = document.createElement('div');
                    ineqDiv.className = 'inequality vertical';
                    const sign = constraints.vert[r][c];
                    ineqDiv.textContent = sign || '';
                    container.appendChild(ineqDiv);

                    if (c < gridSize - 1) {
                        const spacer = document.createElement('div');
                        spacer.className = 'intersection';
                        container.appendChild(spacer);
                    }
                }
            }
        }
    }

    /* --- Interaction --- */

    function onCellClick(e) {
        const r = parseInt(e.target.dataset.r);
        const c = parseInt(e.target.dataset.c);
        if (currentGame.playerBoard[r][c].fixed) return;
        selectedCell = { r, c };
        renderMainGrid();
    }

    function handleKeyInput(e) {
        if (!selectedCell) return;
        
        const num = parseInt(e.key);
        if (!isNaN(num) && num > 0 && num <= gridSize) {
            currentGame.playerBoard[selectedCell.r][selectedCell.c].val = num;
            renderMainGrid();
        } else if (e.key === 'Backspace' || e.key === 'Delete') {
            currentGame.playerBoard[selectedCell.r][selectedCell.c].val = 0;
            renderMainGrid();
        } else if (['ArrowUp','ArrowDown','ArrowLeft','ArrowRight'].includes(e.key)) {
            moveSelection(e.key);
        }
    }

    function moveSelection(key) {
        let { r, c } = selectedCell;
        if (key === 'ArrowUp') r = Math.max(0, r - 1);
        if (key === 'ArrowDown') r = Math.min(gridSize - 1, r + 1);
        if (key === 'ArrowLeft') c = Math.max(0, c - 1);
        if (key === 'ArrowRight') c = Math.min(gridSize - 1, c + 1);
        selectedCell = { r, c };
        renderMainGrid();
    }

    function checkSolution() {
        let isCorrect = true;
        let isComplete = true;

        const { gridSize, playerBoard, constraints } = currentGame;

        // Completeness
        for(let r=0; r<gridSize; r++) 
            for(let c=0; c<gridSize; c++) 
                if (playerBoard[r][c].val === 0) isComplete = false;
        
        if (!isComplete) {
            messageArea.textContent = "Incomplete!";
            messageArea.style.color = "orange";
            return;
        }

        // Logic Check
         // Check Rows
        for (let r=0; r<gridSize; r++) {
            let rs = new Set();
            for (let c=0; c<gridSize; c++) {
                let v = playerBoard[r][c].val;
                if (rs.has(v)) isCorrect = false;
                rs.add(v);
            }
        }
        // Check Cols
        for (let c=0; c<gridSize; c++) {
            let cs = new Set();
            for (let r=0; r<gridSize; r++) {
                let v = playerBoard[r][c].val;
                if (cs.has(v)) isCorrect = false;
                cs.add(v);
            }
        }

        if(isCorrect) {
            // Check Inequalities
            for (let r=0; r<gridSize; r++) {
                for (let c=0; c<gridSize; c++) {
                    let v = playerBoard[r][c].val;
                    if (c < gridSize - 1) {
                        let sign = constraints.horz[r][c];
                        let nextV = playerBoard[r][c+1].val;
                        if (sign && nextV !== 0) {
                            if (sign === '>' && !(v > nextV)) isCorrect = false;
                            if (sign === '<' && !(v < nextV)) isCorrect = false;
                        }
                    }
                    if (r < gridSize - 1) {
                        let sign = constraints.vert[r][c];
                        let nextV = playerBoard[r+1][c].val;
                        if (sign && nextV !== 0) {
                            if (sign === 'v' && !(v > nextV)) isCorrect = false;
                            if (sign === '^' && !(v < nextV)) isCorrect = false;
                        }
                    }
                }
            }
        }

        if (isCorrect) {
            messageArea.textContent = "Correct! Well Done!";
            messageArea.style.color = "green";
        } else {
            messageArea.textContent = "Incorrect. Keep trying.";
            messageArea.style.color = "red";
        }
    }

    function revealSolution() {
        if (!confirm('Reveal solution?')) return;
        for(let r=0; r<gridSize; r++) {
            for(let c=0; c<gridSize; c++) {
                currentGame.playerBoard[r][c].val = currentGame.solutionBoard[r][c];
            }
        }
        renderMainGrid();
        messageArea.textContent = "Solution Revealed";
    }

    /* --- PDF Generation --- */
    async function generatePDF() {
        const count = parseInt(pdfCountInput.value) || 5;
        const { jsPDF } = window.jspdf;
        const doc = new jsPDF('p', 'pt', 'a4');
        const pageWidth = doc.internal.pageSize.getWidth();

        messageArea.textContent = "Generating PDF...";
        messageArea.style.color = "blue";
        pdfBtn.disabled = true;

        try {
            for (let i = 0; i < count; i++) {
                // Generate Fresh Data
                const pData = generateGameData(gridSize);
                const puzzleNum = i + 1;

                // 1. Puzzle
                pdfContainer.innerHTML = `<h2>Futoshiki Puzzle #${puzzleNum} (Size ${gridSize}x${gridSize})</h2>`;
                const pDiv = document.createElement('div');
                renderGridToContainer(pData, pDiv, false, false);
                pdfContainer.appendChild(pDiv);
                
                const canvasP = await html2canvas(pdfContainer, { scale: 2 });
                const imgDataP = canvasP.toDataURL('image/jpeg', 0.95);
                const imgPropsP = doc.getImageProperties(imgDataP);
                const pdfWidth = pageWidth - 100;
                const pdfHeightP = (imgPropsP.height * pdfWidth) / imgPropsP.width;

                if (i > 0) doc.addPage();
                doc.addImage(imgDataP, 'JPEG', 50, 50, pdfWidth, pdfHeightP);

                // 2. Solution
                doc.addPage();
                pdfContainer.innerHTML = `<h2>Solution #${puzzleNum}</h2>`;
                const sDiv = document.createElement('div');
                renderGridToContainer(pData, sDiv, true, false);
                pdfContainer.appendChild(sDiv);

                const canvasS = await html2canvas(pdfContainer, { scale: 2 });
                const imgDataS = canvasS.toDataURL('image/jpeg', 0.95);
                const imgPropsS = doc.getImageProperties(imgDataS);
                const pdfHeightS = (imgPropsS.height * pdfWidth) / imgPropsS.width;
                doc.addImage(imgDataS, 'JPEG', 50, 50, pdfWidth, pdfHeightS);
            }

            doc.save('futoshiki-puzzles.pdf');
            messageArea.textContent = "PDF Downloaded!";
            messageArea.style.color = "green";

        } catch (e) {
            console.error(e);
            messageArea.textContent = "Error generating PDF.";
            messageArea.style.color = "red";
        } finally {
            pdfBtn.disabled = false;
            pdfContainer.innerHTML = '';
        }
    }

});
