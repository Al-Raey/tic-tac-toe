import { WINNING_LINES, availableMoves, getResult, otherMark, type Board, type Cell, type Mark } from './game';

export type Difficulty = 'easy' | 'medium' | 'hard' | 'very-hard' | 'impossible';

const CORNERS = [0, 2, 6, 8] as const;
const HARD_MISTAKE_CHANCE = 0.12;
const VERY_HARD_MISTAKE_CHANCE = 0.035;

function terminalScore(board: readonly Cell[], ai: Mark, depth: number): number {
  const result = getResult(board);
  if (!result) return 0;
  if (result.winner === 'draw') return 0;
  // Keep terminal outcomes more valuable than any heuristic leaf score.
  return result.winner === ai ? 100 - depth : depth - 100;
}

/** A fast static evaluator for deliberately depth-limited search. */
function heuristicScore(board: readonly Cell[], ai: Mark): number {
  const opponent = otherMark(ai);
  let score = 0;

  for (const [a, b, c] of WINNING_LINES) {
    const line = [board[a], board[b], board[c]];
    const aiCount = line.filter((cell) => cell === ai).length;
    const opponentCount = line.filter((cell) => cell === opponent).length;
    if (aiCount > 0 && opponentCount > 0) continue;
    if (aiCount > 0) score += aiCount === 2 ? 8 : 2;
    if (opponentCount > 0) score -= opponentCount === 2 ? 9 : 2;
  }

  if (board[4] === ai) score += 2;
  else if (board[4] === opponent) score -= 2;
  for (const corner of CORNERS) {
    if (board[corner] === ai) score += 0.75;
    else if (board[corner] === opponent) score -= 0.75;
  }
  return score;
}

/** Full Minimax with alpha-beta pruning. This is the perfect-play search. */
function minimaxSearch(board: readonly Cell[], turn: Mark, ai: Mark, depth: number, alpha: number, beta: number): number {
  const terminal = getResult(board);
  if (terminal) return terminalScore(board, ai, depth);
  const moves = availableMoves(board);
  if (turn === ai) {
    let best = Number.NEGATIVE_INFINITY;
    for (const index of moves) {
      const next: Cell[] = [...board];
      next[index] = turn;
      best = Math.max(best, minimaxSearch(next, otherMark(turn), ai, depth + 1, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }
  let best = Number.POSITIVE_INFINITY;
  for (const index of moves) {
    const next: Cell[] = [...board];
    next[index] = turn;
    best = Math.min(best, minimaxSearch(next, otherMark(turn), ai, depth + 1, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

/** Minimax with a controlled search horizon for the Hard difficulty. */
function limitedMinimax(
  board: readonly Cell[],
  turn: Mark,
  ai: Mark,
  depth: number,
  depthLimit: number,
  alpha: number,
  beta: number,
): number {
  const terminal = getResult(board);
  if (terminal) return terminalScore(board, ai, depth);
  if (depth >= depthLimit) return heuristicScore(board, ai);

  const moves = availableMoves(board);
  if (turn === ai) {
    let best = Number.NEGATIVE_INFINITY;
    for (const index of moves) {
      const next: Cell[] = [...board];
      next[index] = turn;
      best = Math.max(best, limitedMinimax(next, otherMark(turn), ai, depth + 1, depthLimit, alpha, beta));
      alpha = Math.max(alpha, best);
      if (beta <= alpha) break;
    }
    return best;
  }

  let best = Number.POSITIVE_INFINITY;
  for (const index of moves) {
    const next: Cell[] = [...board];
    next[index] = turn;
    best = Math.min(best, limitedMinimax(next, otherMark(turn), ai, depth + 1, depthLimit, alpha, beta));
    beta = Math.min(beta, best);
    if (beta <= alpha) break;
  }
  return best;
}

export function minimaxScore(board: readonly Cell[], turn: Mark, ai: Mark, depth = 0): number {
  return minimaxSearch(board, turn, ai, depth, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY);
}

type ScoredMove = { move: number; score: number; board: Cell[] };

function scoreMoves(board: Board, ai: Mark): ScoredMove[] {
  return availableMoves(board).map((move) => {
    const next: Cell[] = [...board];
    next[move] = ai;
    return { move, score: minimaxScore(next, otherMark(ai), ai, 1), board: next };
  });
}

function bestMoves(scored: readonly ScoredMove[]): ScoredMove[] {
  if (scored.length === 0) return [];
  const bestScore = Math.max(...scored.map(({ score }) => score));
  return scored.filter(({ score }) => score === bestScore);
}

function randomItem<T>(items: readonly T[], random: () => number): T | undefined {
  if (items.length === 0) return undefined;
  const sample = random();
  // A supplied random source is injectable for deterministic tests. Normalize
  // out-of-range and non-finite values so it can never produce an invalid move.
  const normalized = Number.isFinite(sample) ? Math.min(1, Math.max(0, sample)) : 0;
  const index = Math.min(items.length - 1, Math.floor(normalized * items.length));
  return items[index];
}

function immediateWinningMove(board: Board, mark: Mark): number | null {
  for (const move of availableMoves(board)) {
    const next: Cell[] = [...board];
    next[move] = mark;
    if (getResult(next)?.winner === mark) return move;
  }
  return null;
}

function heuristicMove(board: Board, ai: Mark, random: () => number): number | null {
  const moves = availableMoves(board);
  if (moves.length === 0) return null;
  const opponent = otherMark(ai);

  // Medium always takes a direct win or prevents an immediate loss.
  const win = immediateWinningMove(board, ai);
  if (win !== null) return win;
  const block = immediateWinningMove(board, opponent);
  if (block !== null) return block;

  const scored = moves.map((move) => {
    const next: Cell[] = [...board];
    next[move] = ai;
    return { move, score: heuristicScore(next, ai) };
  });
  const bestScore = Math.max(...scored.map(({ score }) => score));
  const goodEnough = scored.filter(({ score }) => score >= bestScore - 2.75);

  // A little unpredictability keeps Medium approachable without ignoring immediate threats.
  if (random() < 0.22) {
    const alternatives = scored.filter(({ score }) => score < bestScore);
    const alternative = randomItem(alternatives, random);
    if (alternative) return alternative.move;
  }
  return randomItem(goodEnough, random)?.move ?? moves[0]!;
}

function limitedSearchMove(board: Board, ai: Mark, depthLimit: number, random: () => number): number | null {
  const moves = availableMoves(board);
  if (moves.length === 0) return null;
  const scores = moves.map((move) => {
    const next: Cell[] = [...board];
    next[move] = ai;
    return {
      move,
      score: limitedMinimax(next, otherMark(ai), ai, 1, depthLimit, Number.NEGATIVE_INFINITY, Number.POSITIVE_INFINITY),
    };
  });
  const topScore = Math.max(...scores.map(({ score }) => score));
  const tied = scores.filter(({ score }) => score === topScore).map(({ move }) => move);
  return randomItem(tied, random) ?? moves[0]!;
}

export function getBestMove(board: Board, ai: Mark): number | null {
  const moves = availableMoves(board);
  if (moves.length === 0) return null;
  const top = bestMoves(scoreMoves(board, ai));
  return top[0]?.move ?? moves[0]!;
}

function hardMove(board: Board, ai: Mark, random: () => number): number | null {
  const moves = availableMoves(board);
  if (moves.length === 0) return null;
  const win = immediateWinningMove(board, ai);
  if (win !== null) return win;
  const block = immediateWinningMove(board, otherMark(ai));
  if (block !== null) return block;

  const searchedMove = limitedSearchMove(board, ai, 4, random);
  // Hard is deliberately fallible: occasionally choose a strategic alternative,
  // but do not miss an obvious win/block or allow an immediate one-move win.
  if (random() >= HARD_MISTAKE_CHANCE) return searchedMove;
  const scored = scoreMoves(board, ai);
  const bestScore = Math.max(...scored.map(({ score }) => score));
  const alternatives = scored.filter(({ score, board: next }) => score < bestScore && !allowsImmediateOpponentWin(next, ai));
  return randomItem(alternatives, random)?.move ?? searchedMove;
}

function allowsImmediateOpponentWin(board: readonly Cell[], ai: Mark): boolean {
  const opponent = otherMark(ai);
  for (const move of availableMoves(board)) {
    const next: Cell[] = [...board];
    next[move] = opponent;
    if (getResult(next)?.winner === opponent) return true;
  }
  return false;
}

function veryHardMove(board: Board, ai: Mark, random: () => number): number | null {
  const moves = availableMoves(board);
  if (moves.length === 0) return null;
  // Even on Very Hard, never throw away an obvious win or an essential one-move block.
  const win = immediateWinningMove(board, ai);
  if (win !== null) return win;
  const block = immediateWinningMove(board, otherMark(ai));
  if (block !== null) return block;

  const scored = scoreMoves(board, ai);
  const optimal = bestMoves(scored);
  if (optimal.length === 0) return moves[0]!;
  if (random() >= VERY_HARD_MISTAKE_CHANCE) return randomItem(optimal, random)?.move ?? optimal[0]!.move;

  const bestScore = optimal[0]!.score;
  // Rarely choose a strategically inferior move, but never hand over an immediate win.
  const alternatives = scored.filter(({ score, board: next }) => score < bestScore && !allowsImmediateOpponentWin(next, ai));
  return randomItem(alternatives, random)?.move ?? randomItem(optimal, random)?.move ?? optimal[0]!.move;
}

/**
 * Five distinct skill levels:
 * - Easy: any legal move.
 * - Medium: direct tactics plus a lightweight positional heuristic.
 * - Hard: depth-limited Minimax with a static evaluation at the horizon.
 * - Very Hard: almost-perfect play with rare, controlled strategic mistakes.
 * - Impossible: full Minimax; optimal opponents can only draw.
 */
export function getAiMove(board: Board, ai: Mark, difficulty: Difficulty, random: () => number = Math.random): number | null {
  const moves = availableMoves(board);
  if (moves.length === 0) return null;

  switch (difficulty) {
    case 'easy':
      return randomItem(moves, random) ?? null;
    case 'medium':
      return heuristicMove(board, ai, random);
    case 'hard':
      return hardMove(board, ai, random);
    case 'very-hard':
      return veryHardMove(board, ai, random);
    case 'impossible':
      return getBestMove(board, ai);
  }
}
