import { applyKrexFeeDiscount } from '@/lib/hub/applyKrexFeeDiscount';
import { formatPrice } from '@/lib/payments/calculator';
import type { HubQuoteDisplay } from '@/lib/payments/hubQuote';
import { computeHubPointsForAction } from '@/lib/rewards/hub-points-eligibility';
import { formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import type { DApp } from '@/lib/dapps';
import { getKrexWrapBaseFeeKas } from './config';

export function quoteKrexWrapFeeKas(tier: KREXTier, baseFeeKas = getKrexWrapBaseFeeKas()): number {
  return applyKrexFeeDiscount(baseFeeKas, tier);
}

export function buildKrexWrapHubQuote(args: {
  dapp: DApp;
  amount: number;
  tick: string;
  tier: KREXTier;
  krexBalance: number;
  baseFeeKas?: number;
  /** Bridge network for fee sink preview (testnet skips mainnet rewards split). */
  network?: 'mainnet' | 'testnet-10';
  treasuryAddress?: string | null;
  /** @deprecated Use `amount`. */
  amountKrex?: number;
}): HubQuoteDisplay | null {
  const amount = args.amount ?? args.amountKrex ?? 0;
  const tick = (args.tick || 'KREX').trim().toUpperCase() || 'KREX';
  if (!Number.isFinite(amount) || amount <= 0) return null;

  const baseFee = args.baseFeeKas ?? getKrexWrapBaseFeeKas();
  const feeKas = quoteKrexWrapFeeKas(args.tier, baseFee);
  const discountKas = Math.max(0, Math.round((baseFee - feeKas) * 100) / 100);
  const discountPercent =
    baseFee > 0 && discountKas > 0 ? Math.round((discountKas / baseFee) * 100) : 0;

  const hubPoints = computeHubPointsForAction({
    dapp: args.dapp,
    actionId: 'migrate',
    tier: args.tier,
  });

  const isTestnet = args.network === 'testnet-10';

  return {
    lines: [
      {
        label: 'Amount',
        value: `${formatPrice(amount)} ${tick}`,
      },
      {
        label: 'You receive (KCC20, 1:1)',
        value: `${formatPrice(amount)} ${tick}`,
      },
      {
        label: 'Bridge fee',
        value: `${formatPrice(feeKas)} KAS`,
      },
    ],
    subtotalKas: baseFee,
    discountKas,
    discountPercent,
    discountCurrency: 'KAS',
    totalKas: feeKas,
    currency: 'KAS',
    hubPoints,
    hubPointsDetail: formatHubPointsTierLabel(args.tier),
    infoText: isTestnet
      ? 'Testnet: pay the KAS bridge fee to the TN10 treasury, then send the KRC-20 to the testnet vault.'
      : 'Pay the KAS bridge fee to Hub treasury, then send the KRC-20 to the vault. Matching KCC20 is 1:1 once mint confirms.',
    tierLabel: KREX_TIERS[args.tier].label,
    hasKrexDiscount: discountKas > 0 && args.krexBalance >= KREX_TIERS.Tier1.minKREX,
    authoritative: true,
    platformFeeOverrides: isTestnet
      ? {
          treasuryAddress: args.treasuryAddress ?? undefined,
          rewardsBps: 0,
        }
      : args.treasuryAddress
        ? { treasuryAddress: args.treasuryAddress }
        : undefined,
  };
}
