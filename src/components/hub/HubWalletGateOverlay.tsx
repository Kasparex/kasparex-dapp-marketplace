'use client';

import type { ReactNode } from 'react';

/**
 * Full-area wallet gate: blurred cover over the parent, centered badge/message/networks.
 * Parent must be `position: relative` with a defined size (min-height).
 */
export function HubWalletGateOverlay({
  badge,
  title,
  subtitle = 'Click to continue',
  availableNetworks,
  onClick,
  className = '',
}: {
  badge: ReactNode;
  title: string;
  subtitle?: string;
  availableNetworks?: string[];
  onClick: () => void;
  className?: string;
}) {
  const networks = availableNetworks?.filter(Boolean) ?? [];

  return (
    <button
      type="button"
      onClick={onClick}
      className={`absolute inset-0 z-20 flex flex-col items-center justify-center gap-4 p-6 sm:p-8 bg-white/92 dark:bg-zinc-950/92 backdrop-blur-xl text-center cursor-pointer rounded-xl ${className}`}
      aria-label={title}
    >
      {badge}
      <p className="text-sm font-medium text-zinc-800 dark:text-zinc-200 leading-relaxed max-w-xs">
        {title}
      </p>
      {networks.length > 0 ? (
        <div className="flex flex-col items-center gap-2 w-full max-w-xs">
          <p className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            Available on
          </p>
          <div className="flex flex-wrap justify-center gap-1.5">
            {networks.map((name) => (
              <span
                key={name}
                className="inline-flex items-center rounded-full bg-zinc-100/90 dark:bg-zinc-800/90 px-2.5 py-1 text-xs font-medium text-zinc-700 dark:text-zinc-300"
              >
                {name}
              </span>
            ))}
          </div>
        </div>
      ) : null}
      <p className="text-xs text-zinc-500 dark:text-zinc-400">{subtitle}</p>
    </button>
  );
}
