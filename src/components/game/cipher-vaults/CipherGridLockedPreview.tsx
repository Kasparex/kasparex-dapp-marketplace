'use client';

/**
 * Locked Vaults preview: same two-panel layout as the live puzzle (your grid + vault seal).
 * Runes stay hidden until a run is activated.
 */
export function CipherGridLockedPreview({ size = 4 }: { size?: number }) {
  const n = size * size;
  const cells = Array.from({ length: n });
  const Cell = ({ muted }: { muted?: boolean }) => (
    <div
      className={[
        'aspect-square rounded-xl border border-dashed flex items-center justify-center text-xs font-semibold tracking-wide text-zinc-400 dark:text-zinc-600',
        muted ? 'border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950/40' : 'border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-950/40',
      ].join(' ')}
      aria-hidden
    >
      -
    </div>
  );

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Cipher Grid</p>
          <p className="text-xs text-zinc-500 dark:text-zinc-500 max-w-xl">
            You will see two panels: your shuffled grid (swaps only) and the Vault Seal target. Match the left to the
            right within the move limit, then submit.
          </p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">Your grid</p>
          <div
            className="grid gap-2 rounded-2xl border border-zinc-200 bg-white p-4 opacity-75 dark:border-zinc-800 dark:bg-zinc-900/60"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {cells.map((_, idx) => (
              <Cell key={`y-${idx}`} muted />
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">Hidden until your run begins.</p>
        </div>

        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-500">
            Vault seal (target)
          </p>
          <div
            className="grid gap-2 rounded-2xl border border-zinc-200 bg-zinc-50 p-4 opacity-75 dark:border-zinc-800 dark:bg-zinc-900/40"
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {cells.map((_, idx) => (
              <Cell key={`t-${idx}`} />
            ))}
          </div>
          <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-500">Shows the pattern to reconstruct.</p>
        </div>
      </div>

      <div className="rounded-xl border border-emerald-500/20 bg-emerald-500/10 p-3 text-sm text-emerald-800 dark:text-emerald-200">
        Locked - start a run (KAS or ticket) to reveal runes and enable swaps.
      </div>
    </div>
  );
}
