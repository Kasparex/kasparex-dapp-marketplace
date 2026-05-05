'use client';

import type { ReactNode } from 'react';

export type HubHaloBadgeVariant = 'pulse' | 'plain';

/** Shared marketplace-style hero card (aligned with `/dapps` halo visuals). */
export function HubHaloHeader(props: {
  id?: string;
  badgeLabel: string;
  badgeVariant?: HubHaloBadgeVariant;
  title: ReactNode;
  subtitle: ReactNode;
  /** Secondary row under subtitle (buttons, shortcuts). */
  actions?: ReactNode;
  /** Optional right column (stats, promo, ads slot). Hidden below `lg` unless `mobileRightSlot` set. */
  rightSlot?: ReactNode;
}) {
  const badgeVariant = props.badgeVariant ?? 'pulse';
  return (
    <section
      id={props.id}
      className="scroll-mt-24 relative mb-10 py-12 px-6 sm:px-8 rounded-3xl overflow-hidden bg-gradient-to-br from-zinc-100 via-cyan-50/50 to-zinc-100 dark:from-zinc-950 dark:via-cyan-950/25 dark:to-zinc-950 border border-zinc-200 dark:border-zinc-800/50"
    >
      <div className="absolute inset-0 overflow-hidden">
        <div className="absolute top-0 right-0 w-[60%] h-[80%] bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.12),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_top_right,_rgba(6,182,212,0.16),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-0 w-[50%] h-[60%] bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.09),transparent_70%)] dark:bg-[radial-gradient(ellipse_at_bottom_left,_rgba(34,211,238,0.12),transparent_70%)] rounded-full blur-3xl" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl" />
        <div className="absolute top-8 right-12 w-32 h-32 border border-cyan-500/20 rounded-2xl rotate-12 hidden sm:block" />
        <div className="absolute bottom-12 right-1/4 w-24 h-24 border border-cyan-400/15 rounded-xl -rotate-6 hidden sm:block" />
      </div>

      <div className="relative z-10 flex flex-col lg:flex-row lg:items-center lg:justify-between gap-8">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-800 dark:text-cyan-200 text-[10px] font-black uppercase tracking-[0.2em] mb-6">
            {badgeVariant === 'pulse' ? (
              <>
                <span className="relative flex h-2 w-2">
                  <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75" />
                  <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500" />
                </span>
                {props.badgeLabel}
              </>
            ) : (
              props.badgeLabel
            )}
          </div>
          <h1 className="text-4xl sm:text-5xl md:text-6xl font-black text-zinc-900 dark:text-white mb-4 leading-tight">{props.title}</h1>
          <div className="text-base sm:text-lg text-zinc-600 dark:text-zinc-400 max-w-xl leading-relaxed mb-6">{props.subtitle}</div>
          {props.actions ? <div className="flex flex-wrap gap-3">{props.actions}</div> : null}
        </div>
        {props.rightSlot ? (
          <div className="w-full lg:w-auto lg:min-w-[260px] flex flex-col gap-4 flex-shrink-0">{props.rightSlot}</div>
        ) : null}
      </div>
    </section>
  );
}
