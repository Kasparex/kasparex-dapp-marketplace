'use client';

import type { ReactNode } from 'react';
import { KxListingCard } from '@/components/kx/KxListingCard';
import type { KxListingAccent } from '@/lib/ui/kxListingAccent';
import type { HubWalletGateConfig } from './HubWalletGateShell';
import { HubWalletGateModal } from './HubWalletGateModal';
import { useHubListingGate } from '@/hooks/useHubListingGate';

export function HubGatedListingCard({
  href,
  accent,
  config,
  className,
  children,
  gateWhen = true,
}: {
  href: string;
  accent: KxListingAccent;
  config: HubWalletGateConfig;
  className?: string;
  children: ReactNode;
  /** When false, card navigates freely (e.g. already-owned magazine issue). */
  gateWhen?: boolean;
}) {
  const { cardProps, l1Modal, closeL1Modal } = useHubListingGate(config, gateWhen);
  const nav = gateWhen ? cardProps(href) : { href, disabled: false as const, onClick: undefined };

  return (
    <>
      <KxListingCard accent={accent} className={className} {...nav}>
        {children}
      </KxListingCard>
      {l1Modal ? <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} /> : null}
    </>
  );
}
