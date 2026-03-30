'use client';

import type { ReactNode } from 'react';

export function VaultSection({
  title,
  subtitle,
  id,
  children,
}: {
  title: string;
  subtitle?: string;
  id?: string;
  children: ReactNode;
}) {
  return (
    <section id={id} className="scroll-mt-24 space-y-5">
      <div>
        <h2 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">{title}</h2>
        {subtitle ? (
          <p className="text-base text-zinc-500 dark:text-zinc-400 mt-2 max-w-2xl leading-relaxed">{subtitle}</p>
        ) : null}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">{children}</div>
    </section>
  );
}
