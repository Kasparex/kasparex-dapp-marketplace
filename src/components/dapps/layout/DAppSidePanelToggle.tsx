'use client';

type Props = {
  open: boolean;
  onToggle: () => void;
  panelId?: string;
};

export function DAppSidePanelToggle({ open, onToggle, panelId = 'kasparex-dapp-side-panel' }: Props) {
  return (
    <div className="k-control-group w-full shrink-0 sm:w-auto">
      <button
        type="button"
        onClick={onToggle}
        aria-expanded={open}
        aria-controls={panelId}
        className="k-tab-btn w-full sm:w-auto"
      >
        {open ? 'Hide side panel' : 'Show side panel'}
      </button>
    </div>
  );
}
