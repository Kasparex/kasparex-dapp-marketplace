'use client';

import type { ChroniclesViewMode } from '@/lib/chronicles/types';

export function ViewModeToggle({
  value,
  onChange,
}: {
  value: ChroniclesViewMode;
  onChange: (v: ChroniclesViewMode) => void;
}) {
  const btn = (mode: ChroniclesViewMode, label: string) => (
    <button
      key={mode}
      type="button"
      onClick={() => onChange(mode)}
      className={`px-3 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors shrink-0 ${
        value === mode
          ? 'bg-[#02abb8]/15 text-[#02abb8] border border-[#02abb8]/30'
          : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 border border-transparent hover:border-zinc-300 dark:hover:border-zinc-600'
      }`}
    >
      {label}
    </button>
  );

  return (
    <div className="flex flex-wrap gap-2 items-center">
      {btn('card', 'Cards')}
      {btn('compact', 'Compact')}
      {btn('table', 'Table')}
    </div>
  );
}
