import { getAdsTreasuryL1Address } from '@/lib/ads/config';

/**
 * L1 treasury for token listing create/edit payments.
 * Falls back to ads treasury if not set.
 */
export function getTokensTreasuryL1Address(): string {
  if (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_TOKENS_TREASURY_L1_ADDRESS?.trim()) {
    return process.env.NEXT_PUBLIC_TOKENS_TREASURY_L1_ADDRESS.trim();
  }
  return getAdsTreasuryL1Address();
}

/** KAS sent to the token creator wallet per listing upvote/downvote. */
export const TOKEN_LISTING_VOTE_FEE_KAS = 1;
