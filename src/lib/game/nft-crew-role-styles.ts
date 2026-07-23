import type { MiningSlotType } from '@/lib/game/engine/types';

/** Platform-standard Worker / Operator / Foreman pill colors (emerald / sky / violet). */
export function nftCrewRoleBadgeClass(type: MiningSlotType): string {
  switch (type) {
    case 'operator':
      return 'border-sky-500/40 bg-sky-500/15 text-sky-800 dark:text-sky-300';
    case 'foreman':
      return 'border-violet-500/40 bg-violet-500/15 text-violet-800 dark:text-violet-300';
    default:
      return 'border-emerald-500/30 bg-emerald-500/15 text-emerald-800 dark:text-emerald-300';
  }
}
