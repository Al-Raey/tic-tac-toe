import { useMemo, useRef } from 'react';
import { Sparkles } from 'lucide-react';
import type { TranslationKey } from '../lib/i18n';
import type { GameState } from '../engine/game';
import type { Language } from '../lib/storage';

type Props = {
  game: GameState;
  onMove: (index: number) => void;
  t: (key: TranslationKey) => string;
  isAiThinking: boolean;
  hintMove: number | null;
  language: Language;
};

export function GameBoard({ game, onMove, t, isAiThinking, hintMove, language }: Props) {
  const cellRefs = useRef<Array<HTMLButtonElement | null>>([]);
  const winningIndexes = useMemo(() => new Set(game.result?.winner === 'draw' || !game.result ? [] : game.result.line), [game.result]);
  const line = game.result && game.result.winner !== 'draw' ? game.result.line : null;
  const coords = line?.map((index) => ({ x: (index % 3) * 100 + 50, y: Math.floor(index / 3) * 100 + 50 }));

  return <div className={`board-wrap ${game.result ? 'board-finished' : ''} ${isAiThinking ? 'board-thinking' : ''}`}>
    <div className="board-grid" role="group" aria-label={t('accessibilityBoard')}>
      {game.board.map((mark, index) => {
        const row = Math.floor(index / 3) + 1;
        const column = index % 3 + 1;
        const winning = winningIndexes.has(index);
        const disabled = Boolean(game.result) || isAiThinking;
        const hinted = hintMove === index && !game.result && mark === null;
        const label = `${t('row')} ${row.toLocaleString(language)}, ${t('column')} ${column.toLocaleString(language)}, ${mark ? `${t('occupiedBy')} ${mark}` : t('empty')}${winning ? `, ${t('winningCell')}` : ''}${hinted ? `, ${t('suggestedMove')}` : ''}`;
        return <button
          key={index}
          type="button"
          ref={(element) => { cellRefs.current[index] = element; }}
          className={`board-cell ${mark ? `cell-${mark.toLowerCase()}` : 'cell-empty'} ${winning ? 'is-winning' : ''} ${mark ? 'has-mark' : ''} ${hinted ? 'is-hinted' : ''}`}
          onClick={() => onMove(index)}
          onKeyDown={(event) => {
            const rowDelta = event.key === 'ArrowDown' ? 1 : event.key === 'ArrowUp' ? -1 : 0;
            // The board inherits the document's direction: column 1 is visually
            // leftmost in English and rightmost in Arabic. Keep arrow-key focus
            // movement aligned with the visible direction in both locales.
            const forwardColumnKey = language === 'ar' ? 'ArrowLeft' : 'ArrowRight';
            const backwardColumnKey = language === 'ar' ? 'ArrowRight' : 'ArrowLeft';
            const columnDelta = event.key === forwardColumnKey ? 1 : event.key === backwardColumnKey ? -1 : 0;
            if (rowDelta === 0 && columnDelta === 0) return;
            let row = Math.floor(index / 3) + rowDelta;
            let column = index % 3 + columnDelta;
            while (row >= 0 && row <= 2 && column >= 0 && column <= 2) {
              const targetIndex = row * 3 + column;
              // Arrow navigation moves across occupied cells too, so keyboard
              // users can inspect prior moves instead of skipping them.
              if (!game.result && !isAiThinking) {
                event.preventDefault();
                cellRefs.current[targetIndex]?.focus();
                return;
              }
              row += rowDelta;
              column += columnDelta;
            }
          }}
          disabled={disabled}
          aria-disabled={mark !== null}
          aria-label={label}
          aria-pressed={mark !== null}
          data-cell-index={index}
        >
          {mark === 'X' && <svg className="cell-symbol cell-x" viewBox="0 0 60 60" aria-hidden="true"><path d="M15 15 L45 45 M45 15 L15 45" /></svg>}
          {mark === 'O' && <svg className="cell-symbol cell-o" viewBox="0 0 60 60" aria-hidden="true"><circle cx="30" cy="30" r="18" /></svg>}
          {!mark && !game.result && <span className="cell-hover-mark" aria-hidden="true">{game.currentPlayer === 'X' ? '×' : '○'}</span>}
        </button>;
      })}
    </div>
    {coords && <svg className="winning-line" viewBox="0 0 300 300" aria-hidden="true"><line x1={coords[0]!.x} y1={coords[0]!.y} x2={coords[2]!.x} y2={coords[2]!.y} /></svg>}
    {game.result?.winner !== undefined && game.result?.winner !== 'draw' && <div className="win-spark" aria-hidden="true"><Sparkles size={18} /></div>}
  </div>;
}
