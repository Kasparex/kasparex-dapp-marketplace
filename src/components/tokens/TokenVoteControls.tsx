'use client';

import type { Token } from '@/lib/tokens/types';
import { resolveTokenCreatorWallet } from '@/lib/tokens/creatorWallet';
import { getHubTreasuryAddress } from '@/lib/payments/paymentPlan';
import { getKasparexGamesAuthorWallet } from '@/lib/games/author';
import { HubListingVoteControls } from '@/components/payments/HubListingVoteControls';

const TOKEN_LISTING_VOTE_KEY = 'tokens_listing_votes';

type TokenVoteControlsProps = {
  token: Token;
  compact?: boolean;
};

function resolveVoteAuthorPayee(authorWallet: string): string {
  const t = authorWallet.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(t)) return t;
  const lower = t.toLowerCase();
  if (lower.startsWith('kaspa:') || lower.startsWith('kaspatest:') || t.length >= 48) return t;
  return getHubTreasuryAddress().trim() || getKasparexGamesAuthorWallet();
}

/** Tokens listing vote control (shared Hub multi-out payment standard). */
export function TokenVoteControls({ token, compact = false }: TokenVoteControlsProps) {
  const creatorWallet = resolveTokenCreatorWallet(token);
  if (!creatorWallet) return null;

  return (
    <HubListingVoteControls
      entityId={token.id}
      storageKey={TOKEN_LISTING_VOTE_KEY}
      legacyIdField="tokenId"
      authorWallet={resolveVoteAuthorPayee(creatorWallet)}
      paymentNote={`Token vote:{vote}:${token.symbol}`}
      compact={compact}
    />
  );
}
