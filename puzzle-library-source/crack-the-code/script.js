const difficultySelect = document.getElementById('difficulty');
const newGameBtn = document.getElementById('new-game-btn');
const showAnswerBtn = document.getElementById('show-answer-btn');
const cluesContainer = document.getElementById('clues-container');
const guessDisplay = document.getElementById('guess-display');
const keys = document.querySelectorAll('.key');
const clearBtn = document.getElementById('clear-btn');
const submitBtn = document.getElementById('submit-btn');

// PDF Elements
const pdfCountInput = document.getElementById('pdf-count');
const pdfBtn = document.getElementById('pdf-btn');
const pdfContainer = document.getElementById('pdf-export-container');

let secretCode = [];
let currentGuess = [];
let currentClues = []; // Store clues for verification display
let codeLength = 4;
let gameActive = true;

// Initial Setup
const languageSelect = document.getElementById('language-select');
let currentLanguage = 'en';

const translations = {
    en: {
        title: "Crack the Code",
        newGame: "New Game",
        showAnswer: "Show Answer",
        submit: "Check",
        clear: "Clear",
        difficulty: {
            3: "Easy (3 Digits)",
            4: "Medium (4 Digits)",
            5: "Hard (5 Digits)"
        },
        pdfBtn: "Save PDF",
        cluesHeader: "Clues",
        workspace: "Workspace:",
        workspaceNote: "(Use this space for notes)",
        crackCode: "Crack the Code",
        solutionTitle: "Solution",
        solutionBreakdown: "Solution Breakdown",
        difficultyLabel: "Difficulty",
        digits: "digits",
        exp: {
            notInCode: "Wrong",
            correct: "correct",
            pos: "pos"
        },
        clues: {
            correct_well_placed: "One number is correct and well placed",
            correct_wrong_placed: "One number is correct but wrongly placed",
            two_correct_wrong_placed: "Two numbers are correct but wrongly placed",
            nothing_correct: "Nothing is correct"
        }
    },
    de: {
        title: "Knacke den Code",
        newGame: "Neues Spiel",
        showAnswer: "Lösung zeigen",
        submit: "Prüfen",
        clear: "Löschen",
        difficulty: {
            3: "Einfach (3 Stellen)",
            4: "Mittel (4 Stellen)",
            5: "Schwer (5 Stellen)"
        },
        pdfBtn: "PDF Speichern",
        cluesHeader: "Hinweise",
        workspace: "Notizen:",
        workspaceNote: "(Hier Notizen machen)",
        crackCode: "Code Knacken",
        solutionTitle: "Lösung",
        solutionBreakdown: "Lösungserklärung",
        difficultyLabel: "Schwierigkeit",
        digits: "Stellen",
        exp: {
            notInCode: "Falsch",
            correct: "korrekt",
            pos: "Pos"
        },
        clues: {
            correct_well_placed: "Eine Zahl ist korrekt und richtig platziert",
            correct_wrong_placed: "Eine Zahl ist korrekt aber falsch platziert",
            two_correct_wrong_placed: "Zwei Zahlen sind korrekt aber falsch platziert",
            nothing_correct: "Nichts ist korrekt"
        }
    },
    fr: {
        title: "Trouvez le Code",
        newGame: "Nouveau Jeu",
        showAnswer: "Voir Réponse",
        submit: "Vérifier",
        clear: "Effacer",
        difficulty: {
            3: "Facile (3 Chiffres)",
            4: "Moyen (4 Chiffres)",
            5: "Difficile (5 Chiffres)"
        },
        pdfBtn: "Sauver PDF",
        cluesHeader: "Indices",
        workspace: "Brouillon:",
        workspaceNote: "(Espace pour vos notes)",
        crackCode: "Trouvez le Code",
        solutionTitle: "Solution",
        solutionBreakdown: "Explication",
        difficultyLabel: "Difficulté",
        digits: "chiffres",
        exp: {
            notInCode: "Faux",
            correct: "correct",
            pos: "pos"
        },
        clues: {
            correct_well_placed: "Un chiffre est correct et bien placé",
            correct_wrong_placed: "Un chiffre est correct mais mal placé",
            two_correct_wrong_placed: "Deux chiffres sont corrects mais mal placés",
            nothing_correct: "Rien n'est correct"
        }
    },
    it: {
        title: "Trova il Codice",
        newGame: "Nuova Partita",
        showAnswer: "Mostra Risposta",
        submit: "Controlla",
        clear: "Cancella",
        difficulty: {
            3: "Facile (3 Cifre)",
            4: "Medio (4 Cifre)",
            5: "Difficile (5 Cifre)"
        },
        pdfBtn: "Salva PDF",
        cluesHeader: "Indizi",
        workspace: "Note:",
        workspaceNote: "(Usa questo spazio per le note)",
        crackCode: "Trova il Codice",
        solutionTitle: "Soluzione",
        solutionBreakdown: "Spiegazione",
        difficultyLabel: "Difficoltà",
        digits: "cifre",
        exp: {
            notInCode: "Errato",
            correct: "corretto",
            pos: "pos"
        },
        clues: {
            correct_well_placed: "Un numero è corretto e nella posizione giusta",
            correct_wrong_placed: "Un numero è corretto ma nella posizione errata",
            two_correct_wrong_placed: "Due numeri sono corretti ma nella posizione errata",
            nothing_correct: "Nessun numero è corretto"
        }
    }
};

let strategies = [
    { type: "correct_well_placed", text: translations.en.clues.correct_well_placed, count: 1, max: 1 },
    { type: "correct_wrong_placed", text: translations.en.clues.correct_wrong_placed, count: 1 },
    { type: "two_correct_wrong_placed", text: translations.en.clues.two_correct_wrong_placed, count: 1, max: 1 },
    { type: "nothing_correct", text: translations.en.clues.nothing_correct, count: 1, max: 1 }
];

languageSelect.addEventListener('change', (e) => {
    setLanguage(e.target.value);
});

function setLanguage(lang) {
    currentLanguage = lang;
    const t = translations[lang];

    // Update UI text
    document.querySelector('h1').textContent = t.title;
    newGameBtn.textContent = t.newGame;
    showAnswerBtn.textContent = t.showAnswer;
    submitBtn.textContent = t.submit;
    clearBtn.textContent = t.clear;
    if(pdfBtn) pdfBtn.textContent = t.pdfBtn;
    
    // Update difficulty options
    const diffSelect = document.getElementById('difficulty');
    diffSelect.options[0].text = t.difficulty[3];
    diffSelect.options[1].text = t.difficulty[4];
    diffSelect.options[2].text = t.difficulty[5];

    // Update strategies text for new clues
    strategies.forEach(s => {
        s.text = t.clues[s.type];
    });

    // Update existing clues text if game is active
    /* Note: We regenerate clues text on the fly if needed, but simplest is 
       user starts new game or we just update displayed text. 
       For now, let's just update the strategies reference. 
       If we want to update CURRENTLY displayed clues, we'd need to re-render.
    */
    // Re-render current clues with new language
    if (currentClues.length > 0) {
        currentClues.forEach(clue => {
             // Find strategy type by some means or re-map. 
             // Simpler: map based on translation key.
             // Actually, simplest is to store 'type' in generated clue object.
             // We need to modify generateClues to store 'type'.
        });
        // Since we didn't store type in generatedClues previously, 
        // asking the user to start a New Game is cleaner, OR we modify generateClues now.
        // Let's modify generateClues to be safe.
        // For immediate UI update without logic change:
        startNewGame(); 
    }
}

newGameBtn.addEventListener('click', startNewGame);
showAnswerBtn.addEventListener('click', showAnswer);
if(pdfBtn) pdfBtn.addEventListener('click', generatePDF);

keys.forEach(key => {
    key.addEventListener('click', () => {
        if (!gameActive) return;
        if (key.id === 'clear-btn') {
            currentGuess = [];
        } else if (key.id === 'submit-btn') {
            checkGuess();
        } else {
            if (currentGuess.length < codeLength) {
                currentGuess.push(parseInt(key.textContent));
            }
        }
        updateDisplay();
    });
});

startNewGame();

function startNewGame() {
    codeLength = parseInt(difficultySelect.value);
    currentGuess = [];
    gameActive = true;
    
    // Generate puzzle with unique solution (retry if needed)
    let clues;
    let attempts = 0;
    const maxAttempts = 50;
    
    do {
        secretCode = generateSecretCode(codeLength);
        clues = generateClues(secretCode);
        attempts++;
    } while (!hasUniqueSolution(clues, secretCode) && attempts < maxAttempts);
    
    if (attempts >= maxAttempts) {
        console.warn("Could not generate unique puzzle after " + maxAttempts + " attempts. Using last generated.");
    }
    
    currentClues = clues; // Store for verification display
    updateDisplay();
    renderClues(clues);
    
    showAnswerBtn.disabled = false;
    guessDisplay.classList.remove('success', 'error');
}

function updateDisplay() {
    guessDisplay.innerHTML = '';
    for (let i = 0; i < codeLength; i++) {
        const span = document.createElement('span');
        span.textContent = currentGuess[i] !== undefined ? currentGuess[i] : '_';
        guessDisplay.appendChild(span);
    }
}

function generateSecretCode(length) {
    const digits = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9];
    const code = [];
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * digits.length);
        code.push(digits[randomIndex]);
        digits.splice(randomIndex, 1); // Ensure unique digits
    }
    return code;
}

function generateClues(code) {
    // Clue count formula: codeLength + 2
    // Easy (3 digits): 5 clues | Medium (4 digits): 6 clues | Hard (5 digits): 7 clues
    const targetClueCount = codeLength + 2;
    
    let generatedClues = [];
    
    // Track which code indices have been used as the "correct" answer in a clue
    // Each secret digit should only be revealed in ONE clue
    let usedAsCorrect = new Set();
    
    const allDigits = [0,1,2,3,4,5,6,7,8,9];
    const badDigits = allDigits.filter(d => !code.includes(d));
    
    // Helper functions
    function getUniqueFiller(currentArr, sourceArr) {
        const candidates = sourceArr.filter(x => !currentArr.includes(x));
        if (candidates.length === 0) return -1;
        return candidates[Math.floor(Math.random() * candidates.length)];
    }
    
    // Get an index that hasn't been used as a "correct answer" yet
    function getUnusedIndex() {
        const unused = [];
        for (let i = 0; i < code.length; i++) {
            if (!usedAsCorrect.has(i)) unused.push(i);
        }
        if (unused.length === 0) return -1; // All used
        return unused[Math.floor(Math.random() * unused.length)];
    }
    
    // Get any random index (for when we need more clues than secret digits)
    function getRandomIndex() {
        return Math.floor(Math.random() * codeLength);
    }
    
    // ============================================
    // 1. NOTHING IS CORRECT (always first, base for other clues)
    // ============================================
    // ============================================
    // 1. NOTHING IS CORRECT (always first, base for other clues)
    // ============================================
    const badPool = [...badDigits];
    shuffle(badPool);
    const nothingCorrectDigits = badPool.slice(0, codeLength);
    generatedClues.push({ 
        guess: [...nothingCorrectDigits], 
        text: strategies.find(s => s.type === "nothing_correct").text,
        type: "nothing_correct"
    });
    
    // Digits NOT in "Nothing is correct" (safe fillers for certain clue types)
    const safeFillers = badDigits.filter(d => !nothingCorrectDigits.includes(d));
    
    // ============================================
    // 2. ONE CORRECT AND WELL PLACED (always at least 1 digit from "Nothing is correct")
    // ============================================
    {
        const targetIdx = getUnusedIndex();
        if (targetIdx !== -1) {
            let clueGuess = Array(codeLength).fill(-1);
            clueGuess[targetIdx] = code[targetIdx]; // Well placed = same position
            usedAsCorrect.add(targetIdx);
            
            // Fill: exactly 1 from nothingCorrectDigits, rest from safeFillers
            let usedFromNothing = 0;
            const neededFromNothing = 1; // Always at least 1
            
            for (let i = 0; i < codeLength; i++) {
                if (clueGuess[i] === -1) {
                    if (usedFromNothing < neededFromNothing) {
                        let f = getUniqueFiller(clueGuess, nothingCorrectDigits);
                        if (f !== -1) {
                            clueGuess[i] = f;
                            usedFromNothing++;
                            continue;
                        }
                    }
                    let f = getUniqueFiller(clueGuess, safeFillers);
                    if (f === -1) f = getUniqueFiller(clueGuess, badDigits);
                    clueGuess[i] = (f !== -1) ? f : badDigits[0]; // Final safety fallback
                }
            }
            generatedClues.push({ 
                guess: clueGuess, 
                text: strategies.find(s => s.type === "correct_well_placed").text,
                type: "correct_well_placed"
            });
        }
    }
    
    // ============================================
    // 3. ONE CORRECT BUT WRONGLY PLACED - Version A (uses 2 digits from "Nothing is correct")
    // ============================================
    {
        const targetIdx = getUnusedIndex();
        if (targetIdx !== -1) {
            usedAsCorrect.add(targetIdx);
            let clueGuess = Array(codeLength).fill(-1);
            
            const correctVal = code[targetIdx];
            let wrongPos;
            do { wrongPos = Math.floor(Math.random() * codeLength); } while (wrongPos === targetIdx);
            clueGuess[wrongPos] = correctVal;
            
            // Fill: exactly 2 from nothingCorrectDigits
            let usedFromNothing = 0;
            const neededFromNothing = 2; // Always 2
            
            for (let i = 0; i < codeLength; i++) {
                if (clueGuess[i] === -1) {
                    if (usedFromNothing < neededFromNothing) {
                        let f = getUniqueFiller(clueGuess, nothingCorrectDigits);
                        if (f !== -1) {
                            clueGuess[i] = f;
                            usedFromNothing++;
                            continue;
                        }
                    }
                    let f = getUniqueFiller(clueGuess, safeFillers);
                    if (f === -1) f = getUniqueFiller(clueGuess, badDigits);
                    clueGuess[i] = (f !== -1) ? f : badDigits[0]; // Final safety fallback
                }
            }
            generatedClues.push({ 
                guess: clueGuess, 
                text: strategies.find(s => s.type === "correct_wrong_placed").text,
                type: "correct_wrong_placed"
            });
        }
    }
    
    // ============================================
    // 4. TWO CORRECT BUT WRONGLY PLACED (NEVER use digits from "Nothing is correct")
    // Uses any two distinct indices (can reuse already-revealed digits)
    // ============================================
    {
        // Pick any two distinct random indices
        const idx1 = Math.floor(Math.random() * codeLength);
        let idx2;
        do { idx2 = Math.floor(Math.random() * codeLength); } while (idx2 === idx1);
        
        let clueGuess = Array(codeLength).fill(-1);
        // Swap positions to guarantee wrong placement
        clueGuess[idx2] = code[idx1];
        clueGuess[idx1] = code[idx2];
        
        // Fill ONLY with safeFillers (never from nothingCorrectDigits)
        for (let i = 0; i < codeLength; i++) {
            if (clueGuess[i] === -1) {
                let f = getUniqueFiller(clueGuess, safeFillers);
                // Fallback to general badDigits if restrictive filter fails
                if (f === -1) f = getUniqueFiller(clueGuess, badDigits);
                clueGuess[i] = (f !== -1) ? f : badDigits[0];
            }
        }
        generatedClues.push({ 
            guess: clueGuess, 
            text: strategies.find(s => s.type === "two_correct_wrong_placed").text,
            type: "two_correct_wrong_placed"
       });
    }
    
    // ============================================
    // 5. ONE CORRECT BUT WRONGLY PLACED - Version B (uses 0 digits from "Nothing is correct")
    // Uses random index if none unused (for easy mode where all 3 are already used)
    // ============================================
    {
        let targetIdx = getUnusedIndex();
        if (targetIdx === -1) {
            targetIdx = getRandomIndex(); // Reuse any index for Version B
        } else {
            usedAsCorrect.add(targetIdx);
        }
        
        let clueGuess = Array(codeLength).fill(-1);
        
        const correctVal = code[targetIdx];
        let wrongPos;
        do { wrongPos = Math.floor(Math.random() * codeLength); } while (wrongPos === targetIdx);
        clueGuess[wrongPos] = correctVal;
        
        // Fill ONLY with safeFillers (0 from nothingCorrectDigits)
        for (let i = 0; i < codeLength; i++) {
            if (clueGuess[i] === -1) {
                let f = getUniqueFiller(clueGuess, safeFillers);
                // Fallback to general badDigits if restrictive filter fails
                if (f === -1) f = getUniqueFiller(clueGuess, badDigits);
                clueGuess[i] = (f !== -1) ? f : badDigits[0];
            }
        }
        generatedClues.push({ 
             guess: clueGuess, 
             text: strategies.find(s => s.type === "correct_wrong_placed").text,
             type: "correct_wrong_placed"
        });
    }
    
    // ============================================
    // 6. FILL REMAINING CLUES 
    // Since all secret digits may be used, we reuse with different positions
    // ============================================
    while (generatedClues.length < targetClueCount) {
        // Try to get unused first, otherwise pick random
        let targetIdx = getUnusedIndex();
        if (targetIdx === -1) {
            targetIdx = getRandomIndex();
        } else {
            usedAsCorrect.add(targetIdx);
        }
        
        let clueGuess = Array(codeLength).fill(-1);
        
        const correctVal = code[targetIdx];
        let wrongPos;
        do { wrongPos = Math.floor(Math.random() * codeLength); } while (wrongPos === targetIdx);
        clueGuess[wrongPos] = correctVal;
        
        // Random fill from bad digits (mixed)
        for (let i = 0; i < codeLength; i++) {
            if (clueGuess[i] === -1) {
                let f = getUniqueFiller(clueGuess, badDigits);
                clueGuess[i] = (f !== -1) ? f : badDigits[0]; // Final fallback
            }
        }
        generatedClues.push({ 
             guess: clueGuess, 
             text: strategies.find(s => s.type === "correct_wrong_placed").text,
             type: "correct_wrong_placed"
        });
    }
    
    // Shuffle for variety
    shuffle(generatedClues);
    
    return generatedClues;
}

function shuffle(array) {
  for (let i = array.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [array[i], array[j]] = [array[j], array[i]];
  }
}

// ============================================
// PUZZLE VALIDATION - Ensure unique solution
// ============================================

function hasUniqueSolution(clues, expectedCode) {
    const solutions = findAllSolutions(clues);
    // Check if exactly one solution exists and it matches expected code
    if (solutions.length === 1) {
        return solutions[0].join('') === expectedCode.join('');
    }
    return false;
}

function findAllSolutions(clues) {
    const solutions = [];
    const allPerms = getPermutations([0,1,2,3,4,5,6,7,8,9], codeLength);
    
    for (const candidate of allPerms) {
        if (testAllClues(candidate, clues)) {
            solutions.push(candidate);
            // Early exit if more than one solution found
            if (solutions.length > 1) return solutions;
        }
    }
    return solutions;
}

function testAllClues(candidate, clues) {
    for (const clue of clues) {
        if (!testClueAgainstCode(candidate, clue)) {
            return false;
        }
    }
    return true;
}

function testClueAgainstCode(candidate, clue) {
    const guess = clue.guess;
    const text = clue.text;
    
    let correctWellPlaced = 0;
    let correctWrongPlaced = 0;
    
    for (let i = 0; i < guess.length; i++) {
        const digit = guess[i];
        const candidateIndex = candidate.indexOf(digit);
        
        if (candidateIndex === -1) {
            // Digit not in candidate
            continue;
        } else if (candidateIndex === i) {
            // Correct and well placed
            correctWellPlaced++;
        } else {
            // Correct but wrong place
            correctWrongPlaced++;
        }
    }
    
    // Match clue text to expected counts
    if (text === "Nothing is correct") {
        return correctWellPlaced === 0 && correctWrongPlaced === 0;
    } else if (text === "One number is correct and well placed") {
        return correctWellPlaced === 1 && correctWrongPlaced === 0;
    } else if (text === "One number is correct but wrongly placed") {
        return correctWellPlaced === 0 && correctWrongPlaced === 1;
    } else if (text === "Two numbers are correct but wrongly placed") {
        return correctWellPlaced === 0 && correctWrongPlaced === 2;
    }
    
    return false;
}

function getPermutations(arr, length) {
    const results = [];
    
    function permute(current, remaining) {
        if (current.length === length) {
            results.push([...current]);
            return;
        }
        for (let i = 0; i < remaining.length; i++) {
            current.push(remaining[i]);
            const newRemaining = [...remaining.slice(0, i), ...remaining.slice(i + 1)];
            permute(current, newRemaining);
            current.pop();
        }
    }
    
    permute([], arr);
    return results;
}

function renderClues(clues) {
    cluesContainer.innerHTML = '';
    
    clues.forEach(clue => {
        const div = document.createElement('div');
        div.className = 'clue-item';
        div.innerHTML = `
            <div class="clue-guess">${clue.guess.join(' ')}</div>
            <div class="clue-text">${clue.text}</div>
            <div class="clue-status"></div>
        `;
        cluesContainer.appendChild(div);
    });
}

function checkGuess() {
    if (currentGuess.length !== codeLength) return;
    
    if (currentGuess.join('') === secretCode.join('')) {
        guessDisplay.classList.add('success');
        gameActive = false;
        // Confetti?
        setTimeout(() => alert("You cracked the code!"), 100);
    } else {
        guessDisplay.classList.add('error');
        setTimeout(() => guessDisplay.classList.remove('error'), 500);
        currentGuess = [];
        updateDisplay();
    }
}

function showAnswer() {
    currentGuess = [...secretCode];
    updateDisplay();
    guessDisplay.classList.add('success');
    gameActive = false;
    showAnswerBtn.disabled = true;
    
    // Display verification table
    displayVerificationTable();
}

function displayVerificationTable() {
    // Create verification container if not exists
    let verifyContainer = document.getElementById('verification-container');
    if (!verifyContainer) {
        verifyContainer = document.createElement('div');
        verifyContainer.id = 'verification-container';
        verifyContainer.className = 'verification-section';
        document.querySelector('.clues-section').appendChild(verifyContainer);
    }
    
    let html = `
        <h3>Solution Breakdown</h3>
        <p class="answer-display">Answer: <strong>${secretCode.join(' ')}</strong></p>
        <table class="verification-table">
            <thead>
                <tr>
                    <th>Clue</th>
                    <th>Type</th>
                    <th>Explanation</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    currentClues.forEach(clue => {
        const explanation = getClueExplanation(clue.guess, clue.text, secretCode);
        html += `
            <tr>
                <td class="clue-cell">${clue.guess.join(' ')}</td>
                <td class="type-cell">${clue.text}</td>
                <td class="explanation-cell">${explanation}</td>
            </tr>
        `;
    });
    
    html += `
            </tbody>
        </table>
    `;
    
    verifyContainer.innerHTML = html;
}

function getClueExplanation(guess, clueType, code) {
    let explanations = [];
    
    for (let i = 0; i < guess.length; i++) {
        const digit = guess[i];
        const codeIndex = code.indexOf(digit);
        
        if (codeIndex === -1) {
            // Not in code
            explanations.push(`<span class="wrong">${digit}</span>: not in code`);
        } else if (codeIndex === i) {
            // Correct and well placed
            explanations.push(`<span class="correct">${digit}</span>: correct at pos ${i + 1} ✓`);
        } else {
            // Correct but wrong place
            explanations.push(`<span class="partial">${digit}</span>: in code but at pos ${codeIndex + 1}`);
        }
    }
    
    return explanations.join('<br>');
}

/* --- PDF Export --- */
async function generatePDF() {
    const count = parseInt(pdfCountInput.value) || 5;
    const { jsPDF } = window.jspdf;
    const doc = new jsPDF('p', 'pt', 'a4');
    const pageWidth = doc.internal.pageSize.getWidth();
    const pageHeight = doc.internal.pageSize.getHeight();
    const margin = 50;
    const contentWidth = pageWidth - (margin * 2);
    
    pdfBtn.innerText = "Generating...";
    pdfBtn.disabled = true;

    try {
        for (let i = 0; i < count; i++) {
            // Generate New Data
            const myCode = generateSecretCode(codeLength);
            let myClues;
            let attempts = 0;
            do {
                myClues = generateClues(myCode);
                attempts++;
            } while (!hasUniqueSolution(myClues, myCode) && attempts < 50);
            
            // ========== PUZZLE PAGE ==========
            if (i > 0) doc.addPage();
            
            let y = margin;
            
            // Clues box - calculate height based on number of clues
            // Clues box - calculate height based on number of clues
            const clueRowHeight = 35;
            const cluesBoxPadding = 20;
            // Reduced constant from 30 to 10 to shrink box height
            const cluesBoxHeight = cluesBoxPadding * 1 + 15 + (myClues.length * clueRowHeight);
            
            // Draw rounded border box for clues
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(1);
            doc.roundedRect(margin, y, contentWidth, cluesBoxHeight, 10, 10);
            
            y += cluesBoxPadding;
            
            // Clues header inside box - centered with faded underline
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            const cluesTitle = translations[currentLanguage].cluesHeader;
            const cluesTitleWidth = doc.getTextWidth(cluesTitle);
            const cluesTitleX = margin + (contentWidth - cluesTitleWidth) / 2;
            doc.text(cluesTitle, cluesTitleX, y + 5);
            
            // Faded underline for Clues
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(1);
            doc.line(cluesTitleX, y + 8, cluesTitleX + cluesTitleWidth, y + 8);
            
            y += 30;
            
            // Draw each clue
            myClues.forEach((clue, idx) => {
                // Clue numbers
                doc.setFontSize(16);
                doc.setFont('courier', 'bold');
                doc.setTextColor(50, 50, 50);
                const clueNumbers = clue.guess.join(' ');
                doc.text(clueNumbers, margin + 20, y);
                
                // Clue text
                doc.setFontSize(12);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(100, 100, 100);
                // Adjust x position based on code length
                const textX = margin + 30 + (codeLength * 20);
                // Use translated clue text if type available, else fallback
                const clueTxt = clue.type ? translations[currentLanguage].clues[clue.type] : clue.text;
                doc.text(clueTxt, textX, y);
                
                doc.setTextColor(0, 0, 0);
                y += clueRowHeight;
            });
            
            y += cluesBoxPadding - 10; // Reduced spacing after last clue
            
            // Workspace section - horizontal layout
            doc.setFontSize(10);
            doc.setFont('helvetica', 'italic');
            doc.setTextColor(100, 100, 100);
            doc.text(translations[currentLanguage].workspace, margin, y);
            
            doc.setFontSize(8);
            doc.setFont('helvetica', 'normal');
            doc.text(translations[currentLanguage].workspaceNote, margin + 60, y);
            y += 10; // Reduced spacing to boxes
            
            // Determine number of workspace sets based on difficulty
            // Easy mode (3 digits) -> 5 sets
            // Medium/Hard (4-5 digits) -> 4 sets
            const numSets = (codeLength === 3) ? 5 : 4;
            
            // Calculate size to fit numSets horizontally
            const innerGap = 5;
            const outerGap = 20;
            const availableWidth = contentWidth - ((numSets - 1) * outerGap);
            const maxBoxSize = 25;
            
            // Calculate max possible box size
            const boxesPerSet = codeLength;
            const widthPerSet = availableWidth / numSets;
            let workBoxSize = (widthPerSet - ((boxesPerSet - 1) * innerGap)) / boxesPerSet;
            
            // Cap the size
            if (workBoxSize > maxBoxSize) workBoxSize = maxBoxSize;
            
            // Recalculate centering
            const actualSetWidth = (boxesPerSet * workBoxSize) + ((boxesPerSet - 1) * innerGap);
            const totalUsedWidth = (numSets * actualSetWidth) + ((numSets - 1) * outerGap);
            let startX = margin + (contentWidth - totalUsedWidth) / 2;
            
            doc.setDrawColor(180, 180, 180);
            doc.setLineWidth(1);
            
            // Draw sets side by side
            for (let set = 0; set < numSets; set++) {
                let bx = startX;
                for (let c = 0; c < codeLength; c++) {
                    doc.rect(bx, y, workBoxSize, workBoxSize);
                    bx += workBoxSize + innerGap;
                }
                startX += actualSetWidth + outerGap;
            }
            
            y += workBoxSize + 40; // Increased spacing
            doc.setTextColor(0, 0, 0);
            
            // "Crack the Code" section - centered with boxes
            doc.setFontSize(14);
            doc.setFont('helvetica', 'bold');
            const crackText = translations[currentLanguage].crackCode;
            const crackTextWidth = doc.getTextWidth(crackText);
            const crackTextX = (pageWidth - crackTextWidth) / 2;
            doc.text(crackText, crackTextX, y);
            
            // Faded underline for Crack the Code
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(1);
            doc.line(crackTextX, y + 3, crackTextX + crackTextWidth, y + 3);
            
            y += 30;
            
            // Answer boxes - code entry style
            const boxSize = 45;
            const boxGap = 12;
            const totalBoxWidth = (codeLength * boxSize) + ((codeLength - 1) * boxGap);
            let boxX = (pageWidth - totalBoxWidth) / 2;
            
            doc.setDrawColor(60, 60, 60);
            doc.setLineWidth(2);
            for (let j = 0; j < codeLength; j++) {
                doc.roundedRect(boxX, y, boxSize, boxSize, 5, 5);
                boxX += boxSize + boxGap;
            }
            
            // ========== SOLUTION PAGE ==========
            doc.addPage();
            let y2 = margin;
            
            // Answer display - black outlined boxes with digits
            const solBoxSize = 50;
            const solBoxGap = 12;
            const totalSolWidth = (codeLength * solBoxSize) + ((codeLength - 1) * solBoxGap);
            let solBoxX = (pageWidth - totalSolWidth) / 2;
            
            for (let j = 0; j < codeLength; j++) {
                // Black outlined box
                doc.setDrawColor(0, 0, 0);
                doc.setLineWidth(2);
                doc.roundedRect(solBoxX, y2, solBoxSize, solBoxSize, 5, 5);
                
                // Black digit inside
                doc.setFontSize(28);
                doc.setFont('courier', 'bold');
                doc.setTextColor(0, 0, 0);
                const digitStr = String(myCode[j]);
                const digitW = doc.getTextWidth(digitStr);
                doc.text(digitStr, solBoxX + (solBoxSize - digitW) / 2, y2 + 35);
                
                solBoxX += solBoxSize + solBoxGap;
            }
            y2 += solBoxSize + 40;
            
            // Solution Breakdown - centered
            doc.setFontSize(16);
            doc.setFont('helvetica', 'bold');
            const breakdownTitle = translations[currentLanguage].solutionBreakdown;
            const breakdownTitleWidth = doc.getTextWidth(breakdownTitle);
            const breakdownTitleX = (pageWidth - breakdownTitleWidth) / 2;
            doc.text(breakdownTitle, breakdownTitleX, y2);
            
            // Faded underline for Solution Breakdown
            doc.setDrawColor(200, 200, 200);
            doc.setLineWidth(1);
            doc.line(breakdownTitleX, y2 + 3, breakdownTitleX + breakdownTitleWidth, y2 + 3);
            
            y2 += 30;
            
            // Each clue breakdown
            myClues.forEach((clue, idx) => {
                // Check if we need a new page
                if (y2 > pageHeight - 100) {
                    doc.addPage();
                    y2 = margin;
                }
                
                // Light gray background for this clue group
                doc.setFillColor(245, 245, 245);
                doc.roundedRect(margin, y2 - 5, contentWidth, 65, 5, 5, 'F');
                doc.setDrawColor(200, 200, 200);
                doc.roundedRect(margin, y2 - 5, contentWidth, 65, 5, 5);
                
                // Clue Text
                doc.setFontSize(10);
                doc.setFont('helvetica', 'normal');
                doc.setTextColor(0, 0, 0);
                const clueTxt = clue.type ? translations[currentLanguage].clues[clue.type] : clue.text;
                doc.text(clueTxt, margin + 10, y2 + 10);
                
                // Draw digits with visual feedback
                const digitBoxSize = 30; // Virtual size for spacing
                const digitGap = 20;
                const totalDigitWidth = (codeLength * digitBoxSize) + ((codeLength - 1) * digitGap);
                let digitX = margin + (contentWidth - totalDigitWidth) / 2;
                
                for (let d = 0; d < clue.guess.length; d++) {
                    const digit = clue.guess[d];
                    const codeIndex = myCode.indexOf(digit);
                    
                    const digitCenter = digitX + (digitBoxSize / 2);
                    const digitY = y2 + 35; // Baseline
                    
                    // Draw Digit (no box)
                    doc.setFontSize(22);
                    doc.setFont('courier', 'bold');
                    doc.setTextColor(0, 0, 0);
                    const dW = doc.getTextWidth(String(digit));
                    doc.text(String(digit), digitCenter - dW/2, digitY);
                    
                    // Logic Logic
                    let expText = "";
                    let indicator = "";
                    
                    if (codeIndex === -1) {
                        indicator = 'X';
                        expText = translations[currentLanguage].exp.notInCode;
                    } else if (codeIndex === d) {
                        indicator = 'O';
                        expText = translations[currentLanguage].exp.correct;
                    } else {
                        indicator = '';
                        expText = `${translations[currentLanguage].exp.pos} ${codeIndex + 1}`;
                    }
                    
                    // Draw visual indicator - centered on digit
                    const centerY = digitY - 8; // Approx center of digit height
                    if (codeIndex === -1) {
                        // Cross through for "not in code"
                        doc.setDrawColor(80, 80, 80);
                        doc.setLineWidth(1); 
                        doc.line(digitCenter - 8, centerY - 8, digitCenter + 8, centerY + 8);
                        doc.line(digitCenter - 8, centerY + 8, digitCenter + 8, centerY - 8);
                    } else if (codeIndex === d) {
                        // Circle for "correct"
                        doc.setDrawColor(80, 80, 80);
                        doc.setLineWidth(1); 
                        doc.circle(digitCenter, centerY, 12);
                    }
                    
                    // Draw explanation text below
                    doc.setFontSize(8);
                    doc.setFont('helvetica', 'normal');
                    doc.setTextColor(80, 80, 80);
                    const expWidth = doc.getTextWidth(expText);
                    doc.text(expText, digitCenter - expWidth / 2, y2 + 52);
                    
                    digitX += digitBoxSize + digitGap;
                }
                
                y2 += 80;
            });
        }

        doc.save('logic-puzzles.pdf');
        
    } catch(e) {
        console.error(e);
        alert("Error generating PDF");
    } finally {
        pdfBtn.innerText = "Download PDF";
        pdfBtn.disabled = false;
    }
}

function getPdfClueExplanation(guess, code) {
    let lines = [];
    
    for (let i = 0; i < guess.length; i++) {
        const digit = guess[i];
        const codeIndex = code.indexOf(digit);
        
        if (codeIndex === -1) {
            lines.push(`${digit}: not in code`);
        } else if (codeIndex === i) {
            lines.push(`${digit}: correct at pos ${i + 1}`);
        } else {
            lines.push(`${digit}: in code at pos ${codeIndex + 1}`);
        }
    }
    
    return lines;
}

