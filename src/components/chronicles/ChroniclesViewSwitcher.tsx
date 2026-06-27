'use client';

import type { ReactNode } from 'react';
import type { ChroniclesViewMode } from '@/lib/chronicles/types';
import { KxTabStrip } from '@/components/ui/KxTabStrip';

const modes: {
  id: ChroniclesViewMode;
  title: string;
  aria: string;
  icon: ReactNode;
}[] = [
  {
    id: 'card',
    title: 'Card view',
    aria: 'Card view',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
        />
      </svg>
    ),
  },
  {
    id: 'table',
    title: 'Table view',
    aria: 'Table view',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z"
        />
      </svg>
    ),
  },
  {
    id: 'compact',
    title: 'Compact view',
    aria: 'Compact view',
    icon: (
      <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
];

export function ChroniclesViewSwitcher({
  value,
  onChange,
}: {
  value: ChroniclesViewMode;
  onChange: (v: ChroniclesViewMode) => void;
}) {
  return (
    <KxTabStrip
      value={value}
      onChange={onChange}
      options={modes.map((m) => ({
        value: m.id,
        icon: m.icon,
        title: m.title,
        ariaLabel: m.aria,
      }))}
      ariaLabel="View mode"
      iconOnly
      className="shrink-0"
    />
  );
}
