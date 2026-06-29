'use client';

type Props = {
  open: boolean;
  onToggle: () => void;
};

/** Lets players collapse the right column for a wider main game area (preference is saved per device). */
export function GamesSidePanelToggle({ open, onToggle }: Props) {
  return (
    <div className="k-control-group w-full shrink-0 sm:w-auto">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls="kasparex-games-side-panel"
        className="k-tab-btn w-full sm:w-auto"
      >
        {open ? 'Hide side panel' : 'Show side panel'}
      </button>
    </div>
  );
}
