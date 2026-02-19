import { Board, Player, makeMove, checkResult, getEmptyCells } from "./game-logic";

const AI_TIME_LIMIT_MS = 2500;

function minimax(
  board: Board,
  player: Player,
  depth: number,
  isMaximizing: boolean,
  deadline: number,
): number {
  const result = checkResult(board);
  if (result) {
    if ("draw" in result) return 0;
    return result.winner === "O" ? 10 - depth : depth - 10;
  }
  if (depth >= 6 || Date.now() >= deadline) return 0;

  const empty = getEmptyCells(board);
  if (isMaximizing) {
    let best = -Infinity;
    for (const i of empty) {
      if (Date.now() >= deadline) break;
      const next = makeMove(board, i, player)!;
      best = Math.max(best, minimax(next, player === "X" ? "O" : "X", depth + 1, false, deadline));
    }
    return best;
  } else {
    let best = Infinity;
    for (const i of empty) {
      if (Date.now() >= deadline) break;
      const next = makeMove(board, i, player)!;
      best = Math.min(best, minimax(next, player === "X" ? "O" : "X", depth + 1, true, deadline));
    }
    return best;
  }
}

export function getAiMove(board: Board): number {
  const empty = getEmptyCells(board);
  if (empty.length === 0) return -1;

  // 30% chance of random move for medium difficulty
  if (Math.random() < 0.3) {
    return empty[Math.floor(Math.random() * empty.length)];
  }

  const deadline = Date.now() + AI_TIME_LIMIT_MS;
  let bestScore = -Infinity;
  let bestMove = empty[0];
  for (const i of empty) {
    if (Date.now() >= deadline) break;
    const next = makeMove(board, i, "O")!;
    const score = minimax(next, "X", 1, false, deadline);
    if (score > bestScore) {
      bestScore = score;
      bestMove = i;
    }
  }
  return bestMove;
}
