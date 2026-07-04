'use client';

import { useState } from 'react';
import type { Token } from '@/lib/tokens/types';
import {
  getListingVoteForWallet,
  getListingVoteScore,
  saveListingVote,
  type TokenListingVote,
} from '@/lib/tokens/votes';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useAccount } from 'wagmi';
import { Tooltip } from '@/components/ui/Tooltip';

type TokenVoteControlsProps = {
  token: Token;
  compact?: boolean;
};

export function TokenVoteControls({ token, compact = false }: TokenVoteControlsProps) {
  const { state: kaspaState } = useKaspaWallet();
  const { address: evmAddress } = useAccount();
  const wallet = kaspaState.address || (evmAddress ? `evm:${evmAddress}` : null);

  const [tick, setTick] = useState(0);
  const score = getListingVoteScore(token.id) + tick * 0;
  const currentVote = wallet ? getListingVoteForWallet(token.id, wallet) : null;

  const castVote = (vote: TokenListingVote) => {
    if (!wallet) return;
    if (currentVote === vote) return;
    saveListingVote({
      tokenId: token.id,
      wallet,
      vote,
      votedAt: new Date().toISOString(),
    });
    setTick((t) => t + 1);
  };

  const btnClass = (active: boolean) =>
    `rounded-lg border px-2 py-1 text-xs font-bold transition ${
      active
        ? 'border-[#02abb8] bg-[#02abb8]/15 text-[#02abb8]'
        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
    }`;

  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'mt-1'}`}>
      <Tooltip content={wallet ? 'Upvote this token' : 'Connect wallet to vote'}>
        <button
          type="button"
          aria-label="Upvote"
          disabled={!wallet}
          onClick={() => castVote('up')}
          className={btnClass(currentVote === 'up')}
        >
          ▲
        </button>
      </Tooltip>
      <span className="min-w-[1.5rem] text-center text-xs font-bold tabular-nums text-zinc-600 dark:text-zinc-300">
        {score}
      </span>
      <Tooltip content={wallet ? 'Downvote this token' : 'Connect wallet to vote'}>
        <button
          type="button"
          aria-label="Downvote"
          disabled={!wallet}
          onClick={() => castVote('down')}
          className={btnClass(currentVote === 'down')}
        >
          ▼
        </button>
      </Tooltip>
    </div>
  );
}
