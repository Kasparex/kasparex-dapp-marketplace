/**
 * Deterministic accent styles for featured ads (stable color per creative id).
 *
 * The colored frame is applied via an absolutely positioned overlay **above** the Next/Image
 * (`z-index` + `pointer-events-none`). Borders on the link itself sit underneath `fill` images
 * and were effectively invisible.
 */
export type FeaturedAdAccent = {
  /** Overlay: thick border + inset glow, stacked on top of the creative */
  overlayClass: string;
  badgeClass: string;
};

const ACCENTS: FeaturedAdAccent[] = [
  {
    overlayClass:
      'border-[5px] border-fuchsia-400 shadow-[inset_0_0_48px_-18px_rgba(232,121,249,0.55)]',
    badgeClass: 'bg-fuchsia-600 dark:bg-fuchsia-500',
  },
  {
    overlayClass:
      'border-[5px] border-violet-400 shadow-[inset_0_0_48px_-18px_rgba(167,139,250,0.5)]',
    badgeClass: 'bg-violet-600 dark:bg-violet-500',
  },
  {
    overlayClass:
      'border-[5px] border-cyan-400 shadow-[inset_0_0_48px_-18px_rgba(34,211,238,0.45)]',
    badgeClass: 'bg-cyan-600 dark:bg-cyan-500',
  },
  {
    overlayClass:
      'border-[5px] border-amber-400 shadow-[inset_0_0_48px_-18px_rgba(251,191,36,0.45)]',
    badgeClass: 'bg-amber-600 dark:bg-amber-500',
  },
  {
    overlayClass:
      'border-[5px] border-emerald-400 shadow-[inset_0_0_48px_-18px_rgba(52,211,153,0.45)]',
    badgeClass: 'bg-emerald-600 dark:bg-emerald-500',
  },
  {
    overlayClass:
      'border-[5px] border-rose-400 shadow-[inset_0_0_48px_-18px_rgba(251,113,133,0.48)]',
    badgeClass: 'bg-rose-600 dark:bg-rose-500',
  },
  {
    overlayClass:
      'border-[5px] border-sky-400 shadow-[inset_0_0_48px_-18px_rgba(56,189,248,0.45)]',
    badgeClass: 'bg-sky-600 dark:bg-sky-500',
  },
  {
    overlayClass:
      'border-[5px] border-orange-400 shadow-[inset_0_0_48px_-18px_rgba(251,146,60,0.45)]',
    badgeClass: 'bg-orange-600 dark:bg-orange-500',
  },
];

function hashId(id: string): number {
  let h = 2166136261;
  for (let i = 0; i < id.length; i++) {
    h ^= id.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

export function featuredAccentForAd(id: string): FeaturedAdAccent {
  return ACCENTS[hashId(id) % ACCENTS.length];
}
