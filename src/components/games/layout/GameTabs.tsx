'use client';

import type { ReactNode } from 'react';

export type GameTab<T extends string = string> = {
  id: T;
  label: string;
  icon?: ReactNode;
  rightAdornment?: ReactNode;
};

export function GameTabs<T extends string>(props: {
  tabs: readonly GameTab<T>[];
  value: T;
  onChange: (next: T) => void;
}) {
  return (
    <div className="relative border-b border-zinc-200 pb-2 dark:border-zinc-800">
      {/* Scrollable tab strip */}
      <div
        className="flex gap-2 overflow-x-auto"
        style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
      >
        {props.tabs.map((t) => (
          <button
            key={t.id}
            type="button"
            onClick={() => props.onChange(t.id)}
            className={`flex-shrink-0 rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
              props.value === t.id
                ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
            }`}
          >
            <span className="inline-flex items-center gap-2">
              {t.icon ? (
                <span className="inline-flex h-4 w-4 items-center justify-center">{t.icon}</span>
              ) : null}
              <span className="whitespace-nowrap">{t.label}</span>
              {t.rightAdornment ? (
                <span className="inline-flex items-center">{t.rightAdornment}</span>
              ) : null}
            </span>
          </button>
        ))}
      </div>

      {/* Right-edge fade hint for overflow */}
      <div className="pointer-events-none absolute inset-y-0 right-0 w-10 bg-gradient-to-l from-white dark:from-zinc-950" />

      {/* Hide webkit scrollbar */}
      <style>{`
        div[style*="scrollbarWidth"]::-webkit-scrollbar { display: none; }
      `}</style>
    </div>
  );
}

