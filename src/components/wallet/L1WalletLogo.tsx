'use client';

export type L1WalletProviderId = 'kasware' | 'kastle';

const LOGO_SRC: Record<L1WalletProviderId, string> = {
  kasware: '/img/logos/kasware.png',
  kastle: '/img/logos/kastle.png',
};

const LOGO_ALT: Record<L1WalletProviderId, string> = {
  kasware: 'KasWare',
  kastle: 'Kastle',
};

/** Square wallet icon for L1 connect rows (KasWare / Kastle). */
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
