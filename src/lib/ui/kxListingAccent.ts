/**
 * Accent ids (`data-kx-accent`) for analytics / theming hooks.
 * Card chrome matches CrowdKAS campaign listing: emerald border hover on `KxListingCard`.
 */
export type KxListingAccent =
  | 'hub'
  | 'crowdkas'
  | 'vblog'
  | 'chronicles'
  | 'store'
  | 'games'
  | 'magazines';

export function kxJoinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter(Boolean).join(' ');
}
