'use client';

import type { ProtocolHubItem } from '@/lib/protocolsHub';
import { protocolHubBucketLabel } from '@/lib/protocolsHub';
import { KxListingCard, KxListingCardBody } from '@/components/kx/KxListingCard';

function maturityClasses(m: ProtocolHubItem['maturity']) {
  switch (m) {
    case 'stable':
      return 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-200';
    case 'beta':
      return 'border-purple-500/30 bg-purple-500/10 text-purple-800 dark:text-purple-200';
    default:
      return 'border-zinc-300 bg-zinc-100 text-zinc-700 dark:border-zinc-600 dark:bg-zinc-800 dark:text-zinc-200';
  }
}

export function ProtocolHubCard({ item }: { item: ProtocolHubItem }) {
  const isApi = item.href.startsWith('/api/');

  const body = (
    <KxListingCardBody>
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="rounded-full border border-[#02abb8]/30 bg-[#02abb8]/10 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest text-[#02abb8] dark:text-[#66dfe8]">
          {protocolHubBucketLabel(item.bucket)}
        </span>
        <span
          className={`rounded-full border px-2 py-0.5 text-[10px] font-black uppercase tracking-widest ${maturityClasses(item.maturity)}`}
        >
          {item.maturity}
        </span>
        {item.suite === 'kpx' ? (
          <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">kpx</span>
        ) : null}
      </div>
      <h3 className="text-base font-black text-zinc-900 dark:text-zinc-100 leading-snug">{item.title}</h3>
      {item.subtitle ? (
        <p className="mt-1 text-xs font-semibold text-zinc-500 dark:text-zinc-400">{item.subtitle}</p>
      ) : null}
      <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">{item.description}</p>
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
