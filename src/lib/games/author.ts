/**
 * Resolve the Kaspa L1 wallet shown as game author (identicon + shortened address).
 * Official Kasparex games fall back to the shared Games treasury / platform L1 address.
 */

const PLACEHOLDER_AUTHOR_PREFIXES = ['author:', 'kasparex:'];

const DEFAULT_KASPAREX_GAMES_AUTHOR =
  (typeof process !== 'undefined' ? process.env.NEXT_PUBLIC_GAME_TREASURY_ADDRESS?.trim() : '') ||
  'kaspa:qr54v0692g4csc45z6phshyh2twy5dv73mylx5uqjtpphynvg70vksky9xffw';

export function isGameAuthorWallet(value: string | undefined | null): boolean {
  const v = (value ?? '').trim();
  if (!v) return false;
  if (PLACEHOLDER_AUTHOR_PREFIXES.some((p) => v.toLowerCase().startsWith(p))) return false;
  return v.startsWith('kaspa:') || /^[a-z0-9]{48,}$/i.test(v);
}

/** Official Kasparex Games publisher wallet for cards and headers. */
export function getKasparexGamesAuthorWallet(): string {
  return DEFAULT_KASPAREX_GAMES_AUTHOR;
}

export function resolveGameAuthorWallet(game: {
  authorAddress?: string | null;
  publisher?: string | null;
}): string {
  const direct = game.authorAddress?.trim();
  if (isGameAuthorWallet(direct)) return direct!;
  return getKasparexGamesAuthorWallet();
}