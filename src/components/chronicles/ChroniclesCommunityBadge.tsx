/** Community-created Chronicles content badge (matches dApps directory styling). */
export function ChroniclesCommunityBadge({ className = '' }: { className?: string }) {
  return (
    <span
      className={`shrink-0 rounded px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wider bg-amber-500/10 text-amber-800 dark:text-amber-300 ${className}`}
    >
      Community
    </span>
  );
}
