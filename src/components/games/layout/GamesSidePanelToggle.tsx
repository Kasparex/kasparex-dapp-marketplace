'use client';

type Props = {
  open: boolean;
  onToggle: () => void;
};

/** Lets players collapse the right column for a wider main game area (preference is saved per device). */
export function GamesSidePanelToggle({ open, onToggle }: Props) {
  return (
    <div className="flex w-full min-w-0 justify-end">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="kasparex-games-side-panel"
        className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-zinc-50 px-3 py-2 text-sm font-medium text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800"
      >
        {open ? 'Hide side panel' : 'Show side panel'}
      </button>
    </div>
  );
}
