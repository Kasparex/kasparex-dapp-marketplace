'use client';

import { useState } from 'react';
import { useAccount } from 'wagmi';
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
  mergeSameAddressLegs,
} from '@/lib/payments/paymentPlan';
import { getKasparexGamesAuthorWallet } from '@/lib/games/author';
import { formatKaspaWalletError } from '@/lib/kaspa/formatWalletError';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { kasToSompi } from '@/lib/ads/config';

export type DAppListingVote = 'up' | 'down';

type DAppListingVoteRecord = {
  dappId: string;
  wallet: string;
  vote: DAppListingVote;
  votedAt: string;
  txHash?: string;
  rail?: 'l1' | 'l2';
};

const DAPP_LISTING_VOTE_KEY = 'dapps_listing_votes';
const DAPP_LISTING_VOTE_AUTHOR_KAS = HUB_PAYMENT_MIN_LEG_KAS;
const DAPP_LISTING_VOTE_PLATFORM_KAS = HUB_PAYMENT_MIN_LEG_KAS;
const DAPP_LISTING_VOTE_FEE_KAS = DAPP_LISTING_VOTE_AUTHOR_KAS + DAPP_LISTING_VOTE_PLATFORM_KAS;

const VOTE_TOOLTIP_L1 = `Vote with KAS. Payment goes to the author's wallet with a Hub payment split. Change returns to your wallet. (${DAPP_LISTING_VOTE_FEE_KAS} KAS per vote)`;
const VOTE_TOOLTIP_L2 = 'Vote with your connected EVM wallet for this L2 dApp author.';
const CONNECT_KASPA_TOOLTIP = 'Connect your Kaspa L1 wallet to vote for this L1 author.';
const CONNECT_EVM_TOOLTIP = 'Connect your EVM wallet to vote for this L2 author.';
const MISMATCH_L1_TOOLTIP = 'This author is on Kaspa L1. Connect a Kaspa wallet to vote (EVM-only is not enough).';
const MISMATCH_L2_TOOLTIP = 'This author is on L2. Connect an EVM wallet to vote (Kaspa-only is not enough).';

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
  return all.filter((v) => {
    if (v.dappId !== dappId) return false;
    if (v.rail === 'l2') return Boolean(v.wallet?.trim());
    return Boolean(v.txHash?.trim());
  });
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
  if (typeof window === 'undefined' || !record.wallet) return;
  if (record.rail !== 'l2' && !record.txHash?.trim()) return;
  const key = record.wallet.toLowerCase();
  const all = safeParse<DAppListingVoteRecord[]>(localStorage.getItem(DAPP_LISTING_VOTE_KEY), []);
  const next = all.filter((v) => !(v.dappId === record.dappId && v.wallet.toLowerCase() === key));
  next.push({
    ...record,
    wallet: key,
    txHash: record.txHash?.trim() || undefined,
  });
  localStorage.setItem(DAPP_LISTING_VOTE_KEY, JSON.stringify(next));
}

function isEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
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

function resolvePlatformPayee(): string {
  return getHubTreasuryAddress().trim() || getKasparexGamesAuthorWallet();
}

export function DAppVoteControls({ dapp, compact = false }: { dapp: DApp; compact?: boolean }) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const kaspaWallet = kaspaState.address?.trim() || null;
  const kaspaConnected = Boolean(kaspaState.isConnected && kaspaWallet && kaspaState.provider);
  const author = resolveDAppAuthor(dapp);
  const creatorWallet = author.wallet?.trim() || null;
  const authorIsL2 = Boolean(creatorWallet && isEvmAddress(creatorWallet));
  const authorIsL1 = Boolean(creatorWallet && isKaspaPayee(creatorWallet));
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voterWallet = authorIsL2 ? (evmAddress?.trim() || null) : kaspaWallet;
  const score = getScore(dapp.id) + tick * 0;
  const currentVote = voterWallet ? getVoteForWallet(dapp.id, voterWallet) : null;

  if (!creatorWallet || (!authorIsL1 && !authorIsL2)) return null;

  const canVote = authorIsL2 ? Boolean(evmConnected && evmAddress) : kaspaConnected;

  let tooltip = VOTE_TOOLTIP_L1;
  if (authorIsL2) {
    if (!evmConnected || !evmAddress) {
      tooltip = kaspaConnected ? MISMATCH_L2_TOOLTIP : CONNECT_EVM_TOOLTIP;
    } else {
      tooltip = VOTE_TOOLTIP_L2;
    }
  } else if (!kaspaConnected) {
    tooltip = evmConnected ? MISMATCH_L1_TOOLTIP : CONNECT_KASPA_TOOLTIP;
  }

  const castVote = async (vote: DAppListingVote) => {
    if (!canVote || busy || !voterWallet) return;
    if (currentVote === vote) return;

    setBusy(true);
    setError(null);
    try {
      if (authorIsL2) {
        saveVote({
          dappId: dapp.id,
          wallet: voterWallet,
          vote,
          votedAt: new Date().toISOString(),
          rail: 'l2',
        });
        setTick((n) => n + 1);
        return;
      }

      if (!kaspaState.provider || !kaspaWallet) {
        throw new Error('Connect your Kaspa wallet to vote');
      }

      const authorPayee = resolveVoteAuthorPayee(creatorWallet);
      const platformAddress = resolvePlatformPayee();
      const plan = mergeSameAddressLegs(
        buildCreatorPlatformPlan({
          creatorAddress: authorPayee,
          creatorKas: DAPP_LISTING_VOTE_AUTHOR_KAS,
          creatorLabel: 'Author',
          platformKas: DAPP_LISTING_VOTE_PLATFORM_KAS,
          platformAddress,
          note: `DApp vote:${vote}:${dapp.slug || dapp.name}`,
        }),
      );

      let txHash: string | undefined;

      // Fast path: one destination (common when author is Hub treasury).
      if (plan.legs.length === 1) {
        const leg = plan.legs[0]!;
        const result = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
          to: leg.address,
          amount: String(Math.floor(kasToSompi(leg.amount))),
          note: plan.note,
        });
        if (result.status === 'failed' || !result.txHash) {
          throw new Error(result.error ?? 'KAS vote payment failed');
        }
        txHash = result.txHash;
      } else {
        const result = await payKasPaymentPlan(
          kaspaState.provider as KaspaWalletProvider,
          plan,
          kaspaWallet,
        );
        if (!result.txHash) {
          throw new Error('KAS vote payment failed');
        }
        txHash = result.txHash;
      }

      saveVote({
        dappId: dapp.id,
        wallet: kaspaWallet,
        vote,
        votedAt: new Date().toISOString(),
        txHash,
        rail: 'l1',
      });
      setTick((n) => n + 1);
    } catch (err) {
      const message = formatKaspaWalletError(err);
      console.error('[DAppVoteControls] vote failed', err);
      setError(message);
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
    <div className={`flex flex-col ${compact ? '' : 'mt-1'}`}>
      <div className="flex items-center gap-1.5">
        <Tooltip content={tooltip}>
          <button
            type="button"
            aria-label="Upvote"
            disabled={!canVote || busy}
            onClick={() => void castVote('up')}
            className={btnClass(currentVote === 'up')}
          >
            ▲
          </button>
        </Tooltip>
        <span className="min-w-[1.5rem] text-center text-xs font-bold tabular-nums text-zinc-600 dark:text-zinc-300">
          {score}
        </span>
        <Tooltip content={tooltip}>
          <button
            type="button"
            aria-label="Downvote"
            disabled={!canVote || busy}
            onClick={() => void castVote('down')}
            className={btnClass(currentVote === 'down')}
          >
            ▼
          </button>
        </Tooltip>
      </div>
      {error ? (
        <p className="mt-1 max-w-[16rem] text-[10px] leading-snug text-rose-600 dark:text-rose-400">
          {error}
        </p>
      ) : null}
    </div>
  );
}
