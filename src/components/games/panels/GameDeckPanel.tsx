'use client';

import type { ReactNode } from 'react';
import { GamePanelCard } from '@/components/games/layout/GamePanelCard';
import { Tooltip } from '@/components/ui/Tooltip';

export type GameDeckResource = {
  id: string;
  label: string;
  value: string;
  subValue?: string;
  description?: string;
  tooltip?: string;
  icon?: ReactNode;
  accent?: 'games' | 'kas' | 'krex' | 'grid' | 'diamonds' | 'purple';
  onClick?: () => void;
};

function accentValueClass(accent?: GameDeckResource['accent']) {
  if (accent === 'kas') return 'text-[#02abb8]';
  if (accent === 'krex') return 'text-[#02abb8]';
  if (accent === 'grid') return 'text-[#02abb8]';
  if (accent === 'diamonds') return 'text-amber-500';
  if (accent === 'purple') return 'text-purple-500 dark:text-purple-400';
  return 'text-emerald-700 dark:text-emerald-300';
}

export function GameDeckPanel(props: {
  title?: string;
  resources: GameDeckResource[];
  footer?: ReactNode;
  featured?: {
    image?: string;
    onOpenOverview?: () => void;
    tooltip?: string;
  };
}) {
  return (
    <GamePanelCard
      title={props.title ?? 'Game Deck'}
      hint="Values update live as you play."
    >
      {props.featured?.image ? (
        <div className="mb-4">
          <Tooltip content={props.featured.tooltip ?? 'Click to open overview'}>
            <button
              type="button"
              onClick={() => props.featured?.onOpenOverview?.()}
              disabled={!props.featured?.onOpenOverview}
              className="group relative block w-full overflow-hidden rounded-xl border border-zinc-200 bg-zinc-100 disabled:cursor-default dark:border-zinc-800 dark:bg-zinc-950/40"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={props.featured.image}
                alt="Featured"
                className="aspect-video w-full object-cover transition-transform group-hover:scale-[1.02]"
              />
            </button>
          </Tooltip>
        </div>
      ) : null}

      <ul className="space-y-0">
        {props.resources.map((r) => {
          const clickable = typeof r.onClick === 'function';
          const Row = clickable ? 'button' : 'div';
          const Wrapper = r.tooltip ? Tooltip : null;
          const wrapperProps = r.tooltip ? ({ content: r.tooltip } as const) : null;
          return (
            <li key={r.id} className="border-b border-zinc-100 dark:border-zinc-800 last:border-0">
              {Wrapper ? (
                <Wrapper {...wrapperProps!}>
                  <Row
                    type={clickable ? 'button' : undefined}
                    onClick={r.onClick}
                    className={[
                      'w-full flex items-center justify-between gap-3 py-2.5 px-3 text-left transition-colors',
                      clickable ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg' : '',
                    ].join(' ')}
                  >
                    <div className="min-w-0">
                      <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                        {r.icon ? <span className="inline-flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-400">{r.icon}</span> : null}
                        <span className="truncate font-medium">{r.label}</span>
                      </div>
                      {r.description ? <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">{r.description}</div> : null}
                    </div>
                    <div className="text-right">
                      <div className={`text-base font-black tabular-nums ${accentValueClass(r.accent)}`}>{r.value}</div>
                      {r.subValue ? (
                        <div className={`mt-0.5 text-[11px] font-semibold ${r.accent ? accentValueClass(r.accent) : 'text-zinc-500 dark:text-zinc-500'}`}>
                          {r.subValue}
                        </div>
                      ) : null}
                    </div>
                  </Row>
                </Wrapper>
              ) : (
                <Row
                  type={clickable ? 'button' : undefined}
                  onClick={r.onClick}
                  className={[
                    'w-full flex items-center justify-between gap-3 py-2.5 px-3 text-left transition-colors',
                    clickable ? 'hover:bg-zinc-50 dark:hover:bg-zinc-800/50 rounded-lg' : '',
                  ].join(' ')}
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 text-sm text-zinc-600 dark:text-zinc-400">
                      {r.icon ? <span className="inline-flex h-4 w-4 items-center justify-center text-zinc-500 dark:text-zinc-400">{r.icon}</span> : null}
                      <span className="truncate font-medium">{r.label}</span>
                    </div>
                    {r.description ? <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">{r.description}</div> : null}
                  </div>
                  <div className="text-right">
                    <div className={`text-base font-black tabular-nums ${accentValueClass(r.accent)}`}>{r.value}</div>
                    {r.subValue ? (
                      <div className={`mt-0.5 text-[11px] font-semibold ${r.accent ? accentValueClass(r.accent) : 'text-zinc-500 dark:text-zinc-500'}`}>
                        {r.subValue}
                      </div>
                    ) : null}
                  </div>
                </Row>
              )}
            </li>
          );
        })}
      </ul>

      {props.footer ? <div className="mt-4 text-xs text-zinc-600 dark:text-zinc-400">{props.footer}</div> : null}
    </GamePanelCard>
  );
}

