'use client';

import type { Game } from '@/lib/games/games';
import { listGames } from '@/lib/games/registry';
import {
  GAMES_LISTING_VOTES_CHANGED_EVENT,
  notifyGamesListingVotesChanged,
} from '@/lib/games/votes';
import { getKasparexGamesAuthorWallet } from '@/lib/games/author';
import { HubListingVoteControls } from '@/components/payments/HubListingVoteControls';

const GAMES_LISTING_VOTE_KEY = 'games_listing_votes';

type GameVoteControlsProps = {
  game: Pick<Game, 'id' | 'name' | 'slug'>;
  className?: string;
};

function resolveVoteAuthor(gameId: string): string {
  const g = listGames().find((x) => x.id === gameId);
  const fromSku = g?.skus?.find((s) => s.kasTreasuryAddress?.trim())?.kasTreasuryAddress?.trim();
  const fromEnv = (process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS || '').trim();
  return fromSku || fromEnv || getKasparexGamesAuthorWallet();
}

/** Games listing vote control (shared Hub multi-out payment standard). */
export function GameVoteControls({ game, className = '' }: GameVoteControlsProps) {
  const authorWallet = resolveVoteAuthor(game.id);

  return (
    <div
      onClick={(e) => {
        e.preventDefault();
        e.stopPropagation();
      }}
    >
      <HubListingVoteControls
        entityId={game.id}
        storageKey={GAMES_LISTING_VOTE_KEY}
        legacyIdField="gameId"
        authorWallet={authorWallet}
        paymentNote={`Game vote:{vote}:${game.slug || game.id}`}
        className={className}
        activeClassName="border-[color:var(--hub-accent-border,#10b981)] bg-[color:var(--hub-accent-muted,rgba(16,185,129,0.15))] text-[color:var(--hub-accent,#10b981)]"
        onVoteSaved={() => {
          notifyGamesListingVotesChanged();
          if (typeof window !== 'undefined') {
            window.dispatchEvent(new CustomEvent(GAMES_LISTING_VOTES_CHANGED_EVENT));
          }
        }}
      />
    </div>
  );
}
