'use client';

import { useMemo, useState } from 'react';
import { useAccount } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { Tooltip } from '@/components/ui/Tooltip';
import { payKasPaymentPlan } from '@/lib/payments/kasMultiOutPay';
import {
  buildListingVotePlan,
  getHubRewardsAddress,
  HUB_PAYMENT_MIN_LEG_KAS,
  mergeSameAddressLegs,
  paymentPlanTotal,
} from '@/lib/payments/paymentPlan';
import { formatKaspaWalletError } from '@/lib/kaspa/formatWalletError';
import { hubNotify } from '@/lib/hub/notify';

export type HubListingVote = 'up' | 'down';

type LegacyIdField = 'dappId' | 'gameId' | 'tokenId';

type HubListingVoteRecord = {
  entityId: string;
  dappId?: string;
  gameId?: string;
  tokenId?: string;
  wallet: string;
  vote: HubListingVote;
  votedAt: string;
  txHash?: string;
  rail?: 'l1' | 'l2';
};

const VOTE_TOOLTIP_L2 = 'Vote anytime with your connected EVM wallet for this L2 author.';
const CONNECT_KASPA_TOOLTIP = 'Connect your Kaspa L1 wallet to vote for this L1 author.';
const CONNECT_EVM_TOOLTIP = 'Connect your EVM wallet to vote for this L2 author.';
const MISMATCH_L1_TOOLTIP =
  'This author is on Kaspa L1. Connect a Kaspa wallet to vote (EVM-only is not enough).';
const MISMATCH_L2_TOOLTIP =
  'This author is on L2. Connect an EVM wallet to vote (Kaspa-only is not enough).';

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function isEvmAddress(address: string): boolean {
  return /^0x[a-fA-F0-9]{40}$/.test(address.trim());
}

function isKaspaPayee(address: string): boolean {
  const t = address.trim().toLowerCase();
  if (!t || t.startsWith('0x')) return false;
  return t.startsWith('kaspa:') || t.startsWith('kaspatest:') || t.length >= 48;
}

function recordEntityId(raw: Record<string, unknown>): string {
  const id = raw.entityId ?? raw.dappId ?? raw.gameId ?? raw.tokenId;
  return typeof id === 'string' ? id : '';
}

function readVotes(storageKey: string, entityId: string): HubListingVoteRecord[] {
  if (typeof window === 'undefined') return [];
  const all = safeParse<Record<string, unknown>[]>(localStorage.getItem(storageKey), []);
  const out: HubListingVoteRecord[] = [];
  for (const raw of all) {
    const id = recordEntityId(raw);
    if (id !== entityId) continue;
    const wallet = typeof raw.wallet === 'string' ? raw.wallet : '';
    const vote = raw.vote === 'up' || raw.vote === 'down' ? raw.vote : null;
    if (!wallet || !vote) continue;
    const rail = raw.rail === 'l2' || raw.rail === 'l1' ? raw.rail : undefined;
    const txHash = typeof raw.txHash === 'string' ? raw.txHash.trim() : '';
    if (rail === 'l2') {
      out.push({
        entityId: id,
        wallet,
        vote,
        votedAt: typeof raw.votedAt === 'string' ? raw.votedAt : '',
        rail: 'l2',
      });
      continue;
    }
    if (!txHash) continue;
    out.push({
      entityId: id,
      wallet,
      vote,
      votedAt: typeof raw.votedAt === 'string' ? raw.votedAt : '',
      txHash,
      rail: rail ?? 'l1',
    });
  }
  return out;
}

function voteForWallet(
  storageKey: string,
  entityId: string,
  wallet: string,
): HubListingVote | null {
  const key = wallet.toLowerCase();
  const votes = readVotes(storageKey, entityId).filter((v) => v.wallet.toLowerCase() === key);
  return votes.length ? votes[votes.length - 1]!.vote : null;
}

function scoreFor(storageKey: string, entityId: string): number {
  return readVotes(storageKey, entityId).reduce((sum, v) => sum + (v.vote === 'up' ? 1 : -1), 0);
}

/** Append-only: wallets may vote unlimited times; each paid vote counts toward the score. */
function saveVote(
  storageKey: string,
  legacyIdField: LegacyIdField,
  record: HubListingVoteRecord,
  onSaved?: () => void,
): void {
  if (typeof window === 'undefined' || !record.wallet) return;
  if (record.rail !== 'l2' && !record.txHash?.trim()) return;
  const key = record.wallet.toLowerCase();
  const all = safeParse<Record<string, unknown>[]>(localStorage.getItem(storageKey), []);
  all.push({
    entityId: record.entityId,
    [legacyIdField]: record.entityId,
    wallet: key,
    vote: record.vote,
    votedAt: record.votedAt,
    txHash: record.txHash?.trim() || undefined,
    rail: record.rail,
  });
  localStorage.setItem(storageKey, JSON.stringify(all));
  onSaved?.();
}

export type HubListingVoteControlsProps = {
  entityId: string;
  storageKey: string;
  /** Persist legacy id field for older vote records. */
  legacyIdField: LegacyIdField;
  authorWallet: string;
  /** Use `{vote}` placeholder for up/down. */
  paymentNote: string;
  compact?: boolean;
  className?: string;
  activeClassName?: string;
  onVoteSaved?: () => void;
};

/**
 * Global Hub up/down vote control.
 * L1: author/treasury primary share + rewards + change (same KasWare shape everywhere).
 */
export function HubListingVoteControls({
  entityId,
  storageKey,
  legacyIdField,
  authorWallet,
  paymentNote,
  compact = false,
  className = '',
  activeClassName = 'border-[#02abb8] bg-[#02abb8]/15 text-[#02abb8]',
  onVoteSaved,
}: HubListingVoteControlsProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress, isConnected: evmConnected } = useAccount();
  const kaspaWallet = kaspaState.address?.trim() || null;
  const kaspaConnected = Boolean(kaspaState.isConnected && kaspaWallet && kaspaState.provider);
  const creatorWallet = authorWallet.trim();
  const authorIsL2 = isEvmAddress(creatorWallet);
  const authorIsL1 = isKaspaPayee(creatorWallet);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const voterWallet = authorIsL2 ? evmAddress?.trim() || null : kaspaWallet;
  const score = scoreFor(storageKey, entityId) + tick * 0;
  const currentVote = voterWallet ? voteForWallet(storageKey, entityId, voterWallet) : null;

  const voteFeeKas = useMemo(() => {
    if (!authorIsL1) return HUB_PAYMENT_MIN_LEG_KAS * 3;
    try {
      return paymentPlanTotal(
        mergeSameAddressLegs(buildListingVotePlan({ authorAddress: creatorWallet })),
      );
    } catch {
      return HUB_PAYMENT_MIN_LEG_KAS * 3;
    }
  }, [authorIsL1, creatorWallet]);

  if (!creatorWallet || (!authorIsL1 && !authorIsL2)) return null;

  const canVote = authorIsL2 ? Boolean(evmConnected && evmAddress) : kaspaConnected;

  let tooltip = `Vote with KAS anytime. One transaction: author/treasury + rewards split. Change returns to your wallet. (${voteFeeKas} KAS per vote)`;
  if (authorIsL2) {
    if (!evmConnected || !evmAddress) {
      tooltip = kaspaConnected ? MISMATCH_L2_TOOLTIP : CONNECT_EVM_TOOLTIP;
    } else {
      tooltip = VOTE_TOOLTIP_L2;
    }
  } else if (!kaspaConnected) {
    tooltip = evmConnected ? MISMATCH_L1_TOOLTIP : CONNECT_KASPA_TOOLTIP;
  }

  const castVote = async (vote: HubListingVote) => {
    if (!canVote || busy || !voterWallet) return;

    setBusy(true);
    setError(null);
    const loadingId = hubNotify.loading(
      vote === 'up' ? 'Casting upvote…' : 'Casting downvote…',
      authorIsL2 ? 'Saving vote' : 'Confirm KAS payment in your wallet',
    );
    try {
      if (authorIsL2) {
        saveVote(
          storageKey,
          legacyIdField,
          {
            entityId,
            wallet: voterWallet,
            vote,
            votedAt: new Date().toISOString(),
            rail: 'l2',
          },
          onVoteSaved,
        );
        setTick((n) => n + 1);
        hubNotify.update(loadingId, {
          title: vote === 'up' ? 'Upvote recorded' : 'Downvote recorded',
          description: 'Your vote was saved.',
          variant: 'success',
        });
        return;
      }

      if (!kaspaState.provider || !kaspaWallet) {
        throw new Error('Connect your Kaspa wallet to vote');
      }

      const plan = buildListingVotePlan({
        authorAddress: creatorWallet,
        note: paymentNote.replaceAll('{vote}', vote),
      });
      const merged = mergeSameAddressLegs(plan);
      if (merged.legs.length < 2 && getHubRewardsAddress().trim()) {
        throw new Error(
          'Vote split needs distinct treasury and rewards addresses. Check NEXT_PUBLIC_REWARDS_ADDRESS.',
        );
      }

      const result = await payKasPaymentPlan(
        kaspaState.provider as KaspaWalletProvider,
        plan,
        kaspaWallet,
      );
      if (!result.txHash) {
        throw new Error('KAS vote payment failed');
      }

      saveVote(
        storageKey,
        legacyIdField,
        {
          entityId,
          wallet: kaspaWallet,
          vote,
          votedAt: new Date().toISOString(),
          txHash: result.txHash,
          rail: 'l1',
        },
        onVoteSaved,
      );
      setTick((n) => n + 1);
      hubNotify.txSuccess({
        id: loadingId,
        title: vote === 'up' ? 'Upvote paid' : 'Downvote paid',
        description: `${voteFeeKas} KAS vote submitted`,
        txHash: result.txHash,
      });
    } catch (err) {
      const message = formatKaspaWalletError(err);
      console.error('[HubListingVoteControls] vote failed', err);
      setError(message);
      hubNotify.update(loadingId, {
        title: 'Vote failed',
        description: message,
        variant: 'error',
      });
    } finally {
      setBusy(false);
    }
  };

  const btnClass = (active: boolean) =>
    `inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg border px-2 text-xs font-bold transition disabled:opacity-50 ${
      active
        ? activeClassName
        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
    }`;

  return (
    <div className={`flex flex-col ${compact ? '' : 'mt-1'} ${className}`.trim()}>
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
        <span className="inline-flex h-7 min-w-[1.75rem] items-center justify-center rounded-lg border border-zinc-200 px-2 text-xs font-bold tabular-nums text-zinc-600 dark:border-zinc-700 dark:text-zinc-300">
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
