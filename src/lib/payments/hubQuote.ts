/**
 * vBlog-style hub quote display: subtotal, % off total discount, final price, hub points.
 */

import { getDAppNetworkType, type DApp } from '@/lib/dapps';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { KpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';
import { getActionCost } from '@/lib/payments/config';
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
  const tierLabel = KREX_TIERS[tier].label;
  const discountPercent = discountPercentForTier(costInputs.krexBalance, tier);
  const networkType = getDAppNetworkType(dapp);
  const breakdown = calculateCost({ dapp, ...costInputs });

  if (variableAmount && (costInputs.overrideBaseCost == null || costInputs.overrideBaseCost <= 0)) {
    return null;
  }

  if (variableAmount && costInputs.overrideBaseCost != null) {
    const payment = costInputs.overrideBaseCost;
    const feeSubtotal = (payment * breakdown.standardFeePercent) / 100;
    const discountKas = Math.round(feeSubtotal * (discountPercent / 100) * 100) / 100;
    const rewards = getDefaultRewardsBreakdown(chainId);
    const basePts = Math.round(payment * rewards.xpPerKas);
    const hubPoints = computeEarnedHubPoints(basePts, tier);

    const lines: HubQuoteLine[] = [
      { label: 'Payment amount', value: `${formatPrice(payment)} ${currency}` },
      {
        label: `Platform fee (${formatPercent(breakdown.standardFeePercent)}%)`,
        value: `${formatPrice(feeSubtotal)} ${currency}`,
      },
    ];

    if (discountKas > 0) {
      lines.push({ label: 'Fee subtotal', value: `${formatPrice(feeSubtotal)} ${currency}` });
    }

    return {
      lines,
      subtotalKas: discountKas > 0 ? feeSubtotal : undefined,
      discountKas,
      discountPercent,
      totalKas: payment,
      currency,
      hubPoints,
      hubPointsDetail: formatHubPointsTierLabel(tier),
      infoText:
        networkType === 'L1'
          ? 'L1 dApps settle in KAS. KREX tier discounts apply as a percentage off eligible fees.'
          : 'L2 dApps settle on Kasplex. Totals update live from the amount you enter in the widget.',
      tierLabel,
      hasKrexDiscount: discountKas > 0 && costInputs.krexBalance > 0,
    };
  }

  const grossSubtotal =
    costInputs.overrideBaseCost != null && costInputs.overrideBaseCost > 0
      ? costInputs.overrideBaseCost
      : getActionCost(dapp, costInputs.actionId, networkType);
  const discountKas = Math.round(grossSubtotal * (discountPercent / 100) * 100) / 100;
  const totalKas = Math.round((grossSubtotal - discountKas) * 100) / 100;

  const lines: HubQuoteLine[] = [
    {
      label: actionLabel ?? 'Base fee',
      value: `${formatPrice(grossSubtotal)} ${currency}`,
    },
  ];

  const hubBase =
    networkType === 'L1' ? HUB_EARN_POINTS.dappL1Interaction : HUB_EARN_POINTS.dappDirectoryList;
  const hubPoints = computeEarnedHubPoints(hubBase, tier);

  return {
    lines,
    subtotalKas: discountKas > 0 ? grossSubtotal : undefined,
    discountKas,
    discountPercent,
    totalKas,
    currency,
    hubPoints,
    hubPointsDetail: formatHubPointsTierLabel(tier),
    infoText:
      networkType === 'L1'
        ? 'L1 dApps settle in KAS. KREX tier discounts apply as a percentage off the action total.'
        : 'Connect the matching network wallet when you are ready to transact.',
    tierLabel,
    hasKrexDiscount: discountKas > 0 && costInputs.krexBalance > 0,
  };
}
