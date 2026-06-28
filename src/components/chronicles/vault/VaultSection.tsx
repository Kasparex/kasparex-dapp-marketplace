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
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">{title}</h2>
        {typeof count === 'number' ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            {count} offer{count !== 1 ? 's' : ''} found
          </p>
        ) : null}
        {subtitle ? (
          <p className="text-base text-zinc-600 dark:text-white/75 mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
        ) : null}
      </div>
      {controls ? <div>{controls}</div> : null}
      <div className="grid gap-6 sm:grid-cols-2 xl:grid-cols-3">{children}</div>
    </section>
  );
}
