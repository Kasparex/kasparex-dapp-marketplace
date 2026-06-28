'use client';

import type { ReactNode } from 'react';
import { GameSectionHeader } from '@/components/games/layout/GameSectionHeader';

const CARD_CLASS = 'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

export function GamePanelCard(props: { title: string; hint?: string; right?: ReactNode; children: ReactNode; id?: string }) {
  return (
    <section id={props.id} className="w-full">
      <div className={CARD_CLASS}>
        <GameSectionHeader title={props.title} hint={props.hint} right={props.right} />
        {props.children}
      </div>
    </section>
  );
}

export function GamePanelRows(props: { rows: Array<{ label: ReactNode; value: ReactNode; hint?: string }>; dense?: boolean }) {
  return (
    <ul className="space-y-0">
      {props.rows.map((r, idx) => (
        <li
          key={idx}
          className={`flex justify-between items-center ${props.dense ? 'py-2' : 'py-2.5'} border-b border-zinc-100 dark:border-zinc-800 last:border-0`}
        >
          <span className="kx-body inline-flex items-center gap-1.5">
            {r.label}
          </span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}

