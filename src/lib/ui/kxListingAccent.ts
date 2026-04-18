/**
 * Accent ids (`data-kx-accent`) for analytics / theming hooks.
 * Card chrome matches CrowdKAS campaign listing: emerald border hover on `KxListingCard`.
 */
export type KxListingAccent =
  | 'hub'
  | 'protocols'
  | 'dapps'
  | 'records'
  | 'tokens'
  | 'games'
  | 'vblog'
  | 'magazines'
  | 'chronicles'
  | 'movies'
  | 'defi'
  | 'studio'
  | 'nodes'
  | 'rewards'
  | 'stats'
  | 'nftTools'
  | 'store'
  | 'crowdkas'
  | 'ads'
  | 'revenueTree';

export function kxJoinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter(Boolean).join(' ');
}
