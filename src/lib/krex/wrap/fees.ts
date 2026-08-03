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
    actionId: 'wrap',
    tier: args.tier,
  });

  return {
    lines: [
      {
        label: 'Wrap amount',
        value: `${formatPrice(amount)} ${tick}`,
      },
      {
        label: 'You receive (KCC20, 1:1)',
        value: `${formatPrice(amount)} w${tick}`,
      },
      {
        label: 'Wrap fee',
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
    infoText:
      'Pay the KAS wrap fee to Hub treasury, then send the KRC-20 to the vault. Minted KCC20 is 1:1 with your deposit once the mint watcher confirms.',
    tierLabel: KREX_TIERS[args.tier].label,
    hasKrexDiscount: discountKas > 0 && args.krexBalance >= KREX_TIERS.Tier1.minKREX,
    authoritative: true,
  };
}
