'use client';

import { useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { getAddress } from 'viem';
import type { DonationCampaign, DonationCampaignMetadata } from '@/lib/donations/types';
import { getGatewayUrl } from '@/lib/ipfs/gateway';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { buildDonationsL1TipPlainNote } from '@/lib/donations/l1TipPayload';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { extractKaspaTransactionId } from '@/lib/kaspa/transactionId';
import { KaspaL1WalletButton } from '@/components/KaspaL1WalletButton';

interface DonationL1TipJarProps {
  campaign: DonationCampaign;
  metadata: DonationCampaignMetadata | null | undefined;
  /** From on-chain `moduleUnlocked` for the L1 Tip Jar module. */
  l1TipsModuleUnlocked: boolean;
  /** Refresh campaign / leaderboard after L2 record succeeds. */
  onTipRecorded?: () => void;
}

export function DonationL1TipJar({
  campaign,
  metadata,
  l1TipsModuleUnlocked,
  onTipRecorded,
}: DonationL1TipJarProps) {
  const { address: donorL2, isConnected: evmConnected } = useAccount();
  const { state: kaspaState } = useKaspaWallet();
  const [tipAddress, setTipAddress] = useState('');
  const [amountKas, setAmountKas] = useState('1');
  const [revealed, setRevealed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [note, setNote] = useState<string | null>(null);

  const cid = campaign.campaignIdV2?.toString();

  useEffect(() => {
    setTipAddress((campaign.l1Address ?? '').trim());
  }, [campaign.l1Address]);

  if (!l1TipsModuleUnlocked || !cid) return null;

  const gift = metadata?.l1TipGift;
  const giftOn = Boolean(gift?.enabled && gift?.value?.trim());

  const minKas = Math.max(0.001, parseFloat(amountKas) || 0);

  const handleSendTip = async () => {
    setErr(null);
    setNote(null);
    if (!donorL2) {
      setErr('Connect your Igra (EVM) wallet so the tip can be tied to your donor profile and leaderboard points.');
      return;
    }
    if (!kaspaState.isConnected || !kaspaState.provider || !kaspaState.address) {
      setErr('Connect your Kaspa wallet to send KAS on L1.');
      return;
    }
    let destDisplay: string;
    try {
      destDisplay = normalizeKaspaAddress(tipAddress.trim());
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Invalid Kaspa address');
      return;
    }
    if (!Number.isFinite(minKas) || minKas < 0.001) {
      setErr('Enter an amount of at least 0.001 KAS.');
      return;
    }

    let donorChecksum: `0x${string}`;
    try {
      donorChecksum = getAddress(donorL2);
    } catch {
      setErr('Invalid EVM wallet address.');
      return;
    }

    const plainNote = buildDonationsL1TipPlainNote(cid, donorChecksum.toLowerCase() as `0x${string}`);
    const sompi = kasToSompi(minKas);

    setBusy(true);
    try {
      const txRes = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: destDisplay,
        amount: String(sompi),
        note: plainNote,
      });
      if (txRes.status === 'failed' || !txRes.txHash) {
        throw new Error(txRes.error ?? 'Kaspa transaction was rejected or failed');
      }
      const hashKaspa = extractKaspaTransactionId(txRes.txHash) ?? txRes.txHash.replace(/^0x/i, '').toLowerCase();

      setNote('Tip submitted. Recording on Igra for points…');
      let lastErr: string | null = null;
      for (let attempt = 0; attempt < 12; attempt++) {
        try {
          const res = await fetch('/api/donations/l1-tip/record', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              txHash: hashKaspa,
              campaignId: cid,
              donorL2: donorChecksum,
              tipToKaspaAddress: tipAddress.trim(),
              minAmountKas: minKas,
              payerKaspaAddress: kaspaState.address,
            }),
          });
          const j = (await res.json()) as {
            ok?: boolean;
            recorded?: boolean;
            verified?: boolean;
            error?: string;
            message?: string;
            l2TxHash?: string;
          };
          if (j.ok && j.recorded) {
            setNote(j.l2TxHash ? `Recorded on Igra. Tx: ${j.l2TxHash.slice(0, 14)}…` : 'Recorded on Igra. Points will update shortly.');
            onTipRecorded?.();
            break;
          }
          if (j.ok && j.verified && !j.recorded) {
            setNote(j.message ?? 'Tip verified on Kaspa; L2 recording is not configured on the server.');
            onTipRecorded?.();
            break;
          }
          if (!j.ok) {
            lastErr = j.error ?? 'Recording failed';
            const low = (lastErr || '').toLowerCase();
            if (low.includes('not found') || low.includes('indexer')) {
              lastErr = null;
            } else {
              break;
            }
          }
        } catch {
          lastErr = attempt < 11 ? null : 'Could not reach the server.';
        }
        if (attempt < 11) await new Promise((r) => setTimeout(r, 1600 + attempt * 300));
      }
      if (lastErr) throw new Error(lastErr);
    } catch (e) {
      setErr(e instanceof Error ? e.message : 'Tip failed');
      setNote(null);
    } finally {
      setBusy(false);
    }
  };

  const payDisabled =
    busy || !evmConnected || !donorL2 || !kaspaState.isConnected || !kaspaState.provider || !tipAddress.trim();

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/25 p-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">L1 Tip Jar</h3>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
        Send KAS on Kaspa L1. The memo binds this tip to your EVM wallet for leaderboard points. Tips do <strong>not</strong> count toward the L2 escrow goal.
      </p>

      <div className="space-y-3">
        <div>
          <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Kaspa tip address</label>
          <input
            type="text"
            value={tipAddress}
            onChange={(e) => setTipAddress(e.target.value)}
            placeholder="kaspa:…"
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm font-mono"
          />
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-1">
            Defaults to this campaign’s on-chain L1 address. It must match on-chain to record points.
          </p>
        </div>
        <div>
          <label className="block text-[11px] font-medium text-zinc-600 dark:text-zinc-400 mb-1">Amount (KAS)</label>
          <input
            type="number"
            value={amountKas}
            onChange={(e) => setAmountKas(e.target.value)}
            min={0.001}
            step="any"
            className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
          />
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <span className="text-xs text-zinc-600 dark:text-zinc-400">Kaspa</span>
          <KaspaL1WalletButton />
        </div>
        {!evmConnected && <p className="text-xs text-amber-800 dark:text-amber-200">Connect your EVM wallet (same network as vDonate / Igra).</p>}
        <button
          type="button"
          disabled={payDisabled}
          onClick={() => void handleSendTip()}
          className="w-full px-4 py-3 rounded-lg bg-amber-600 text-white font-medium hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {busy ? 'Working…' : `Send ${Number.isFinite(minKas) ? minKas : '…'} KAS & record points`}
        </button>
      </div>

      {err ? <p className="text-xs text-red-600 dark:text-red-400 mt-2">{err}</p> : null}
      {note ? <p className="text-xs text-emerald-800 dark:text-emerald-300 mt-2">{note}</p> : null}

      {giftOn && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 mt-4">
          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mb-1">{gift?.label?.trim() || 'Creator gift'}</p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
            The creator may share a thank-you link or note after you donate on L1 (honor system - not locked by the app).
          </p>
          {!revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="text-sm font-medium text-amber-800 dark:text-amber-300 hover:underline"
            >
              I donated on L1 - reveal gift
            </button>
          ) : (
            <div className="kx-body space-y-2">
              {gift?.type === 'text' && <p className="whitespace-pre-wrap">{gift.value}</p>}
              {gift?.type === 'url' && gift.value && (
                <a href={gift.value} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 break-all hover:underline">
                  {gift.value}
                </a>
              )}
              {gift?.type === 'ipfs' && gift.value && (
                <a href={getGatewayUrl(gift.value)} target="_blank" rel="noopener noreferrer" className="text-emerald-600 dark:text-emerald-400 break-all hover:underline">
                  Open via IPFS gateway
                </a>
              )}
              {!gift?.type && gift?.value && <p className="whitespace-pre-wrap">{gift.value}</p>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
