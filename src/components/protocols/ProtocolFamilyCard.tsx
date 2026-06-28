'use client';

import type { ProtocolFamily } from '@/lib/protocolFamilies';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import { KxBadge } from '@/components/ui/KxBadge';
import { KX_CARD_EXCERPT } from '@/lib/ui/kxTypography';

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

export function ProtocolFamilyCard({ family }: { family: ProtocolFamily }) {
  return (
    <KxListingCard
      href={`/protocols/${family.slug}`}
      accent="protocols"
      className="relative flex h-full min-h-0 flex-col"
    >
      <KxListingCardMedia aspectClass="aspect-[3/2]">
        <div className="absolute inset-0 bg-gradient-to-br from-[#02abb8] via-cyan-600 to-teal-800 dark:from-[#02919c] dark:via-cyan-800 dark:to-teal-950" />
        <div className="pointer-events-none absolute inset-0 opacity-30">
          <div className="absolute -right-8 -top-8 h-32 w-32 rounded-full bg-white/20 blur-2xl" />
          <div className="absolute bottom-0 left-1/4 h-24 w-40 rounded-full bg-black/10 blur-xl" />
        </div>
        <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-black/10 to-transparent" />
        <div className="absolute left-3 top-3 z-10 flex flex-wrap gap-2">
          <KxBadge variant={family.status === 'live' ? 'emerald' : family.status === 'preview' ? 'cyan' : 'zinc'}>
            {statusLabel(family.status)}
          </KxBadge>
        </div>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-4xl font-black tracking-tight text-white drop-shadow-sm sm:text-5xl">
            {family.shortLabel}
          </span>
        </div>
      </KxListingCardMedia>
      <KxListingCardBody className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="text-[15px] font-semibold text-zinc-900 dark:text-zinc-100">{family.name}</div>
        <p className={`mt-1 flex-1 ${KX_CARD_EXCERPT}`}>
          {family.description}
        </p>
        <div className="mt-3 text-sm font-bold text-[#02abb8] group-hover:underline">View protocol hub →</div>
      </KxListingCardBody>
    </KxListingCard>
  );
}
