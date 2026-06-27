/** Shared Stats UI helpers (safe for Server and Client Components). */

export function statsHeadlineAccent(text: string) {
  return (
    <span className="text-transparent bg-clip-text bg-gradient-to-r from-cyan-600 via-teal-500 to-emerald-500 dark:from-cyan-300 dark:via-teal-300 dark:to-emerald-300">
      {text}
    </span>
  );
}

/** Shared panel chrome for Stats content sections (Store dashboard style). */
export const STATS_PANEL =
  'rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950';
