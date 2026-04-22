'use client';

import Link from 'next/link';
import type { TechnicalRequirements as TechnicalRequirementsType } from '@/lib/nodes/types';
import { SectionHeader } from './SectionHeader';

const CARD_CLASS =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 p-6';

interface TechnicalRequirementsProps {
  requirements: TechnicalRequirementsType;
}

export function TechnicalRequirements({ requirements }: TechnicalRequirementsProps) {
  return (
    <section id="technical-requirements" className="mb-6">
      <div className={CARD_CLASS}>
        <SectionHeader title="Technical requirements" />
        <ul className="space-y-0 mb-4">
          {requirements.map((item) => (
            <li
              key={item.label}
              className="flex justify-between items-center py-2.5 border-b border-zinc-100 dark:border-zinc-800 last:border-0"
            >
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {item.label}
              </span>
              <span className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">
                {item.value}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/nodes?tab=docs"
          className="text-xs font-bold text-cyan-600 dark:text-cyan-400 hover:underline uppercase tracking-widest transition-colors"
        >
          Full setup guide →
        </Link>
      </div>
    </section>
  );
}
