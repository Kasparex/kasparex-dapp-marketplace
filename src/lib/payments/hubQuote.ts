/**
 * vBlog-style hub quote display: line items, optional subtotal, final price, hub points.
 * Discount percent in UI is derived from amounts (not tier label alone).
 */

import { getDAppNetworkType, type DApp } from '@/lib/dapps';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { KpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';
import { calculateCost, formatPrice, formatPercent, type CostCalculatorInputs } from '@/lib/payments/calculator';
import { computeEarnedHubPoints, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import { getUiNativeSymbol } from '@/lib/walletUi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';

export type HubQuoteLine = {
  label: string;
  value: string;
};

export type HubQuoteDisplay = {
  lines: HubQuoteLine[];
  /** Gross amount before KREX discount (shown when discount applies). */
  subtotalKas?: number;
  discountKas: number;
  discountPercent: number;
  /** Wording after discount percent, e.g. "platform fee" or "total". */
  discountOffLabel: string;
  /** Currency for the discount line (may differ from payment currency on L1 transfers). */
  discountCurrency: string;
  totalKas: number;
  currency: string;
  totalLabel?: string;
  hubPoints?: number;
  hubPointsDetail?: string;
  infoText?: string;
  tierLabel: string;
  hasKrexDiscount: boolean;
  /** When true, only this quote may be shown (covenant widgets). */
  authoritative?: boolean;
};

const L1_NETWORK_BUFFER_KAS = 0.001;

const COVENANT_DAPP_SLUGS = new Set([
  'lockbox',
  'covenant-split',
  'covenant-milestone',
  'covenant-crowdfund',
  'covenant-voucher',
]);

export function isCovenantDAppSlug(slug?: string): boolean {
  return slug != null && COVENANT_DAPP_SLUGS.has(slug);
}

function round2(n: number): number {
  return Math.round(n * 100) / 100;
}

function discountPercentForTier(krexBalance: number, tier: KREXTier): number {
  if (krexBalance < KREX_TIERS.Tier1.minKREX) return 0;
  return krexTierDiscountPercent(tier);
}

function displayDiscountPercent(subtotal: number, discountKas: number): number {
  if (subtotal <= 0 || discountKas <= 0) return 0;
  return Math.round((discountKas / subtotal) * 100);
}

/** Quote currency matches the asset the dApp interacts with on the active chain. */
export function quoteCurrencyForDApp(dapp: DApp, chainId?: number): string {
  const slug = dapp.slug ?? '';
  if (slug === 'send-krex') return 'KREX';
  if (isCovenantDAppSlug(slug)) return 'KAS';

  const networkType = getDAppNetworkType(dapp);
  if (networkType === 'L1') return 'KAS';
  if (!chainId) return 'KAS';

  const native = getNativeCurrencySymbol(chainId);
  return getUiNativeSymbol(chainId, native);
}

/** Fixed hub points base per action (never scaled by transaction size). */
export function getHubPointsBaseForAction(dapp: DApp, actionId: string): number {
  const slug = dapp.slug ?? '';
  if (slug === 'send-kas' || slug === 'send-krex') return HUB_EARN_POINTS.dappL1Interaction;
  if (actionId === 'unlock-or-boost') return HUB_EARN_POINTS.dappDirectoryList;
  if (actionId === 'submit-proposal') return HUB_EARN_POINTS.dappDirectoryList;
  if (actionId === 'cast-vote') return HUB_EARN_POINTS.dappL1Interaction;
  if (actionId === 'send-payment') return HUB_EARN_POINTS.dappDirectoryList;
  if (actionId === 'donation') return HUB_EARN_POINTS.crowdkasCampaignCreate;
  if (getDAppNetworkType(dapp) === 'L1') return HUB_EARN_POINTS.dappL1Interaction;
  return HUB_EARN_POINTS.dappDirectoryList;
}

export function covenantDeployToHubQuote(
  pricing: KpxCovenantDeployPrice,
  krexBalance: number,
  lockAmountKas?: number,
): HubQuoteDisplay {
  const tierLabel = KREX_TIERS[pricing.krexTier].label;
  const subtotalKas = round2(pricing.baseFeeKas);
  const totalKas = pricing.waived ? 0 : round2(pricing.feeKas);
  const discountKas = round2(subtotalKas - totalKas);
  const discountPercent = displayDiscountPercent(subtotalKas, discountKas);

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
    discountOffLabel: 'total',
    discountCurrency: 'KAS',
    totalKas,
    currency: 'KAS',
    totalLabel: 'Platform fee to pay',
    hubPoints: pricing.hubPointsEarned,
    hubPointsDetail: formatHubPointsTierLabel(pricing.krexTier),
    infoText: pricing.waived
      ? 'Platform fee is waived when treasury is not configured. Lock principal stays separate from this fee.'
      : 'Fee is a separate KAS transfer to Kasparex treasury before your covenant deploy. Locked funds are not taken from this fee.',
    tierLabel,
    hasKrexDiscount: discountKas > 0 && krexBalance >= KREX_TIERS.Tier1.minKREX,
    authoritative: true,
  };
}

/** L1 native/KRC-20 transfers: amount in token, network buffer in KAS with tier discount on buffer only. */
function l1TransferHubQuote(
  amount: number,
  transferCurrency: 'KAS' | 'KREX',
  tier: KREXTier,
  krexBalance: number,
  hubPoints: number,
): HubQuoteDisplay {
  const tierLabel = KREX_TIERS[tier].label;
  const tierDiscountPct = discountPercentForTier(krexBalance, tier);
  const networkBuffer = L1_NETWORK_BUFFER_KAS;
  const feeSubtotal = round2(networkBuffer);
  const discountKas = round2(feeSubtotal * (tierDiscountPct / 100));
  const discountedNetwork = round2(feeSubtotal - discountKas);
  const discountPercent = displayDiscountPercent(feeSubtotal, discountKas);

  const lines: HubQuoteLine[] = [
    { label: 'Transfer amount', value: `${formatPrice(amount)} ${transferCurrency}` },
    { label: 'Network buffer', value: `${formatPrice(networkBuffer)} KAS` },
  ];

  if (discountKas > 0) {
    lines.push({
      label: 'Network buffer (after discount)',
      value: `${formatPrice(discountedNetwork)} KAS`,
    });
  }

  return {
    lines,
    subtotalKas: discountKas > 0 ? feeSubtotal : undefined,
    discountKas,
    discountPercent,
    discountOffLabel: 'network buffer',
    discountCurrency: 'KAS',
    totalKas: round2(amount),
    currency: transferCurrency,
    totalLabel: 'Transfer amount',
    hubPoints,
    hubPointsDetail: formatHubPointsTierLabel(tier),
    infoText:
      transferCurrency === 'KREX'
        ? 'KREX amount is transferred on L1. Network buffer is paid in KAS from your wallet separately from the KREX amount.'
        : 'Transfer amount is sent on Kaspa L1. A small KAS network buffer is paid separately from your wallet.',
    tierLabel,
    hasKrexDiscount: discountKas > 0 && krexBalance >= KREX_TIERS.Tier1.minKREX,
  };
}

/** L2 fee-inclusive payments: user pays the entered/fixed amount; discount reduces platform fee only. */
function l2FeeInclusiveHubQuote(
  breakdown: ReturnType<typeof calculateCost>,
  options: {
    tier: KREXTier;
    krexBalance: number;
    currency: string;
    actionLabel?: string;
    hubPoints?: number;
    infoText?: string;
  },
): HubQuoteDisplay {
  const payment = round2(breakdown.baseCost);
  const feeGross = round2((payment * breakdown.standardFeePercent) / 100);
  const feeNet = round2(breakdown.feeAmount);
  const discountKas = round2(Math.max(0, feeGross - feeNet));
  const discountPercent = displayDiscountPercent(feeGross, discountKas);
  const tierLabel = KREX_TIERS[options.tier].label;

  const lines: HubQuoteLine[] = [
    {
      label: options.actionLabel ?? 'Amount',
      value: `${formatPrice(payment)} ${options.currency}`,
    },
    {
      label: `Platform fee (${formatPercent(breakdown.feePercent)}%, was ${formatPercent(breakdown.standardFeePercent)}%)`,
      value: `${formatPrice(feeNet)} ${options.currency}`,
    },
    {
      label: 'Recipient receives',
      value: `${formatPrice(breakdown.breakdown.subtotal)} ${options.currency}`,
    },
  ];

  return {
    lines,
    subtotalKas: undefined,
    discountKas,
    discountPercent,
    discountOffLabel: 'platform fee',
    discountCurrency: options.currency,
    totalKas: payment,
    currency: options.currency,
    totalLabel: 'Total to pay',
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
  const { dapp, currency, variableAmount, actionLabel, ...costInputs } = inputs;
  const tier = costInputs.krexTier;
  const slug = dapp.slug ?? '';
  const hubBase = getHubPointsBaseForAction(dapp, costInputs.actionId);
  const hubPoints = computeEarnedHubPoints(hubBase, tier);

  if (variableAmount && (costInputs.overrideBaseCost == null || costInputs.overrideBaseCost <= 0)) {
    return null;
  }

  if (slug === 'send-kas' && costInputs.overrideBaseCost != null) {
    return l1TransferHubQuote(costInputs.overrideBaseCost, 'KAS', tier, costInputs.krexBalance, hubPoints);
  }

  if (slug === 'send-krex' && costInputs.overrideBaseCost != null) {
    return l1TransferHubQuote(costInputs.overrideBaseCost, 'KREX', tier, costInputs.krexBalance, hubPoints);
  }

  const breakdown = calculateCost({ dapp, ...costInputs });
  const networkType = getDAppNetworkType(dapp);

  return l2FeeInclusiveHubQuote(breakdown, {
    tier,
    krexBalance: costInputs.krexBalance,
    currency,
    actionLabel: actionLabel ?? (variableAmount ? 'Payment amount' : 'Base fee'),
    hubPoints,
    infoText:
      networkType === 'L1'
        ? 'L1 dApps settle in KAS. KREX tier discounts apply to eligible platform fees.'
        : variableAmount
          ? 'L2 dApps settle on your connected network. Totals update live from the amount you enter in the widget.'
          : 'L2 totals include platform fees. KREX tier discounts reduce the fee portion of your payment.',
  });
}
