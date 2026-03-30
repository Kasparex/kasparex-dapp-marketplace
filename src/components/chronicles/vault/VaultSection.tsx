'use client';

import type { ReactNode } from 'react';

export function VaultSection({
  title,
  subtitle,
  count,
  id,
  controls,
  children,
}: {
  title: string;
  subtitle?: string;
  count?: number;
  id?: string;
  controls?: ReactNode;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <div className="flex items-end justify-between gap-4 flex-wrap">
        <div>
          <div className="flex items-baseline gap-3 flex-wrap">
            <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{title}</h2>
            {typeof count === 'number' ? (
              <span className="text-sm font-mono text-zinc-500 dark:text-zinc-400">{count}</span>
            ) : null}
          </div>
          {subtitle ? (
            <p className="text-base text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
          ) : null}
        </div>
        {subtitle ? (
          null
        ) : null}
      </div>
      {controls ? <div>{controls}</div> : null}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}
