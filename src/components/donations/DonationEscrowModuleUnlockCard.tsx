'use client';

import { useEffect, useMemo, useState } from 'react';
import { useWriteContract, useWaitForTransactionReceipt } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { getDonationsModulesTreasuryL1Address } from '@/lib/donations/modulesConfig';
import { DONATION_MODULE_OFFERS, getDonationModulePriceKas, type DonationPaidModuleId } from '@/lib/donations/modules';
import { buildDonationsModuleUnlockPayloadHex, buildDonationsModuleUnlockPlainNote } from '@/lib/donations/modulePayload';
import { DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';
import { KaspaL1WalletButton } from '@/components/KaspaL1WalletButton';
import { getErrorMessage } from '@/lib/utils';
import type { Address } from 'viem';

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
}: DonationEscrowModuleUnlockCardProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { balance: krexBalance, tier } = useKREXBalance();
  const { nftStatus } = useNFTStatus();
  const [busy, setBusy] = useState(false);
  const [note, setNote] = useState<string | null>(null);
  const [err, setErr] = useState<string | null>(null);

  const moduleNftFlags = useMemo(
    () => ({
      hasAny: !!(nftStatus?.hasKREXPRIME || nftStatus?.hasPIXELKREX ||
        (nftStatus?.partnerCollections && Object.values(nftStatus.partnerCollections || {}).some(Boolean))),
      hasDiamond: !!(nftStatus?.hasDiamondKREXPRIME || nftStatus?.hasDiamondPIXELKREX ||
        (nftStatus?.partnerDiamonds && Object.values(nftStatus.partnerDiamonds || {}).some(Boolean))),
      hasRarest: !!nftStatus?.hasRarestNFT,
    }),
    [nftStatus]
  );

  const priceKas = useMemo(
    () => getDonationModulePriceKas(offer.basePriceKas, krexBalance ?? 0, tier, moduleNftFlags),
    [offer.basePriceKas, krexBalance, tier, moduleNftFlags]
  );

  const { writeContract, data: hash, error: writeErr, isPending: isWritePending } = useWriteContract();
  const { isSuccess: isConfirmed, isLoading: isConfirming } = useWaitForTransactionReceipt({ hash });

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
  const headerClass =
    accent === 'amber'
      ? 'from-zinc-100 via-zinc-50 to-amber-500/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-amber-950/35'
      : 'from-zinc-100 via-zinc-50 to-emerald-500/10 dark:from-zinc-900 dark:via-zinc-950 dark:to-emerald-950/35';
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
    !writeEscrowV2Address;

  const handlePay = async () => {
    setErr(null);
    setNote(null);
    if (!writeEscrowV2Address || !kaspaState.provider || !kaspaState.address) {
      setErr('Connect your Kaspa L1 wallet and use an EVM wallet on Igra for the final unlock step.');
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
      className={`rounded-2xl border bg-white/95 dark:bg-zinc-900/80 overflow-hidden flex flex-col ${borderClass} ${
        isUnlocked ? 'ring-1 ring-emerald-500/25' : ''
      }`}
    >
      <div
        className={`h-16 bg-gradient-to-br ${headerClass} border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-center px-3`}
      >
        <span className="text-[10px] font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
          {isUnlocked ? 'Unlocked on-chain' : 'Kaspa L1 payment'}
        </span>
      </div>
      <div className="p-3 space-y-2">
        <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{offer.title}</p>
        <p className="text-xs text-zinc-600 dark:text-zinc-400">{offer.description}</p>
        {!isUnlocked && (
          <>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
              {priceKas} KAS
              {priceKas < offer.basePriceKas ? (
                <span className="text-xs font-normal text-zinc-500 dark:text-zinc-400 ml-1">
                  (list {offer.basePriceKas} KAS)
                </span>
              ) : null}
            </p>
            <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
              Pay from Kaspa (same flow as vBlog vault modules). Then confirm one transaction on Igra with your EVM wallet.
            </p>
            <div className="flex flex-wrap items-center gap-2 py-1">
              <span className="text-xs text-zinc-600 dark:text-zinc-400">Kaspa wallet</span>
              <KaspaL1WalletButton />
            </div>
            <button
              type="button"
              disabled={payDisabled}
              onClick={() => void handlePay()}
              className={`w-full k-control-btn justify-center ${btnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
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
        {isUnlocked && <p className="text-xs font-semibold text-emerald-700 dark:text-emerald-300">Active for this campaign.</p>}
        {err ? <p className="text-xs text-red-600 dark:text-red-400">{err}</p> : null}
        {writeErr ? <p className="text-xs text-red-600 dark:text-red-400">{getErrorMessage(writeErr, 'EVM tx failed')}</p> : null}
        {note ? <p className="text-xs text-amber-800 dark:text-amber-300">{note}</p> : null}
      </div>
    </div>
  );
}
