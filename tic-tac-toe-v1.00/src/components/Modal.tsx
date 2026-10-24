import { useEffect, useRef } from 'react';
import { AlertTriangle, X } from 'lucide-react';

export function Modal({ title, description, confirmLabel, cancelLabel, onConfirm, onCancel }: {
  title: string; description: string; confirmLabel: string; cancelLabel: string; onConfirm: () => void; onCancel: () => void;
}) {
  const dialogRef = useRef<HTMLElement>(null);
  const onCancelRef = useRef(onCancel);
  useEffect(() => { onCancelRef.current = onCancel; }, [onCancel]);
  useEffect(() => {
    const previousFocus = document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const dialog = dialogRef.current;
    const firstButton = dialog?.querySelector<HTMLButtonElement>('button');
    firstButton?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') { event.preventDefault(); onCancelRef.current(); return; }
      if (event.key !== 'Tab' || !dialog) return;
      const controls = Array.from(dialog.querySelectorAll<HTMLElement>('button:not(:disabled)'));
      if (controls.length === 0) return;
      const first = controls[0]!; const last = controls[controls.length - 1]!;
      if (event.shiftKey && document.activeElement === first) { event.preventDefault(); last.focus(); }
      else if (!event.shiftKey && document.activeElement === last) { event.preventDefault(); first.focus(); }
    };
    document.addEventListener('keydown', onKeyDown);
    return () => { document.removeEventListener('keydown', onKeyDown); previousFocus?.focus(); };
  }, []);
  return <div className="modal-backdrop" role="presentation" onMouseDown={(event) => { if (event.target === event.currentTarget) onCancel(); }}>
    <section ref={dialogRef} className="confirm-modal" tabIndex={-1} role="dialog" aria-modal="true" aria-labelledby="confirm-title" aria-describedby="confirm-description">
      <button type="button" className="modal-close" onClick={onCancel} aria-label={cancelLabel}><X size={17} /></button>
      <span className="modal-icon"><AlertTriangle size={22} /></span>
      <h2 id="confirm-title">{title}</h2>
      <p id="confirm-description">{description}</p>
      <div className="modal-actions"><button type="button" className="modal-cancel" onClick={onCancel}>{cancelLabel}</button><button type="button" className="modal-confirm" onClick={onConfirm}>{confirmLabel}</button></div>
    </section>
  </div>;
}
