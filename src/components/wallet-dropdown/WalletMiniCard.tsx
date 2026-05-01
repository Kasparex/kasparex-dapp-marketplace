'use client';

import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

export function WalletMiniCard({
  title,
  value,
  sub,
  right,
  onInfo,
  onClick,
}: {
  title: string;
  value: string;
  sub?: string;
  right?: string;
  onInfo?: () => void;
  onClick?: () => void;
}) {
  const tierBadge =
    sub && sub.toLowerCase().startsWith('tier:')
      ? sub.slice(sub.indexOf(':') + 1).trim()
      : null;

  const tierBadgeText = tierBadge
    ? tierBadge.toLowerCase().startsWith('tier')
      ? tierBadge.slice(4).trim()
      : tierBadge
    : null;

  return (
    <div
      role={onClick ? 'button' : undefined}
      tabIndex={onClick ? 0 : undefined}
      onClick={onClick}
      onKeyDown={
        onClick
          ? (e) => {
              if (e.key === 'Enter' || e.key === ' ') onClick();
            }
          : undefined
      }
      className={[
        'rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-3 py-2',
        onClick ? 'cursor-pointer hover:bg-zinc-100 dark:hover:bg-zinc-800/60 transition-colors' : '',
      ].join(' ')}
    >
      <div className="flex items-center justify-between gap-2">
        <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400 truncate">
          {title}
        </div>
        <div className="flex items-center gap-1">
          {right ? (
            <div className="text-[10px] font-semibold text-zinc-500 dark:text-zinc-400">{right}</div>
          ) : null}
          {onInfo ? (
            <Tooltip content={gameTooltipRich('More details', `Opens help or context for ${title}.`)}>
              <button
                type="button"
                className="p-1 rounded hover:bg-zinc-200/60 dark:hover:bg-zinc-800/60 transition-colors"
                onClick={onInfo}
                aria-label={`Info: ${title}`}
              >
                <svg className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </button>
            </Tooltip>
          ) : null}
        </div>
      </div>
      <div className="mt-0.5 text-sm font-semibold text-zinc-900 dark:text-zinc-100">{value}</div>
      {tierBadgeText ? (
        <div className="mt-1">
          <Tooltip
            content={gameTooltipRich(
              'KREX tier',
              sub ?? `Your current tier badge is ${tierBadgeText}.`,
            )}
          >
            <span className="inline-flex items-center text-[10px] px-2 py-0.5 rounded-full bg-[#02abb8]/10 text-[#02abb8] dark:text-[#66dfe8] font-black uppercase tracking-widest">
              Tier {tierBadgeText}
            </span>
          </Tooltip>
        </div>
      ) : sub ? (
        <Tooltip content={gameTooltipRich(title, sub)}>
          <div className="text-[11px] text-zinc-500 dark:text-zinc-500 truncate">{sub}</div>
        </Tooltip>
      ) : null}
    </div>
  );
}

