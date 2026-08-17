(function(global){
  'use strict';

  const scanned=[
    ['wordsearch','Word Search','🔎','Find every hidden word.'],
    ['sudoku','Sudoku','▦','Classic 9×9 number logic.'],
    ['maze','Maze','⌁','A perfect maze with one route.'],
    ['numbersearch','Number Search','#','Find every hidden number.'],
    ['anagram','Anagram','AZ','Unscramble the words.'],
    ['pyramid','Number Pyramid','△','Complete the addition pyramid.'],
    ['mathmatrix','Math Matrix','＋','Complete a sum-constrained matrix.'],
    ['crackthecode','Crack the Code','⌕','Deduce a unique secret code.'],
    ['binoxo','Binoxo','XO','Binary balance logic.'],
    ['xo','XO Tactics','XO','Solve three win-in-one boards per page.'],
    ['dotsboxes','Dots & Boxes','•─•','Join dots, claim boxes, and outscore your opponent.'],
    ['drawobject','Draw the Object','✎','Draw the named object; the closest drawing wins.'],
    ['jigsawsudoku','Jigsaw Sudoku','🧩','Irregular Sudoku regions.'],
    ['kakuro','Kakuro','◇','Cross-sum number puzzle.'],
    ['summenratsel','Sum Puzzle','Σ','Row and column sum logic.'],
    ['crosssudoku','Cross Sudoku','✚','Overlapping Sudoku grids.'],
    ['killersudoku','Killer Sudoku','K','Sudoku with sum cages.'],
    ['flowersudoku','Flower Sudoku','✿','Overlapping flower grids.'],
    ['futoshiki','Futoshiki','<>','Latin-square inequalities.'],
    ['calcudoku','Calcudoku','÷','Arithmetic cage logic.'],
    ['guessflag','Guess the Flag','⚑','Identify country flags.'],
    ['flag','Flag Match','⚐','Match flags and countries.']
  ];

  global.DuelPuzzleCatalog=scanned.map(([id,name,icon,description])=>({id,name,icon,description}));
})(window);
