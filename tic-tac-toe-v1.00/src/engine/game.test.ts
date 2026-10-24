import { describe, expect, it } from 'vitest';
import { createGame, getResult, playMove, type Board } from './game';

const winningBoards: Board[] = [
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
  [null, null, null, null, null, null, null, null, null],
];

describe('game engine', () => {
  it('starts with X on an empty board', () => {
    const game = createGame();
    expect(game.board).toEqual(Array(9).fill(null));
    expect(game.currentPlayer).toBe('X');
    expect(game.result).toBeNull();
  });

  it('detects all eight winning lines', () => {
    const expectedLines = [[0,1,2], [3,4,5], [6,7,8], [0,3,6], [1,4,7], [2,5,8], [0,4,8], [2,4,6]];
    winningBoards.forEach((emptyBoard, index) => {
      const board = [...emptyBoard] as Board;
      expectedLines[index]!.forEach((cell) => { board[cell] = 'X'; });
      const result = getResult(board);
      expect(result?.winner, `case ${index}`).toBe('X');
      expect(result?.line).toEqual(expectedLines[index]);
    });
  });

  it('detects a draw and does not mistake it for a win', () => {
    const board: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(getResult(board)).toEqual({ winner: 'draw', line: null });
  });

  it('alternates turns after every legal move', () => {
    const afterX = playMove(createGame(), 4);
    expect(afterX.board[4]).toBe('X');
    expect(afterX.currentPlayer).toBe('O');
    const afterO = playMove(afterX, 0);
    expect(afterO.board[0]).toBe('O');
    expect(afterO.currentPlayer).toBe('X');
  });

  it('rejects occupied, out-of-range, non-integer, and terminal moves', () => {
    const first = playMove(createGame(), 1);
    expect(playMove(first, 1)).toBe(first);
    expect(playMove(first, -1)).toBe(first);
    expect(playMove(first, 2.3)).toBe(first);
    const won = playMove(playMove(playMove(playMove(playMove(createGame(), 0), 3), 1), 4), 2);
    expect(won.result?.winner).toBe('X');
    expect(playMove(won, 8)).toBe(won);
  });

  it('does not mutate the original board', () => {
    const game = createGame();
    const after = playMove(game, 5);
    expect(game.board.every((cell) => cell === null)).toBe(true);
    expect(after.board[5]).toBe('X');
  });
});
