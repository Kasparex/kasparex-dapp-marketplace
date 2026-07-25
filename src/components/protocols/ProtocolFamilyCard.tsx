'use client';

import type { ProtocolFamily } from '@/lib/protocolFamilies';
import { isProtocolFamilyAccessible } from '@/lib/protocolFamilies';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxBadge } from '@/components/ui/KxBadge';
import { KxListingCategoryChip } from '@/components/ui/KxListingCategoryChip';
import { KX_CARD_EXCERPT } from '@/lib/ui/kxTypography';
import {
  KX_LISTING_PLACEHOLDER_GRADIENT,
  KX_LISTING_PLACEHOLDER_ICON,
} from '@/lib/ui/kxListingPlaceholder';

function statusLabel(status: ProtocolFamily['status']) {
  switch (status) {
    case 'live':
      return 'Live';
    case 'preview':
      return 'Preview';
    default:
      return 'Planned';
  }
}

function ProtocolPlaceholderIcon() {
  return (
    <svg
      className={`h-10 w-10 ${KX_LISTING_PLACEHOLDER_ICON}`}
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
      aria-hidden
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M13 10V3L4 14h7v7l9-11h-7z"
      />
    </svg>
  );
}

export function ProtocolFamilyCard({ family }: { family: ProtocolFamily }) {
  const accessible = isProtocolFamilyAccessible(family);
  return (
    <KxListingCard
      href={accessible ? `/protocols/${family.slug}` : undefined}
      disabled={!accessible}
      accent="protocols"
      className={`relative flex h-full min-h-0 flex-col${!accessible ? ' opacity-80' : ''}`}
    >
      <KxListingCardMedia aspectClass="aspect-[3/2]">
        <div className={`flex h-full w-full items-center justify-center ${KX_LISTING_PLACEHOLDER_GRADIENT}`}>
          <ProtocolPlaceholderIcon />
        </div>
      </KxListingCardMedia>
      <KxListingCardBody comfortable className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="min-w-0 text-[17px] font-semibold leading-snug text-zinc-900 dark:text-white">
            {family.name}
          </h3>
          <KxBadge
            variant={family.status === 'live' ? 'emerald' : family.status === 'preview' ? 'violet' : 'zinc'}
            className="shrink-0"
          >
            {statusLabel(family.status)}
          </KxBadge>
        </div>
        <p className={`mb-4 flex-1 ${KX_CARD_EXCERPT}`}>{family.description}</p>
        <div className="mt-auto border-t border-zinc-100 pt-3 dark:border-zinc-800">
          <KxListingCategoryChip>{family.category}</KxListingCategoryChip>
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}
