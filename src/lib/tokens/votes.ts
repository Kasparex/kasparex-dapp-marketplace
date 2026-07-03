/**
 * Community listing votes (localStorage MVP).
 * One vote per wallet per token. On-chain proof optional via txHash in Phase 3.
 */

export type TokenVoteDirection = 'up' | 'down';

export type TokenVote = {
  tokenId: string;
  wallet: string;
  direction: TokenVoteDirection;
  txHash?: string;
  votedAt: string;
};

const STORAGE_KEY = 'tokens_listing_votes';

function readVotes(): TokenVote[] {
  if (typeof window === 'undefined') return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return [];
    const parsed = JSON.parse(raw) as TokenVote[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeVotes(votes: TokenVote[]): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(votes));
}

export function getTokenVotes(): TokenVote[] {
  return readVotes();
}

export function getVoteForToken(wallet: string, tokenId: string): TokenVoteDirection | null {
  const normalized = wallet.toLowerCase();
  const vote = readVotes().find(
    (v) => v.tokenId === tokenId && v.wallet.toLowerCase() === normalized,
  );
  return vote?.direction ?? null;
}

export function saveTokenVote(vote: TokenVote): void {
  const votes = readVotes().filter(
    (v) => !(v.tokenId === vote.tokenId && v.wallet.toLowerCase() === vote.wallet.toLowerCase()),
  );
  votes.push({ ...vote, wallet: vote.wallet.toLowerCase() });
  writeVotes(votes);
}

export function clearTokenVote(wallet: string, tokenId: string): void {
  const normalized = wallet.toLowerCase();
  const votes = readVotes().filter(
    (v) => !(v.tokenId === tokenId && v.wallet.toLowerCase() === normalized),
  );
  writeVotes(votes);
}

export function getNetVoteScore(tokenId: string): number {
  const votes = readVotes().filter((v) => v.tokenId === tokenId);
  let score = 0;
  for (const vote of votes) {
    score += vote.direction === 'up' ? 1 : -1;
  }
  return score;
}

export function getEffectiveCommunityScore(tokenId: string, baseScore = 0): number {
  return baseScore + getNetVoteScore(tokenId);
}
