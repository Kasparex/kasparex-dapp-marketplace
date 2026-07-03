'use client';

import { useCallback, useEffect, useState } from 'react';
import { useAccount } from 'wagmi';
import { useKaspaWallet } from '@/lib/kaspa/context';
import {
  clearTokenVote,
  getNetVoteScore,
  getVoteForToken,
  saveTokenVote,
  type TokenVoteDirection,
} from '@/lib/tokens/votes';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { HubPointsEarnRow } from '@/components/hub/HubPointsEarnBadge';
import { TOKENS_ACCENT } from '@/lib/tokens/theme';

export function TokenVoteControls({
  tokenId,
  baseCommunityScore = 0,
  compact,
}: {
  tokenId: string;
  baseCommunityScore?: number;
  compact?: boolean;
}) {
  const { address: evmAddress } = useAccount();
  const { state: kaspaState } = useKaspaWallet();
  const wallet = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);

  const [netScore, setNetScore] = useState(0);
  const [userVote, setUserVote] = useState<TokenVoteDirection | null>(null);

  const refresh = useCallback(() => {
    setNetScore(getNetVoteScore(tokenId) + baseCommunityScore);
    if (wallet) {
      setUserVote(getVoteForToken(wallet, tokenId));
    } else {
      setUserVote(null);
    }
  }, [tokenId, baseCommunityScore, wallet]);

  useEffect(() => {
    refresh();
    const onStorage = (e: StorageEvent) => {
      if (e.key === 'tokens_listing_votes') refresh();
    };
    window.addEventListener('storage', onStorage);
    return () => window.removeEventListener('storage', onStorage);
  }, [refresh]);

  const handleVote = (direction: TokenVoteDirection) => {
    if (!wallet) return;
    if (userVote === direction) {
      clearTokenVote(wallet, tokenId);
    } else {
      saveTokenVote({
        tokenId,
        wallet,
        direction,
        votedAt: new Date().toISOString(),
      });
    }
    refresh();
  };

  const btnClass = compact
    ? 'p-1 rounded-md border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40'
    : 'p-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors disabled:opacity-40';

  const activeUp = userVote === 'up';
  const activeDown = userVote === 'down';

  return (
    <div className={`flex flex-col items-center gap-0.5 ${compact ? '' : 'min-w-[4rem]'}`}>
      <div className="flex items-center gap-1">
        <button
          type="button"
          onClick={() => handleVote('up')}
          disabled={!wallet}
          className={`${btnClass} ${activeUp ? '!border-[#02abb8] !bg-[#02abb8]/10 text-[#02abb8]' : 'text-zinc-500'}`}
          title={wallet ? 'Upvote' : 'Connect wallet to vote'}
          aria-label="Upvote token"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
          </svg>
        </button>
        <span
          className={`text-xs font-bold tabular-nums min-w-[1.5rem] text-center ${
            netScore > 0 ? 'text-emerald-600 dark:text-emerald-400' : netScore < 0 ? 'text-red-600 dark:text-red-400' : 'text-zinc-500'
          }`}
        >
          {netScore > 0 ? `+${netScore}` : netScore}
        </span>
        <button
          type="button"
          onClick={() => handleVote('down')}
          disabled={!wallet}
          className={`${btnClass} ${activeDown ? '!border-red-400 !bg-red-500/10 text-red-600' : 'text-zinc-500'}`}
          title={wallet ? 'Downvote' : 'Connect wallet to vote'}
          aria-label="Downvote token"
        >
          <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
          </svg>
        </button>
      </div>
      {!compact && wallet ? (
        <HubPointsEarnRow points={HUB_EARN_POINTS.tokensListingVote} className="text-[10px]" />
      ) : null}
      {!wallet && !compact ? (
        <span className="text-[10px] text-zinc-400 whitespace-nowrap">Connect to vote</span>
      ) : null}
      {compact && wallet ? (
        <span className="text-[9px] font-semibold" style={{ color: TOKENS_ACCENT }}>
          +{HUB_EARN_POINTS.tokensListingVote} pts
        </span>
      ) : null}
    </div>
  );
}
