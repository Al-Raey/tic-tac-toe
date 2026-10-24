import { fireEvent, render, screen, waitFor, within } from '@testing-library/react';
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import App from './App';

beforeEach(() => { localStorage.clear(); });
afterEach(() => { vi.useRealTimers(); });

describe('app interactions', () => {
  it('renders the board and switches between modes', () => {
    render(<App />);
    expect(screen.getByRole('group', { name: 'Tic-tac-toe board' })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TWO PLAYERS' })).toHaveAttribute('aria-pressed', 'false');
    fireEvent.click(screen.getByRole('button', { name: 'TWO PLAYERS' }));
    expect(screen.getByRole('button', { name: 'TWO PLAYERS' })).toHaveAttribute('aria-pressed', 'true');
  });

  it('offers all five difficulty levels and explains the selected level', () => {
    render(<App />);
    const difficulty = screen.getByRole('combobox', { name: 'DIFFICULTY' });
    expect(within(difficulty).getAllByRole('option')).toHaveLength(5);
    expect(screen.getByText('Spots immediate wins and blocks, with simple strategy.')).toBeInTheDocument();
    fireEvent.change(difficulty, { target: { value: 'very-hard' } });
    expect(screen.getByText('Near-perfect play, with rare strategic mistakes.')).toBeInTheDocument();
    expect(localStorage.getItem('ttu.settings.v1')).toContain('"difficulty":"very-hard"');
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'ar' } });
    expect(screen.getByText('لعب شبه مثالي مع أخطاء استراتيجية نادرة.')).toBeInTheDocument();
  });

  it('places human moves and provides a restart round control', () => {
    render(<App />);
    const cell = screen.getByRole('button', { name: 'Row 1, Column 1, empty' });
    fireEvent.click(cell);
    expect(screen.getByRole('button', { name: 'Row 1, Column 1, occupied by X' })).toHaveAttribute('aria-disabled', 'true');
    expect(screen.getByRole('button', { name: /Restart round/ })).toBeInTheDocument();
  });

  it('allows arrow-key navigation through occupied cells in the board', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'TWO PLAYERS' }));
    fireEvent.click(screen.getByRole('button', { name: 'Row 1, Column 1, empty' }));
    fireEvent.click(screen.getByRole('button', { name: 'Row 1, Column 2, empty' }));
    const firstCell = screen.getByRole('button', { name: 'Row 1, Column 1, occupied by X' });
    const occupiedNeighbor = screen.getByRole('button', { name: 'Row 1, Column 2, occupied by O' });
    firstCell.focus();
    fireEvent.keyDown(firstCell, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(occupiedNeighbor);
  });

  it('keeps horizontal arrow navigation aligned with the visual RTL board direction', () => {
    render(<App />);
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'ar' } });
    fireEvent.click(screen.getByRole('button', { name: 'لاعبان' }));
    const cells = within(screen.getByRole('group', { name: 'لوحة إكس-أو' })).getAllByRole('button');
    cells[0]!.focus();
    // In RTL, the first DOM/grid cell is at the right edge; ArrowLeft moves to
    // the visually adjacent cell, which is the next column in the DOM order.
    fireEvent.keyDown(cells[0]!, { key: 'ArrowLeft' });
    expect(document.activeElement).toBe(cells[1]);
    fireEvent.keyDown(cells[1]!, { key: 'ArrowRight' });
    expect(document.activeElement).toBe(cells[0]);
  });

  it('offers hints without placing a move and supports undo in local play', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Hint' }));
    expect(screen.getByText('A suggested move is highlighted on the board.')).toBeInTheDocument();
    expect(screen.getByText('Move history').parentElement?.parentElement).toHaveTextContent('0/9');

    fireEvent.click(screen.getByRole('button', { name: 'TWO PLAYERS' }));
    fireEvent.click(screen.getByRole('button', { name: 'Row 1, Column 1, empty' }));
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByRole('button', { name: 'Row 1, Column 1, empty' })).toBeEnabled();
    expect(screen.getByText('No moves yet')).toBeInTheDocument();
  });

  it('waits for a human move before offering undo when the human plays O', async () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'O', exact: true }));
    await vi.advanceTimersByTimeAsync(500);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeDisabled();

    const board = screen.getByRole('group', { name: 'Tic-tac-toe board' });
    const availableCell = within(board).getAllByRole('button').find((button: HTMLElement) => button.getAttribute('aria-disabled') !== 'true' && !button.hasAttribute('disabled'));
    expect(availableCell).toBeDefined();
    fireEvent.click(availableCell!);
    expect(screen.getByRole('button', { name: 'Undo' })).toBeEnabled();
    fireEvent.click(screen.getByRole('button', { name: 'Undo' }));
    expect(screen.getByText('Move history').parentElement?.parentElement).toHaveTextContent('1/9');
  });

  it('asks before abandoning an in-progress round when changing modes', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Row 1, Column 1, empty' }));
    fireEvent.click(screen.getByRole('button', { name: 'TWO PLAYERS' }));
    expect(screen.getByRole('dialog')).toHaveTextContent('Switch game mode?');
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    expect(screen.queryByRole('dialog')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: 'TWO PLAYERS' })).toHaveAttribute('aria-pressed', 'false');
    expect(screen.getByRole('button', { name: 'Row 1, Column 1, occupied by X' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('restores the current board after the application is remounted', () => {
    const view = render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'TWO PLAYERS' }));
    fireEvent.click(screen.getByRole('button', { name: 'Row 2, Column 2, empty' }));
    expect(localStorage.getItem('ttu.session.v1')).toContain('"moves":[4]');
    view.unmount();
    render(<App />);
    expect(screen.getByRole('button', { name: 'Row 2, Column 2, occupied by X' })).toHaveAttribute('aria-disabled', 'true');
  });

  it('switches theme and language direction', () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Light' }));
    expect(document.documentElement).toHaveAttribute('data-theme', 'light');
    fireEvent.change(screen.getByRole('combobox', { name: 'Language' }), { target: { value: 'ar' } });
    expect(document.documentElement).toHaveAttribute('dir', 'rtl');
    expect(screen.getByRole('heading', { name: /Tic-Tac-Toe/ })).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /الصف ١, العمود ١, فارغ/ })).toBeInTheDocument();
    expect(localStorage.getItem('ttu.settings.v1')).toContain('"language":"ar"');
  });

  it('requires confirmation to reset statistics', async () => {
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Reset statistics' }));
    expect(screen.getByRole('dialog')).toBeInTheDocument();
    fireEvent.click(screen.getByRole('button', { name: 'Cancel' }));
    await waitFor(() => expect(screen.queryByRole('dialog')).not.toBeInTheDocument());
  });

  it('records a completed local round exactly once without changing AI streak history', async () => {
    localStorage.setItem('ttu.statistics.v1', JSON.stringify({ currentWinStreak: 3, bestWinStreak: 5 }));
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'TWO PLAYERS' }));
    const moves = [
      'Row 1, Column 1, empty', 'Row 2, Column 1, empty',
      'Row 1, Column 2, empty', 'Row 2, Column 2, empty',
      'Row 1, Column 3, empty',
    ];
    for (const label of moves) fireEvent.click(screen.getByRole('button', { name: label }));
    await waitFor(() => {
      const stats = JSON.parse(localStorage.getItem('ttu.statistics.v1') ?? '{}') as Record<string, number>;
      expect(stats.matches).toBe(1);
      expect(stats.playerXWins).toBe(1);
      expect(stats.playerOWins).toBe(0);
      expect(stats.currentWinStreak).toBe(3);
      expect(stats.bestWinStreak).toBe(5);
    });
    expect(screen.getByText('Player wins').parentElement).toHaveTextContent('1');
    expect(screen.getByText('AI wins').parentElement).toHaveTextContent('0');
    expect(screen.getByText('Totals cover all competitive modes; practice rounds are excluded.')).toBeInTheDocument();

    fireEvent.click(screen.getByRole('button', { name: /Play next round/ }));
    await waitFor(() => {
      const session = JSON.parse(localStorage.getItem('ttu.session.v1') ?? '{}') as { game?: { moves?: number[] }; matchScore?: { x?: number; o?: number; draws?: number }; roundNumber?: number };
      expect(session.game?.moves).toEqual([]);
      expect(session.matchScore).toEqual({ x: 1, o: 0, draws: 0 });
      expect(session.roundNumber).toBe(2);
    });

    fireEvent.click(screen.getByRole('button', { name: 'New match' }));
    const dialog = screen.getByRole('dialog');
    fireEvent.click(within(dialog).getByRole('button', { name: 'New match' }));
    await waitFor(() => {
      const session = JSON.parse(localStorage.getItem('ttu.session.v1') ?? '{}') as { game?: { moves?: number[] }; matchScore?: { x?: number; o?: number; draws?: number }; roundNumber?: number };
      expect(session.game?.moves).toEqual([]);
      expect(session.matchScore).toEqual({ x: 0, o: 0, draws: 0 });
      expect(session.roundNumber).toBe(1);
    });
    expect(JSON.parse(localStorage.getItem('ttu.statistics.v1') ?? '{}')).toMatchObject({ matches: 1, playerXWins: 1 });
  });

  it('schedules an AI response and cancels stale responses on restart', async () => {
    vi.useFakeTimers();
    render(<App />);
    fireEvent.click(screen.getByRole('button', { name: 'Row 1, Column 1, empty' }));
    fireEvent.click(screen.getByRole('button', { name: /Restart round/ }));
    await vi.advanceTimersByTimeAsync(500);
    expect(screen.getByRole('button', { name: 'Row 1, Column 1, empty' })).toBeEnabled();
    expect(screen.getByRole('button', { name: 'Row 1, Column 2, empty' })).toBeEnabled();
  });
});
