'use client';

import { useMemo } from 'react';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import type { CovenantTemplate } from '@/lib/programmability/types';
import { resolveKpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';

export function useKpxCovenantDeployFee(template: CovenantTemplate) {
  const { tier, balance: krexBalance } = useKREXBalance();
  const pricing = useMemo(
    () => resolveKpxCovenantDeployPrice(template, tier),
    [template, tier],
  );

  return { pricing, krexTier: tier, krexBalance };
}
