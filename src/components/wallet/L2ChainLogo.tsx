'use client';

import { getL2ChainLogoByName, getL2ChainLogoSrc } from '@/lib/chains/logos';

/** Square chain icon for L2 network rows (Kasplex / Igra). */
export function L2ChainLogo({
  chainId,
  chainName,
  size = 22,
  className = '',
}: {
  chainId?: number;
  chainName?: string;
  size?: number;
  className?: string;
}) {
  const src =
    (chainId != null ? getL2ChainLogoSrc(chainId) : undefined) ??
    (chainName ? getL2ChainLogoByName(chainName) : undefined);

  if (!src) return null;

  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt=""
      width={size}
      height={size}
      className={`shrink-0 rounded-md object-cover ${className}`.trim()}
      aria-hidden
    />
  );
}

/** Logo + chain name for network switcher rows. */
export function L2ChainConnectLabel({
  chainId,
  chainName,
  label,
  logoSize = 22,
}: {
  chainId?: number;
  chainName?: string;
  label: string;
  logoSize?: number;
}) {
  return (
    <span className="flex min-w-0 items-center gap-2.5">
      <L2ChainLogo chainId={chainId} chainName={chainName} size={logoSize} />
      <span className="truncate">{label}</span>
    </span>
  );
}
