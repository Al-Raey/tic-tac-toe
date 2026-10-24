import { beforeEach, describe, expect, it } from 'vitest';
import { createGame, playMove } from '../engine/game';
import { DEFAULT_SETTINGS, EMPTY_STATISTICS, loadSession, loadSettings, loadStatistics, resetStatistics, saveSession, saveStatistics, incrementSafeCounter, type SavedSession } from './storage';

beforeEach(() => localStorage.clear());

describe('persistent storage', () => {
  it('returns safe defaults for missing or malformed settings', () => {
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
    localStorage.setItem('ttu.settings.v1', '{broken json');
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('validates settings instead of trusting localStorage values', () => {
    localStorage.setItem('ttu.settings.v1', JSON.stringify({ theme: 'neon', language: 'fr', sound: 'yes', difficulty: 'expert', humanMark: 'Y' }));
    expect(loadSettings()).toEqual(DEFAULT_SETTINGS);
  });

  it('loads all five difficulty levels and remains compatible with older settings', () => {
    for (const difficulty of ['easy', 'medium', 'hard', 'very-hard', 'impossible'] as const) {
      localStorage.setItem('ttu.settings.v1', JSON.stringify({ difficulty }));
      expect(loadSettings().difficulty).toBe(difficulty);
    }
    localStorage.setItem('ttu.settings.v1', JSON.stringify({ difficulty: 'unknown-level' }));
    expect(loadSettings().difficulty).toBe('medium');
  });

  it('sanitizes missing, negative, and nonnumeric statistics', () => {
    localStorage.setItem('ttu.statistics.v1', JSON.stringify({ matches: -8, humanWins: 'a lot', draws: 3.8, playerXWins: 4 }));
    expect(loadStatistics()).toEqual({ ...EMPTY_STATISTICS, draws: 3, playerXWins: 4 });
  });

  it('increments counters without exceeding JavaScript safe-integer precision', () => {
    expect(incrementSafeCounter(0)).toBe(1);
    expect(incrementSafeCounter(Number.MAX_SAFE_INTEGER - 1)).toBe(Number.MAX_SAFE_INTEGER);
    expect(incrementSafeCounter(Number.MAX_SAFE_INTEGER)).toBe(Number.MAX_SAFE_INTEGER);
    expect(incrementSafeCounter(Number.NaN)).toBe(0);
    expect(incrementSafeCounter(-1)).toBe(0);
  });

  it('rejects unsafe integer-sized statistics values without losing other valid counters', () => {
    localStorage.setItem('ttu.statistics.v1', JSON.stringify({ matches: 1e300, humanWins: Number.MAX_SAFE_INTEGER + 1, aiWins: 12, draws: -1 }));
    expect(loadStatistics()).toEqual({ ...EMPTY_STATISTICS, aiWins: 12 });
  });

  it('clears all counters when asked to reset statistics', () => {
    saveStatistics({ ...EMPTY_STATISTICS, matches: 12, humanWins: 8, currentWinStreak: 4 });
    expect(resetStatistics()).toEqual(EMPTY_STATISTICS);
    expect(loadStatistics()).toEqual(EMPTY_STATISTICS);
  });

  it('saves and restores a valid in-progress game and match score', () => {
    const game = playMove(createGame(), 4);
    const session: SavedSession = { mode: 'local', game, matchScore: { x: 2, o: 1, draws: 3 }, roundNumber: 7 };
    saveSession(session);
    expect(loadSession()).toEqual(session);
  });

  it('rejects a saved board that does not match the replayed move history', () => {
    const game = playMove(createGame(), 4);
    localStorage.setItem('ttu.session.v1', JSON.stringify({
      mode: 'local', game: { ...game, board: ['X', null, null, null, null, null, null, null, null] },
      matchScore: { x: 0, o: 0, draws: 0 }, roundNumber: 1,
    }));
    expect(loadSession()).toBeNull();
  });

  it('rejects a move list that continues after a terminal game state', () => {
    const moves = [0, 3, 1, 4, 2, 8];
    localStorage.setItem('ttu.session.v1', JSON.stringify({
      mode: 'ai', game: { ...playMove(playMove(playMove(playMove(playMove(createGame(), 0), 3), 1), 4), 2), moves },
      matchScore: { x: 0, o: 0, draws: 0 }, roundNumber: 1,
    }));
    expect(loadSession()).toBeNull();
  });
});
