'use client';

import type { ReactNode } from 'react';
import { GameSectionHeader } from '@/components/games/layout/GameSectionHeader';
import { CHRONICLES_PANEL } from '@/lib/chronicles/typography';

/** Chronicles-matching panel chrome for Games right rails (accent comes from HubAccentScope). */
const CARD_CLASS = `${CHRONICLES_PANEL} p-4`;

export function GamePanelCard(props: {
  title: string;
  hint?: string;
  right?: ReactNode;
  children: ReactNode;
  id?: string;
}) {
  return (
    <section id={props.id} className="w-full min-w-0">
      <div className={CARD_CLASS}>
        <GameSectionHeader title={props.title} hint={props.hint} right={props.right} className="mb-3" />
        {props.children}
      </div>
    </section>
  );
}

export function GamePanelRows(props: {
  rows: Array<{ label: ReactNode; value: ReactNode; hint?: string }>;
  dense?: boolean;
}) {
  return (
    <ul className="space-y-0">
      {props.rows.map((r, idx) => (
        <li
          key={idx}
          className={`flex items-center justify-between border-b border-zinc-100 last:border-0 dark:border-zinc-800 ${
            props.dense ? 'py-2' : 'py-2.5'
          }`}
        >
          <span className="kx-body inline-flex items-center gap-1.5">{r.label}</span>
          <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">{r.value}</span>
        </li>
      ))}
    </ul>
  );
}
