'use client';

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

/** Logo + wallet name label for connect buttons and dropdown rows. */
export function L1WalletConnectLabel({
  provider,
  label,
  logoSize = 22,
  badge,
}: {
  provider: L1WalletProviderId;
  label: string;
  logoSize?: number;
  badge?: string | null;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <span className="relative shrink-0">
        <L1WalletLogo provider={provider} size={logoSize} />
        {badge ? (
          <span className="pointer-events-none absolute -bottom-1 -right-1 rounded bg-amber-500 px-1 py-px text-[8px] font-bold uppercase leading-none text-zinc-950 shadow-sm">
            {badge}
          </span>
        ) : null}
      </span>
      <span className="truncate">{label}</span>
    </span>
  );
}
