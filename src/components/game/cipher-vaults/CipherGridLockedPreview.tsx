'use client';

/**
 * Locked preview until a level starts. Soft nest chrome (no heavy white tile borders).
 */
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';

export function CipherGridLockedPreview({ size = 4 }: { size?: number }) {
  const n = size * size;
  const cells = Array.from({ length: n });
  const Cell = () => (
    <div
      className="flex aspect-square items-center justify-center rounded-xl border border-transparent bg-zinc-50 text-xs font-semibold text-zinc-400 transition-colors hover:border-[color:var(--hub-accent)] dark:bg-zinc-950/40 dark:text-zinc-600"
      aria-hidden
    >
      -
    </div>
  );

  return (
    <div className="space-y-4">
      <p className="max-w-xl text-sm text-zinc-600 dark:text-zinc-400">
        Start an unlocked level to reveal your shuffled grid and the Vault Seal. Higher levels grow the grid and may
        fog seal cells.
      </p>

      <div className="grid gap-3 md:grid-cols-2">
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Your grid</p>
          <div
            className={`${KX_SURFACE_NESTED} grid gap-2 rounded-2xl p-4 opacity-75`}
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {cells.map((_, idx) => (
              <Cell key={`y-${idx}`} />
            ))}
          </div>
        </div>
        <div>
          <p className="mb-2 text-xs font-semibold uppercase tracking-wide text-zinc-500">Vault seal (target)</p>
          <div
            className={`${KX_SURFACE_NESTED} grid gap-2 rounded-2xl p-4 opacity-75`}
            style={{ gridTemplateColumns: `repeat(${size}, minmax(0, 1fr))` }}
          >
            {cells.map((_, idx) => (
              <Cell key={`t-${idx}`} />
            ))}
          </div>
        </div>
      </div>

      <div className="rounded-xl border border-dashed border-amber-500/40 bg-amber-500/10 p-3 text-sm text-amber-900 dark:text-amber-200">
        Locked. Open a covenant from Calculation breakdown, then start a level above.
      </div>
    </div>
  );
}
