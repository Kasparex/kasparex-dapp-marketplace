'use client';

import { useMemo } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import type { CovenantTemplate } from '@/lib/programmability/types';
import {
  resolveKpxCovenantClaimPrice,
  resolveKpxCovenantDeployPrice,
} from '@/lib/covenant/kpxCovenantPricing';

/** Shared deploy fee + KREX tier for all covenant dApps. */
export function useKpxCovenantDeployFee(template: CovenantTemplate, premiumSlotCount?: number) {
  const { tier, balance: krexBalance } = useKREXBalance();
  const pricing = useMemo(
    () => resolveKpxCovenantDeployPrice(template, tier, { premiumSlotCount }),
    [template, tier, premiumSlotCount],
  );

  return { pricing, krexTier: tier, krexBalance };
}

/** Shared claim fee + Hub points (× KREX tier multiplier) for all covenant dApps. */
export function useKpxCovenantClaimFee(template: CovenantTemplate) {
  const { tier, balance: krexBalance } = useKREXBalance();
  const pricing = useMemo(
    () => resolveKpxCovenantClaimPrice(template, tier),
    [template, tier],
  );

  return { pricing, krexTier: tier, krexBalance };
}
