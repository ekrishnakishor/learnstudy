// src/utils/sudokuGenerator.js

const BLANK = 0;

// Helper to check if a number can be placed in a specific cell
function isValid(board, row, col, num) {
  for (let i = 0; i < 9; i++) {
    if (board[row * 9 + i] === num) return false;
    if (board[i * 9 + col] === num) return false;
  }
  const startRow = Math.floor(row / 3) * 3;
  const startCol = Math.floor(col / 3) * 3;
  for (let i = 0; i < 3; i++) {
    for (let j = 0; j < 3; j++) {
      if (board[(startRow + i) * 9 + startCol + j] === num) return false;
    }
  }
  return true;
}

// Recursive backtracking algorithm to fill the board
function solve(board) {
  for (let i = 0; i < 81; i++) {
    if (board[i] === BLANK) {
      // Randomize the numbers 1-9 so every game is completely unique
      const nums = [1, 2, 3, 4, 5, 6, 7, 8, 9].sort(() => Math.random() - 0.5);
      
      for (let num of nums) {
        const row = Math.floor(i / 9);
        const col = i % 9;
        
        if (isValid(board, row, col, num)) {
          board[i] = num;
          if (solve(board)) return true;
          board[i] = BLANK; // Backtrack
        }
      }
      return false; // No valid number found, trigger backtrack
    }
  }
  return true; // Board is full and valid
}

// The main function we will call from our React component
export function generateSudoku(difficultyBlanks = 45) {
  // 1. Generate a completely blank board
  const solution = new Array(81).fill(BLANK);
  
  // 2. Solve it fully using our randomizer (creates the Answer Key)
  solve(solution);

  // 3. Clone it to make the playable puzzle
  const puzzle = [...solution];
  
  // 4. Punch holes in it based on difficulty
  let blanks = difficultyBlanks;
  while (blanks > 0) {
    const idx = Math.floor(Math.random() * 81);
    if (puzzle[idx] !== BLANK) {
      puzzle[idx] = BLANK;
      blanks--;
    }
  }

  return { puzzle, solution };
}