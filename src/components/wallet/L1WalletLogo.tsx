'use client';

import type { ReactNode } from 'react';

export type L1WalletProviderId = 'kasware' | 'kastle' | 'kaspire';


const LOGO_SRC: Record<L1WalletProviderId, string> = {
  kasware: '/img/logos/kasware.png',
  kastle: '/img/logos/kastle.png',
  kaspire: '/img/logos/kaspire.png',
};

const LOGO_ALT: Record<L1WalletProviderId, string> = {
  kasware: 'KasWare',
  kastle: 'Kastle',
  kaspire: 'Kaspire',
};

/** Square wallet icon for L1 connect rows (KasWare / Kastle / Kaspire). */
export function L1WalletLogo({
  provider,
  size = 22,
  className = '',
}: {
  provider: L1WalletProviderId;
  size?: number;
  className?: string;
}) {
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={LOGO_SRC[provider]}
      alt={LOGO_ALT[provider]}
      width={size}
      height={size}
      className={`shrink-0 rounded-md object-cover ${className}`.trim()}
    />
  );
}

/** Logo + wallet name for connect buttons and dropdown rows. */
export function L1WalletConnectLabel({
  provider,
  label,
  logoSize = 22,
}: {
  provider: L1WalletProviderId;
  label: string;
  logoSize?: number;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <L1WalletLogo provider={provider} size={logoSize} />
      <span className="truncate">{label}</span>
    </span>
  );
}

/** Right-aligned chip matching Hub project Beta badge colors. */
export function L1WalletConnectBadge({ children }: { children: ReactNode }) {
  return (
    <span className="shrink-0 rounded px-1.5 py-0.5 text-[10px] font-medium bg-purple-100/80 dark:bg-purple-900/40 text-purple-800 dark:text-purple-300">
      {children}
    </span>
  );
}
