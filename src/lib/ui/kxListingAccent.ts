/** Kasparex hub listing cards — hover border + shadow tint. */
export type KxListingAccent =
  | 'hub'
  | 'crowdkas'
  | 'vblog'
  | 'chronicles'
  | 'store'
  | 'games'
  | 'magazines';

export function kxListingAccentHoverClasses(accent: KxListingAccent): string {
  switch (accent) {
    case 'crowdkas':
      return 'hover:!border-emerald-500 dark:hover:!border-emerald-500 hover:shadow-lg hover:shadow-emerald-500/10';
    case 'vblog':
      return 'hover:!border-orange-500 dark:hover:!border-orange-500 hover:shadow-lg hover:shadow-orange-500/10';
    case 'chronicles':
      return 'hover:!border-cyan-500 dark:hover:!border-cyan-500 hover:shadow-lg hover:shadow-cyan-500/10';
    case 'store':
    case 'magazines':
      return 'hover:!border-cyan-500 dark:hover:!border-cyan-400 hover:shadow-lg hover:shadow-cyan-500/10';
    case 'games':
      return 'hover:!border-violet-500 dark:hover:!border-violet-400 hover:shadow-lg hover:shadow-violet-500/15';
    case 'hub':
    default:
      return 'hover:!border-[#02abb8] dark:hover:!border-[#02abb8] hover:shadow-lg hover:shadow-[#02abb8]/15';
  }
}

export function kxJoinClasses(...parts: (string | undefined | false | null)[]): string {
  return parts.filter(Boolean).join(' ');
}
