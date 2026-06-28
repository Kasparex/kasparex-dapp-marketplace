import { KxBadge } from '@/components/ui/KxBadge';

function HubPtsIcon({ className = 'h-3.5 w-3.5' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
    </svg>
  );
}

/** Hub PTS reward badge (platform standard). */
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
    <KxBadge variant="reward" icon={<HubPtsIcon />} title={title} className={className}>
      {points} PTS
    </KxBadge>
  );
}
