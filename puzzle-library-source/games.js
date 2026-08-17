const games = [
  {
    id: 'flower-sudoku',
    title: 'Flower Sudoku',
    description: 'Overlapping flower-shaped grids.',
    svg: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="3"/><path d="M12 3c-1 0-2 2-2 4s1 4 2 4 2-2 2-4-1-4-2-4z"/><path d="M12 21c-1 0-2-2-2-4s1-4 2-4 2 2 2 4-1 4-2 4z"/><path d="M3 12c0-1 2-2 4-2s4 1 4 2-2 2-4 2-4-1-4-2z"/><path d="M21 12c0-1-2-2-4-2s-4 1-4 2 2 2 4 2 4-1 4-2z"/></svg>'
  },
  {
    id: 'cross-sudoku',
    title: 'Cross Sudoku',
    description: 'Solve intersecting lines.',
    svg: '<svg viewBox="0 0 24 24"><path d="M11 2h2v20h-2z"/><path d="M2 11h20v2h-20z"/></svg>'
  },
  {
    id: 'killer-sudoku',
    title: 'Killer Sudoku',
    description: 'Sudoku with sum cages.',
    svg: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M5 5l2 2"/></svg>'
  },
  {
    id: 'kakuro',
    title: 'Kakuro',
    description: 'Mathematical crossword.',
    svg: '<svg viewBox="0 0 24 24"><path d="M2 2l20 20"/><path d="M22 2L2 22"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
  },
  {
    id: 'futoshiki',
    title: 'Futoshiki',
    description: 'Inequality number puzzles.',
    svg: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M10 8l4 4-4 4"/></svg>'
  },
  {
    id: 'word-search',
    title: 'Word Search',
    description: 'Find hidden words.',
    svg: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/><path d="M8 8l6 6"/></svg>'
  },
  {
    id: 'sudoku',
    title: 'Sudoku',
    description: 'Classic 9x9 number puzzle.',
    svg: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M9 3v18"/><path d="M15 3v18"/><path d="M3 9h18"/><path d="M3 15h18"/></svg>'
  },
  {
    id: 'number-search',
    title: 'Number Search',
    description: 'Find hidden numbers.',
    svg: '<svg viewBox="0 0 24 24"><circle cx="11" cy="11" r="8"/><path d="M11 7v8"/><path d="m21 21-4.35-4.35"/></svg>'
  },
  {
    id: 'calcudoku',
    title: 'Calcudoku',
    description: 'Math + Sudoku.',
    svg: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M8 12h8"/><circle cx="12" cy="9" r="1"/><circle cx="12" cy="15" r="1"/></svg>'
  },
  {
    id: 'jigsaw-sudoku',
    title: 'Jigsaw Sudoku',
    description: 'Irregular shaped regions.',
    svg: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 12c3 0 3-3 6-3s3 3 6 3 3-3 6-3"/></svg>'
  },
  {
    id: 'pyramid',
    title: 'Pyramid',
    description: 'Solve the number pyramids.',
    svg: '<svg viewBox="0 0 24 24"><path d="M12 2l10 18H2L12 2z"/><path d="M12 2v18"/><path d="M7 11h10"/></svg>'
  },
  {
    id: 'math-matix',
    title: 'Math-Matix',
    description: 'Matrix math challenges.',
    svg: '<svg viewBox="0 0 24 24"><rect x="3" y="3" width="18" height="18" rx="2"/><path d="M3 9h18"/><path d="M3 15h18"/><path d="M9 3v18"/><path d="M15 3v18"/></svg>'
  },
  {
    id: 'vrais-faux',
    title: 'Vrais-Faux',
    description: 'True or False logic.',
    svg: '<svg viewBox="0 0 24 24"><path d="M20 6L9 17l-5-5"/><circle cx="12" cy="12" r="10" stroke-dasharray="4 4"/></svg>'
  },
  {
    id: 'summenrätsel',
    title: 'Summenrätsel',
    description: 'Sum-based logic puzzles.',
    svg: '<svg viewBox="0 0 24 24"><path d="M12 5v14"/><path d="M5 12h14"/><rect x="3" y="3" width="18" height="18" rx="2"/></svg>'
  },
  {
    id: 'binoxo',
    title: 'Binoxo',
    description: 'Binary logic puzzle.',
    svg: '<svg viewBox="0 0 24 24"><circle cx="7" cy="12" r="3"/><path d="M14 9l6 6"/><path d="M20 9l-6 6"/></svg>'
  },
  {
    id: 'guess-flag',
    title: 'Guess Flag',
    description: 'Identify world flags.',
    svg: '<svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>'
  },
  {
    id: 'mazes',
    title: 'Mazes',
    description: 'Find your way through.',
    svg: '<svg viewBox="0 0 24 24"><path d="M3 3h18v18H3z"/><path d="M8 3v10h5V8h5v10h-5"/></svg>'
  },
  {
    id: 'flag',
    title: 'Flag',
    description: 'Learn and identify flags.',
    svg: '<svg viewBox="0 0 24 24"><path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z"/><line x1="4" y1="22" x2="4" y2="15"/></svg>'
  },
  {
    id: 'anagram',
    title: 'Anagram',
    description: 'Rearrange letters.',
    svg: '<svg viewBox="0 0 24 24"><path d="M3 12h18"/><path d="M12 3l9 9-9 9"/><path d="M9 12l-6-6"/><path d="M9 12l-6 6"/></svg>'
  },
  {
    id: 'crack-the-code',
    title: 'Crack the Code',
    description: 'Deduce the secret sequence.',
    svg: '<svg viewBox="0 0 24 24"><rect x="3" y="11" width="18" height="10" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>'
  }
];

