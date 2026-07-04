/**
 * Paid KAS listing votes and token poll votes.
 */

export type TokenListingVote = 'up' | 'down';

export type TokenListingVoteRecord = {
  tokenId: string;
  wallet: string;
  vote: TokenListingVote;
  votedAt: string;
  txHash?: string;
};

export type TokenPollVoteRecord = {
  tokenSlug: string;
  wallet: string;
  optionIndex: number;
  votedAt: string;
  txHash?: string;
};

const STORAGE_KEYS = {
  listingVotes: 'tokens_listing_votes',
  pollVotes: 'tokens_poll_votes',
} as const;

export const TOKEN_LISTING_VOTES_CHANGED_EVENT = 'tokens-listing-votes-changed';

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(key: string, value: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(value));
}

export function notifyListingVotesChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(TOKEN_LISTING_VOTES_CHANGED_EVENT));
}

function isPaidListingVote(record: TokenListingVoteRecord): boolean {
  return Boolean(record.txHash?.trim());
}

export function getListingVotes(tokenId: string): TokenListingVoteRecord[] {
  if (typeof window === 'undefined') return [];
  const all = safeParse<TokenListingVoteRecord[]>(localStorage.getItem(STORAGE_KEYS.listingVotes), []);
  return all.filter((v) => v.tokenId === tokenId && isPaidListingVote(v));
}

export function getListingVoteScore(tokenId: string): number {
  const votes = getListingVotes(tokenId);
  let score = 0;
  for (const v of votes) {
    score += v.vote === 'up' ? 1 : -1;
  }
  return score;
}

export function getListingVoteForWallet(tokenId: string, wallet: string): TokenListingVote | null {
  if (!wallet) return null;
  const key = wallet.toLowerCase();
  const votes = getListingVotes(tokenId);
  const match = votes.find((v) => v.wallet.toLowerCase() === key);
  return match?.vote ?? null;
}

export function saveListingVote(record: TokenListingVoteRecord): void {
  if (typeof window === 'undefined' || !record.wallet || !record.txHash?.trim()) return;
  const key = record.wallet.toLowerCase();
  const all = safeParse<TokenListingVoteRecord[]>(localStorage.getItem(STORAGE_KEYS.listingVotes), []);
  const next = all.filter((v) => !(v.tokenId === record.tokenId && v.wallet.toLowerCase() === key));
  next.push({ ...record, wallet: key, txHash: record.txHash.trim() });
  safeWrite(STORAGE_KEYS.listingVotes, next);
  notifyListingVotesChanged();
}

export function getPollVotes(tokenSlug: string): TokenPollVoteRecord[] {
  if (typeof window === 'undefined') return [];
  const all = safeParse<TokenPollVoteRecord[]>(localStorage.getItem(STORAGE_KEYS.pollVotes), []);
  return all.filter((v) => v.tokenSlug === tokenSlug);
}

export function hasPollVote(tokenSlug: string, wallet: string): boolean {
  if (!wallet) return false;
  const key = wallet.toLowerCase();
  return getPollVotes(tokenSlug).some((v) => v.wallet.toLowerCase() === key);
}

export function getPollVoteForWallet(tokenSlug: string, wallet: string): TokenPollVoteRecord | undefined {
  if (!wallet) return undefined;
  const key = wallet.toLowerCase();
  return getPollVotes(tokenSlug).find((v) => v.wallet.toLowerCase() === key);
}

export function savePollVote(record: TokenPollVoteRecord): void {
  if (typeof window === 'undefined' || !record.wallet) return;
  const key = record.wallet.toLowerCase();
  const all = safeParse<TokenPollVoteRecord[]>(localStorage.getItem(STORAGE_KEYS.pollVotes), []);
  if (all.some((v) => v.tokenSlug === record.tokenSlug && v.wallet.toLowerCase() === key)) return;
  all.push({ ...record, wallet: key });
  safeWrite(STORAGE_KEYS.pollVotes, all);
}
