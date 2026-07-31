'use client';

import { useState } from 'react';
import type { DApp } from '@/lib/dapps';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { resolveDAppAuthor } from '@/lib/dapps/deployer';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import {
  buildCreatorPlatformPlan,
  getHubTreasuryAddress,
  HUB_PAYMENT_MIN_LEG_KAS,
} from '@/lib/payments/paymentPlan';
import { getKasparexGamesAuthorWallet } from '@/lib/games/author';

export type DAppListingVote = 'up' | 'down';

type DAppListingVoteRecord = {
  dappId: string;
  wallet: string;
  vote: DAppListingVote;
  votedAt: string;
  txHash?: string;
};

const DAPP_LISTING_VOTE_KEY = 'dapps_listing_votes';
const DAPP_LISTING_VOTE_AUTHOR_KAS = HUB_PAYMENT_MIN_LEG_KAS;
const DAPP_LISTING_VOTE_PLATFORM_KAS = HUB_PAYMENT_MIN_LEG_KAS;
const DAPP_LISTING_VOTE_FEE_KAS = DAPP_LISTING_VOTE_AUTHOR_KAS + DAPP_LISTING_VOTE_PLATFORM_KAS;

const VOTE_TOOLTIP = `Vote with KAS. Payment goes to the author's wallet with a Hub payment split. Change returns to your wallet. (${DAPP_LISTING_VOTE_FEE_KAS} KAS per vote)`;
const CONNECT_TOOLTIP = 'Connect your Kaspa wallet to vote with KAS';

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

function isKaspaPayee(address: string): boolean {
  const t = address.trim().toLowerCase();
  if (!t || t.startsWith('0x')) return false;
  return t.startsWith('kaspa:') || t.startsWith('kaspatest:') || t.length >= 48;
}

function resolveVoteAuthorPayee(authorWallet: string): string {
  if (isKaspaPayee(authorWallet)) return authorWallet.trim();
  return getHubTreasuryAddress().trim() || getKasparexGamesAuthorWallet();
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

  const castVote = async (vote: DAppListingVote) => {
    if (!wallet || !kaspaState.provider || !kaspaState.isConnected) return;
    if (busy || currentVote === vote) return;

    setBusy(true);
    try {
      const authorPayee = resolveVoteAuthorPayee(creatorWallet);
      const platformAddress = getHubTreasuryAddress().trim() || getKasparexGamesAuthorWallet();
      const plan = buildCreatorPlatformPlan({
        creatorAddress: authorPayee,
        creatorKas: DAPP_LISTING_VOTE_AUTHOR_KAS,
        creatorLabel: 'Author',
        platformKas: DAPP_LISTING_VOTE_PLATFORM_KAS,
        platformAddress,
        note: `DApp vote:${vote}:${dapp.slug || dapp.name}`,
      });
      const result = await payKasPaymentPlan(
        kaspaState.provider as KaspaWalletProvider,
        plan,
        wallet,
      );
      if (!result.txHash) {
        throw new Error('KAS vote payment failed');
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
      <Tooltip content={wallet ? VOTE_TOOLTIP : CONNECT_TOOLTIP}>
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
      <Tooltip content={wallet ? VOTE_TOOLTIP : CONNECT_TOOLTIP}>
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
