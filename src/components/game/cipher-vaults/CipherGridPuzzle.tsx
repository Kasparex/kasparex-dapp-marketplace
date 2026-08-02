'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CipherMove } from '@/lib/game/cipher-grid';
import { applyCipherMove, isSolved } from '@/lib/game/cipher-grid';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';

function runeFor(n: number) {
  const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛋ'];
  return runes[n % runes.length] ?? '?';
}

function formatMs(ms: number): string {
  const totalSec = Math.max(0, Math.floor(ms / 1000));
  const m = Math.floor(totalSec / 60);
  const s = totalSec % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
}

export function CipherGridPuzzle({
  size,
  initial,
  target,
  moveLimit,
  solveMsLeft,
  hintIndex,
  onHintConsumed,
  onSolved,
  onFailed,
}: {
  size: number;
  initial: number[];
  target: number[];
  moveLimit: number;
  solveMsLeft?: number;
  hintIndex?: number | null;
  onHintConsumed?: () => void;
  onSolved: (moves: CipherMove[]) => void | Promise<void>;
  onFailed: () => void;
}) {
  const [grid, setGrid] = useState<number[]>(() => [...initial]);
  const [moves, setMoves] = useState<CipherMove[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  useEffect(() => {
    setGrid([...initial]);
    setMoves([]);
    setSelected(null);
  }, [initial]);

  useEffect(() => {
    if (hintIndex == null) return;
    setSelected(hintIndex);
    const t = setTimeout(() => onHintConsumed?.(), 1600);
    return () => clearTimeout(t);
  }, [hintIndex, onHintConsumed]);

  const solved = useMemo(() => isSolved(grid, target), [grid, target]);
  const remaining = Math.max(0, moveLimit - moves.length);
  const correctCount = useMemo(() => {
    let c = 0;
    for (let i = 0; i < Math.min(grid.length, target.length); i++) if (grid[i] === target[i]) c++;
    return c;
  }, [grid, target]);
  const timedOut = typeof solveMsLeft === 'number' && solveMsLeft <= 0;
  const lockedOut = !solved && (moves.length >= moveLimit || timedOut);

  useEffect(() => {
    if (timedOut && !solved) {
      // Parent handles cancel / retry UI via onFailed when user acknowledges.
    }
  }, [timedOut, solved]);

  const clickTile = (idx: number) => {
    if (solved || lockedOut) return;
    if (selected == null) {
      setSelected(idx);
      return;
    }
    if (selected === idx) {
      setSelected(null);
      return;
    }
    const mv: CipherMove = { type: 'swap', a: selected, b: idx };
    setMoves((m) => [...m, mv]);
    setGrid((g) => applyCipherMove(g, size, mv));
    setSelected(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Cipher Grid</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500">
            Swap two runes to reconstruct the vault key. Move limit:{' '}
            <span className="font-mono">{moveLimit}</span>.
          </p>
        </div>
        <div className={`${KX_SURFACE_NESTED} rounded-xl px-3 py-2 text-xs font-semibold text-zinc-700 dark:text-zinc-200`}>
          Moves: <span className="font-mono tabular-nums">{moves.length}</span> · Left:{' '}
          <span className="font-mono tabular-nums">{remaining}</span>
          {typeof solveMsLeft === 'number' ? (
            <>
              {' '}
              · Timer: <span className="font-mono tabular-nums text-[color:var(--hub-accent)]">{formatMs(solveMsLeft)}</span>
            </>
          ) : null}
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Your grid</p>
          <div
            className={`${KX_SURFACE_NESTED} grid gap-2 rounded-2xl p-4`}
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {grid.map((v, idx) => {
              const isSel = selected === idx;
              const isCorrect = grid[idx] === target[idx];
              const isHint = hintIndex === idx;
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={lockedOut}
                  onClick={() => clickTile(idx)}
                  className={[
                    'aspect-square rounded-xl border text-2xl font-black transition-colors active:scale-[0.98]',
                    'flex items-center justify-center disabled:cursor-not-allowed disabled:opacity-70',
                    isSel || isHint
                      ? 'border-[color:var(--hub-accent)] bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.15))] text-[color:var(--hub-accent)] shadow-[0_0_0_1px_var(--hub-accent)]'
                      : isCorrect
                        ? 'border-[color:var(--hub-accent)]/30 bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.08))] text-zinc-800 dark:text-zinc-100'
                        : 'border-zinc-200 bg-white text-zinc-800 hover:border-[color:var(--hub-accent)] hover:bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.08))] dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-100 dark:hover:border-[color:var(--hub-accent)]',
                  ].join(' ')}
                  aria-pressed={isSel}
                >
                  {runeFor(v)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            Correct positions: <span className="font-mono tabular-nums">{correctCount}</span>/{grid.length}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            Vault seal (target)
          </p>
          <div
            className={`${KX_SURFACE_NESTED} grid gap-2 rounded-2xl p-4`}
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {target.map((v, idx) => (
              <div
                key={idx}
                className="flex aspect-square items-center justify-center rounded-xl border border-zinc-200 bg-white text-2xl font-black text-zinc-600 transition-colors hover:border-[color:var(--hub-accent)] dark:border-zinc-800 dark:bg-zinc-950/40 dark:text-zinc-300"
              >
                {runeFor(v)}
              </div>
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">
            Hint: tiles highlighted on the left are already in the correct spot.
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        {lockedOut ? (
          <button type="button" onClick={onFailed} className="k-control-btn">
            {timedOut ? 'Timer expired · End or retry' : 'Out of moves · End or retry'}
          </button>
        ) : (
          <button type="button" onClick={() => setSelected(null)} className="k-control-btn">
            Clear selection
          </button>
        )}
        <button
          type="button"
          disabled={!solved}
          onClick={() => void onSolved(moves)}
          className="k-cta-games disabled:opacity-50 disabled:grayscale"
        >
          {solved ? 'Submit solution' : 'Solve to submit'}
        </button>
      </div>
    </div>
  );
}
