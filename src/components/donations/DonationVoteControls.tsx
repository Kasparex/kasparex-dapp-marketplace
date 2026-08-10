'use client';

import { HubListingVoteControls } from '@/components/payments/HubListingVoteControls';
import { getHubTreasuryAddress } from '@/lib/payments/paymentPlan';

const VDONATE_LISTING_VOTE_KEY = 'vdonate_listing_votes';

function resolveVoteAuthorPayee(authorWallet: string): string {
  const t = authorWallet.trim();
  if (/^0x[a-fA-F0-9]{40}$/.test(t)) return t;
  const lower = t.toLowerCase();
  if (lower.startsWith('kaspa:') || lower.startsWith('kaspatest:') || t.length >= 48) return t;
  return getHubTreasuryAddress().trim();
}

/** vDonate listing vote control (supports the campaign creator). */
export function DonationVoteControls({
  entityId,
  creatorWallet,
  title,
  compact = false,
}: {
  entityId: string;
  creatorWallet: string;
  title?: string;
  compact?: boolean;
}) {
  const payee = resolveVoteAuthorPayee(creatorWallet);
  if (!payee) return null;

  return (
    <HubListingVoteControls
      entityId={entityId}
      storageKey={VDONATE_LISTING_VOTE_KEY}
      legacyIdField="dappId"
      authorWallet={payee}
      paymentNote={`vDonate vote:{vote}:${title || entityId}`}
      compact={compact}
    />
  );
}
