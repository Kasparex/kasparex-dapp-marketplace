'use client';

import type { ReactNode } from 'react';

/**
 * Standardized Hub dashboard page header (vBlog Creator Center pattern):
 * kicker, tilt bar + title with accent word, excerpt.
 * Accent colors follow HubAccentScope CSS variables.
 */
export function HubDashboardPageHeader(props: {
  kicker: string;
  title: string;
  titleAccent: string;
  excerpt?: string;
  meta?: ReactNode;
  className?: string;
}) {
  const { kicker, title, titleAccent, excerpt, meta, className = '' } = props;

  return (
    <div className={`mb-8 ${className}`.trim()}>
      <p className="mb-4 text-xs font-black uppercase tracking-widest text-[color:var(--hub-accent,#02abb8)]">
        {kicker}
      </p>
      <div className="mb-2 flex items-center gap-3">
        <span
          className="hub-tilt-bar h-7 w-1.5 shrink-0 rounded-full"
          aria-hidden="true"
        />
        <h1 className="text-3xl font-bold leading-tight tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
          {title}{' '}
          <span className="text-[color:var(--hub-accent,#02abb8)]">{titleAccent}</span>
        </h1>
      </div>
      {excerpt ? <p className="kx-body max-w-3xl">{excerpt}</p> : null}
      {meta ? <div className="mt-2">{meta}</div> : null}
    </div>
  );
}
