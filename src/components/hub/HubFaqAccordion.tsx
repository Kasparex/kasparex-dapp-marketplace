'use client';

import { useState } from 'react';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';

export type HubFaqItem = {
  id: string;
  question: string;
  answer: string;
};

/** Hub-wide FAQ accordion (one open at a time by default). */
export function HubFaqAccordion({
  items,
  allowMultiple = false,
  className = '',
}: {
  items: HubFaqItem[];
  allowMultiple?: boolean;
  className?: string;
}) {
  const [openIds, setOpenIds] = useState<Set<string>>(() => new Set());

  if (!items.length) return null;

  const toggle = (id: string) => {
    setOpenIds((prev) => {
      const next = new Set(allowMultiple ? prev : []);
      if (prev.has(id)) {
        next.delete(id);
      } else {
        next.add(id);
      }
      return next;
    });
  };

  return (
    <div className={`space-y-2 ${className}`}>
      {items.map((item) => {
        const open = openIds.has(item.id);
        return (
          <div key={item.id} className={`${KX_SURFACE_NESTED} overflow-hidden`}>
            <button
              type="button"
              onClick={() => toggle(item.id)}
              className="w-full flex items-center justify-between gap-3 p-4 text-left hover:bg-zinc-50/80 dark:hover:bg-white/[0.03] transition-colors"
              aria-expanded={open}
            >
              <span className="font-semibold text-zinc-900 dark:text-zinc-100 text-sm sm:text-base">
                {item.question}
              </span>
              <svg
                className={`w-5 h-5 shrink-0 text-zinc-500 transition-transform ${open ? 'rotate-180' : ''}`}
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                aria-hidden
              >
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                open ? 'max-h-[2000px] opacity-100' : 'max-h-0 opacity-0'
              }`}
            >
              <div className="px-4 pb-4 text-sm text-zinc-600 dark:text-zinc-300 whitespace-pre-wrap border-t border-zinc-200/80 dark:border-zinc-800 pt-3">
                {item.answer}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
