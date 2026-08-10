'use client';

import Link from 'next/link';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import { KxBadge } from '@/components/ui/KxBadge';
import { getGatewayUrl } from '@/lib/ipfs/gateway';

export function VDonateCampaignMedia({
  imageUrl,
  imageHash,
  className = '',
}: {
  imageUrl?: string | null;
  imageHash?: string | null;
  className?: string;
}) {
  const src = imageUrl?.trim() || (imageHash ? getGatewayUrl(imageHash) : '');
  if (!src) {
    return (
      <div className={`aspect-[16/9] relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${className}`}>
        <KxListingFeaturedPlaceholder className="absolute inset-0" />
      </div>
    );
  }
  return (
    <div className={`aspect-[16/9] relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${className}`}>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img src={src} alt="" className="w-full h-full object-cover" />
    </div>
  );
}

export function VDonateStatusBadges({
  isLive,
  goalReached,
}: {
  isLive: boolean;
  goalReached?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {isLive ? (
        <KxBadge variant="emerald" size="sm">
          Active
        </KxBadge>
      ) : (
        <KxBadge variant="rose" size="sm">
          Ended
        </KxBadge>
      )}
      {goalReached ? (
        <KxBadge variant="sky" size="sm">
          Goal reached
        </KxBadge>
      ) : null}
    </div>
  );
}

export function VDonateNetworkBadges({
  network,
  featured,
}: {
  network: 'l1' | 'l2';
  featured?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {network === 'l1' ? (
        <KxBadge variant="teal" size="sm">
          L1
        </KxBadge>
      ) : (
        <KxBadge variant="indigo" size="sm">
          L2
        </KxBadge>
      )}
      {featured ? (
        <KxBadge variant="amber" size="sm">
          Featured
        </KxBadge>
      ) : null}
    </div>
  );
}

export function VDonatePledgeInline({
  amount,
  onAmountChange,
  onPledge,
  busy,
  disabled,
  minKas,
  feeHint,
}: {
  amount: string;
  onAmountChange: (v: string) => void;
  onPledge: () => void;
  busy?: boolean;
  disabled?: boolean;
  minKas?: number;
  feeHint?: string;
}) {
  return (
    <div
      className="mt-3 pt-3 border-t border-zinc-200 dark:border-zinc-800"
      onClick={(e) => e.stopPropagation()}
      onKeyDown={(e) => e.stopPropagation()}
    >
      <div className="flex gap-2">
        <input
          type="number"
          min={minKas ?? 0.01}
          step="0.01"
          className="k-input text-sm flex-1"
          placeholder={minKas != null ? `Min ${minKas} KAS` : 'Pledge KAS'}
          value={amount}
          onChange={(e) => onAmountChange(e.target.value)}
          disabled={disabled || busy}
        />
        <button
          type="button"
          disabled={disabled || busy || !amount}
          onClick={onPledge}
          className="px-4 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 shrink-0"
        >
          {busy ? '…' : 'Pledge'}
        </button>
      </div>
      {feeHint ? <p className="mt-1.5 text-[11px] text-zinc-500 dark:text-zinc-400">{feeHint}</p> : null}
    </div>
  );
}

export function VDonateCardShell({
  href,
  children,
  footer,
}: {
  href: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors">
      <Link href={href} className="block min-w-0">
        {children}
      </Link>
      {footer ? <div className="px-4 pb-4">{footer}</div> : null}
    </div>
  );
}
