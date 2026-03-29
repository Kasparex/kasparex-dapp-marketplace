'use client';

import Link from 'next/link';
import type { EntitlementOffer } from '@/lib/chronicles/entitlements/types';
import { ChroniclesLockCard } from './ChroniclesLockCard';

export function UnlockOfferCard({
  offer,
  unlocked,
}: {
  offer: EntitlementOffer;
  unlocked: boolean;
}) {
  const inner = (
    <div className="chronicles-vault-card rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-900/60 p-5 h-full min-h-[140px] flex flex-col">
      <p className="text-[10px] font-black uppercase tracking-widest text-[#02abb8] mb-2">{offer.kind}</p>
      <h3 className="font-black text-zinc-900 dark:text-zinc-100 text-base mb-2">{offer.title}</h3>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 flex-1 leading-relaxed">{offer.shortDescription}</p>
      <p className="text-xs font-mono text-zinc-500 mt-3">{offer.priceLabel}</p>
      {unlocked && offer.targetHref ? (
        <Link
          href={offer.targetHref}
          className="mt-3 text-sm font-bold text-[#02abb8] hover:underline inline-flex items-center gap-1"
        >
          Open
          <span aria-hidden>→</span>
        </Link>
      ) : null}
    </div>
  );

  return (
    <ChroniclesLockCard
      locked={!unlocked}
      title={offer.title}
      description={offer.shortDescription}
      priceLabel={offer.priceLabel}
    >
      {inner}
    </ChroniclesLockCard>
  );
}
