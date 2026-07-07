/**
 * vBlog-style hub quote display: subtotal, % off total discount, final price, hub points.
 */

import { getDAppNetworkType, type DApp } from '@/lib/dapps';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { KpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';
import { calculateCost, formatPrice, formatPercent, type CostCalculatorInputs } from '@/lib/payments/calculator';
import { computeEarnedHubPoints, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { getDefaultRewardsBreakdown } from '@/lib/rewards/mockData';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';

export type HubQuoteLine = {
  label: string;
  value: string;
};

export type HubQuoteDisplay = {
  lines: HubQuoteLine[];
  /** Gross total before KREX discount (shown when discount applies). */
  subtotalKas?: number;
  discountKas: number;
  discountPercent: number;
  totalKas: number;
  currency: string;
  hubPoints?: number;
  hubPointsDetail?: string;
  infoText?: string;
  tierLabel: string;
  hasKrexDiscount: boolean;
};

function discountPercentForTier(krexBalance: number, tier: KREXTier): number {
  if (krexBalance < KREX_TIERS.Tier1.minKREX) return 0;
  return krexTierDiscountPercent(tier);
}

export function covenantDeployToHubQuote(
  pricing: KpxCovenantDeployPrice,
  krexBalance: number,
  lockAmountKas?: number,
): HubQuoteDisplay {
  const tierLabel = KREX_TIERS[pricing.krexTier].label;
  const discountPercent = pricing.discountPercent;
  const subtotalKas = pricing.baseFeeKas;
  const discountKas =
    discountPercent > 0 ? Math.round(subtotalKas * (discountPercent / 100) * 100) / 100 : 0;
  const totalKas = pricing.waived ? 0 : pricing.feeKas;

  const lines: HubQuoteLine[] = [];
  if (lockAmountKas != null && lockAmountKas > 0) {
    lines.push({
      label: 'Amount to lock (covenant)',
      value: `${formatPrice(lockAmountKas)} KAS`,
    });
  }
  lines.push({ label: 'Base fee (deploy)', value: `${formatPrice(subtotalKas)} KAS` });

  return {
    lines,
    subtotalKas: discountKas > 0 ? subtotalKas : undefined,
    discountKas,
    discountPercent,
    totalKas,
    currency: 'KAS',
    hubPoints: pricing.hubPointsEarned,
    hubPointsDetail: formatHubPointsTierLabel(pricing.krexTier),
    infoText: pricing.waived
      ? 'Platform fee is waived when treasury is not configured. Lock principal stays separate from this fee.'
      : 'Fee is a separate KAS transfer to Kasparex treasury before your covenant deploy. Locked funds are not taken from this fee.',
    tierLabel,
    hasKrexDiscount: discountKas > 0 && krexBalance > 0,
  };
}

function costBreakdownToHubQuote(
  breakdown: ReturnType<typeof calculateCost>,
  options: {
    tier: KREXTier;
    krexBalance: number;
    currency: string;
    actionLabel?: string;
    hubPoints?: number;
    infoText?: string;
    extraLines?: HubQuoteLine[];
  },
): HubQuoteDisplay {
  const discountPercent = discountPercentForTier(options.krexBalance, options.tier);
  const discountKas = breakdown.feeDiscountAmount;
  const tierLabel = KREX_TIERS[options.tier].label;

  const lines: HubQuoteLine[] = [
    ...(options.extraLines ?? []),
    {
      label: options.actionLabel ?? 'Amount',
      value: `${formatPrice(breakdown.baseCost)} ${options.currency}`,
    },
    {
      label: `Platform fee (${formatPercent(breakdown.feePercent)}%, was ${formatPercent(breakdown.standardFeePercent)}%)`,
      value: `${formatPrice(breakdown.feeAmount)} ${options.currency}`,
    },
    {
      label: 'Recipient receives',
      value: `${formatPrice(breakdown.breakdown.subtotal)} ${options.currency}`,
    },
  ];

  const feeGross = breakdown.feeAmount + breakdown.feeDiscountAmount;

  return {
    lines,
    subtotalKas: discountKas > 0 ? feeGross : undefined,
    discountKas,
    discountPercent,
    totalKas: breakdown.finalCostWithFee,
    currency: options.currency,
    hubPoints: options.hubPoints,
    hubPointsDetail: formatHubPointsTierLabel(options.tier),
    infoText: options.infoText,
    tierLabel,
    hasKrexDiscount: discountKas > 0 && options.krexBalance >= KREX_TIERS.Tier1.minKREX,
  };
}

export function calculateDAppHubQuote(
  inputs: CostCalculatorInputs & {
    dapp: DApp;
    chainId?: number;
    currency: string;
    variableAmount?: boolean;
    actionLabel?: string;
  },
): HubQuoteDisplay | null {
  const { dapp, chainId, currency, variableAmount, actionLabel, ...costInputs } = inputs;
  const tier = costInputs.krexTier;
  const networkType = getDAppNetworkType(dapp);
  const breakdown = calculateCost({ dapp, ...costInputs });

  if (variableAmount && (costInputs.overrideBaseCost == null || costInputs.overrideBaseCost <= 0)) {
    return null;
  }

  const rewards = getDefaultRewardsBreakdown(chainId);
  const hubBasePts =
    variableAmount && costInputs.overrideBaseCost != null
      ? Math.round(costInputs.overrideBaseCost * rewards.xpPerKas)
      : networkType === 'L1'
        ? HUB_EARN_POINTS.dappL1Interaction
        : Math.round(breakdown.baseCost * rewards.xpPerKas);
  const hubPoints = computeEarnedHubPoints(hubBasePts, tier);

  return costBreakdownToHubQuote(breakdown, {
    tier,
    krexBalance: costInputs.krexBalance,
    currency,
    actionLabel: actionLabel ?? (variableAmount ? 'Payment amount' : 'Base fee'),
    hubPoints,
    infoText:
      networkType === 'L1'
        ? 'L1 dApps settle in KAS. KREX tier discounts apply as a percentage off eligible fees.'
        : variableAmount
          ? 'L2 dApps settle on Kasplex. Totals update live from the amount you enter in the widget.'
          : 'L2 totals include platform fees. KREX tier discounts reduce the fee portion of your payment.',
  });
}
