'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { KxBadge } from '@/components/ui/KxBadge';
import { getGatewayUrl } from '@/lib/ipfs/gateway';

/** Same empty media plate as DAppCard (zinc plate + photo SVG). */
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
      <div
        className={`aspect-[16/9] relative overflow-hidden bg-zinc-100 dark:bg-zinc-800 ${className}`}
      >
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-12 w-12 text-zinc-400 dark:text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
        </div>
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

/** One row: network (left) · status (right). */
export function VDonateBadgeRow({
  network,
  isLive,
  goalReached,
  featured,
}: {
  network: 'l1' | 'l2';
  isLive: boolean;
  goalReached?: boolean;
  featured?: boolean;
}) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2">
      <div className="flex flex-wrap items-center gap-1.5">
        {network === 'l1' ? (
          <KxBadge variant="teal" size="sm">
            L1
          </KxBadge>
        ) : (
          <KxBadge variant="cyan" size="sm">
            L2
          </KxBadge>
        )}
        {featured ? (
          <KxBadge variant="amber" size="sm">
            Featured
          </KxBadge>
        ) : null}
      </div>
      <div className="flex flex-wrap items-center justify-end gap-1.5">
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
    </div>
  );
}

/** @deprecated Prefer VDonateBadgeRow */
export function VDonateStatusBadges(props: { isLive: boolean; goalReached?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {props.isLive ? (
        <KxBadge variant="emerald" size="sm">
          Active
        </KxBadge>
      ) : (
        <KxBadge variant="rose" size="sm">
          Ended
        </KxBadge>
      )}
      {props.goalReached ? (
        <KxBadge variant="sky" size="sm">
          Goal reached
        </KxBadge>
      ) : null}
    </div>
  );
}

/** @deprecated Prefer VDonateBadgeRow */
export function VDonateNetworkBadges(props: { network: 'l1' | 'l2'; featured?: boolean }) {
  return (
    <div className="flex flex-wrap items-center gap-1.5">
      {props.network === 'l1' ? (
        <KxBadge variant="teal" size="sm">
          L1
        </KxBadge>
      ) : (
        <KxBadge variant="cyan" size="sm">
          L2
        </KxBadge>
      )}
      {props.featured ? (
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
      className="pt-3"
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
  onNavigate,
}: {
  href: string;
  children: ReactNode;
  footer?: ReactNode;
  /** Return false to block navigation (e.g. open wallet gate). */
  onNavigate?: () => boolean | void;
}) {
  return (
    <div className="flex flex-col rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors">
      <Link
        href={href}
        className="block min-w-0"
        onClick={(e) => {
          if (onNavigate && onNavigate() === false) {
            e.preventDefault();
          }
        }}
      >
        {children}
      </Link>
      {footer ? <div className="px-4 pb-4 border-t border-zinc-200 dark:border-zinc-800 pt-3">{footer}</div> : null}
    </div>
  );
}
