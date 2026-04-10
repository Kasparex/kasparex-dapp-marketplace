'use client';

import { useState } from 'react';
import type { DonationCampaign, DonationCampaignMetadata } from '@/lib/donations/types';
import { getGatewayUrl } from '@/lib/ipfs/gateway';

interface DonationL1TipJarProps {
  campaign: DonationCampaign;
  metadata: DonationCampaignMetadata | null | undefined;
}

export function DonationL1TipJar({ campaign, metadata }: DonationL1TipJarProps) {
  const [revealed, setRevealed] = useState(false);
  const addr = campaign.l1Address?.trim();
  if (!addr) return null;

  const gift = metadata?.l1TipGift;
  const giftOn = Boolean(gift?.enabled && gift?.value?.trim());

  return (
    <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/25 p-4">
      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Kaspa L1 tips (optional)</h3>
      <p className="text-xs text-zinc-600 dark:text-zinc-400 mb-3">
        Send KAS on Layer 1 to support the creator. These tips do <strong>not</strong> count toward the L2 escrow goal or progress bar; they are extra support and still earn points when recorded on-chain.
      </p>
      <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3 mb-3">
        <p className="text-[11px] uppercase tracking-wide text-zinc-500 dark:text-zinc-400 mb-1">Tip address</p>
        <p className="text-sm font-mono text-zinc-800 dark:text-zinc-200 break-all">{addr}</p>
        <button
          type="button"
          onClick={() => void navigator.clipboard.writeText(addr)}
          className="mt-2 text-xs font-medium text-amber-800 dark:text-amber-300 hover:underline"
        >
          Copy address
        </button>
      </div>
      {giftOn && (
        <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 p-3">
          <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 mb-1">
            {gift?.label?.trim() || 'Creator gift'}
          </p>
          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mb-2">
            The creator may share a thank-you link or note after you donate on L1 (honor system — not locked by the app).
          </p>
          {!revealed ? (
            <button
              type="button"
              onClick={() => setRevealed(true)}
              className="text-sm font-medium text-amber-800 dark:text-amber-300 hover:underline"
            >
              I donated on L1 — reveal gift
            </button>
          ) : (
            <div className="text-sm text-zinc-700 dark:text-zinc-300 space-y-2">
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
