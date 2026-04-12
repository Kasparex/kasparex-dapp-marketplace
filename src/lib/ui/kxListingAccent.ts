/** Kasparex hub areas — used for listing-card hover border + shadow tint. */
export type KxListingAccent =
  | 'hub'
  | 'crowdkas'
  | 'vblog'
  | 'chronicles'
  | 'store'
  | 'games'
  | 'magazines';

/**
 * Hover/interaction classes for unified listing cards (border + subtle shadow).
 * Base shell applies shadow-kx-card; hover adds shadow-kx-card-hover + accent tint.
 */
export function kxListingAccentHoverClasses(accent: KxListingAccent): string {
  switch (accent) {
    case 'crowdkas':
      return 'hover:border-emerald-500 dark:hover:border-emerald-500 hover:shadow-kx-card-hover hover:shadow-emerald-500/[0.12]';
    case 'vblog':
      return 'hover:border-orange-500 dark:hover:border-orange-500 hover:shadow-kx-card-hover hover:shadow-orange-500/[0.12]';
    case 'chronicles':
      return 'hover:border-cyan-500 dark:hover:border-cyan-500 hover:shadow-kx-card-hover hover:shadow-cyan-500/[0.12]';
    case 'store':
    case 'magazines':
      return 'hover:border-cyan-500 dark:hover:border-cyan-400 hover:shadow-kx-card-hover hover:shadow-cyan-500/[0.12]';
    case 'games':
      return 'hover:border-violet-500 dark:hover:border-violet-400 hover:shadow-kx-card-hover hover:shadow-violet-500/[0.12]';
    case 'hub':
    default:
      return 'hover:border-[#02abb8] dark:hover:border-[#02abb8] hover:shadow-kx-card-hover hover:shadow-[#02abb8]/[0.15]';
  }
}

export function kxJoinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter(Boolean).join(' ');
}
