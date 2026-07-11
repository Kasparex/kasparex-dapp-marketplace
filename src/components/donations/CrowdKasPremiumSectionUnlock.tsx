'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { getAddress } from 'viem';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { usePricingSnapshot } from '@/hooks/usePricingSnapshot';
import { getVBlogModuleDiscountPercent } from '@/lib/vblog/modules';
import { splitAuthorKasByPercent } from '@/lib/vblog/paymentSplit';
import type { DonationCampaign, DonationCampaignMetadata } from '@/lib/donations/types';
import {
  buildCrowdKasPremiumUnlockPlainNote,
  grantCrowdKasPremiumUnlock,
  hasCrowdKasPremiumUnlock,
  resolveCrowdKasPremiumPayoutSplits,
} from '@/lib/donations/premiumSection';
import { CrowdKasPremiumSectionGate } from '@/components/donations/CrowdKasPremiumSectionGate';
import { buildKasKrexCurrencyOptions } from '@/lib/payments/hubPaymentTypes';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';

export function CrowdKasPremiumSectionUnlock({
  campaign,
  metadata,
  creatorKaspaAddress,
  onDonationRecorded,
}: {
  campaign: DonationCampaign;
  metadata: DonationCampaignMetadata | null | undefined;
  creatorKaspaAddress?: string;
  onDonationRecorded?: () => void;
}) {
  const modules = metadata?.modules;
  const enabled = Boolean(modules?.premiumSectionEnabled && modules?.premiumSectionContent?.trim());
  const listPriceKas = modules?.premiumSectionPriceKas ?? 0;
  const campaignId = campaign.campaignIdV2?.toString() ?? '';

  const { address: donorL2 } = useAccount();
  const { state: kaspaState } = useKaspaWallet();
  const { tier, balance: krexBalance } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const { snapshot: pricingSnapshot } = usePricingSnapshot(['KREX']);

  const [premiumCurrency, setPremiumCurrency] = useState('KAS');
  const [isProcessing, setIsProcessing] = useState(false);
  const [refreshTick, setRefreshTick] = useState(0);

  const discountPercent = getVBlogModuleDiscountPercent(tier);
  const effectivePriceKas =
    listPriceKas > 0 ? Math.max(0, listPriceKas * (1 - discountPercent / 100)) : listPriceKas;

  const payerWallets = useMemo(() => {
    const rows: string[] = [];
    if (kaspaState.address?.trim()) rows.push(kaspaState.address.trim());
    return rows;
  }, [kaspaState.address]);

  const unlocked = useMemo(() => {
    if (!campaignId) return false;
    return payerWallets.some((w) => hasCrowdKasPremiumUnlock(campaignId, w));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [campaignId, payerWallets, refreshTick]);

  const payoutSplits = useMemo(
    () => resolveCrowdKasPremiumPayoutSplits(modules, creatorKaspaAddress ?? campaign.l1Address ?? ''),
    [campaign.l1Address, creatorKaspaAddress, modules],
  );

  const paymentCurrencies = useMemo(() => buildKasKrexCurrencyOptions().map((c) => c.id), []);

  const handleUnlock = useCallback(async () => {
    if (!campaignId || !donorL2 || !kaspaState.isConnected || !kaspaState.provider || !kaspaState.address) return;
    if (listPriceKas <= 0 || effectivePriceKas <= 0) return;

    let donorChecksum: `0x${string}`;
    try {
      donorChecksum = getAddress(donorL2);
    } catch {
      return;
    }

    const payerAddress = normalizeKaspaAddress(kaspaState.address);
    const authorSplits = splitAuthorKasByPercent(effectivePriceKas, payoutSplits);
    if (authorSplits.length === 0) return;

    const plainNote = buildCrowdKasPremiumUnlockPlainNote({
      campaignId,
      payerAddress,
      amountKas: effectivePriceKas,
    });

    setIsProcessing(true);
    try {
      let primaryTxHash = '';
      for (const split of authorSplits) {
        const txRes = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
          to: split.address,
          amount: String(kasToSompi(split.kas)),
          note: plainNote,
        });
        if (txRes.status === 'failed' || !txRes.txHash) {
          throw new Error(txRes.error ?? 'Kaspa transaction was rejected or failed');
        }
        primaryTxHash = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash.replace(/^0x/i, '').toLowerCase();
      }

      const destForRecord = authorSplits[0]?.address ?? campaign.l1Address?.trim();
      if (destForRecord) {
        for (let attempt = 0; attempt < 12; attempt++) {
          try {
            const res = await fetch('/api/donations/l1-tip/record', {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                txHash: primaryTxHash,
                campaignId,
                donorL2: donorChecksum,
                tipToKaspaAddress: destForRecord,
                minAmountKas: effectivePriceKas,
                payerKaspaAddress: kaspaState.address,
              }),
            });
            const j = (await res.json()) as { ok?: boolean; recorded?: boolean; verified?: boolean; error?: string };
            if (j.ok && (j.recorded || j.verified)) break;
            if (!j.ok && !(j.error ?? '').toLowerCase().includes('not found')) break;
          } catch {
            /* retry */
          }
          if (attempt < 11) await new Promise((r) => setTimeout(r, 1600 + attempt * 300));
        }
      }

      grantCrowdKasPremiumUnlock(campaignId, payerAddress);
      appendHubActivityEarn({
        walletRaw: payerAddress,
        source: 'vblog_premium_unlock',
        redeemableDelta: HUB_EARN_POINTS.vblogPremiumUnlock,
        krexBalance: krexBalance ?? 0,
        idempotencyKey: `crowdkas:premium:${campaignId}:${primaryTxHash}`,
        meta: { campaignId },
      });
      setRefreshTick((x) => x + 1);
      onDonationRecorded?.();
    } finally {
      setIsProcessing(false);
    }
  }, [
    campaign.l1Address,
    campaignId,
    donorL2,
    effectivePriceKas,
    kaspaState.address,
    kaspaState.isConnected,
    kaspaState.provider,
    krexBalance,
    listPriceKas,
    onDonationRecorded,
    payoutSplits,
  ]);

  useEffect(() => {
    if (!enabled || !campaignId) return;
    const onStorage = (e: StorageEvent) => {
      if (e.key?.includes('crowdkas_premium_unlocks')) setRefreshTick((x) => x + 1);
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [campaignId, enabled]);

  if (!enabled || !campaignId || listPriceKas <= 0) return null;

  return (
    <CrowdKasPremiumSectionGate
      unlocked={unlocked}
      previewHtml={modules?.premiumSectionContent ?? ''}
      listPriceKas={listPriceKas}
      effectivePriceKas={effectivePriceKas}
      discountPercent={discountPercent}
      hubPointsBase={HUB_EARN_POINTS.vblogPremiumUnlock}
      tier={tier}
      isProcessing={isProcessing}
      isWalletConnected={kaspaState.isConnected && Boolean(donorL2)}
      payoutSplits={payoutSplits}
      paymentCurrencies={paymentCurrencies}
      selectedCurrency={premiumCurrency}
      onCurrencyChange={setPremiumCurrency}
      pricingSnapshot={pricingSnapshot}
      onUnlock={() => void handleUnlock()}
    />
  );
}
