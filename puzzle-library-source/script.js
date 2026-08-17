// Assumes 'games' array is loaded via games.js

const homeView = document.getElementById('home-view');
const playerView = document.getElementById('player-view');
const gamesList = document.getElementById('games-list');
const gameClient = document.getElementById('game-client');
const gameTitleDisplay = document.getElementById('game-title-display');
const btnPrev = document.getElementById('btn-prev');
const btnNext = document.getElementById('btn-next');

// --- Initialization ---
function init() {
  renderGamesList();
  handleRouting();
  // Listen for browser back/forward buttons
  window.addEventListener('popstate', handleRouting);
}

// --- Rendering ---
function renderGamesList() {
  gamesList.innerHTML = '';
  games.forEach(game => {
    const card = document.createElement('a');
    card.className = 'game-card';
    card.href = `?game=${game.id}`;
    card.onclick = (e) => {
      e.preventDefault();
      navigateTo(`?game=${game.id}`);
    };

    card.innerHTML = `
      <div class="card-icon">${game.svg || '🧩'}</div>
      <div class="card-title">${game.title}</div>
      <div class="card-desc">${game.description}</div>
    `;
    gamesList.appendChild(card);
  });
}

// --- Routing & Navigation ---
function navigateTo(query) {
  const currentSearch = window.location.search || '';
  const targetSearch = query.includes('?') ? query.substring(query.indexOf('?')) : '';
  
  // Only push if the search parameters are actually changing
  if (currentSearch !== targetSearch) {
    window.history.pushState({}, '', query);
    handleRouting();
  } else if (query === 'index.html' && currentSearch !== '') {
    // If we want home and we currently have search params
    window.history.pushState({}, '', window.location.pathname);
    handleRouting();
  }
}

function handleRouting() {
  const params = new URLSearchParams(window.location.search);
  const gameId = params.get('game');

  if (gameId) {
    const game = games.find(g => g.id === gameId);
    if (game) {
      showPlayer(game);
      return;
    }
  }
  showHome();
}

function showHome() {
  homeView.style.display = 'block';
  playerView.classList.remove('active');
  // Use replace to avoid adding more history when clearing
  gameClient.contentWindow.location.replace('about:blank');
  document.title = 'Game Hub';
}

function showPlayer(game) {
  homeView.style.display = 'none';
  playerView.classList.add('active');
  
  const targetPath = `./${game.id}/index.html`;
  
  // Use location.replace on the iframe's contentWindow to prevent history pollution
  // This is the key to preventing the "double back" issue caused by iframe navigation
  if (!gameClient.src.includes(`${game.id}/index.html`)) {
    gameClient.contentWindow.location.replace(targetPath);
  }

  gameTitleDisplay.textContent = game.title;
  document.title = `${game.title} - Game Hub`;
  
  const currentIndex = games.findIndex(g => g.id === game.id);
  btnPrev.onclick = () => cycleGame(currentIndex - 1);
  btnNext.onclick = () => cycleGame(currentIndex + 1);
}

function cycleGame(index) {
  let newIndex = index;
  if (newIndex < 0) newIndex = games.length - 1;
  if (newIndex >= games.length) newIndex = 0;
  
  const nextGame = games[newIndex];
  // Using pushState here allows the user to go "back" to the previous game they were on
  navigateTo(`?game=${nextGame.id}`);
}

// --- Start ---
if (typeof games !== 'undefined') {
  init();
} else {
  console.error('games.js not loaded!');
  gamesList.innerHTML = '<p style="text-align:center; color:red">Error: Configuration file missing.</p>';
}
