'use client';

import { useEffect, useMemo, useState } from 'react';
import type { CipherMove } from '@/lib/game/cipher-grid';
import { applyCipherMove, countCorrect, isSolved } from '@/lib/game/cipher-grid';
import { cipherRuneAccentClass, CIPHER_SEAL_POINTS_PER_CORRECT } from '@/lib/game/cipher-vaults-config';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';

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
  fogHidden = [],
  hintIndex,
  retriesLeft = 0,
  onHintConsumed,
  onSealPointsDelta,
  onSolved,
  onFailed,
  onAbandon,
  onRetry,
}: {
  size: number;
  initial: number[];
  target: number[];
  moveLimit: number;
  solveMsLeft?: number;
  fogHidden?: number[];
  hintIndex?: number | null;
  retriesLeft?: number;
  onHintConsumed?: () => void;
  onSealPointsDelta?: (delta: number) => void;
  onSolved: (moves: CipherMove[]) => void | Promise<void>;
  onFailed: () => void;
  onAbandon?: () => void;
  onRetry?: () => void;
}) {
  const [grid, setGrid] = useState<number[]>(() => [...initial]);
  const [moves, setMoves] = useState<CipherMove[]>([]);
  const [selected, setSelected] = useState<number | null>(null);
  const fog = useMemo(() => new Set(fogHidden), [fogHidden]);

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
  const correctCount = useMemo(() => countCorrect(grid, target), [grid, target]);
  const timedOut = typeof solveMsLeft === 'number' && solveMsLeft <= 0;
  const lockedOut = !solved && (moves.length >= moveLimit || timedOut);

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
    const before = countCorrect(grid, target);
    const mv: CipherMove = { type: 'swap', a: selected, b: idx };
    const next = applyCipherMove(grid, size, mv);
    const after = countCorrect(next, target);
    const gained = after - before;
    if (gained > 0) onSealPointsDelta?.(gained * CIPHER_SEAL_POINTS_PER_CORRECT);
    setMoves((m) => [...m, mv]);
    setGrid(next);
    setSelected(null);
  };

  const tileClass = (opts: { isSel: boolean; isHint: boolean; isCorrect: boolean; rune: number }) => {
    const accent = cipherRuneAccentClass(opts.rune);
    if (opts.isSel || opts.isHint) {
      return `border-[color:var(--hub-accent)] bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.12))] ${accent}`;
    }
    if (opts.isCorrect) {
      return `border-transparent bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.08))] ${accent}`;
    }
    return `border-transparent bg-zinc-50 hover:border-[color:var(--hub-accent)] dark:bg-zinc-900 ${accent}`;
  };

  return (
    <div className="space-y-4">
      <p className="text-sm text-zinc-600 dark:text-zinc-400">
        Swap two runes to match the Vault Seal. Correct placements earn seal points; clears bank Cipher Fragments.
      </p>

      <HubMetadataStatGrid
        stats={[
          {
            label: 'Moves',
            value: String(moves.length),
            copyable: false,
            tooltipTitle: 'Moves used',
            tooltipDescription: 'Swaps spent on this level attempt.',
          },
          {
            label: 'Left moves',
            value: String(remaining),
            copyable: false,
            accent: remaining <= 3,
            tooltipTitle: 'Moves remaining',
            tooltipDescription: 'Swaps left before the seal collapses. Wardens and Extra Swaps raise this budget.',
          },
          {
            label: 'Time left',
            value: typeof solveMsLeft === 'number' ? formatMs(solveMsLeft) : '—',
            copyable: false,
            accent: true,
            tooltipTitle: 'Level timer',
            tooltipDescription: 'Solve countdown for this level. Shop Chrono Buffer and Cipher Wardens extend it.',
          },
        ]}
      />

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Your grid</p>
          <div
            className="grid gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-100/60 p-4 dark:border-zinc-800 dark:bg-white/[0.04]"
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
                    tileClass({ isSel, isHint, isCorrect, rune: v }),
                  ].join(' ')}
                  aria-pressed={isSel}
                >
                  {runeFor(v)}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            Correct: <span className="font-mono tabular-nums">{correctCount}</span>/{grid.length}
            {correctCount > 0 ? (
              <>
                {' '}
                · Seal pts this board:{' '}
                <span className="font-mono tabular-nums">{correctCount * CIPHER_SEAL_POINTS_PER_CORRECT}</span>
              </>
            ) : null}
          </p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Vault seal (target)</p>
          <div
            className="grid gap-2 rounded-2xl border border-zinc-200/80 bg-zinc-100/40 p-4 dark:border-zinc-800 dark:bg-white/[0.03]"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {target.map((v, idx) => {
              const hidden = fog.has(idx);
              return (
                <div
                  key={idx}
                  title={hidden ? 'Fogged seal cell' : undefined}
                  className={[
                    'flex aspect-square items-center justify-center rounded-xl border border-transparent text-2xl font-black transition-colors',
                    'bg-zinc-50 hover:border-[color:var(--hub-accent)] dark:bg-zinc-950/40',
                    hidden ? 'text-zinc-400 dark:text-zinc-600' : cipherRuneAccentClass(v),
                  ].join(' ')}
                >
                  {hidden ? '?' : runeFor(v)}
                </div>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {fog.size > 0
              ? `${fog.size} seal cells are fogged. Correct tiles on your grid still highlight.`
              : 'Correct tiles on your grid highlight with the Hub accent.'}
          </p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {lockedOut ? (
          <button type="button" onClick={onFailed} className="k-control-btn">
            {timedOut ? 'Timer expired · Retry or abandon' : 'Out of moves · Retry or abandon'}
          </button>
        ) : (
          <button type="button" onClick={() => setSelected(null)} className="k-control-btn">
            Clear selection
          </button>
        )}
        {onAbandon ? (
          <button type="button" onClick={onAbandon} className="k-control-btn">
            Abandon level
          </button>
        ) : null}
        {retriesLeft > 0 && onRetry ? (
          <button type="button" onClick={onRetry} className="k-control-btn">
            Second Seal ({retriesLeft})
          </button>
        ) : null}
        <button
          type="button"
          disabled={!solved}
          onClick={() => void onSolved(moves)}
          className="k-cta-games ml-auto h-11 min-h-[2.75rem] px-5 text-sm leading-none disabled:opacity-50 disabled:grayscale"
        >
          {solved ? 'Submit clear' : 'Solve to submit'}
        </button>
      </div>
    </div>
  );
}
