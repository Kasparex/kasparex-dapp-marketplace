/**
 * Deterministic accent styles for featured ads so carousel/list colors stay stable per creative.
 * Uses a thick CSS border (not inset ring/box-shadow on the image layer) so the frame stays fully
 * visible beside full-bleed Next/Image — inset rings were painted under the image and looked invisible.
 */
export type FeaturedAdAccent = {
  /** Classes for the framed shell (border + optional glow inside border box). */
  frameClass: string;
  /** Badge background classes (Featured pill). */
  badgeClass: string;
};

const ACCENTS: FeaturedAdAccent[] = [
  {
    frameClass:
      'border-[3px] border-fuchsia-500 box-border shadow-[inset_0_0_28px_-14px_rgba(217,70,239,0.35)]',
    badgeClass: 'bg-fuchsia-600 dark:bg-fuchsia-500',
  },
  {
    frameClass:
      'border-[3px] border-violet-500 box-border shadow-[inset_0_0_28px_-14px_rgba(139,92,246,0.35)]',
    badgeClass: 'bg-violet-600 dark:bg-violet-500',
  },
  {
    frameClass: 'border-[3px] border-cyan-500 box-border shadow-[inset_0_0_28px_-14px_rgba(6,182,212,0.35)]',
    badgeClass: 'bg-cyan-600 dark:bg-cyan-500',
  },
  {
    frameClass:
      'border-[3px] border-amber-500 box-border shadow-[inset_0_0_28px_-14px_rgba(245,158,11,0.32)]',
    badgeClass: 'bg-amber-600 dark:bg-amber-500',
  },
  {
    frameClass:
      'border-[3px] border-emerald-500 box-border shadow-[inset_0_0_28px_-14px_rgba(16,185,129,0.32)]',
    badgeClass: 'bg-emerald-600 dark:bg-emerald-500',
  },
  {
    frameClass: 'border-[3px] border-rose-500 box-border shadow-[inset_0_0_28px_-14px_rgba(244,63,94,0.32)]',
    badgeClass: 'bg-rose-600 dark:bg-rose-500',
  },
  {
    frameClass: 'border-[3px] border-sky-500 box-border shadow-[inset_0_0_28px_-14px_rgba(14,165,233,0.32)]',
    badgeClass: 'bg-sky-600 dark:bg-sky-500',
  },
  {
    frameClass:
      'border-[3px] border-orange-500 box-border shadow-[inset_0_0_28px_-14px_rgba(249,115,22,0.32)]',
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
