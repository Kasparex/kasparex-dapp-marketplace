'use client';

import { useState } from 'react';
import type { Token } from '@/lib/tokens/types';
import {
  getListingVoteForWallet,
  getListingVoteScore,
  saveListingVote,
  type TokenListingVote,
} from '@/lib/tokens/votes';
import { resolveTokenCreatorWallet } from '@/lib/tokens/creatorWallet';
import { TOKEN_LISTING_VOTE_FEE_KAS } from '@/lib/tokens/config';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { Tooltip } from '@/components/ui/Tooltip';

const VOTE_TOOLTIP =
  `Vote with KAS to support this token project directly. Your vote payment goes to the token creator wallet. (${TOKEN_LISTING_VOTE_FEE_KAS} KAS per vote)`;

type TokenVoteControlsProps = {
  token: Token;
  compact?: boolean;
};

export function TokenVoteControls({ token, compact = false }: TokenVoteControlsProps) {
  const { state: kaspaState } = useKaspaWallet();
  const creatorWallet = resolveTokenCreatorWallet(token);
  const wallet = kaspaState.address?.trim() || null;

  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);
  const score = getListingVoteScore(token.id) + tick * 0;
  const currentVote = wallet ? getListingVoteForWallet(token.id, wallet) : null;

  if (!creatorWallet) return null;

  const castVote = async (vote: TokenListingVote) => {
    if (!wallet || !kaspaState.provider || !kaspaState.isConnected) return;
    if (currentVote === vote || busy) return;

    setBusy(true);
    try {
      const result = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
        to: creatorWallet.replace(/^kaspa:/, ''),
        amount: String(kasToSompi(TOKEN_LISTING_VOTE_FEE_KAS)),
        note: `Token vote:${vote}:${token.symbol}`,
      });
      if (result.status === 'failed' || !result.txHash) {
        throw new Error(result.error ?? 'KAS vote payment failed');
      }
      saveListingVote({
        tokenId: token.id,
        wallet,
        vote,
        votedAt: new Date().toISOString(),
        txHash: result.txHash,
      });
      setTick((t) => t + 1);
    } catch (error) {
      console.error('[TokenVoteControls] vote failed', error);
    } finally {
      setBusy(false);
    }
  };

  const btnClass = (active: boolean) =>
    `rounded-lg border px-2 py-1 text-xs font-bold transition disabled:opacity-50 ${
      active
        ? 'border-[color:var(--hub-accent-border,#02abb8)] bg-[color:var(--hub-accent-muted,rgba(2,171,184,0.15))] text-[color:var(--hub-accent,#02abb8)]'
        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
    }`;

  const connectHint = 'Connect your Kaspa wallet to vote with KAS';

  return (
    <div className={`flex items-center gap-1.5 ${compact ? '' : 'mt-1'}`}>
      <Tooltip content={wallet ? VOTE_TOOLTIP : connectHint}>
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
      <Tooltip content={wallet ? VOTE_TOOLTIP : connectHint}>
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
