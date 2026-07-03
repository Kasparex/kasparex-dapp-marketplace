'use client';

import Image from 'next/image';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import type { Token } from '@/lib/tokens/types';
import { loadTokenFeaturedImageUrl } from '@/lib/tokens/metadata';
import { TokenLogo } from './TokenLogo';
import { TokenTitle } from './TokenTitle';
import { KxListingFeaturedPlaceholder } from '@/components/kx/KxListingFeaturedPlaceholder';
import { TokenListingBadges } from './TokenListingBadges';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { Tooltip } from '@/components/ui/Tooltip';
import { KxTagChip } from '@/components/ui/KxTagChip';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';

function HeaderCategoryIcon() {
  return (
    <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2} aria-hidden>
      <path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
    </svg>
  );
}

function getAvailabilityLabels(token: Token): string[] {
  const labels: string[] = [];
  if (token.network === 'L1') {
    labels.push('Kaspa L1', 'KRC-20');
  } else {
    labels.push('L2 EVM');
  }
  if (token.l1Address && token.l2Address) labels.push('L1 + L2');
  return labels;
}

function SocialIcon({ type }: { type?: string }) {
  const props = { className: 'h-4 w-4', fill: 'none' as const, viewBox: '0 0 24 24', stroke: 'currentColor', strokeWidth: 2 };
  if (type === 'social') {
    return (
      <svg {...props}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1" />
      </svg>
    );
  }
  return (
    <svg {...props}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M21 12a9 9 0 01-9 9m9-9a9 9 0 00-9-9m9 9H3m9 9a9 9 0 01-9-9m9 9c1.657 0 3-4.03 3-9s-1.343-9-3-9m0 18c-1.657 0-3-4.03-3-9s1.343-9 3-9m-9 9a9 9 0 019-9" />
    </svg>
  );
}

export function TokenPageHeader({ token }: { token: Token }) {
  const router = useRouter();
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected } = useAccount();
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const featuredImageUrl = loadTokenFeaturedImageUrl(token);
  const short = token.shortDescription?.trim() || token.description;
  const socialLinks = (token.links ?? []).filter((l) => l.type === 'social' || l.type === 'website' || !l.type);
  const availability = getAvailabilityLabels(token);
  const isWalletConnected = kaspaState.isConnected || isConnected;
  const isVerifiedDeveloper = Boolean(token.listing?.verified && isWalletConnected);

  const handleEdit = () => {
    router.push(`/tokens/dashboard?edit=${encodeURIComponent(token.slug)}`);
  };

  return (
    <div id="token-header" className="relative mb-10 scroll-mt-24 overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50/80 dark:border-zinc-800 dark:bg-zinc-900/45 select-text">
      <div className="absolute inset-0 bg-gradient-to-br from-cyan-500/5 via-transparent to-transparent" />

      <div className="relative flex min-h-[360px] flex-col lg:flex-row">
        <div className="flex w-full flex-col justify-center p-8 sm:p-10 lg:w-1/2 lg:p-12">
          <div className="mb-6 flex items-center gap-4">
            <TokenLogo token={token} size={64} showName={false} showSymbol={false} shape="rounded" className="flex-shrink-0" />
            <TokenTitle token={token} size="lg" layout="besideLogo" className="min-w-0" />
          </div>

          <p id="token-intro" className="kx-body mb-6 max-w-2xl select-text">
            {short}
          </p>

          {socialLinks.length > 0 ? (
            <div className="mb-6 flex flex-wrap items-center gap-2">
              {socialLinks.map((link) => (
                <a
                  key={link.url}
                  href={link.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-2 rounded-xl border border-zinc-200 bg-white/80 px-3 py-2 text-sm font-semibold text-zinc-700 transition hover:border-[#02abb8]/40 hover:text-[#02abb8] dark:border-zinc-700 dark:bg-zinc-900/80 dark:text-zinc-200"
                >
                  <SocialIcon type={link.type} />
                  {link.label}
                </a>
              ))}
            </div>
          ) : null}

          <div className="mb-4 flex flex-wrap items-center gap-2">
            {token.tags?.map((tag) => (
              <KxTagChip key={tag} label={tag} prefix="" />
            ))}
            <KxListingCategoryChip icon={<HeaderCategoryIcon />} title={`Category: ${token.type}`}>
              {token.type}
            </KxListingCategoryChip>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {availability.map((label) => (
              <Tooltip key={label} content={`Available on ${label}`}>
                <span className="cursor-help rounded-lg border border-zinc-200 bg-white/70 px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wide text-zinc-600 dark:border-zinc-700 dark:bg-zinc-900/60 dark:text-zinc-300">
                  {label}
                </span>
              </Tooltip>
            ))}
            <TokenListingBadges token={token} />
          </div>
        </div>

        <div className="relative min-h-[260px] w-full border-t border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-800 lg:min-h-full lg:w-1/2 lg:border-l lg:border-t-0">
          {featuredImageUrl ? (
            <Image
              src={featuredImageUrl}
              alt={token.name}
              fill
              className="object-cover"
              priority
              unoptimized
            />
          ) : (
            <KxListingFeaturedPlaceholder className="min-h-[260px]" iconClassName="h-16 w-16" />
          )}
        </div>
      </div>

      {isVerifiedDeveloper ? (
        <div className="absolute right-6 top-6 z-30 flex items-center gap-3">
          <button
            type="button"
            onClick={handleEdit}
            className="rounded-xl border border-zinc-200 bg-white/90 p-3 text-zinc-900 backdrop-blur-md transition hover:scale-105 dark:border-zinc-800 dark:bg-zinc-900/90 dark:text-zinc-100"
            aria-label="Edit token page"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
          </button>
          <button
            type="button"
            onClick={() => setShowDeleteConfirm(true)}
            className="rounded-xl bg-red-500 p-3 text-white transition hover:scale-105"
            aria-label="Delete token listing"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ) : null}

      {showDeleteConfirm ? (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-zinc-900/50 p-4">
          <div className="max-w-md rounded-2xl border border-zinc-200 bg-white p-6 shadow-xl dark:border-zinc-700 dark:bg-zinc-900">
            <p className="mb-4 text-sm text-zinc-700 dark:text-zinc-300">
              Delete this token listing? On-chain removal will be available when publishing goes live.
            </p>
            <div className="flex justify-end gap-2">
              <button type="button" onClick={() => setShowDeleteConfirm(false)} className="k-control-btn">
                Cancel
              </button>
              <button
                type="button"
                onClick={() => setShowDeleteConfirm(false)}
                className="k-control-btn !border-red-500/40 !text-red-600"
              >
                Confirm
              </button>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
