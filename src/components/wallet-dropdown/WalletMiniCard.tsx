'use client';

export function WalletMiniCard({
  title,
  value,
  sub,
  right,
  onInfo,
}: {
  title: string;
  value: string;
  sub?: string;
  right?: string;
  onInfo?: () => void;
}) {
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-3 py-2">
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 truncate">
          {title}
        </div>
        <div className="flex items-center gap-1">
          {right ? (
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">{right}</div>
          ) : null}
          {onInfo ? (
            <button
              type="button"
              className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
              onClick={onInfo}
              aria-label={`Info: ${title}`}
              title={`Info: ${title}`}
            >
              <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </button>
          ) : null}
        </div>
      </div>
      <div className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
      {sub ? (
        <div className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate" title={sub}>
          {sub}
        </div>
      ) : null}
    </div>
  );
}

