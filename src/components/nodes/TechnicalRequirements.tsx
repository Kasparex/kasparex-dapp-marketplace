'use client';

import Link from 'next/link';
import type { TechnicalRequirements as TechnicalRequirementsType } from '@/lib/nodes/types';

const CARD_CLASS =
  'bg-zinc-50 dark:bg-zinc-900 rounded-lg border border-zinc-200 dark:border-zinc-800 p-6';

interface TechnicalRequirementsProps {
  requirements: TechnicalRequirementsType;
}

export function TechnicalRequirements({ requirements }: TechnicalRequirementsProps) {
  return (
    <section id="technical-requirements" className="mb-8">
      <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">
        Technical Requirements
      </h2>
      <div className={CARD_CLASS}>
        <ul className="space-y-2 mb-4">
          {requirements.map((item) => (
            <li
              key={item.label}
              className="flex justify-between items-center py-2 border-b border-zinc-200 dark:border-zinc-800 last:border-0"
            >
              <span className="text-sm text-zinc-600 dark:text-zinc-400">
                {item.label}
              </span>
              <span className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
                {item.value}
              </span>
            </li>
          ))}
        </ul>
        <Link
          href="/api/krex-node"
          className="text-sm font-medium text-[#02abb8] hover:underline"
        >
          Full setup guide →
        </Link>
      </div>
    </section>
  );
}
