import type { UnifiedGame } from '@/lib/games/registry';
import type { GameDifficulty, GameStatus, GameType } from '@/lib/games/games';
import { htmlToPlainText } from '@/lib/richText/html';

export const GAMES_PROMO_STORAGE_KEY = 'kasparex_games_dashboard_promotions';
export const GAMES_PROMO_UPDATED_EVENT = 'games-promo-listings-updated';

export type GamePromoListing = {
  id: string;
  wallet: string;
  title: string;
  slug: string;
  shortDescription: string;
  content: string;
  instructions: string;
  featuredImageUrl: string;
  featuredImageCid?: string | null;
  gameType: GameType;
  difficulty: GameDifficulty;
  status: GameStatus;
  entryCostKAS: number;
  version: string;
  gameUrl: string;
  categories: string[];
  tags: string[];
  listingStatus: 'draft' | 'published';
  createdAt: string;
  feeTxHash?: string;
  feeAmountKas?: number;
};

function safeParse(raw: string | null): GamePromoListing[] {
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as GamePromoListing[]) : [];
  } catch {
    return [];
  }
}

export function readAllGamePromoListings(): GamePromoListing[] {
  if (typeof window === 'undefined') return [];
  return safeParse(localStorage.getItem(GAMES_PROMO_STORAGE_KEY));
}

export function readGamePromoListingsForWallet(wallet?: string | null): GamePromoListing[] {
  if (!wallet) return [];
  const needle = wallet.toLowerCase();
  return readAllGamePromoListings().filter((x) => x.wallet.toLowerCase() === needle);
}

export function saveGamePromoListing(listing: GamePromoListing): void {
  if (typeof window === 'undefined') return;
  const all = readAllGamePromoListings().filter((x) => x.id !== listing.id);
  localStorage.setItem(GAMES_PROMO_STORAGE_KEY, JSON.stringify([listing, ...all]));
  window.dispatchEvent(new Event(GAMES_PROMO_UPDATED_EVENT));
}

export function updateGamePromoListing(listing: GamePromoListing): void {
  saveGamePromoListing(listing);
}

export function deleteGamePromoListing(id: string): boolean {
  if (typeof window === 'undefined') return false;
  const all = readAllGamePromoListings();
  const next = all.filter((x) => x.id !== id);
  if (next.length === all.length) return false;
  localStorage.setItem(GAMES_PROMO_STORAGE_KEY, JSON.stringify(next));
  window.dispatchEvent(new Event(GAMES_PROMO_UPDATED_EVENT));
  return true;
}

export function getGamePromoListingById(id: string): GamePromoListing | undefined {
  return readAllGamePromoListings().find((x) => x.id === id);
}

export function gamePromoListingToUnified(listing: GamePromoListing): UnifiedGame {
  const description =
    listing.shortDescription.trim() ||
    htmlToPlainText(listing.content).slice(0, 280) ||
    'Community-listed game on Kasparex Games.';

  return {
    id: listing.id,
    name: listing.title,
    slug: listing.slug,
    description,
    instructions: listing.instructions || undefined,
    gameType: listing.gameType,
    difficulty: listing.difficulty,
    status: listing.status,
    entryCostKAS: listing.entryCostKAS,
    developer: 'Community',
    publisher: 'community',
    authorAddress: listing.wallet,
    version: listing.version || undefined,
    featuredImage: listing.featuredImageUrl || undefined,
    gameUrl: listing.gameUrl || undefined,
    createdAt: listing.createdAt,
    playCount: 0,
    likeCount: 0,
    favoriteCount: 0,
    route: { kind: 'slug', slug: listing.slug },
    capabilities: ['wallet_l1'],
    categories: listing.categories?.length ? listing.categories : undefined,
    tags: listing.tags?.length ? listing.tags : undefined,
  };
}

/** Published community promos as UnifiedGame (client-only; empty on server). */
export function listPublishedPromoGames(): UnifiedGame[] {
  return readAllGamePromoListings()
    .filter((l) => l.listingStatus === 'published' && l.slug?.trim())
    .map(gamePromoListingToUnified);
}

export function getPublishedPromoGameBySlug(slug: string): UnifiedGame | undefined {
  const s = (slug ?? '').trim().toLowerCase();
  if (!s) return undefined;
  return listPublishedPromoGames().find((g) => g.slug.toLowerCase() === s);
}

/** Registry first; promo games fill gaps by id/slug (no duplicates). */
export function mergeGamesWithPromos(
  registry: UnifiedGame[],
  promos: UnifiedGame[] = listPublishedPromoGames(),
): UnifiedGame[] {
  const ids = new Set(registry.map((g) => g.id));
  const slugs = new Set(registry.map((g) => g.slug.toLowerCase()));
  const extras = promos.filter((g) => !ids.has(g.id) && !slugs.has(g.slug.toLowerCase()));
  return [...registry, ...extras];
}
