'use client';

import { useEffect, useState } from 'react';
import type { Game } from '@/lib/games/games';
import {
  GAME_LISTING_VOTE_FEE_KAS,
  GAMES_LISTING_VOTES_CHANGED_EVENT,
  getGameListingVoteForWallet,
  getGameListingVoteScore,
  saveGameListingVote,
  type GameListingVote,
} from '@/lib/games/votes';
import { listGames } from '@/lib/games/registry';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { kasToSompi } from '@/lib/ads/config';
import { Tooltip } from '@/components/ui/Tooltip';

type GameVoteControlsProps = {
  game: Pick<Game, 'id' | 'name' | 'slug'>;
  className?: string;
};

function resolveVoteTreasury(gameId: string): string | null {
  const g = listGames().find((x) => x.id === gameId);
  const fromSku = g?.skus?.find((s) => s.kasTreasuryAddress?.trim())?.kasTreasuryAddress?.trim();
  const fromEnv = (process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS || '').trim();
  return fromSku || fromEnv || null;
}

export function GameVoteControls({ game, className = '' }: GameVoteControlsProps) {
  const { state: kaspaState } = useKaspaWallet();
  const wallet = kaspaState.address?.trim() || null;
  const treasury = resolveVoteTreasury(game.id);
  const [tick, setTick] = useState(0);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    const onChange = () => setTick((t) => t + 1);
    window.addEventListener(GAMES_LISTING_VOTES_CHANGED_EVENT, onChange);
    return () => window.removeEventListener(GAMES_LISTING_VOTES_CHANGED_EVENT, onChange);
  }, []);

  void tick;
  const score = getGameListingVoteScore(game.id);
  const currentVote = wallet ? getGameListingVoteForWallet(game.id, wallet) : null;

  const castVote = async (vote: GameListingVote) => {
    if (!wallet || !kaspaState.isConnected || busy) return;
    if (currentVote === vote) return;

    setBusy(true);
    try {
      let txHash: string | undefined;
      if (treasury && kaspaState.provider) {
        const result = await sendKaspaTransaction(kaspaState.provider as KaspaWalletProvider, {
          to: treasury.replace(/^kaspa:/, ''),
          amount: String(kasToSompi(GAME_LISTING_VOTE_FEE_KAS)),
          note: `Game vote:${vote}:${game.slug || game.id}`,
        });
        if (result.status === 'failed' || !result.txHash) {
          throw new Error(result.error ?? 'KAS vote payment failed');
        }
        txHash = result.txHash;
      }

      saveGameListingVote({
        gameId: game.id,
        wallet,
        vote,
        votedAt: new Date().toISOString(),
        txHash,
      });
      setTick((t) => t + 1);
    } catch (error) {
      console.error('[GameVoteControls] vote failed', error);
    } finally {
      setBusy(false);
    }
  };

  const btnClass = (active: boolean) =>
    `rounded-lg border px-2 py-1 text-xs font-bold transition disabled:opacity-50 ${
      active
        ? 'border-[color:var(--hub-accent-border,#10b981)] bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.15))] text-[color:var(--hub-accent,#10b981)]'
        : 'border-zinc-200 text-zinc-500 hover:border-zinc-300 dark:border-zinc-700 dark:hover:border-zinc-600'
    }`;

  const connectHint = treasury
    ? 'Connect your Kaspa wallet to vote with KAS'
    : 'Connect your Kaspa wallet to vote';
  const voteHint = treasury
    ? `Vote with KAS to rank this game. (${GAME_LISTING_VOTE_FEE_KAS} KAS per vote)`
    : `Upvote or downvote ${game.name} on Kasparex Games.`;

  return (
    <div
      className={`flex items-center gap-1.5 ${className}`.trim()}
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <Tooltip content={wallet ? voteHint : connectHint}>
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
      <Tooltip content={wallet ? voteHint : connectHint}>
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
