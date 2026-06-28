function HubPtsIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

const HUB_PTS_BADGE_CLASS =
  'inline-flex items-center gap-1 shrink-0 rounded-md border border-emerald-500/30 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-800 dark:text-emerald-300';

/** Hub PTS reward badge only (bordered emerald styling, not used for general tags). */
export function KxHubPtsBadge({
  points,
  title = 'Hub PTS reward',
  className = '',
}: {
  points: number;
  title?: string;
  className?: string;
}) {
  return (
    <span className={`${HUB_PTS_BADGE_CLASS} ${className}`.trim()} title={title}>
      <HubPtsIcon />
      {points} PTS
    </span>
  );
}
