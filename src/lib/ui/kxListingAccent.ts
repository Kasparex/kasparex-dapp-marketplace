/** Kasparex hub areas — used for listing-card hover border + shadow tint. */
export type KxListingAccent =
  | 'hub'
  | 'crowdkas'
  | 'vblog'
  | 'chronicles'
  | 'store'
  | 'games'
  | 'magazines'
  /** dApp grid: border tint comes from `data-kx-dapp-network` in globals.css */
  | 'dapp-neutral';

/**
 * Hover/interaction classes for unified listing cards (border + subtle shadow).
 * Base shell applies shadow-kx-card; hover adds shadow-kx-card-hover + accent tint.
 */
/** Hover border uses ! so it wins over `.kaspa .border-zinc-* { !important }` in globals.css. */
export function kxListingAccentHoverClasses(accent: KxListingAccent): string {
  switch (accent) {
    case 'crowdkas':
      return 'hover:!border-emerald-500 dark:hover:!border-emerald-500 hover:!shadow-kx-card-hover';
    case 'vblog':
      return 'hover:!border-orange-500 dark:hover:!border-orange-500 hover:!shadow-kx-card-hover';
    case 'chronicles':
      return 'hover:!border-cyan-500 dark:hover:!border-cyan-500 hover:!shadow-kx-card-hover';
    case 'store':
    case 'magazines':
      return 'hover:!border-cyan-500 dark:hover:!border-cyan-400 hover:!shadow-kx-card-hover';
    case 'games':
      return 'hover:!border-violet-500 dark:hover:!border-violet-400 hover:!shadow-kx-card-hover';
    case 'dapp-neutral':
      return 'hover:!shadow-kx-card-hover';
    case 'hub':
    default:
      return 'hover:!border-[#02abb8] dark:hover:!border-[#02abb8] hover:!shadow-kx-card-hover';
  }
}

/** CrowdKAS module tiles (emerald / amber) — not in KxListingAccent union. */
export function kxCrowdkasModuleHoverClasses(accent: 'emerald' | 'amber'): string {
  return accent === 'amber'
    ? 'hover:!border-amber-500 dark:hover:!border-amber-400 hover:!shadow-kx-card-hover'
    : 'hover:!border-emerald-500 dark:hover:!border-emerald-500 hover:!shadow-kx-card-hover';
}

export function kxJoinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter(Boolean).join(' ');
}
