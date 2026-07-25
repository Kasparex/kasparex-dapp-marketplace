/** Shared Stats UI helpers (safe for Server and Client Components). */

export function statsHeadlineAccent(text: string) {
  return (
    <span className="bg-gradient-to-r from-[color:var(--hub-accent)] via-teal-500 to-emerald-500 bg-clip-text text-transparent dark:from-sky-300 dark:via-teal-300 dark:to-emerald-300">
      {text}
    </span>
  );
}

/** Shared panel chrome for Stats (Diamond Veins Mining tab boxes). */
export const STATS_PANEL =
  'rounded-2xl border border-zinc-200 bg-white dark:border-zinc-800 dark:bg-zinc-900/60';
