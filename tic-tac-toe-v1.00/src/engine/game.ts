export type Mark = 'X' | 'O';
export type Cell = Mark | null;
export type Board = [Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell, Cell];
export type GameResult = { winner: Mark; line: readonly [number, number, number] } | { winner: 'draw'; line: null } | null;
export type GameState = {
  board: Board;
  currentPlayer: Mark;
  result: GameResult;
  moves: number[];
};

export const WINNING_LINES = [
  [0, 1, 2], [3, 4, 5], [6, 7, 8],
  [0, 3, 6], [1, 4, 7], [2, 5, 8],
  [0, 4, 8], [2, 4, 6],
] as const satisfies readonly (readonly [number, number, number])[];

export const EMPTY_BOARD = (): Board => [null, null, null, null, null, null, null, null, null];
export const createGame = (): GameState => ({ board: EMPTY_BOARD(), currentPlayer: 'X', result: null, moves: [] });
export const otherMark = (mark: Mark): Mark => mark === 'X' ? 'O' : 'X';

export function getResult(board: readonly Cell[]): GameResult {
  for (const line of WINNING_LINES) {
    const [a, b, c] = line;
    if (board[a] && board[a] === board[b] && board[a] === board[c]) {
      return { winner: board[a] as Mark, line };
    }
  }
  return board.every((cell) => cell !== null) ? { winner: 'draw', line: null } : null;
}

export function playMove(game: GameState, index: number): GameState {
  if (!Number.isInteger(index) || index < 0 || index > 8 || game.result || game.board[index] !== null) return game;
  const board: Board = [...game.board];
  board[index] = game.currentPlayer;
  const result = getResult(board);
  return {
    board,
    currentPlayer: result ? game.currentPlayer : otherMark(game.currentPlayer),
    result,
    moves: [...game.moves, index],
  };
}

export function isLegalMove(board: readonly Cell[], index: number): boolean {
  return Number.isInteger(index) && index >= 0 && index < 9 && board[index] === null && getResult(board) === null;
}

export function availableMoves(board: readonly Cell[]): number[] {
  if (getResult(board)) return [];
  return board.flatMap((cell, index) => cell === null ? [index] : []);
}
