export type Cell = "X" | "O" | null;
export type Board = Cell[];
export type Player = "X" | "O";
export type GameResult = { winner: Player } | { winner: null; draw: true } | null;

const WIN_LINES = [
  [0, 1, 2],
  [3, 4, 5],
  [6, 7, 8],
  [0, 3, 6],
  [1, 4, 7],
  [2, 5, 8],
  [0, 4, 8],
  [2, 4, 6],
];

export function createBoard(): Board {
  return Array(9).fill(null);
}

export function makeMove(board: Board, index: number, player: Player): Board | null {
  if (board[index] !== null) return null;
  const next = [...board];
  next[index] = player;
  return next;
}

export function getWinningLine(board: Board): number[] | null {
  for (const line of WIN_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return line;
    }
  }
  return null;
}

export function checkResult(board: Board): GameResult {
  const winLine = getWinningLine(board);
  if (winLine) {
    return { winner: board[winLine[0]] as Player };
  }
  if (board.every((cell) => cell !== null)) {
    return { winner: null, draw: true };
  }
  return null;
}

export function getEmptyCells(board: Board): number[] {
  return board.reduce<number[]>((acc, cell, i) => {
    if (cell === null) acc.push(i);
    return acc;
  }, []);
}
