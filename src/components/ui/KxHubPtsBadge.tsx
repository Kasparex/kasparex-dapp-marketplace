import { HubPointsLightningIcon } from '@/components/hub/HubPointsEarnBadge';

/**
 * Hub Points reward badge. Unified borderless style (lightning icon + emerald text),
 * matching the standard used in the vBlog publishing fee box and across the Hub.
 */
export function KxHubPtsBadge({
  points,
  label,
  title = 'Hub PTS reward',
  className = '',
}: {
  points?: number;
  /** Optional preformatted value (e.g. "1.2K PTS"); overrides the default `{points} PTS`. */
  label?: string;
  title?: string;
  className?: string;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1 shrink-0 text-xs font-bold tabular-nums text-emerald-600 dark:text-emerald-400 ${className}`.trim()}
      title={title}
    >
      <HubPointsLightningIcon className="h-3.5 w-3.5 shrink-0" />
      {label ?? `${points ?? 0} PTS`}
    </span>
  );
}
