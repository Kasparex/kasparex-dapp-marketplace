'use client';

import type { ReactNode } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { ChronicleAccessMeta } from '@/lib/chronicles/types';
import { useChroniclesEntitlements } from '@/lib/chronicles/entitlements/useChroniclesEntitlements';
import catalogFile from '../../../../data/chronicles/entitlements-catalog.json';
import { ChroniclesLockCard } from './ChroniclesLockCard';
import type { EntitlementOffer } from '@/lib/chronicles/entitlements/types';

export function ChroniclesChapterAccessGate({
  access,
  children,
}: {
  access?: ChronicleAccessMeta;
  children: ReactNode;
}) {
  const { state } = useKaspaWallet();
  const { isUnlocked } = useChroniclesEntitlements(state.address);

  if (!access || access.tier === 'free') {
    return <>{children}</>;
  }

  const ok = isUnlocked(access.contentId);
  const catalog = (catalogFile as { offers?: EntitlementOffer[] }).offers ?? [];
  const offer = catalog.find((o) => o.id === access.contentId);

  return (
    <ChroniclesLockCard
      locked={!ok}
      title={offer?.title ?? 'Premium chapter'}
      description={
        offer?.shortDescription ??
        'Connect KasWare and unlock this chapter from Vault & unlocks with an on-chain payment.'
      }
      priceLabel={offer?.priceLabel}
      vaultHref="/chronicles/dashboard#premium"
      unlockLabel="Unlock"
    >
      {children}
    </ChroniclesLockCard>
  );
}
