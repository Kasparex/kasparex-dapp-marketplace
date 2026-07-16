'use client';

import type { KpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';
import { formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { TierBadge } from '@/components/rewards/TierBadge';
import type { KREXTier } from '@/lib/rewards/types';
import { covenantPanelClass } from '@/components/dapps/covenant/CovenantWidgetUi';

export function KpxCovenantFeePanel({
  pricing,
  krexTier,
  krexBalance,
  lockAmountKas,
  actionLabel = 'deploy',
}: {
  pricing: KpxCovenantDeployPrice;
  krexTier: KREXTier;
  krexBalance: number;
  lockAmountKas?: number;
  actionLabel?: string;
}) {
  return (
    <div className={`${covenantPanelClass} text-sm space-y-3`}>
      <div className="flex flex-wrap items-center justify-between gap-2">
        <span className="font-medium text-zinc-800 dark:text-zinc-200">Hub platform fee</span>
        <TierBadge tier={krexTier} isUnlocked={krexBalance > 0} />
      </div>

      {lockAmountKas != null && lockAmountKas > 0 ? (
        <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
          <span>Amount to lock (your covenant)</span>
          <span className="font-medium text-zinc-900 dark:text-zinc-100">
            {lockAmountKas.toLocaleString(undefined, { maximumFractionDigits: 8 })} KAS
          </span>
        </div>
      ) : null}

      <div className="flex justify-between text-zinc-600 dark:text-zinc-400">
        <span>Base fee ({actionLabel})</span>
        <span>{pricing.baseFeeKas.toFixed(2)} KAS</span>
      </div>

      {pricing.discountPercent > 0 ? (
        <div className="flex justify-between text-emerald-700 dark:text-emerald-400">
          <span>KREX tier discount</span>
          <span>−{pricing.discountPercent}%</span>
        </div>
      ) : null}

      <div className="flex justify-between font-semibold text-zinc-900 dark:text-zinc-100 border-t border-zinc-200 dark:border-zinc-700 pt-2">
        <span>You pay (fee only)</span>
        <span>
          {pricing.waived ? (
            <span className="text-amber-600 dark:text-amber-400">Waived (demo)</span>
          ) : (
            `${pricing.feeKas.toFixed(2)} KAS`
          )}
        </span>
      </div>

      <div className="flex justify-between text-xs text-zinc-500 dark:text-zinc-400">
        <span>Hub points on {actionLabel}</span>
        <span>
          +{pricing.hubPointsEarned} pts ({formatHubPointsTierLabel(krexTier)})
        </span>
      </div>

      {pricing.waived ? (
        <p className="text-xs text-zinc-500">
          Platform fee is waived when treasury is not configured. Lock principal stays separate when
          on-chain deploy is available.
        </p>
      ) : (
        <p className="text-xs text-zinc-500">
          Fee is a separate KAS transfer to Kasparex treasury{' '}
          {actionLabel === 'claim' ? 'after' : 'before'} your covenant {actionLabel}. Locked funds are
          not taken from this fee.
        </p>
      )}
    </div>
  );
}
