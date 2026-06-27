'use client';

type Props = {
  open: boolean;
  onToggle: () => void;
};

export function DAppSidePanelToggle({ open, onToggle }: Props) {
  return (
    <button
      type="button"
      onClick={onToggle}
      aria-expanded={open}
      aria-controls="kasparex-dapp-side-panel"
      className="inline-flex h-10 w-full max-w-full shrink-0 items-center justify-center gap-2 rounded-lg border border-zinc-200 bg-zinc-50 px-3 text-sm font-medium whitespace-nowrap text-zinc-700 transition hover:bg-zinc-100 dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200 dark:hover:bg-zinc-800 sm:w-auto"
    >
      {open ? 'Hide side panel' : 'Show side panel'}
    </button>
  );
}
