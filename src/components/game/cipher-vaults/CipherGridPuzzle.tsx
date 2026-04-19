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
}: {
  size: number;
  initial: number[];
  target: number[];
  moveLimit: number;
  onSolved: (moves: CipherMove[]) => void | Promise<void>;
}) {
  const [grid, setGrid] = useState<number[]>(() => [...initial]);
  const [moves, setMoves] = useState<CipherMove[]>([]);
  const [selected, setSelected] = useState<number | null>(null);

  const solved = useMemo(() => isSolved(grid, target), [grid, target]);
  const remaining = Math.max(0, moveLimit - moves.length);

  const clickTile = (idx: number) => {
    if (solved) return;
    if (moves.length >= moveLimit) return;
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

      <div
        className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-4 dark:border-zinc-800 dark:bg-zinc-900/60"
        style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
      >
        {grid.map((v, idx) => {
          const isSel = selected === idx;
          return (
            <button
              key={idx}
              type="button"
              onClick={() => clickTile(idx)}
              className={[
                'aspect-square rounded-xl border text-2xl font-black transition-colors active:scale-[0.98]',
                'flex items-center justify-center',
                isSel
                  ? 'border-emerald-500 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300'
                  : 'border-zinc-200 bg-zinc-50 text-zinc-800 hover:bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900 dark:text-zinc-100 dark:hover:bg-zinc-800/60',
              ].join(' ')}
              aria-pressed={isSel}
            >
              {runeFor(v)}
            </button>
          );
        })}
      </div>

      <div className="flex flex-wrap items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            setGrid([...initial]);
            setMoves([]);
            setSelected(null);
          }}
          className="k-control-btn"
        >
          Reset
        </button>
        <button
          type="button"
          disabled={!solved}
          onClick={() => void onSolved(moves)}
          className="k-cta-primary disabled:opacity-50 disabled:grayscale"
        >
          {solved ? 'Submit solution' : 'Solve to submit'}
        </button>
      </div>
    </div>
  );
}

