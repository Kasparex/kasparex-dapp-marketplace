'use client';

import type { CostBreakdown } from '@/lib/payments/calculator';
import { formatPrice } from '@/lib/payments/calculator';

const BASE_FEE_PERCENT = 1.0;

interface FeeDisplayProps {
  /** Cost breakdown from calculateCost (fee + amount). */
  breakdown: CostBreakdown;
  /** Optional label, e.g. "Fee" or "You pay". */
  label?: string;
  /** Native currency symbol (e.g. KAS, iKAS on Galleon). Pass from getNativeCurrencySymbol(chainId). */
  currency: string;
  /** Compact layout (single line). */
  compact?: boolean;
  className?: string;
}

/**
 * Displays final fee next to or on CTAs so users see exactly what they will pay.
 * Shows discount when fee reduction applies (KREX tier / NFT / node).
 * Uses formatPrice for compact display (e.g. "10" for whole numbers).
 */
export function FeeDisplay({
  breakdown,
  label = 'You pay',
  currency,
  compact = false,
  className = '',
}: FeeDisplayProps) {
  const total = breakdown.finalCostWithFee;
  const hasDiscount = breakdown.feePercent < BASE_FEE_PERCENT && breakdown.feePercent >= 0;
  const discountPercent = hasDiscount
    ? Math.round((BASE_FEE_PERCENT - breakdown.feePercent) * 100) / 100
    : 0;

  if (compact) {
    return (
      <span className={`text-sm text-zinc-600 dark:text-zinc-400 ${className}`}>
        {label}: <strong className="text-zinc-900 dark:text-zinc-100">{formatPrice(total)} {currency}</strong>
        {hasDiscount && discountPercent > 0 && (
          <span className="text-green-600 dark:text-green-400 ml-1">({discountPercent}% off)</span>
        )}
      </span>
    );
  }

  return (
    <div className={`text-sm ${className}`}>
      <div className="flex items-center gap-2 flex-wrap">
        <span className="text-zinc-600 dark:text-zinc-400">{label}:</span>
        <span className="font-semibold text-zinc-900 dark:text-zinc-100">
          {formatPrice(total)} {currency}
        </span>
        {hasDiscount && discountPercent > 0 && (
          <span className="text-green-600 dark:text-green-400">({discountPercent}% fee discount)</span>
        )}
      </div>
      {breakdown.feeAmount > 0 && (
        <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
          Includes {formatPrice(breakdown.feeAmount)} {currency} fee
          {breakdown.feePercent < BASE_FEE_PERCENT && (
            <> (base {BASE_FEE_PERCENT}%, {discountPercent}% off)</>
          )}
        </div>
      )}
    </div>
  );
}
