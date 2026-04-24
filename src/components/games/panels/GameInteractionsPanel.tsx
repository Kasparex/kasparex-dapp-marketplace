'use client';

import Link from 'next/link';

export type GameInteraction = {
  title: string;
  punch: string;
  toSlug?: string;
  toHref?: string;
  requirement?: string;
};

export function GameInteractionsPanel(props: { interactions?: GameInteraction[]; title?: string }) {
  const interactions = props.interactions ?? [];
  if (interactions.length === 0) return null;
  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900/60">
      <p className="text-xs font-bold uppercase tracking-wider text-white">{props.title ?? 'Interactions'}</p>
      <div className="mt-3 space-y-2">
        {interactions.map((c) => (
          <Link
            key={`${c.title}-${c.toHref ?? c.toSlug ?? 'x'}`}
            href={c.toHref ?? (c.toSlug ? `/games/${c.toSlug}` : '/games')}
            className="block rounded-2xl border border-zinc-200 bg-white p-3 transition-colors hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-950 dark:hover:bg-zinc-800/50"
          >
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{c.title}</p>
            <p className="mt-1 text-xs text-zinc-600 dark:text-zinc-400">{c.punch}</p>
            {c.requirement ? <p className="mt-2 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300">Requirement: {c.requirement}</p> : null}
          </Link>
        ))}
      </div>
    </div>
  );
}

