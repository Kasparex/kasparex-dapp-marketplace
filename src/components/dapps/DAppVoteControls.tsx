'use client';

import type { DApp } from '@/lib/dapps';
import { resolveDAppAuthor } from '@/lib/dapps/deployer';
import { getHubTreasuryAddress } from '@/lib/payments/paymentPlan';
import { getKasparexGamesAuthorWallet } from '@/lib/games/author';
import { HubListingVoteControls } from '@/components/payments/HubListingVoteControls';

export type DAppListingVote = 'up' | 'down';

const DAPP_LISTING_VOTE_KEY = 'dapps_listing_votes';

function resolveVoteAuthorPayee(authorWallet: string): string {
  const t = authorWallet.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(t)) return t;
  const lower = t.toLowerCase();
  if (lower.startsWith('kaspa:') || lower.startsWith('kaspatest:') || t.length >= 48) return t;
  return getHubTreasuryAddress().trim() || getKasparexGamesAuthorWallet();
}

/** dApps listing vote control (shared Hub multi-out payment standard). */
export function DAppVoteControls({ dapp, compact = false }: { dapp: DApp; compact?: boolean }) {
  const author = resolveDAppAuthor(dapp);
  const creatorWallet = author.wallet?.trim();
  if (!creatorWallet) return null;

  return (
    <HubListingVoteControls
      entityId={dapp.id}
      storageKey={DAPP_LISTING_VOTE_KEY}
      legacyIdField="dappId"
      authorWallet={resolveVoteAuthorPayee(creatorWallet)}
      paymentNote={`DApp vote:{vote}:${dapp.slug || dapp.name}`}
      compact={compact}
    />
  );
}
