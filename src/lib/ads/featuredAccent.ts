/**
 * Deterministic accent styles for featured ads so carousel/list colors stay stable per creative.
 * Uses inset ring + inset glow so highlights are not clipped by parent overflow-hidden.
 */
export type FeaturedAdAccent = {
  /** Tailwind classes for the creative frame (width + inset ring + inset shadow). */
  frameClass: string;
  /** Badge background classes (Featured pill). */
  badgeClass: string;
};

const ACCENTS: FeaturedAdAccent[] = [
  {
    frameClass:
      'ring-2 ring-inset ring-fuchsia-500 shadow-[inset_0_0_26px_-12px_rgba(217,70,239,0.5)] dark:shadow-[inset_0_0_28px_-10px_rgba(217,70,239,0.42)]',
    badgeClass: 'bg-fuchsia-600/95 dark:bg-fuchsia-500/95',
  },
  {
    frameClass:
      'ring-2 ring-inset ring-violet-500 shadow-[inset_0_0_26px_-12px_rgba(139,92,246,0.48)] dark:shadow-[inset_0_0_28px_-10px_rgba(139,92,246,0.4)]',
    badgeClass: 'bg-violet-600/95 dark:bg-violet-500/95',
  },
  {
    frameClass:
      'ring-2 ring-inset ring-cyan-500 shadow-[inset_0_0_26px_-12px_rgba(6,182,212,0.48)] dark:shadow-[inset_0_0_28px_-10px_rgba(6,182,212,0.4)]',
    badgeClass: 'bg-cyan-600/95 dark:bg-cyan-500/95',
  },
  {
    frameClass:
      'ring-2 ring-inset ring-amber-500 shadow-[inset_0_0_26px_-12px_rgba(245,158,11,0.48)] dark:shadow-[inset_0_0_28px_-10px_rgba(245,158,11,0.38)]',
    badgeClass: 'bg-amber-600/95 dark:bg-amber-500/95',
  },
  {
    frameClass:
      'ring-2 ring-inset ring-emerald-500 shadow-[inset_0_0_26px_-12px_rgba(16,185,129,0.48)] dark:shadow-[inset_0_0_28px_-10px_rgba(16,185,129,0.38)]',
    badgeClass: 'bg-emerald-600/95 dark:bg-emerald-500/95',
  },
  {
    frameClass:
      'ring-2 ring-inset ring-rose-500 shadow-[inset_0_0_26px_-12px_rgba(244,63,94,0.48)] dark:shadow-[inset_0_0_28px_-10px_rgba(244,63,94,0.38)]',
    badgeClass: 'bg-rose-600/95 dark:bg-rose-500/95',
  },
  {
    frameClass:
      'ring-2 ring-inset ring-sky-500 shadow-[inset_0_0_26px_-12px_rgba(14,165,233,0.48)] dark:shadow-[inset_0_0_28px_-10px_rgba(14,165,233,0.38)]',
    badgeClass: 'bg-sky-600/95 dark:bg-sky-500/95',
  },
  {
    frameClass:
      'ring-2 ring-inset ring-orange-500 shadow-[inset_0_0_26px_-12px_rgba(249,115,22,0.48)] dark:shadow-[inset_0_0_28px_-10px_rgba(249,115,22,0.38)]',
    badgeClass: 'bg-orange-600/95 dark:bg-orange-500/95',
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
