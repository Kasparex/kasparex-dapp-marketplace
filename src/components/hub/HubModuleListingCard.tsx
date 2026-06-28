'use client';

import type { ReactNode } from 'react';
import type { HubNetworkLayer } from '@/lib/hub/access';
import { KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';
import type { KxListingAccent } from '@/lib/ui/kxListingAccent';
import { hubModuleGateConfig } from '@/lib/hub/gateConfigs';
import { HubGatedListingCard } from './HubGatedListingCard';

export function HubModuleListingCard({
  title,
  description,
  price,
  currency,
  requiredNetwork,
  accent,
  footer,
}: {
  title: string;
  description: string;
  price: number;
  currency: string;
  requiredNetwork: HubNetworkLayer;
  accent: KxListingAccent;
  footer?: ReactNode;
}) {
  return (
    <HubGatedListingCard href="" accent={accent} config={hubModuleGateConfig(title, requiredNetwork)} className="relative flex flex-col min-h-0">
      <KxListingCardMedia>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="h-12 w-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex flex-1 min-h-0 flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="flex-1 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100" title={title}>
            {title}
          </h3>
        </div>

        <div className="mb-4 flex-grow min-h-0">
          <p className="kx-body-sm line-clamp-3">{description}</p>
        </div>

        <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
          {footer ?? (
            <div className="flex items-center justify-between gap-3">
              <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
                {price} {currency}
              </div>
              <button type="button" disabled className="k-control-btn disabled:opacity-50 disabled:cursor-not-allowed">
                Coming soon
              </button>
            </div>
          )}
        </div>
      </KxListingCardBody>
    </HubGatedListingCard>
  );
}
