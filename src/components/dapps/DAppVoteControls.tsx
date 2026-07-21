'use client';

import { useState } from 'react';
import type { DApp } from '@/lib/dapps';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { Tooltip } from '@/components/ui/Tooltip';
import { resolveDAppAuthor } from '@/lib/dapps/deployer';

export type DAppListingVote = 'up' | 'down';

type DAppListingVoteRecord = {
  dappId: string;
  wallet: string;
  vote: DAppListingVote;
  votedAt: string;
  txHash?: string;
};

const DAPP_LISTING_VOTE_KEY = 'dapps_listing_votes';
const DAPP_LISTING_VOTE_FEE_KAS = 1;

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function getVotes(dappId: string): DAppListingVoteRecord[] {
  if (typeof window === 'undefined') return [];
  const all = safeParse<DAppListingVoteRecord[]>(localStorage.getItem(DAPP_LISTING_VOTE_KEY), []);
  return all.filter((v) => v.dappId === dappId && Boolean(v.txHash?.trim()));
}

function getVoteForWallet(dappId: string, wallet: string): DAppListingVote | null {
  const key = wallet.toLowerCase();
  const match = getVotes(dappId).find((v) => v.wallet.toLowerCase() === key);
  return match?.vote ?? null;
}

function getScore(dappId: string): number {
  return getVotes(dappId).reduce((sum, v) => sum + (v.vote === 'up' ? 1 : -1), 0);
}

function saveVote(record: DAppListingVoteRecord): void {
  if (typeof window === 'undefined' || !record.wallet || !record.txHash?.trim()) return;
  const key = record.wallet.toLowerCase();
  const all = safeParse<DAppListingVoteRecord[]>(localStorage.getItem(DAPP_LISTING_VOTE_KEY), []);
  const next = all.filter((v) => !(v.dappId === record.dappId && v.wallet.toLowerCase() === key));
  next.push({ ...record, wallet: key, txHash: record.txHash.trim() });
  localStorage.setItem(DAPP_LISTING_VOTE_KEY, JSON.stringify(next));
}

export function DAppVoteControls({ dapp, compact = false }: { dapp: DApp; compact?: boolean }) {
  const { state: kaspaState } = useKaspaWallet();
  const wallet = kaspaState.address?.trim() || null;
  const author = resolveDAppAuthor(dapp);
  const creatorWallet = author.wallet?.trim() || null;
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  const score = getScore(dapp.id) + tick * 0;
  const currentVote = wallet ? getVoteForWallet(dapp.id, wallet) : null;

  if (!creatorWallet) return null;

  const voteHint = `Vote with KAS to support this dApp. Payment goes to the creator wallet (${DAPP_LISTING_VOTE_FEE_KAS} KAS per vote).`;

  const castVote = async (vote: DAppListingVote) => {
    if (!wallet || !kaspaState.provider || !kaspaState.isConnected) return;
    if (busy || currentVote === vote) return;

    setBusy(true);
    try {
      const result = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: creatorWallet.replace(/^kaspa:/, ''),
        amount: String(kasToSompi(DAPP_LISTING_VOTE_FEE_KAS)),
        note: `DApp vote:${vote}:${dapp.slug || dapp.name}`,
      });
      if (result.status === 'failed' || !result.txHash) {
        throw new Error(result.error ?? 'KAS vote payment failed');
      }
      saveVote({
        dappId: dapp.id,
        wallet,
        vote,
        votedAt: new Date().toISOString(),
        txHash: result.txHash,
      });
      setTick((n) => n + 1);
    } catch (error) {
      console.error('[DAppVoteControls] vote failed', error);
    } finally {
      setBusy(false);
    }
  };

  const btnClass = (active: boolean) =>
    `rounded-lg border px-2 py-1 text-xs font-bold transition disabled:opacity-50 ${
      active
        ? 'border-[#02abb8] bg-[#02abb8]/15 text-[#02abb8]'
        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
    }`;

  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'mt-1'}`}>
      <Tooltip content={wallet ? voteHint : 'Connect your Kaspa wallet to vote with KAS'}>
        <button
          type="button"
          aria-label="Upvote"
          disabled={!wallet || busy}
          onClick={() => void castVote('up')}
          className={btnClass(currentVote === 'up')}
        >
          ▲
        </button>
      </Tooltip>
      <span className="min-w-[1.5rem] text-center text-xs font-bold tabular-nums text-zinc-600 dark:text-zinc-300">
        {score}
      </span>
      <Tooltip content={wallet ? voteHint : 'Connect your Kaspa wallet to vote with KAS'}>
        <button
          type="button"
          aria-label="Downvote"
          disabled={!wallet || busy}
          onClick={() => void castVote('down')}
          className={btnClass(currentVote === 'down')}
        >
          ▼
        </button>
      </Tooltip>
    </div>
  );
}
