/**
 * Deterministic accent per creative (`hash(id)`): stable SSR/hydration, visually varied across campaigns.
 *
 * Framing is drawn in a **separate stacking layer above the image** (see AdPlacementGrid / AdCard:
 * `isolate`, image in `z-0`, overlay `z-25+`). Borders on the same plane as `next/image` fill
 * often disappear under the decoded bitmap.
 */
export type FeaturedAdAccent = {
  overlayClass: string;
  badgeClass: string;
  /** Matching outer ring on dashboard cards (embedded + full-width). */
  outerRingClass: string;
};

const ACCENTS: FeaturedAdAccent[] = [
  {
    overlayClass:
      'border-[7px] border-fuchsia-500 ring-2 ring-inset ring-white/50 shadow-[inset_0_0_72px_-20px_rgba(217,70,239,0.72)]',
    badgeClass: 'bg-fuchsia-600 dark:bg-fuchsia-400 text-white',
    outerRingClass: 'ring-2 ring-fuchsia-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-violet-600 ring-2 ring-inset ring-white/45 shadow-[inset_0_0_72px_-20px_rgba(124,58,237,0.68)]',
    badgeClass: 'bg-violet-600 dark:bg-violet-400 text-white',
    outerRingClass: 'ring-2 ring-violet-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-cyan-500 ring-2 ring-inset ring-white/50 shadow-[inset_0_0_72px_-20px_rgba(6,182,212,0.65)]',
    badgeClass: 'bg-cyan-600 dark:bg-cyan-400 text-white',
    outerRingClass: 'ring-2 ring-cyan-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-amber-500 ring-2 ring-inset ring-white/45 shadow-[inset_0_0_72px_-20px_rgba(245,158,11,0.62)]',
    badgeClass: 'bg-amber-600 dark:bg-amber-400 text-white',
    outerRingClass: 'ring-2 ring-amber-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-emerald-500 ring-2 ring-inset ring-white/45 shadow-[inset_0_0_72px_-20px_rgba(16,185,129,0.62)]',
    badgeClass: 'bg-emerald-600 dark:bg-emerald-400 text-white',
    outerRingClass: 'ring-2 ring-emerald-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-rose-500 ring-2 ring-inset ring-white/50 shadow-[inset_0_0_72px_-20px_rgba(244,63,94,0.62)]',
    badgeClass: 'bg-rose-600 dark:bg-rose-400 text-white',
    outerRingClass: 'ring-2 ring-rose-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-sky-500 ring-2 ring-inset ring-white/45 shadow-[inset_0_0_72px_-20px_rgba(14,165,233,0.62)]',
    badgeClass: 'bg-sky-600 dark:bg-sky-400 text-white',
    outerRingClass: 'ring-2 ring-sky-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-orange-500 ring-2 ring-inset ring-white/45 shadow-[inset_0_0_72px_-20px_rgba(249,115,22,0.62)]',
    badgeClass: 'bg-orange-600 dark:bg-orange-400 text-white',
    outerRingClass: 'ring-2 ring-orange-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-pink-500 ring-2 ring-inset ring-white/50 shadow-[inset_0_0_72px_-20px_rgba(236,72,153,0.65)]',
    badgeClass: 'bg-pink-600 dark:bg-pink-400 text-white',
    outerRingClass: 'ring-2 ring-pink-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-indigo-500 ring-2 ring-inset ring-white/45 shadow-[inset_0_0_72px_-20px_rgba(99,102,241,0.65)]',
    badgeClass: 'bg-indigo-600 dark:bg-indigo-400 text-white',
    outerRingClass: 'ring-2 ring-indigo-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-lime-500 ring-2 ring-inset ring-black/25 shadow-[inset_0_0_72px_-20px_rgba(132,204,22,0.55)]',
    badgeClass: 'bg-lime-600 dark:bg-lime-400 text-black',
    outerRingClass: 'ring-2 ring-lime-400 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
  },
  {
    overlayClass:
      'border-[7px] border-teal-500 ring-2 ring-inset ring-white/45 shadow-[inset_0_0_72px_-20px_rgba(20,184,166,0.62)]',
    badgeClass: 'bg-teal-600 dark:bg-teal-400 text-white',
    outerRingClass: 'ring-2 ring-teal-500 ring-offset-[3px] ring-offset-white dark:ring-offset-zinc-950',
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
