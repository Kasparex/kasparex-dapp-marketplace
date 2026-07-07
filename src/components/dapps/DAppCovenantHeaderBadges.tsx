'use client';

import { useMemo } from 'react';
import type { DApp } from '@/lib/dapps';
import { isCovenantDAppSlug } from '@/lib/payments/hubQuote';
import { covenantTemplateFromDAppSlug } from '@/lib/covenant/covenantDAppSlug';
import { getKpxCovenantBrand } from '@/lib/covenant/kpxBranding';
import { getActiveCovenantRuntimeMode } from '@/lib/covenant/resolver';
import { covenantRuntimeBadge } from '@/lib/programmability/runtime-label';
import type { CovenantRuntimeMode } from '@/lib/covenant/types';
import { KxBadge } from '@/components/ui/KxBadge';
import { Tooltip, TooltipProvider } from '@/components/ui/Tooltip';

function runtimeVariant(tone: 'simulator' | 'l1' | 'hybrid'): 'cyan' | 'emerald' | 'amber' {
  if (tone === 'l1') return 'emerald';
  if (tone === 'hybrid') return 'amber';
  return 'cyan';
}

export function DAppCovenantHeaderBadges({ dapp }: { dapp: DApp }) {
  const template = useMemo(() => covenantTemplateFromDAppSlug(dapp.slug), [dapp.slug]);
  const runtimeMode = useMemo(() => getActiveCovenantRuntimeMode(), []);

  if (!isCovenantDAppSlug(dapp.slug) || !template) return null;

  const brand = getKpxCovenantBrand(template);
  const badge = covenantRuntimeBadge(runtimeMode as CovenantRuntimeMode);

  return (
    <TooltipProvider>
      <div className="flex flex-wrap items-center gap-2">
        <KxBadge variant="cyan" size="sm">
          KPX
        </KxBadge>
        <KxBadge variant="zinc" size="sm">
          {brand.payloadTemplate}
        </KxBadge>
        <Tooltip content={badge.description}>
          <KxBadge variant={runtimeVariant(badge.tone)} size="sm">
            {badge.label}
          </KxBadge>
        </Tooltip>
      </div>
    </TooltipProvider>
  );
}
