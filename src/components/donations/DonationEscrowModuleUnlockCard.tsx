'use client';

import { useEffect, useMemo, useState } from 'react';
import { useChainId, useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { getDonationsModulesTreasuryL1Address } from '@/lib/donations/modulesConfig';
import {
  DONATION_MODULE_OFFERS,
  getDonationModulePriceKas,
  type DonationPaidModuleId,
} from '@/lib/donations/modules';
import { KREX_TIERS, type KREXTier } from '@/lib/rewards/types';
import { buildDonationsModuleUnlockPayloadHex, buildDonationsModuleUnlockPlainNote } from '@/lib/donations/modulePayload';
import { DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';
import { getErrorMessage } from '@/lib/utils';
import type { Address } from 'viem';
import { kxCrowdkasModuleHoverClasses, kxJoinClasses } from '@/lib/ui/kxListingAccent';
import { KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

export type DonationModuleOffer = (typeof DONATION_MODULE_OFFERS)[DonationPaidModuleId];

interface DonationEscrowModuleUnlockCardProps {
  offer: DonationModuleOffer;
  campaignId: bigint;
  igraEscrowV2Address: string;
  writeEscrowV2Address: Address | undefined;
  creatorEvmAddress: Address;
  isUnlocked: boolean;
  onUnlockedOnChain: () => void;
  accent?: 'emerald' | 'amber';
  className?: string;
}

export function DonationEscrowModuleUnlockCard({
  offer,
  campaignId,
  igraEscrowV2Address,
  writeEscrowV2Address,
  creatorEvmAddress,
  isUnlocked,
  onUnlockedOnChain,
  accent = 'emerald',
  className = '',
}: DonationEscrowModuleUnlockCardProps) {
  const chainId = useChainId();
  const onCrowdkasChain = chainId === CROWDKAS_CHAIN_ID;
  const { state: kaspaState } = useKaspaWallet();
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const moduleNftFlags = useMemo(
    () => ({
      hasAny: !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX ||
        Object.values(nftStatus?.partnerCollections ?? {}).some(Boolean)),
      hasDiamond: !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ||
        Object.values(nftStatus?.partnerDiamonds ?? {}).some(Boolean)),
      hasRarest: !!nftStatus?.hasRarestNFT,
    }),
    [nftStatus]
  );

  const priceKas = useMemo(
    () => getDonationModulePriceKas(offer.basePriceKas, krexBalance ?? 0, tier, moduleNftFlags),
    [offer.basePriceKas, krexBalance, tier, moduleNftFlags]
  );

  const savingsKas = Math.max(0, Math.round((offer.basePriceKas - priceKas) * 1000) / 1000);
  const tierLabel = KREX_TIERS[tier as KREXTier]?.label ?? tier;

  const krexDiscountChip =
    (krexBalance ?? 0) > 0 ? (
      <span className="px-2 py-0.5 rounded-full bg-emerald-500/15 border border-emerald-500/25 text-emerald-700 dark:text-emerald-300 text-xs font-bold uppercase tracking-wider">
        KREX · {tierLabel}
      </span>
    ) : null;

  const nftDiscountChip =
    moduleNftFlags.hasRarest || moduleNftFlags.hasDiamond || moduleNftFlags.hasAny ? (
      <span className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-700 dark:text-cyan-300 text-xs font-bold uppercase tracking-wider">
        {moduleNftFlags.hasRarest ? 'NFT · Rarest' : moduleNftFlags.hasDiamond ? 'NFT · Diamond' : 'NFT · Holder'}
      </span>
    ) : null;

  const { writeContract, data: hash, error: writeErr, isPending: isWritePending } = useWriteContract();
  const { isSuccess: isConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({
    hash,
    chainId: hash ? CROWDKAS_CHAIN_ID : undefined,
  });

  useEffect(() => {
    if (isConfirmed) {
      setNote('Module unlocked on-chain.');
      onUnlockedOnChain();
    }
  }, [isConfirmed, onUnlockedOnChain]);

  const borderClass =
    accent === 'amber'
      ? 'border-amber-300/50 dark:border-amber-600/35'
      : 'border-emerald-300/50 dark:border-emerald-600/35';
  const heroGradient =
    accent === 'amber'
      ? 'from-amber-500/30 via-zinc-100 to-zinc-50 dark:from-amber-500/18 dark:via-zinc-900 dark:to-zinc-950'
      : 'from-emerald-500/30 via-zinc-100 to-zinc-50 dark:from-emerald-500/18 dark:via-zinc-900 dark:to-zinc-950';
  const btnClass =
    accent === 'amber'
      ? '!bg-amber-600 hover:!bg-amber-700 !text-white !border-amber-500/30'
      : '!bg-emerald-600 hover:!bg-emerald-700 !text-white !border-emerald-500/30';

  const payDisabled =
    isUnlocked ||
    busy ||
    !kaspaState.isConnected ||
    !kaspaState.address ||
    !kaspaState.provider ||
    !writeEscrowV2Address ||
    !onCrowdkasChain;

  const handlePay = async () => {
    setErr(null);
    setNote(null);
    if (!writeEscrowV2Address || !kaspaState.provider || !kaspaState.address) {
      setErr('Connect your Kaspa L1 wallet (header) and use an EVM wallet on Igra for the final unlock step.');
      return;
    }
    const treasury = getDonationsModulesTreasuryL1Address();
    if (!treasury) {
      setErr('Treasury is not configured.');
      return;
    }

    setBusy(true);
    try {
      const payer = kaspaState.address;
      const sompi = kasToSompi(priceKas);
      const payloadHex = buildDonationsModuleUnlockPayloadHex(offer.id, campaignId.toString(), payer);
      const plainNote = buildDonationsModuleUnlockPlainNote(offer.id, campaignId.toString(), payer);

      const txRes = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: treasury,
        amount: String(sompi),
        note: plainNote,
        payload: payloadHex,
      });
      if (txRes.status === 'failed' || !txRes.txHash) {
        throw new Error(txRes.error ?? 'Kaspa payment was rejected or failed');
      }
      const hashKaspa = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash;

      let verifiedPayload:
        | { signature: `0x${string}`; l1TxId: `0x${string}`; paidAmountWei: string; moduleIdBytes32: `0x${string}` }
        | null = null;
      let lastMsg: string | null = null;
      for (let attempt = 0; attempt < 10; attempt++) {
        try {
          const vr = await fetch('/api/donations/modules/verify', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txHash: hashKaspa,
              moduleId: offer.id,
              campaignId: campaignId.toString(),
              payerAddress: payer,
              basePriceKas: priceKas,
              escrowV2Address: igraEscrowV2Address,
              creatorAddress: creatorEvmAddress,
            }),
          });
          const vj = (await vr.json()) as
            | { ok?: true; signature: `0x${string}`; l1TxId: `0x${string}`; paidAmountWei: string; moduleIdBytes32: `0x${string}` }
            | { ok?: false; error?: string };
          if ('ok' in vj && vj.ok) {
            verifiedPayload = {
              signature: vj.signature,
              l1TxId: vj.l1TxId,
              paidAmountWei: vj.paidAmountWei,
              moduleIdBytes32: vj.moduleIdBytes32,
            };
            lastMsg = null;
            break;
          }
          const msg = ((vj as { error?: string }).error ?? '').toLowerCase();
          const indexing = msg.includes('not found');
          if (!indexing) {
            lastMsg = (vj as { error?: string }).error ?? 'Verification failed.';
            break;
          }
          lastMsg = attempt < 9 ? 'Waiting for the network indexer…' : (vj as { error?: string }).error ?? 'Still not indexed; retry shortly.';
        } catch {
          lastMsg = attempt < 9 ? 'Waiting for verification…' : 'Could not reach the server.';
        }
        if (attempt < 9) {
          await new Promise((r) => setTimeout(r, 1400 + attempt * 400));
        }
      }

      if (!verifiedPayload) {
        throw new Error(lastMsg || 'Payment sent but not verified yet.');
      }

      setNote('Confirm the Igra transaction in your EVM wallet to finish unlocking on-chain.');
      writeContract({
        address: writeEscrowV2Address,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'unlockModule',
        args: [
          campaignId,
          verifiedPayload.moduleIdBytes32,
          verifiedPayload.l1TxId,
          BigInt(verifiedPayload.paidAmountWei),
          verifiedPayload.signature,
        ],
      });
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Unlock failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div
      className={kxJoinClasses(
        'kx-listing-card overflow-hidden rounded-xl border bg-white/95 dark:bg-zinc-900/80 shadow-kx-card flex flex-col transition-all duration-200',
        borderClass,
        kxCrowdkasModuleHoverClasses(accent),
        isUnlocked ? 'ring-1 ring-emerald-500/25' : '',
        className,
      )}
      data-kx-accent={accent === 'amber' ? 'crowdkas-amber' : 'crowdkas'}
    >
      <KxListingCardMedia aspectClass="aspect-[16/9]">
        <div
          className={`absolute inset-0 bg-gradient-to-br ${heroGradient} flex flex-col items-center justify-center px-4 text-center`}
        >
          <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2">
            {isUnlocked ? 'Unlocked' : 'CrowdKAS module'}
          </p>
          <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">{offer.title}</h3>
        </div>
      </KxListingCardMedia>
      <KxListingCardBody comfortable className="space-y-3 flex-1 min-h-0">
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">{offer.description}</p>
        {!isUnlocked && (
          <>
            <div className="mt-1 space-y-2">
              <div className="flex items-baseline gap-3 flex-wrap">
                <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">{priceKas} KAS</span>
                {savingsKas > 0 ? (
                  <span className="text-sm font-mono text-zinc-400 line-through tabular-nums">{offer.basePriceKas} KAS</span>
                ) : (
                  <span className="text-sm font-mono text-zinc-500">Kaspa L1 → treasury</span>
                )}
              </div>
              {(krexDiscountChip || nftDiscountChip) && (
                <div className="flex flex-wrap gap-2">
                  {krexDiscountChip}
                  {nftDiscountChip}
                </div>
              )}
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Pay on Kaspa (L1) to the configured treasury; the server verifies amount and discounts match this total, then you confirm{' '}
                <code className="font-mono text-[11px]">unlockModule</code> on Igra.
              </p>
            </div>
            <button
              type="button"
              disabled={payDisabled}
              onClick={() => void handlePay()}
              className={`w-full k-control-btn justify-center mt-auto ${btnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
            >
              {isUnlocked
                ? 'Unlocked'
                : busy
                  ? 'Processing Kaspa payment…'
                  : isWritePending || isConfirming
                    ? 'Confirm on Igra…'
                    : `Pay ${priceKas} KAS & unlock`}
            </button>
          </>
        )}
        {isUnlocked && <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">Active for this campaign.</p>}
        {err ? <p className="text-sm text-red-600 dark:text-red-400">{err}</p> : null}
        {writeErr ? <p className="text-sm text-red-600 dark:text-red-400">{getErrorMessage(writeErr, 'EVM tx failed')}</p> : null}
        {note ? <p className="text-sm text-amber-800 dark:text-amber-300">{note}</p> : null}
      </KxListingCardBody>
    </div>
  );
}
