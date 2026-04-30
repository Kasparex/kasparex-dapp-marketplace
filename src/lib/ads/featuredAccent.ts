/**
 * Deterministic accent per creative (`hash(id)`): stable SSR/hydration, visually varied across campaigns.
 *
 * Sliders paint chrome in layers above `next/image` (see AdPlacementGrid / AdCard). Thick **border**
 * on the shell (`solidFrameClass`) survives stacking and busy creatives better than thin overlay-only borders.
 */
export type FeaturedAdAccent = {
  /** Thick colored frame around the creative (slot sliders + card hero link). */
  solidFrameClass: string;
  /** Inset glow / inner ring above the bitmap. */
  overlayClass: string;
  badgeClass: string;
  /** Outer emphasis on full dashboard cards (includes footer/meta). */
  outerRingClass: string;
  /** Tailwind gradient stops after `bg-gradient-to-r` on inventory progress bars. */
  progressBarClass: string;
};

const ACCENTS: FeaturedAdAccent[] = [
  {
    solidFrameClass: 'border-[8px] border-fuchsia-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.35)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/75 shadow-[inset_0_0_96px_-28px_rgba(217,70,239,0.72)]',
    badgeClass: '!bg-fuchsia-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-fuchsia-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(217,70,239,0.85)]',
    progressBarClass: 'from-fuchsia-500 via-purple-600 to-fuchsia-600',
  },
  {
    solidFrameClass: 'border-[8px] border-violet-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.32)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/70 shadow-[inset_0_0_96px_-28px_rgba(124,58,237,0.68)]',
    badgeClass: '!bg-violet-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-violet-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(139,92,246,0.82)]',
    progressBarClass: 'from-violet-500 via-purple-600 to-indigo-600',
  },
  {
    solidFrameClass: 'border-[8px] border-cyan-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.38)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/78 shadow-[inset_0_0_96px_-28px_rgba(6,182,212,0.68)]',
    badgeClass: '!bg-cyan-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-cyan-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(34,211,238,0.8)]',
    progressBarClass: 'from-cyan-400 via-sky-500 to-cyan-600',
  },
  {
    solidFrameClass: 'border-[8px] border-amber-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.28)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/65 shadow-[inset_0_0_96px_-28px_rgba(245,158,11,0.62)]',
    badgeClass: '!bg-amber-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-amber-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(251,191,36,0.78)]',
    progressBarClass: 'from-amber-400 via-orange-500 to-amber-600',
  },
  {
    solidFrameClass: 'border-[8px] border-emerald-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.32)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/68 shadow-[inset_0_0_96px_-28px_rgba(16,185,129,0.62)]',
    badgeClass: '!bg-emerald-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-emerald-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(52,211,153,0.78)]',
    progressBarClass: 'from-emerald-400 via-teal-500 to-emerald-600',
  },
  {
    solidFrameClass: 'border-[8px] border-rose-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.34)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/72 shadow-[inset_0_0_96px_-28px_rgba(244,63,94,0.62)]',
    badgeClass: '!bg-rose-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-rose-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(251,113,133,0.82)]',
    progressBarClass: 'from-rose-500 via-pink-600 to-rose-600',
  },
  {
    solidFrameClass: 'border-[8px] border-sky-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.34)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/70 shadow-[inset_0_0_96px_-28px_rgba(14,165,233,0.62)]',
    badgeClass: '!bg-sky-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-sky-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(56,189,248,0.78)]',
    progressBarClass: 'from-sky-400 via-blue-500 to-sky-600',
  },
  {
    solidFrameClass: 'border-[8px] border-orange-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.28)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/66 shadow-[inset_0_0_96px_-28px_rgba(249,115,22,0.62)]',
    badgeClass: '!bg-orange-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-orange-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(251,146,60,0.78)]',
    progressBarClass: 'from-orange-400 via-red-500 to-orange-600',
  },
  {
    solidFrameClass: 'border-[8px] border-pink-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.34)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/74 shadow-[inset_0_0_96px_-28px_rgba(236,72,153,0.65)]',
    badgeClass: '!bg-pink-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-pink-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(244,114,182,0.82)]',
    progressBarClass: 'from-pink-500 via-fuchsia-600 to-pink-600',
  },
  {
    solidFrameClass: 'border-[8px] border-indigo-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.32)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/68 shadow-[inset_0_0_96px_-28px_rgba(99,102,241,0.65)]',
    badgeClass: '!bg-indigo-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-indigo-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(129,140,248,0.82)]',
    progressBarClass: 'from-indigo-500 via-violet-600 to-indigo-700',
  },
  {
    solidFrameClass: 'border-[8px] border-lime-500 shadow-[inset_0_0_0_2px_rgba(0,0,0,0.22)]',
    overlayClass:
      'ring-[3px] ring-inset ring-black/15 shadow-[inset_0_0_96px_-28px_rgba(132,204,22,0.55)]',
    badgeClass: '!bg-lime-500 !text-black',
    outerRingClass:
      'ring-[3px] ring-lime-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(163,230,53,0.72)]',
    progressBarClass: 'from-lime-400 via-emerald-500 to-lime-600',
  },
  {
    solidFrameClass: 'border-[8px] border-teal-500 shadow-[inset_0_0_0_2px_rgba(255,255,255,0.32)]',
    overlayClass:
      'ring-[3px] ring-inset ring-white/68 shadow-[inset_0_0_96px_-28px_rgba(20,184,166,0.62)]',
    badgeClass: '!bg-teal-600 !text-white',
    outerRingClass:
      'ring-[3px] ring-teal-400 ring-offset-[4px] ring-offset-white dark:ring-offset-zinc-950 shadow-[0_0_28px_-6px_rgba(45,212,191,0.78)]',
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
