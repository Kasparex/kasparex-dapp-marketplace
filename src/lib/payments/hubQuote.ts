/**
 * vBlog-style hub quote display: line items, subtotal, discount off total, final price.
 * Discount percent in UI is derived from subtotal and discount amounts.
 */

import { getDAppNetworkType, type DApp } from '@/lib/dapps';
import { krexTierDiscountPercent } from '@/lib/chronicles/vault/pricing';
import type { KpxCovenantDeployPrice } from '@/lib/covenant/kpxCovenantPricing';
import { formatPrice, type CostCalculatorInputs } from '@/lib/payments/calculator';
import { getActionCost } from '@/lib/payments/config';
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
  /** Gross total before KREX discount (shown when discount applies). */
  subtotalKas?: number;
  discountKas: number;
  discountPercent: number;
  discountCurrency: string;
  totalKas: number;
  currency: string;
  hubPoints?: number;
  hubPointsDetail?: string;
  infoText?: string;
  tierLabel: string;
  hasKrexDiscount: boolean;
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

function totalDiscountQuote(
  grossTotal: number,
  currency: string,
  tier: KREXTier,
  krexBalance: number,
  lines: HubQuoteLine[],
  options: {
    hubPoints?: number;
    infoText?: string;
  } = {},
): HubQuoteDisplay {
  const tierLabel = KREX_TIERS[tier].label;
  const subtotalKas = round2(grossTotal);
  const tierDiscountPct = discountPercentForTier(krexBalance, tier);
  const discountKas = round2(subtotalKas * (tierDiscountPct / 100));
  const totalKas = round2(subtotalKas - discountKas);
  const discountPercent = displayDiscountPercent(subtotalKas, discountKas);

  return {
    lines,
    subtotalKas: discountKas > 0 ? subtotalKas : undefined,
    discountKas,
    discountPercent,
    discountCurrency: currency,
    totalKas,
    currency,
    hubPoints: options.hubPoints,
    hubPointsDetail: formatHubPointsTierLabel(tier),
    infoText: options.infoText,
    tierLabel,
    hasKrexDiscount: discountKas > 0 && krexBalance >= KREX_TIERS.Tier1.minKREX,
  };
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
  if (isCovenantDAppSlug(slug)) return HUB_EARN_POINTS.kpxCovenantDeploy;
  if (getDAppNetworkType(dapp) === 'L1') return HUB_EARN_POINTS.dappL1Interaction;
  return HUB_EARN_POINTS.dappDirectoryList;
}

export function covenantDeployToHubQuote(
  pricing: KpxCovenantDeployPrice,
  krexBalance: number,
  lockAmountKas?: number,
): HubQuoteDisplay {
  const lines: HubQuoteLine[] = [];
  if (lockAmountKas != null && lockAmountKas > 0) {
    lines.push({
      label: 'Amount to lock (covenant)',
      value: `${formatPrice(lockAmountKas)} KAS`,
    });
  }
  lines.push({ label: 'Base fee (deploy)', value: `${formatPrice(pricing.baseFeeKas)} KAS` });

  const quote = totalDiscountQuote(
    pricing.waived ? 0 : pricing.baseFeeKas,
    'KAS',
    pricing.krexTier,
    krexBalance,
    lines,
    {
      hubPoints: pricing.hubPointsEarned,
      infoText: pricing.waived
        ? 'Platform fee is waived when treasury is not configured. Lock principal stays separate from this fee.'
        : 'Fee is a separate KAS transfer to Kasparex treasury before your covenant deploy. Locked funds are not taken from this fee.',
    },
  );

  if (pricing.waived) {
    return { ...quote, totalKas: 0, discountKas: 0, discountPercent: 0, subtotalKas: undefined };
  }

  return { ...quote, authoritative: true };
}

/** L1 native/KRC-20 transfers: tier discount applies to network buffer total. */
function l1TransferHubQuote(
  amount: number,
  transferCurrency: 'KAS' | 'KREX',
  tier: KREXTier,
  krexBalance: number,
  hubPoints: number,
): HubQuoteDisplay {
  const lines: HubQuoteLine[] = [
    { label: 'Transfer amount', value: `${formatPrice(amount)} ${transferCurrency}` },
    { label: 'Network buffer', value: `${formatPrice(L1_NETWORK_BUFFER_KAS)} KAS` },
  ];

  const bufferQuote = totalDiscountQuote(
    L1_NETWORK_BUFFER_KAS,
    'KAS',
    tier,
    krexBalance,
    lines,
    {
      hubPoints,
      infoText:
        transferCurrency === 'KREX'
          ? 'KREX amount is transferred on L1. Network buffer is paid in KAS from your wallet separately from the KREX amount.'
          : 'Transfer amount is sent on Kaspa L1. A small KAS network buffer is paid separately from your wallet.',
    },
  );

  return {
    ...bufferQuote,
    totalKas: round2(amount),
    currency: transferCurrency,
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
  const networkType = getDAppNetworkType(dapp);
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

  const grossTotal =
    costInputs.overrideBaseCost != null && costInputs.overrideBaseCost > 0
      ? costInputs.overrideBaseCost
      : getActionCost(dapp, costInputs.actionId, networkType);

  const lines: HubQuoteLine[] = [
    {
      label: actionLabel ?? (variableAmount ? 'Payment amount' : 'Base fee'),
      value: `${formatPrice(grossTotal)} ${currency}`,
    },
  ];

  return totalDiscountQuote(grossTotal, currency, tier, costInputs.krexBalance, lines, {
    hubPoints,
    infoText:
      networkType === 'L1'
        ? 'L1 dApps settle in KAS. KREX tier discounts apply to the total.'
        : variableAmount
          ? 'L2 dApps settle on your connected network. Totals update live from the amount you enter in the widget.'
          : 'L2 totals include KREX tier discounts off the total amount.',
  });
}
