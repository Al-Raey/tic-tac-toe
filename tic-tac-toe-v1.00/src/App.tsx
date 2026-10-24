import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  ArrowLeftRight, Bot, Check, ChevronDown, CircleHelp, Cpu, Crown, Gamepad2, Globe2, Languages, Moon, RotateCcw, RotateCw,
  ShieldCheck, SlidersHorizontal, Sparkles, Sun, Trophy, Users, Volume2, VolumeX, Zap,
} from 'lucide-react';
import { getAiMove, getBestMove } from './engine/ai';
import { createGame, otherMark, playMove, type GameState, type Mark } from './engine/game';
import { getTranslator } from './lib/i18n';
import { playSound } from './lib/sound';
import {
  DEFAULT_SETTINGS, EMPTY_STATISTICS, loadSession, loadSettings, loadStatistics, resetStatistics,
  saveSession, saveSettings, saveStatistics, incrementSafeCounter, type Language, type MatchScore, type Mode, type SavedSession, type Settings, type Statistics,
} from './lib/storage';
import type { TranslationKey } from './lib/i18n';
import { GameBoard } from './components/GameBoard';
import { Modal } from './components/Modal';
import { AdSlot } from './lib/AdSlot';

function readSettings(): Settings {
  try { return loadSettings(); } catch { return { ...DEFAULT_SETTINGS }; }
}
function readStats(): Statistics {
  try { return loadStatistics(); } catch { return { ...EMPTY_STATISTICS }; }
}
function readSessionSafely(): SavedSession | null {
  try { return loadSession(); } catch { return null; }
}

const ZERO_SCORE: MatchScore = { x: 0, o: 0, draws: 0 };
const DIFFICULTY_DESCRIPTION: Record<Settings['difficulty'], TranslationKey> = {
  easy: 'easyDescription', medium: 'mediumDescription', hard: 'hardDescription',
  'very-hard': 'veryHardDescription', impossible: 'impossibleDescription',
};
const BOARD_CELL_COUNT = 9;

type PendingConfirmation = 'new-match' | 'reset-stats' | 'mode-change' | 'mark-change' | 'round-change' | null;
type PendingChange = { kind: 'mode'; mode: Mode } | { kind: 'setting'; patch: Partial<Settings> } | null;

export default function App() {
  const [initialSession] = useState<SavedSession | null>(readSessionSafely);
  const [settings, setSettings] = useState<Settings>(readSettings);
  const [stats, setStats] = useState<Statistics>(readStats);
  const [mode, setMode] = useState<Mode>(initialSession?.mode ?? 'ai');
  const [game, setGame] = useState<GameState>(initialSession?.game ?? createGame());
  const [matchScore, setMatchScore] = useState<MatchScore>(initialSession?.matchScore ?? { ...ZERO_SCORE });
  const [roundNumber, setRoundNumber] = useState(initialSession?.roundNumber ?? 1);
  const [isAiThinking, setIsAiThinking] = useState(false);
  const [hintMove, setHintMove] = useState<number | null>(null);
  const [showSettings, setShowSettings] = useState(true);
  const [pendingConfirmation, setPendingConfirmation] = useState<PendingConfirmation>(null);
  const [pendingChange, setPendingChange] = useState<PendingChange>(null);
  const [toast, setToast] = useState('');
  const gameRef = useRef(game);
  const modeRef = useRef(mode);
  const settingsRef = useRef(settings);
  const roundVersion = useRef(0);
  const toastTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  gameRef.current = game;
  modeRef.current = mode;
  settingsRef.current = settings;

  const t = useMemo(() => getTranslator(settings.language), [settings.language]);
  const isArabic = settings.language === 'ar';
  const humanMark = settings.humanMark;
  const aiMark = otherMark(humanMark);
  const isAiMode = mode === 'ai' || mode === 'practice';

  useEffect(() => {
    document.documentElement.dataset.theme = settings.theme;
    document.documentElement.lang = settings.language;
    document.documentElement.dir = isArabic ? 'rtl' : 'ltr';
    document.title = t('pageTitle');
    const description = document.querySelector<HTMLMetaElement>('meta[name="description"]');
    if (description) description.content = t('pageDescription');
    saveSettings(settings);
  }, [settings, isArabic, t]);

  useEffect(() => { saveStatistics(stats); }, [stats]);
  useEffect(() => { saveSession({ mode, game, matchScore, roundNumber }); }, [mode, game, matchScore, roundNumber]);
  useEffect(() => () => {
    if (toastTimer.current) clearTimeout(toastTimer.current);
  }, []);

  const showToast = useCallback((message: string) => {
    setToast(message);
    if (toastTimer.current) clearTimeout(toastTimer.current);
    toastTimer.current = setTimeout(() => setToast(''), 2400);
  }, []);

  const changeSettings = useCallback((patch: Partial<Settings>) => {
    setSettings((current) => ({ ...current, ...patch }));
  }, []);

  const resetRound = useCallback((options: { clearMatchScore?: boolean; resetRoundNumber?: boolean; incrementRound?: boolean } = {}) => {
    roundVersion.current += 1;
    const next = createGame();
    gameRef.current = next;
    setGame(next);
    setIsAiThinking(false);
    setHintMove(null);
    if (options.clearMatchScore) setMatchScore({ ...ZERO_SCORE });
    if (options.resetRoundNumber) setRoundNumber(1);
    else if (options.incrementRound) setRoundNumber((current) => incrementSafeCounter(current));
  }, []);

  const startNewMatch = useCallback(() => {
    resetRound({ clearMatchScore: true, resetRoundNumber: true });
    setPendingConfirmation(null);
    setPendingChange(null);
  }, [resetRound]);

  const recordCompletedRound = useCallback((next: GameState, activeMode: Mode, currentSettings: Settings) => {
    if (!next.result || activeMode === 'practice') return;
    const result = next.result;
    setMatchScore((current) => result.winner === 'draw'
      ? { ...current, draws: incrementSafeCounter(current.draws) }
      : result.winner === 'X' ? { ...current, x: incrementSafeCounter(current.x) } : { ...current, o: incrementSafeCounter(current.o) });
    setStats((current) => {
      const base = { ...current, matches: incrementSafeCounter(current.matches) };
      if (result.winner === 'draw') return { ...base, draws: incrementSafeCounter(base.draws), currentWinStreak: activeMode === 'local' ? current.currentWinStreak : 0 };
      if (activeMode === 'local') {
        return result.winner === 'X'
          ? { ...base, playerXWins: incrementSafeCounter(base.playerXWins) }
          : { ...base, playerOWins: incrementSafeCounter(base.playerOWins) };
      }
      if (result.winner === currentSettings.humanMark) {
        const streak = incrementSafeCounter(current.currentWinStreak);
        return { ...base, humanWins: incrementSafeCounter(base.humanWins), currentWinStreak: streak, bestWinStreak: Math.max(current.bestWinStreak, streak) };
      }
      return { ...base, aiWins: incrementSafeCounter(base.aiWins), currentWinStreak: 0 };
    });
  }, []);

  const handleMove = useCallback((index: number, expectedVersion?: number) => {
    if (expectedVersion !== undefined && expectedVersion !== roundVersion.current) return;
    const previous = gameRef.current;
    if (previous.result) return;
    const activeMode = modeRef.current;
    const activeSettings = settingsRef.current;
    if ((activeMode === 'ai' || activeMode === 'practice') && previous.currentPlayer !== activeSettings.humanMark && expectedVersion === undefined) return;
    const next = playMove(previous, index);
    if (next === previous) return;
    gameRef.current = next;
    setGame(next);
    setIsAiThinking(false);
    setHintMove(null);
    if (activeSettings.sound) playSound(next.result ? (next.result.winner === 'draw' ? 'draw' : 'win') : 'move');
    if (next.result) recordCompletedRound(next, activeMode, activeSettings);
  }, [recordCompletedRound]);

  useEffect(() => {
    if (!isAiMode || game.result || game.currentPlayer === humanMark || pendingConfirmation !== null) {
      setIsAiThinking(false);
      return;
    }
    const version = roundVersion.current;
    const boardAtSchedule = [...game.board];
    setIsAiThinking(true);
    const timeout = setTimeout(() => {
      if (version !== roundVersion.current) return;
      const liveGame = gameRef.current;
      if (liveGame.result || liveGame.currentPlayer !== aiMark || liveGame.board.some((cell, i) => cell !== boardAtSchedule[i])) {
        setIsAiThinking(false);
        return;
      }
      const move = getAiMove(liveGame.board, aiMark, settingsRef.current.difficulty);
      if (move !== null) handleMove(move, version);
      else setIsAiThinking(false);
    }, 430);
    return () => clearTimeout(timeout);
  }, [isAiMode, game.board, game.currentPlayer, game.result, humanMark, aiMark, mode, handleMove, settings.difficulty, pendingConfirmation]);

  const applyModeChange = (nextMode: Mode) => {
    if (nextMode === mode) return;
    setMode(nextMode);
    modeRef.current = nextMode;
    // Match scores belong to a specific mode. Ask before clearing them when changing modes.
    resetRound({ clearMatchScore: true, resetRoundNumber: true });
  };

  const changeMode = (nextMode: Mode) => {
    if (nextMode === mode) return;
    const hasScore = matchScore.x + matchScore.o + matchScore.draws > 0;
    if (game.moves.length > 0 || hasScore) {
      roundVersion.current += 1;
      setPendingChange({ kind: 'mode', mode: nextMode });
      setPendingConfirmation('mode-change');
      return;
    }
    applyModeChange(nextMode);
  };

  const applyRoundSetting = (patch: Partial<Settings>) => {
    const changesMark = patch.humanMark !== undefined && patch.humanMark !== settingsRef.current.humanMark;
    changeSettings(patch);
    settingsRef.current = { ...settingsRef.current, ...patch };
    if (changesMark) resetRound({ clearMatchScore: true, resetRoundNumber: true });
    else resetRound();
  };

  const updateRoundSetting = (patch: Partial<Settings>) => {
    const changesMark = patch.humanMark !== undefined && patch.humanMark !== settings.humanMark;
    const hasScore = matchScore.x + matchScore.o + matchScore.draws > 0;
    if (changesMark && (game.moves.length > 0 || hasScore)) {
      roundVersion.current += 1;
      setPendingChange({ kind: 'setting', patch });
      setPendingConfirmation('mark-change');
      return;
    }
    if (patch.difficulty !== undefined && game.moves.length > 0) {
      roundVersion.current += 1;
      setPendingChange({ kind: 'setting', patch });
      setPendingConfirmation('round-change');
      return;
    }
    applyRoundSetting(patch);
  };

  const confirmPendingChange = () => {
    const nextChange = pendingChange;
    setPendingChange(null);
    setPendingConfirmation(null);
    if (!nextChange) return;
    if (nextChange.kind === 'mode') applyModeChange(nextChange.mode);
    else applyRoundSetting(nextChange.patch);
  };

  const hasUndoableMove = mode === 'local' || game.moves.length >= (humanMark === 'X' ? 1 : 2);
  const canUndo = hasUndoableMove && !game.result && (mode === 'local' || isAiThinking || game.currentPlayer === humanMark);
  const handleUndo = () => {
    if (!canUndo) return;
    // Undo the human move and AI reply together, unless the reply is still pending.
    const moveCount = mode === 'local' ? 1 : isAiThinking ? 1 : 2;
    const remainingMoves = game.moves.slice(0, Math.max(0, game.moves.length - moveCount));
    let previous = createGame();
    for (const move of remainingMoves) previous = playMove(previous, move);
    roundVersion.current += 1;
    gameRef.current = previous;
    setGame(previous);
    setIsAiThinking(false);
    setHintMove(null);
    if (settings.sound) playSound('click');
  };

  const handleHint = () => {
    if (game.result || isAiThinking || (isAiMode && game.currentPlayer !== humanMark)) return;
    const suggestedMove = getBestMove(game.board, game.currentPlayer);
    setHintMove(suggestedMove);
    if (suggestedMove !== null && settings.sound) playSound('click');
  };

  const handleResetStats = () => {
    const clean = resetStatistics();
    setStats(clean);
    setPendingConfirmation(null);
    setPendingChange(null);
    showToast(t('statsReset'));
  };

  const cancelConfirmation = () => {
    setPendingConfirmation(null);
    setPendingChange(null);
  };

  const resultText = (): string => {
    if (!game.result) {
      if (isAiMode && isAiThinking && game.currentPlayer !== humanMark) return t('aiThinking');
      return game.currentPlayer === 'X' ? t('xTurn') : t('oTurn');
    }
    if (game.result.winner === 'draw') return mode === 'practice' ? t('practiceDraw') : t('drawResult');
    if (mode === 'local') return game.result.winner === 'X' ? t('xWon') : t('oWon');
    if (game.result.winner === humanMark) return mode === 'practice' ? t('practiceWon') : t('youWon');
    return t('aiWon');
  };
  const statusText = game.result ? t('roundComplete') : isAiThinking ? t('aiThinking') : game.moves.length > 0 ? t('gameInProgress') : t('roundReady');
  const confirmationTitle = pendingConfirmation === 'new-match' ? t('newMatchTitle')
    : pendingConfirmation === 'reset-stats' ? t('resetStats')
      : pendingConfirmation === 'mode-change' ? t('modeChangeTitle')
        : pendingConfirmation === 'mark-change' ? t('markChangeTitle') : t('roundSettingTitle');
  const confirmationDescription = pendingConfirmation === 'new-match' ? t('newMatchConfirm')
    : pendingConfirmation === 'reset-stats' ? t('resetConfirm')
      : pendingConfirmation === 'mode-change' ? t('modeChangeConfirm')
        : pendingConfirmation === 'mark-change' ? t('markChangeConfirm') : t('roundSettingConfirm');
  const confirmationLabel = pendingConfirmation === 'reset-stats' ? t('reset')
    : pendingConfirmation === 'round-change' || pendingConfirmation === 'mark-change' ? t('applyChange') : t('newGame');

  const modeMeta: Record<Mode, { label: TranslationKey; detail: TranslationKey; Icon: typeof Bot }> = {
    ai: { label: 'vsAi', detail: 'aiLabel', Icon: Bot },
    local: { label: 'twoPlayers', detail: 'localLabel', Icon: Users },
    practice: { label: 'practice', detail: 'practiceLabel', Icon: Gamepad2 },
  };

  return (
    <div className={`app-root ${isArabic ? 'is-arabic' : ''}`}>
      <div className="ambient ambient-one" aria-hidden="true" />
      <div className="ambient ambient-two" aria-hidden="true" />
      <div className="app-frame">
        <header className="topbar">
          <a className="brand" href="#top" aria-label={t('home')}>
            <span className="brand-mark" aria-hidden="true"><span>X</span><span>O</span><span>✦</span><span /></span>
            <span className="brand-copy"><strong>tic-tac-toe</strong><small>{t('brandEdition')}</small></span>
          </a>
          <div className="topbar-right">
            <span className="status-pill" aria-live="polite"><span className="status-dot" /> {statusText}</span>
            <button className="icon-button header-settings" type="button" onClick={() => { setShowSettings((value) => !value); if (settings.sound) playSound('click'); }} aria-expanded={showSettings} aria-label={t('settings')} title={t('settings')}>
              <SlidersHorizontal size={18} />
            </button>
          </div>
        </header>

        <main id="top">
          <section className="hero-row">
            <div className="hero-copy">
              <div className="eyebrow"><Sparkles size={13} strokeWidth={2.2} /> {t('eyebrow')}</div>
              <h1>tic-tac-toe</h1>
              <p>{t('tagline')}</p>
            </div>
            <div className="hero-badge"><ShieldCheck size={16} /><span>{t('playYourWay')}</span></div>
          </section>

          <div className={`game-layout ${showSettings ? '' : 'settings-collapsed'}`}>
            <section className="play-panel panel" aria-label={t('gameArea')}>
              <div className="panel-topline">
                <div className="panel-kicker"><span className="live-dot" /> {t('mode')}</div>
                <div className="round-label"><span>{t('round')}</span><strong>{roundNumber.toLocaleString(settings.language, { minimumIntegerDigits: 2, useGrouping: false })}</strong></div>
              </div>

              <div className="mode-selector" role="group" aria-label={t('mode')}>
                {(Object.keys(modeMeta) as Mode[]).map((item) => {
                  const MetaIcon = modeMeta[item].Icon;
                  return <button key={item} type="button" className={`mode-option ${mode === item ? 'selected' : ''}`} onClick={() => changeMode(item)} aria-pressed={mode === item}>
                    <MetaIcon size={17} strokeWidth={1.9} />
                    <span>{t(modeMeta[item].label)}</span>
                  </button>;
                })}
              </div>

              <div className={`turn-banner ${game.result ? 'is-result' : ''} ${isAiThinking ? 'is-thinking' : ''}`} aria-live="polite" aria-atomic="true">
                <span className={`turn-mark ${game.result?.winner === 'draw' ? 'draw-mark' : ''}`}>
                  {game.result?.winner === 'draw' ? <ArrowLeftRight size={17} /> : game.result ? (game.result.winner === 'X' ? <span className="x-symbol small">×</span> : <span className="o-symbol small" />) : isAiThinking ? <Cpu size={17} className="thinking-icon" /> : game.currentPlayer === 'X' ? <span className="x-symbol small">×</span> : <span className="o-symbol small" />}
                </span>
                <span className="turn-copy"><strong>{resultText()}</strong><small>{game.result ? (game.result.winner === 'draw' ? t('strategy') : mode === 'local' ? `${t('player')} ${game.result.winner}` : game.result.winner === humanMark ? t('strategy') : t('rematchReady')) : isAiThinking ? t('aiMove') : t('yourMove')}</small></span>
                {!game.result && <span className="turn-pulse" aria-hidden="true" />}
                {game.result && <span className="result-check"><Check size={15} /></span>}
              </div>

              <div className="board-stage">
                <div className="board-aura" aria-hidden="true" />
                <GameBoard game={game} onMove={handleMove} t={t} isAiThinking={isAiThinking} hintMove={hintMove} language={settings.language} />
              </div>

              <div className="game-actions">
                {game.result ? <button className="primary-button" type="button" onClick={() => { resetRound({ incrementRound: true }); if (settings.sound) playSound('click'); }}><RotateCw size={17} /> {t('nextRound')} <span className="button-arrow">↗</span></button> : <button className="primary-button" type="button" onClick={() => { resetRound(); if (settings.sound) playSound('click'); }}><RotateCcw size={17} /> {t('restart')} <span className="button-arrow">↻</span></button>}
                <button className="secondary-button" type="button" onClick={() => { roundVersion.current += 1; setPendingConfirmation('new-match'); if (settings.sound) playSound('click'); }}><Sparkles size={16} /> {t('newGame')}</button>
                <button className="secondary-button utility-button" type="button" onClick={handleUndo} disabled={!canUndo}><RotateCcw size={15} /> {t('undo')}</button>
                <button className="secondary-button utility-button" type="button" onClick={handleHint} disabled={Boolean(game.result) || isAiThinking || (isAiMode && game.currentPlayer !== humanMark)}><CircleHelp size={15} /> {t('hint')}</button>
              </div>
              {hintMove !== null && !game.result && <p className="hint-note" role="status"><Sparkles size={13} /> {t('hintShown')}</p>}
              <section className="move-history-panel" aria-label={t('moveHistory')}>
                <div className="history-heading"><strong>{t('moveHistory')}</strong><span>{game.moves.length.toLocaleString(settings.language)}/{BOARD_CELL_COUNT.toLocaleString(settings.language)}</span></div>
                {game.moves.length === 0 ? <p className="no-moves">{t('noMoves')}</p> : <ol className="move-history-list">{game.moves.map((cellIndex, moveIndex) => {
                  const mark = moveIndex % 2 === 0 ? 'X' : 'O';
                  return <li key={`${moveIndex}-${cellIndex}`} className={moveIndex === game.moves.length - 1 ? 'is-last-move' : ''}>
                    <span className={`history-mark ${mark === 'X' ? 'history-x' : 'history-o'}`}>{mark}</span>
                    <span className="history-coordinate">{t('moveNumber')} {(moveIndex + 1).toLocaleString(settings.language)} · {t('row')} {(Math.floor(cellIndex / 3) + 1).toLocaleString(settings.language)}, {t('column')} {(cellIndex % 3 + 1).toLocaleString(settings.language)}</span>
                    {moveIndex === game.moves.length - 1 && <span className="last-move-label">{t('lastMove')}</span>}
                  </li>;
                })}</ol>}
              </section>
              {mode === 'practice' && <p className="practice-note"><CircleHelp size={13} /> {t('practiceNote')}</p>}
            </section>

            <aside className="side-column">
              <section className="panel score-panel">
                <div className="section-heading"><div><span className="section-overline">{t('score')}</span><h2>{mode === 'local' ? t('twoPlayers') : mode === 'practice' ? t('practice') : t('vsAi')}</h2></div><span className="score-icon"><Trophy size={17} /></span></div>
                <div className="players-row">
                  <PlayerCard mark="X" score={matchScore.x} label={mode === 'local' ? t('playerX') : humanMark === 'X' ? t('you') : t('computer')} active={!game.result && game.currentPlayer === 'X'} winning={game.result?.winner === 'X'} language={settings.language} />
                  <div className="versus-divider"><span>{t('vs')}</span></div>
                  <PlayerCard mark="O" score={matchScore.o} label={mode === 'local' ? t('playerO') : humanMark === 'O' ? t('you') : t('computer')} active={!game.result && game.currentPlayer === 'O'} winning={game.result?.winner === 'O'} language={settings.language} />
                </div>
                <div className="draws-row"><span className="draw-icon"><ArrowLeftRight size={14} /></span><span>{t('draws')}</span><strong>{matchScore.draws.toLocaleString(settings.language)}</strong></div>
                {(mode === 'ai' || mode === 'practice') && <div className="side-setting-inline">
                  <div className="inline-label"><span>{t('youPlayAs')}</span><span className="mini-help">{t('mark')}</span></div>
                  <div className="mark-picker" role="group" aria-label={t('youPlayAs')}>
                    {(['X', 'O'] as const).map((mark) => <button key={mark} type="button" className={`mark-choice ${humanMark === mark ? 'chosen' : ''}`} onClick={() => { if (humanMark !== mark) updateRoundSetting({ humanMark: mark }); }} aria-pressed={humanMark === mark}><span className={mark === 'X' ? 'x-symbol' : 'o-symbol'}>{mark === 'X' ? '×' : ''}</span><span>{mark}</span>{humanMark === mark && <Check size={13} />}</button>)}
                  </div>
                </div>}
              </section>

              {showSettings && <>
                <section className="panel preferences-panel">
                  <div className="section-heading compact"><div><span className="section-overline">{t('preferences')}</span><h2>{t('settings')}</h2></div><span className="pref-heading-icon"><Zap size={16} /></span></div>
                  {(mode === 'ai' || mode === 'practice') && <div className="preference-row difficulty-row">
                    <div className="difficulty-main-row">
                      <div className="pref-label"><span className="pref-icon purple"><Cpu size={16} /></span><div><strong>{t('chooseDifficulty')}</strong><small>{modeMeta[mode] ? t(modeMeta[mode].detail) : ''}</small></div></div>
                      <div className="difficulty-select-wrap"><select aria-label={t('chooseDifficulty')} aria-describedby="difficulty-description" className="difficulty-select" value={settings.difficulty} onChange={(event) => updateRoundSetting({ difficulty: event.target.value as Settings['difficulty'] })}><option value="easy">{t('easy')}</option><option value="medium">{t('medium')}</option><option value="hard">{t('hard')}</option><option value="very-hard">{t('veryHard')}</option><option value="impossible">{t('impossible')}</option></select><ChevronDown size={13} /></div>
                    </div>
                    <p className="difficulty-description" id="difficulty-description">{t(DIFFICULTY_DESCRIPTION[settings.difficulty])}</p>
                  </div>}
                  <div className="preference-row">
                    <div className="pref-label"><span className="pref-icon amber">{settings.theme === 'dark' ? <Moon size={16} /> : <Sun size={16} />}</span><div><strong>{t('theme')}</strong><small>{t('appearance')}</small></div></div>
                    <div className="segmented-control" role="group" aria-label={t('theme')}>
                      <button type="button" className={settings.theme === 'dark' ? 'active' : ''} onClick={() => changeSettings({ theme: 'dark' })} aria-pressed={settings.theme === 'dark'} aria-label={t('dark')}><Moon size={14} /></button>
                      <button type="button" className={settings.theme === 'light' ? 'active' : ''} onClick={() => changeSettings({ theme: 'light' })} aria-pressed={settings.theme === 'light'} aria-label={t('light')}><Sun size={14} /></button>
                    </div>
                  </div>
                  <div className="preference-row">
                    <div className="pref-label"><span className="pref-icon blue"><Languages size={16} /></span><div><strong>{t('language')}</strong><small>{isArabic ? t('arabic') : t('english')}</small></div></div>
                    <div className="language-select-wrap"><Globe2 size={14} /><select aria-label={t('language')} value={settings.language} onChange={(event) => changeSettings({ language: event.target.value as Language })}><option value="en">EN</option><option value="ar">عربي</option></select><ChevronDown size={12} /></div>
                  </div>
                  <div className="preference-row last-row">
                    <div className="pref-label"><span className="pref-icon green">{settings.sound ? <Volume2 size={16} /> : <VolumeX size={16} />}</span><div><strong>{t('sound')}</strong><small>{settings.sound ? t('on') : t('off')}</small></div></div>
                    <button type="button" className={`sound-toggle ${settings.sound ? 'sound-on' : ''}`} onClick={() => changeSettings({ sound: !settings.sound })} role="switch" aria-checked={settings.sound} aria-label={t('sound')}><span /></button>
                  </div>
                </section>

                <section className="panel stats-panel">
                  <div className="section-heading compact"><div><span className="section-overline">{t('statistics')}</span><h2>{t('allMatches')}</h2></div><span className="stats-badge"><Trophy size={14} /></span></div>
                  <div className="stats-grid">
                    <StatItem value={stats.matches} label={t('allMatches')} accent="neutral" language={settings.language} />
                    <StatItem value={stats.humanWins + stats.playerXWins + stats.playerOWins} label={t('playerWins')} accent="blue" language={settings.language} />
                    <StatItem value={stats.aiWins} label={t('aiWins')} accent="purple" language={settings.language} />
                    <StatItem value={stats.draws} label={t('draws')} accent="amber" language={settings.language} />
                  </div>
                  <p className="stats-scope-note">{t('statisticsScope')}</p>
                  {mode === 'local' && <p className="stats-mode-detail">{t('playerX')}: {stats.playerXWins.toLocaleString(settings.language)} · {t('playerO')}: {stats.playerOWins.toLocaleString(settings.language)}</p>}
                  {stats.matches === 0 && <p className="stats-empty">{t('noStatsYet')}</p>}
                  <div className="streak-row"><span><Zap size={13} /> {t('bestStreak')}</span><strong>{stats.bestWinStreak.toLocaleString(settings.language)}</strong></div>
                  <div className="streak-row current-streak-row"><span><Zap size={13} /> {t('currentStreak')}</span><strong>{stats.currentWinStreak.toLocaleString(settings.language)}</strong></div>
                  <button type="button" className="reset-stats-button" onClick={() => { roundVersion.current += 1; setPendingConfirmation('reset-stats'); }}><RotateCcw size={13} /> {t('resetStats')}</button>
                </section>
              </>}
            </aside>
          </div>
        </main>

        <AdSlot label={t('advertisement')} />
        <footer className="footer">
          <div className="footer-left"><span className="footer-spark">✦</span><span>{t('designedToThinkDifferent')}</span></div>
          <nav className="footer-links" aria-label={t('siteNavigation')}>
            <a href="/about.html">{t('about')}</a>
            <a href="/guide.html">{t('strategyGuide')}</a>
            <a href="/privacy.html">{t('privacyPolicy')}</a>
            <a href="/terms.html">{t('termsOfUse')}</a>
            <a href="/contact.html">{t('contact')}</a>
          </nav>
        </footer>
      </div>

      {toast && <div className="toast-message" role="status"><Check size={15} /> {toast}</div>}
      {pendingConfirmation && <Modal title={confirmationTitle} description={confirmationDescription} cancelLabel={t('cancel')} confirmLabel={confirmationLabel} onCancel={cancelConfirmation} onConfirm={pendingConfirmation === 'new-match' ? startNewMatch : pendingConfirmation === 'reset-stats' ? handleResetStats : confirmPendingChange} />}
    </div>
  );
}

function PlayerCard({ mark, score, label, active, winning, language }: { mark: Mark; score: number; label: string; active: boolean; winning: boolean; language: Language }) {
  return <div className={`player-card player-${mark.toLowerCase()} ${active ? 'is-active' : ''} ${winning ? 'has-won' : ''}`}>
    <div className="player-card-top"><span className={`player-mark ${mark === 'X' ? 'x-symbol' : 'o-symbol'}`}>{mark === 'X' ? '×' : ''}</span>{active && <span className="active-player-dot" />}{winning && <Crown size={13} className="crown-icon" />}</div>
    <span className="player-name">{label}</span><strong className="player-score">{score.toLocaleString(language)}</strong>
  </div>;
}

function StatItem({ value, label, accent, language }: { value: number; label: string; accent: string; language: Language }) {
  return <div className={`stat-item stat-${accent}`}><strong>{value.toLocaleString(language)}</strong><span>{label}</span></div>;
}
