'use client';

import type { ProtocolHubItem } from '@/lib/protocolsHub';
import { protocolHubBucketLabel } from '@/lib/protocolsHub';
import { KxListingCard, KxListingCardBody } from '@/components/kx/KxListingCard';
import { KxBadge } from '@/components/ui/KxBadge';
import { KX_CARD_EXCERPT } from '@/lib/ui/kxTypography';

export function ProtocolHubCard({ item }: { item: ProtocolHubItem }) {
  const isApi = item.href.startsWith('/api/');

  const body = (
    <KxListingCardBody>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <KxBadge variant="cyan">{protocolHubBucketLabel(item.bucket)}</KxBadge>
        <KxBadge variant={item.maturity === 'stable' ? 'emerald' : item.maturity === 'beta' ? 'violet' : 'zinc'}>
          {item.maturity}
        </KxBadge>
        {item.suite === 'kpx' ? <KxBadge variant="zinc">kpx</KxBadge> : null}
      </div>
      <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-snug">{item.title}</h3>
      {item.subtitle ? (
        <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{item.subtitle}</p>
      ) : null}
      <p className={`mt-2 ${KX_CARD_EXCERPT}`}>{item.description}</p>
      <div className="mt-3 text-xs font-bold text-[#02abb8]">
        {isApi ? 'Open API response →' : 'Open →'}
      </div>
    </KxListingCardBody>
  );

  return (
    <KxListingCard href={item.href} accent="hub" className="h-full hover:border-[#02abb8]/35">
      {body}
    </KxListingCard>
  );
}
