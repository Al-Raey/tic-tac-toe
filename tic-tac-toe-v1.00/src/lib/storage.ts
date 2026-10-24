import type { Difficulty } from '../engine/ai';
import { createGame, playMove, type GameState, type Mark } from '../engine/game';

export type Theme = 'dark' | 'light';
export type Language = 'en' | 'ar';
export type Mode = 'ai' | 'local' | 'practice';
export type Settings = { theme: Theme; language: Language; sound: boolean; difficulty: Difficulty; humanMark: Mark };
export type Statistics = {
  matches: number;
  humanWins: number;
  aiWins: number;
  draws: number;
  playerXWins: number;
  playerOWins: number;
  bestWinStreak: number;
  currentWinStreak: number;
};
export type MatchScore = { x: number; o: number; draws: number };
export type SavedSession = {
  mode: Mode;
  game: GameState;
  matchScore: MatchScore;
  roundNumber: number;
};

export const DEFAULT_SETTINGS: Settings = { theme: 'dark', language: 'en', sound: true, difficulty: 'medium', humanMark: 'X' };
export const EMPTY_STATISTICS: Statistics = { matches: 0, humanWins: 0, aiWins: 0, draws: 0, playerXWins: 0, playerOWins: 0, bestWinStreak: 0, currentWinStreak: 0 };

/** Increment persisted/UI counters without overflowing JavaScript's safe integer range. */
export function incrementSafeCounter(value: number): number {
  if (!Number.isSafeInteger(value) || value < 0) return 0;
  return value >= Number.MAX_SAFE_INTEGER ? Number.MAX_SAFE_INTEGER : value + 1;
}
const SETTINGS_KEY = 'ttu.settings.v1';
const STATISTICS_KEY = 'ttu.statistics.v1';
const SESSION_KEY = 'ttu.session.v1';

function safeRead(key: string): unknown {
  try {
    if (typeof localStorage === 'undefined') return null;
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) as unknown : null;
  } catch { return null; }
}
function safeWrite(key: string, value: unknown): void {
  try { if (typeof localStorage !== 'undefined') localStorage.setItem(key, JSON.stringify(value)); } catch { /* storage is optional */ }
}
function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === 'object' && value !== null && !Array.isArray(value);
}
function validCounter(value: unknown): value is number {
  return typeof value === 'number' && Number.isSafeInteger(value) && value >= 0;
}

/** Validate a saved game by replaying its move history, rather than trusting a stored board. */
function parseGame(value: unknown): GameState | null {
  if (!isRecord(value) || !Array.isArray(value.moves) || value.moves.length > 9 || !Array.isArray(value.board) || value.board.length !== 9) return null;
  if (!value.board.every((cell) => cell === null || cell === 'X' || cell === 'O')) return null;
  if (!value.moves.every((move) => typeof move === 'number' && Number.isInteger(move) && move >= 0 && move <= 8)) return null;

  let replayed = createGame();
  for (const move of value.moves as number[]) {
    const next = playMove(replayed, move);
    if (next === replayed) return null;
    replayed = next;
  }

  if (!value.board.every((cell, index) => cell === replayed.board[index])) return null;
  if (value.currentPlayer !== replayed.currentPlayer) return null;
  if (value.result === null) return replayed.result === null ? replayed : null;
  if (!isRecord(value.result)) return null;
  const savedWinner = value.result.winner;
  if (savedWinner !== 'X' && savedWinner !== 'O' && savedWinner !== 'draw') return null;
  if (savedWinner !== replayed.result?.winner) return null;
  if (savedWinner === 'draw') return value.result.line === null && replayed.result?.line === null ? replayed : null;
  const savedLine = value.result.line;
  const replayedLine = replayed.result && replayed.result.winner !== 'draw' ? replayed.result.line : null;
  if (!Array.isArray(savedLine) || !replayedLine || savedLine.length !== 3 || !savedLine.every((cell, index) => cell === replayedLine[index])) return null;
  return replayed;
}

export function loadSettings(): Settings {
  const raw = safeRead(SETTINGS_KEY);
  if (!raw || typeof raw !== 'object') return { ...DEFAULT_SETTINGS };
  const obj = raw as Record<string, unknown>;
  return {
    theme: obj.theme === 'light' ? 'light' : 'dark',
    language: obj.language === 'ar' ? 'ar' : 'en',
    sound: typeof obj.sound === 'boolean' ? obj.sound : DEFAULT_SETTINGS.sound,
    difficulty: obj.difficulty === 'easy' || obj.difficulty === 'medium' || obj.difficulty === 'hard' || obj.difficulty === 'very-hard' || obj.difficulty === 'impossible' ? obj.difficulty : 'medium',
    humanMark: obj.humanMark === 'O' ? 'O' : 'X',
  };
}
export function saveSettings(settings: Settings): void { safeWrite(SETTINGS_KEY, settings); }

export function loadSession(): SavedSession | null {
  const raw = safeRead(SESSION_KEY);
  if (!isRecord(raw) || (raw.mode !== 'ai' && raw.mode !== 'local' && raw.mode !== 'practice')) return null;
  const game = parseGame(raw.game);
  if (!game || !isRecord(raw.matchScore)) return null;
  const { x, o, draws } = raw.matchScore;
  if (!validCounter(x) || !validCounter(o) || !validCounter(draws)) return null;
  if (typeof raw.roundNumber !== 'number' || !Number.isSafeInteger(raw.roundNumber) || raw.roundNumber < 1) return null;
  return {
    mode: raw.mode,
    game,
    matchScore: { x, o, draws },
    roundNumber: raw.roundNumber,
  };
}
export function saveSession(session: SavedSession): void { safeWrite(SESSION_KEY, session); }

export function loadStatistics(): Statistics {
  const raw = safeRead(STATISTICS_KEY);
  if (!raw || typeof raw !== 'object') return { ...EMPTY_STATISTICS };
  const obj = raw as Record<string, unknown>;
  // localStorage is user-controlled; preserve only finite, nonnegative values in the safe-integer range.
  const validCount = (key: keyof Statistics) => {
    const value = obj[key];
    return typeof value === 'number' && Number.isFinite(value) && value >= 0 && value <= Number.MAX_SAFE_INTEGER
      ? Math.floor(value)
      : 0;
  };
  return {
    matches: validCount('matches'), humanWins: validCount('humanWins'), aiWins: validCount('aiWins'),
    draws: validCount('draws'), playerXWins: validCount('playerXWins'), playerOWins: validCount('playerOWins'),
    bestWinStreak: validCount('bestWinStreak'), currentWinStreak: validCount('currentWinStreak'),
  };
}
export function saveStatistics(stats: Statistics): void { safeWrite(STATISTICS_KEY, stats); }
export function resetStatistics(): Statistics { const clean = { ...EMPTY_STATISTICS }; saveStatistics(clean); return clean; }
