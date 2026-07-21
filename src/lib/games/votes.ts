/**
 * Local up/down votes for Kasparex Games listings.
 */

export type GameListingVote = 'up' | 'down';

export type GameListingVoteRecord = {
  gameId: string;
  wallet: string;
  vote: GameListingVote;
  votedAt: string;
  txHash?: string;
};

const STORAGE_KEY = 'games_listing_votes';
export const GAMES_LISTING_VOTES_CHANGED_EVENT = 'games-listing-votes-changed';
export const GAME_LISTING_VOTE_FEE_KAS = 1;

function safeParse<T>(value: string | null, fallback: T): T {
  if (!value) return fallback;
  try {
    return JSON.parse(value) as T;
  } catch {
    return fallback;
  }
}

function safeWrite(value: unknown): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem(STORAGE_KEY, JSON.stringify(value));
}

export function notifyGamesListingVotesChanged(): void {
  if (typeof window === 'undefined') return;
  window.dispatchEvent(new CustomEvent(GAMES_LISTING_VOTES_CHANGED_EVENT));
}

export function getGameListingVotes(gameId: string): GameListingVoteRecord[] {
  if (typeof window === 'undefined') return [];
  const all = safeParse<GameListingVoteRecord[]>(localStorage.getItem(STORAGE_KEY), []);
  return all.filter((v) => v.gameId === gameId);
}

export function getAllGameListingVoteScores(): Record<string, number> {
  if (typeof window === 'undefined') return {};
  const all = safeParse<GameListingVoteRecord[]>(localStorage.getItem(STORAGE_KEY), []);
  const scores: Record<string, number> = {};
  for (const v of all) {
    scores[v.gameId] = (scores[v.gameId] ?? 0) + (v.vote === 'up' ? 1 : -1);
  }
  return scores;
}

export function getGameListingVoteScore(gameId: string): number {
  let score = 0;
  for (const v of getGameListingVotes(gameId)) {
    score += v.vote === 'up' ? 1 : -1;
  }
  return score;
}

export function getGameListingVoteForWallet(gameId: string, wallet: string): GameListingVote | null {
  if (!wallet) return null;
  const key = wallet.toLowerCase();
  const match = getGameListingVotes(gameId).find((v) => v.wallet.toLowerCase() === key);
  return match?.vote ?? null;
}

export function saveGameListingVote(record: GameListingVoteRecord): void {
  if (typeof window === 'undefined' || !record.wallet) return;
  const key = record.wallet.toLowerCase();
  const all = safeParse<GameListingVoteRecord[]>(localStorage.getItem(STORAGE_KEY), []);
  const next = all.filter((v) => !(v.gameId === record.gameId && v.wallet.toLowerCase() === key));
  next.push({ ...record, wallet: key });
  safeWrite(next);
  notifyGamesListingVotesChanged();
}
