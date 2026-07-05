'use client';

import type { ReactNode } from 'react';
import { HUB_HALO_DESKTOP_ONLY } from '@/lib/hub/haloHeaders';

export type HubHaloBadgeVariant = 'pulse' | 'plain';
export type HubHaloTheme = 'cyan' | 'violet';

const HALO_THEMES: Record<
  HubHaloTheme,
  {
    section: string;
    radialTop: string;
    radialBottom: string;
    glow: string;
    frameA: string;
    frameB: string;
    badge: string;
    pulse: string;
  }
> = {
  cyan: {
    section:
      'bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/25 dark:to-zinc-950',
    radialTop:
      'bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.16),transparent_70%)]',
    radialBottom:
      'bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.09),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.12),transparent_70%)]',
    glow: 'bg-cyan-500/5',
    frameA: 'border-cyan-500/20',
    frameB: 'border-cyan-400/15',
    badge: 'bg-cyan-500/10 border-cyan-500/25 text-cyan-800 dark:text-cyan-200',
    pulse: 'bg-cyan-400 bg-cyan-500',
  },
  violet: {
    section:
      'bg-gradient-to-br from-zinc-100 via-violet-50/60 to-purple-50/40 dark:from-zinc-950 dark:via-violet-950/30 dark:to-purple-950/20',
    radialTop:
      'bg-[radial-gradient(ellipse_at_top_right,_rgba(167,139,250,0.18),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(139,92,246,0.22),transparent_70%)]',
    radialBottom:
      'bg-[radial-gradient(ellipse_at_bottom_left,_rgba(192,132,252,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(168,85,247,0.16),transparent_70%)]',
    glow: 'bg-violet-500/8',
    frameA: 'border-violet-400/25',
    frameB: 'border-purple-400/20',
    badge: 'bg-violet-500/10 border-violet-400/30 text-violet-800 dark:text-violet-200',
    pulse: 'bg-violet-400 bg-violet-500',
  },
};

/** Shared marketplace-style hero card (aligned with `/dapps` halo visuals). */
export function HubHaloHeader(props: {
  id?: string;
  badgeLabel: string;
  badgeVariant?: HubHaloBadgeVariant;
  theme?: HubHaloTheme;
  title: ReactNode;
  subtitle: ReactNode;
  /** Secondary row under subtitle (buttons, shortcuts). */
  actions?: ReactNode;
  /** Optional right column (stats, promo, ads slot). Hidden below `lg` unless `mobileRightSlot` set. */
  rightSlot?: ReactNode;
  /** Omit floating corner outline decorations (helps keep focus on a dense right-slot panel). */
  hideAccentFrames?: boolean;
}) {
  const badgeVariant = props.badgeVariant ?? 'pulse';
  const theme = HALO_THEMES[props.theme ?? 'cyan'];
  const showAccentFrames = !props.hideAccentFrames;
  const [pulseOuter, pulseInner] = theme.pulse.split(' ');
  return (
    <section
      id={props.id}
      className={`scroll-mt-24 relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden border border-zinc-200 dark:border-zinc-800/50 ${HUB_HALO_DESKTOP_ONLY} ${theme.section}`}
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className={`absolute top-0 right-0 w-[60%] h-[80%] ${theme.radialTop} rounded-full blur-3xl`} />
        <div className={`absolute bottom-0 left-0 w-[50%] h-[60%] ${theme.radialBottom} rounded-full blur-3xl`} />
        <div className={`absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 ${theme.glow} rounded-full blur-3xl`} />
        {showAccentFrames ? (
          <>
            <div className={`absolute top-8 right-12 w-32 h-32 border ${theme.frameA} rounded-2xl rotate-12 hidden sm:block`} />
            <div className={`absolute bottom-12 right-1/4 w-24 h-24 border ${theme.frameB} rounded-xl -rotate-6 hidden sm:block`} />
          </>
        ) : null}
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-start lg:justify-between gap-8 lg:gap-10">
        <div className="max-w-2xl">
          <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-full border text-[10px] font-black uppercase tracking-[0.2em] mb-6 ${theme.badge}`}>
            {badgeVariant === 'pulse' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className={`animate-ping absolute inline-flex h-full w-full rounded-full ${pulseOuter} opacity-75`} />
                  <span className={`relative inline-flex rounded-full h-2 w-2 ${pulseInner}`} />
                </span>
                {props.badgeLabel}
              </>
            ) : (
              props.badgeLabel
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">{props.title}</h1>
          <div className="kx-body max-w-xl leading-relaxed mb-6">{props.subtitle}</div>
          {props.actions ? <div className="flex flex-wrap gap-3">{props.actions}</div> : null}
        </div>
        {props.rightSlot ? (
          <div className="w-full lg:w-auto lg:max-w-xl lg:flex-shrink-0 lg:min-w-0">{props.rightSlot}</div>
        ) : null}
      </div>
    </section>
  );
}
