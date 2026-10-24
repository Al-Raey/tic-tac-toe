import { describe, expect, it } from 'vitest';
import { getAiMove, getBestMove, minimaxScore } from './ai';
import { availableMoves, createGame, getResult, otherMark, type Board, type Cell, type Mark } from './game';

const board = (...cells: Cell[]): Board => cells as Board;

describe('AI engine', () => {
  it('keeps randomized difficulty moves legal when an injected random source is out of range', () => {
    const position = createGame().board;
    for (const random of [() => Number.NaN, () => Number.POSITIVE_INFINITY, () => Number.NEGATIVE_INFINITY, () => -3, () => 9, () => 1]) {
      const move = getAiMove(position, 'X', 'easy', random);
      expect(availableMoves(position)).toContain(move);
    }
  });

  it('returns legal moves for every difficulty and returns null on a full board', () => {
    const opening = createGame().board;
    for (const difficulty of ['easy', 'medium', 'hard', 'very-hard', 'impossible'] as const) {
      const move = getAiMove(opening, 'O', difficulty, () => 0.3);
      expect(availableMoves(opening)).toContain(move);
    }
    const full: Board = ['X', 'O', 'X', 'X', 'O', 'O', 'O', 'X', 'X'];
    expect(getAiMove(full, 'X', 'impossible')).toBeNull();
  });

  it('takes an immediate winning move', () => {
    const position = board('X', 'X', null, 'O', 'O', null, null, null, null);
    expect(getBestMove(position, 'X')).toBe(2);
    const second = board('O', null, 'O', 'X', 'X', null, null, null, null);
    expect(getBestMove(second, 'O')).toBe(1);
  });

  it('blocks an immediate opponent win', () => {
    const position = board('X', 'X', null, 'O', null, null, null, 'O', null);
    expect(getBestMove(position, 'O')).toBe(2);
    expect(getAiMove(position, 'O', 'medium', () => 0.99)).toBe(2);
  });

  it('Medium takes a win before considering randomized alternatives', () => {
    const position = board('O', 'O', null, 'X', 'X', null, null, null, null);
    expect(getAiMove(position, 'O', 'medium', () => 0.99)).toBe(2);
  });

  it('Medium uses a lightweight strategy while retaining controlled variety', () => {
    const position = board('X', null, null, null, 'O', null, null, null, 'X');
    const predictable = getAiMove(position, 'O', 'medium', () => 0.99);
    const varied = getAiMove(position, 'O', 'medium', () => 0);
    expect(availableMoves(position)).toContain(predictable);
    expect(availableMoves(position)).toContain(varied);
  });

  it('Hard and Very Hard preserve obvious wins and necessary blocks', () => {
    const winning = board('O', 'O', null, 'X', 'X', null, null, null, null);
    const mustBlock = board('X', 'X', null, 'O', null, null, null, 'O', null);
    for (const difficulty of ['hard', 'very-hard'] as const) {
      expect(getAiMove(winning, 'O', difficulty, () => 0)).toBe(2);
      expect(getAiMove(mustBlock, 'O', difficulty, () => 0)).toBe(2);
    }
  });

  it('Hard is beatable while Impossible keeps the objectively best move', () => {
    const position = board('X', null, 'O', null, null, null, null, null, null);
    const hardMove = getAiMove(position, 'X', 'hard', () => 0.1);
    const impossibleMove = getAiMove(position, 'X', 'impossible', () => 0.1);
    expect(hardMove).not.toBe(impossibleMove);
    const hardBoard = [...position]; hardBoard[hardMove!] = 'X';
    const perfectBoard = [...position]; perfectBoard[impossibleMove!] = 'X';
    expect(minimaxScore(hardBoard, 'O', 'X', 1)).toBeLessThan(minimaxScore(perfectBoard, 'O', 'X', 1));
  });

  it('Very Hard can occasionally make a strategic mistake, but Impossible remains optimal', () => {
    const position = board('X', 'O', 'X', 'O', null, null, null, null, null);
    const impossibleMove = getAiMove(position, 'X', 'impossible', () => 0);
    const veryHardMove = getAiMove(position, 'X', 'very-hard', () => 0);
    expect(impossibleMove).toBe(4);
    expect(veryHardMove).toBe(5);
    expect(availableMoves(position)).toContain(veryHardMove);
    expect(getAiMove(position, 'X', 'very-hard', () => 0.1)).toBe(impossibleMove);
  });

  it('allows a skilled opponent to beat Hard through a reachable game path', () => {
    const aiMark: Mark = 'X';
    const seen = new Set<string>();
    const canHumanWin = (position: Board, turn: Mark): boolean => {
      const result = getResult(position);
      if (result) return result.winner === otherMark(aiMark);
      const key = `${position.map((cell) => cell ?? '-').join('')}:${turn}`;
      if (seen.has(key)) return false;
      seen.add(key);
      if (turn === aiMark) {
        const move = getAiMove(position, aiMark, 'hard', () => 0.1);
        if (move === null) return false;
        const next: Board = [...position];
        next[move] = aiMark;
        return canHumanWin(next, otherMark(turn));
      }
      return availableMoves(position).some((move) => {
        const next: Board = [...position];
        next[move] = turn;
        return canHumanWin(next, otherMark(turn));
      });
    };
    expect(canHumanWin(createGame().board, 'X')).toBe(true);
  });

  it('never misses a forced win on representative fork and finish positions', () => {
    const position = board('X', null, 'X', 'O', 'O', null, null, null, null);
    expect(getBestMove(position, 'O')).toBe(5);
    const position2 = board('X', 'O', 'X', 'O', 'X', null, null, null, null);
    const move = getBestMove(position2, 'X');
    expect(move).not.toBeNull();
    const next = [...position2]; next[move!] = 'X';
    expect(getResult(next)?.winner).toBe('X');
  });

  it('exhaustively checks all reachable turns: optimal AI play cannot be forced to lose', () => {
    const checkFor = (ai: Mark) => {
      const seen = new Set<string>();
      const visit = (position: Board, turn: Mark) => {
        const result = getResult(position);
        if (result) { expect(result.winner).not.toBe(otherMark(ai)); return; }
        const key = `${position.map((v) => v ?? '-').join('')}:${turn}:${ai}`;
        if (seen.has(key)) return;
        seen.add(key);
        if (turn === ai) {
          const move = getAiMove(position, ai, 'impossible', () => 0);
          expect(move).not.toBeNull();
          const after: Board = [...position];
          after[move!] = ai;
          // Only the opponent branches freely; the AI always takes its optimal move.
          const immediate = getResult(after);
          expect(immediate?.winner).not.toBe(otherMark(ai));
          expect(minimaxScore(after, otherMark(ai), ai, 1)).toBeGreaterThanOrEqual(0);
          visit(after, otherMark(turn));
          return;
        }
        for (const move of availableMoves(position)) {
          const next: Board = [...position];
          next[move] = turn;
          visit(next, otherMark(turn));
        }
      };
      visit(createGame().board, 'X');
      expect(seen.size).toBeGreaterThan(50);
    };
    checkFor('X');
    checkFor('O');
  });
});
