'use client';

import type { ReactNode } from 'react';

export type GameDeckResource = {
  id: string;
  label: string;
  value: string;
  hint?: string;
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

export function GameDeckPanel(props: { title?: string; resources: GameDeckResource[]; footer?: ReactNode }) {
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs font-bold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">{props.title ?? 'Game Deck'}</p>
      <div className="mt-4 space-y-2">
        {props.resources.map((r) => {
          const clickable = typeof r.onClick === 'function';
          const Row = clickable ? 'button' : 'div';
          return (
            <Row
              key={r.id}
              type={clickable ? 'button' : undefined}
              onClick={r.onClick}
              className={[
                'w-full rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3 text-left transition-colors dark:border-zinc-800 dark:bg-zinc-950',
                clickable ? 'hover:bg-zinc-100 dark:hover:bg-zinc-800/60' : '',
              ].join(' ')}
            >
              <div className="flex items-start justify-between gap-3">
                <div className="min-w-0">
                  <div className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 dark:text-zinc-500">{r.label}</div>
                  {r.hint ? <div className="mt-1 text-[11px] text-zinc-500 dark:text-zinc-500">{r.hint}</div> : null}
                </div>
                <div className={`text-2xl font-black tabular-nums leading-none ${accentValueClass(r.accent)}`}>{r.value}</div>
              </div>
            </Row>
          );
        })}
      </div>
      {props.footer ? <div className="mt-4 text-xs text-zinc-500 dark:text-zinc-500">{props.footer}</div> : null}
    </div>
  );
}

