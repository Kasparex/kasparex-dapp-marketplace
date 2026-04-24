'use client';

import type { ReactNode } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { Tooltip } from '@/components/ui/Tooltip';

export type GameDeckResource = {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  hint?: string;
  icon?: ReactNode;
  accent?: 'games' | 'kas' | 'krex' | 'grid' | 'diamonds';
  onClick?: () => void;
};

function accentValueClass(accent?: GameDeckResource['accent']) {
  if (accent === 'kas') return 'text-amber-600 dark:text-amber-400';
  if (accent === 'krex') return 'text-emerald-700 dark:text-emerald-300';
  if (accent === 'grid') return 'text-emerald-700 dark:text-emerald-300';
  if (accent === 'diamonds') return 'text-emerald-700 dark:text-emerald-300';
  return 'text-emerald-700 dark:text-emerald-300';
}

export function GameDeckPanel(props: {
  title?: string;
  resources: GameDeckResource[];
  footer?: ReactNode;
  featured?: {
    image?: string;
    title?: string;
    description?: string;
    onOpenOverview?: () => void;
    tooltip?: string;
  };
}) {
  return (
    <GamePanelCard
      title={props.title ?? 'Game Deck'}
      hint="Values update live as you play."
    >
      <ul className="space-y-0">
        {props.resources.map((r) => {
          const clickable = typeof r.onClick === 'function';
          const Row = clickable ? 'button' : 'div';
          return (
            <li key={r.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              <Row
                type={clickable ? 'button' : undefined}
                onClick={r.onClick}
                className={[
                  'w-full flex items-center justify-between gap-3 py-2.5 text-left transition-colors',
                  clickable ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg px-2 -mx-2' : '',
                ].join(' ')}
              >
                <div className="min-w-0">
                  <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                    {r.icon ? <span className="inline-flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-400">{r.icon}</span> : null}
                    <span className="truncate font-medium">{r.label}</span>
                  </div>
                  {r.hint ? <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">{r.hint}</div> : null}
                </div>
                <div className="text-right">
                  <div className={`text-base font-black tabular-nums ${accentValueClass(r.accent)}`}>{r.value}</div>
                  {r.subValue ? <div className="mt-0.5 text-[11px] font-semibold text-zinc-500 dark:text-zinc-500">{r.subValue}</div> : null}
                </div>
              </Row>
            </li>
          );
        })}
      </ul>

      {props.featured?.image ? (
        <div className="mt-4 border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div className="flex items-start gap-3">
            <Tooltip content={props.featured.tooltip ?? 'Click to open overview'}>
              <button
                type="button"
                onClick={props.featured.onOpenOverview}
                className="group relative overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-950/40"
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={props.featured.image}
                  alt={props.featured.title ?? 'Featured'}
                  className="h-20 w-28 object-cover transition-transform group-hover:scale-[1.02]"
                />
              </button>
            </Tooltip>
            <div className="min-w-0">
              {props.featured.title ? <div className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{props.featured.title}</div> : null}
              {props.featured.description ? (
                <div className="mt-1 text-xs leading-relaxed text-zinc-600 dark:text-zinc-400">{props.featured.description}</div>
              ) : null}
              {props.featured.onOpenOverview ? (
                <button
                  type="button"
                  onClick={props.featured.onOpenOverview}
                  className="mt-2 text-xs font-bold uppercase tracking-wider text-emerald-700 hover:underline dark:text-emerald-300"
                >
                  Open overview
                </button>
              ) : null}
            </div>
          </div>
        </div>
      ) : null}

      {props.footer ? <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">{props.footer}</div> : null}
    </GamePanelCard>
  );
}

