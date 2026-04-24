'use client';

import { useMemo, useState } from 'react';
import type { CipherMove } from '@/lib/game/cipher-grid';
import { applyCipherMove, isSolved } from '@/lib/game/cipher-grid';

function runeFor(n: number) {
  const runes = ['ᚠ', 'ᚢ', 'ᚦ', 'ᚨ', 'ᚱ', 'ᚲ', 'ᚷ', 'ᚹ', 'ᚺ', 'ᚾ', 'ᛁ', 'ᛃ', 'ᛇ', 'ᛈ', 'ᛉ', 'ᛋ'];
  return runes[n % runes.length] ?? '?';
}

export function CipherGridPuzzle({
  size,
  initial,
  target,
  moveLimit,
  onSolved,
  onFailed,
}: {
  size: number;
  initial: number[];
  target: number[];
  moveLimit: number;
  onSolved: (moves: CipherMove[]) => void | Promise<void>;
  onFailed: () => void;
}) {
  const [grid, setGrid] = useState<number[]>(() => [...initial]);
  const [moves, setMoves] = useState<CipherMove[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const solved = useMemo(() => isSolved(grid, target), [grid, target]);
  const remaining = Math.max(0, moveLimit - moves.length);
  const correctCount = useMemo(() => {
    let c = 0;
    for (let i = 0; i < Math.min(grid.length, target.length); i++) if (grid[i] === target[i]) c++;
    return c;
  }, [grid, target]);
  const lockedOut = !solved && moves.length >= moveLimit;

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
            Swap two runes to reconstruct the vault key. Move limit: <span className="font-mono">{moveLimit}</span>.
          </p>
        </div>
        <div className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-xs font-semibold text-zinc-700 dark:border-zinc-800 dark:bg-zinc-900/60 dark:text-zinc-200">
          Moves: <span className="font-mono tabular-nums">{moves.length}</span> · Left:{' '}
          <span className="font-mono tabular-nums">{remaining}</span>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Your grid</p>
          <div
            className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {grid.map((v, idx) => {
              const isSel = selected === idx;
              const isCorrect = grid[idx] === target[idx];
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={lockedOut}
                  onClick={() => clickTile(idx)}
                  className={[
                    'aspect-square rounded-xl border text-2xl font-black transition-colors active:scale-[0.98]',
                    'flex items-center justify-center disabled:opacity-70 disabled:cursor-not-allowed',
                    isSel
                      ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                      : isCorrect
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-zinc-800 dark:text-zinc-100'
                      : 'border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800/60',
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
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Vault seal (target)</p>
          <div
            className="grid gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-900/40"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {target.map((v, idx) => (
              <div
                key={idx}
                className="aspect-square rounded-xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40 flex items-center justify-center text-2xl font-black text-zinc-600 dark:text-zinc-300"
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
            Out of moves · Start new run
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

