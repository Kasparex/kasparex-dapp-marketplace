/**
 * Deterministic accent per creative (`hash(id)`): stable SSR/hydration, visually varied across campaigns.
 *
 * Single visible frame: `solidFrameClass` on the creative shell only (inventory cards no longer stack `outerRing`).
 * Overlay is a light vignette only - inset rings were doubling as a second border.
 *
 * CSS mirror (tokens + optional data-attribute classes): `src/styles/ads-featured-highlight.css`
 */
export type FeaturedAdAccent = {
  solidFrameClass: string;
  overlayClass: string;
  badgeClass: string;
  progressBarClass: string;
};

/** Unified featured styling for in-page ad slot placements (halos, rails, panels). */
export const FEATURED_AD_SLOT_FRAME_CLASS =
  'border-[2px] border-solid border-white/95 dark:border-zinc-100/90 box-border shadow-md shadow-black/25 dark:shadow-black/45';

export const FEATURED_AD_SLOT_HOST_CLASS =
  'kasparex-ad-slot-featured-host relative isolate box-border overflow-visible flex flex-col';

export const FEATURED_AD_SLOT_AURA_CLASS =
  'kasparex-ad-slot-featured-aura pointer-events-none absolute -inset-[2px] z-0';

export const FEATURED_AD_SLOT_OVERLAY_CLASS = '';

/** Shared pill positioning for Featured chips in inventory cards (color from `badgeClass`). */
export const FEATURED_BADGE_LAYOUT =
  'pointer-events-none absolute top-2 right-2 z-[35] rounded-full px-2 py-0.5 text-[9px] font-semibold uppercase tracking-wide shadow-sm';

/** Positioning wrapper when using `KxBadge` on in-page ad slots. */
export const FEATURED_AD_SLOT_BADGE_LAYOUT = 'pointer-events-none absolute top-2 right-2 z-[35]';

const ACCENTS: FeaturedAdAccent[] = [
  {
    solidFrameClass: 'border-2 border-fuchsia-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(217,70,239,0.38)]',
    badgeClass: 'bg-fuchsia-600 text-white',
    progressBarClass: 'from-fuchsia-500 via-purple-600 to-fuchsia-600',
  },
  {
    solidFrameClass: 'border-2 border-violet-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(124,58,237,0.34)]',
    badgeClass: 'bg-violet-600 text-white',
    progressBarClass: 'from-violet-500 via-purple-600 to-indigo-600',
  },
  {
    solidFrameClass: 'border-2 border-cyan-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(6,182,212,0.34)]',
    badgeClass: 'bg-cyan-600 text-white',
    progressBarClass: 'from-cyan-400 via-sky-500 to-cyan-600',
  },
  {
    solidFrameClass: 'border-2 border-amber-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(245,158,11,0.32)]',
    badgeClass: 'bg-amber-600 text-white',
    progressBarClass: 'from-amber-400 via-orange-500 to-amber-600',
  },
  {
    solidFrameClass: 'border-2 border-emerald-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(16,185,129,0.32)]',
    badgeClass: 'bg-emerald-600 text-white',
    progressBarClass: 'from-emerald-400 via-teal-500 to-emerald-600',
  },
  {
    solidFrameClass: 'border-2 border-rose-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(244,63,94,0.32)]',
    badgeClass: 'bg-rose-600 text-white',
    progressBarClass: 'from-rose-500 via-pink-600 to-rose-600',
  },
  {
    solidFrameClass: 'border-2 border-sky-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(14,165,233,0.32)]',
    badgeClass: 'bg-sky-600 text-white',
    progressBarClass: 'from-sky-400 via-blue-500 to-sky-600',
  },
  {
    solidFrameClass: 'border-2 border-orange-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(249,115,22,0.32)]',
    badgeClass: 'bg-orange-600 text-white',
    progressBarClass: 'from-orange-400 via-red-500 to-orange-600',
  },
  {
    solidFrameClass: 'border-2 border-pink-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(236,72,153,0.34)]',
    badgeClass: 'bg-pink-600 text-white',
    progressBarClass: 'from-pink-500 via-fuchsia-600 to-pink-600',
  },
  {
    solidFrameClass: 'border-2 border-indigo-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(99,102,241,0.34)]',
    badgeClass: 'bg-indigo-600 text-white',
    progressBarClass: 'from-indigo-500 via-violet-600 to-indigo-700',
  },
  {
    solidFrameClass: 'border-2 border-lime-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(132,204,22,0.3)]',
    badgeClass: 'bg-lime-500 text-black',
    progressBarClass: 'from-lime-400 via-emerald-500 to-lime-600',
  },
  {
    solidFrameClass: 'border-2 border-teal-500',
    overlayClass: 'shadow-[inset_0_0_48px_-18px_rgba(20,184,166,0.32)]',
    badgeClass: 'bg-teal-600 text-white',
    progressBarClass: 'from-teal-400 via-cyan-500 to-teal-600',
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

/** Matches `data-kasparex-ad-accent="…"` in `src/styles/ads-featured-highlight.css` (0 … ACCENTS.length - 1). */
export function featuredAccentIndex(id: string): number {
  return hashId(id) % ACCENTS.length;
}
