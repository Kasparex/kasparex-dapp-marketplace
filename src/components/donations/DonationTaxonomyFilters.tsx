'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { DONATION_CATEGORIES } from '@/lib/donations/categories';

export function DonationCategoryFilter({
  value,
  onChange,
}: {
  value: string | null;
  onChange: (value: string | null) => void;
}) {
  return (
    <select
      className="k-control-btn min-w-[180px] h-10"
      value={value ?? ''}
      onChange={(e) => onChange(e.target.value ? e.target.value : null)}
    >
      <option value="">All categories</option>
      {DONATION_CATEGORIES.map((c) => (
        <option key={c} value={c}>
          {c}
        </option>
      ))}
    </select>
  );
}

export type DonationNetworkFilterValue = 'all' | 'l1' | 'l2';

export function DonationNetworkFilter({
  value,
  onChange,
}: {
  value: DonationNetworkFilterValue;
  onChange: (value: DonationNetworkFilterValue) => void;
}) {
  return (
    <select className="k-control-btn min-w-[160px] h-10" value={value} onChange={(e) => onChange(e.target.value as DonationNetworkFilterValue)}>
      <option value="all">All networks</option>
      <option value="l1">Kaspa L1 (covenant + tips)</option>
      <option value="l2">L2 escrow (Igra)</option>
    </select>
  );
}

export function DonationTagMultiFilter({
  allTags,
  selectedTags,
  onToggleTag,
}: {
  allTags: string[];
  selectedTags: string[];
  onToggleTag: (tag: string) => void;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onDown = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) setIsOpen(false);
    };
    if (isOpen) document.addEventListener('mousedown', onDown);
    return () => document.removeEventListener('mousedown', onDown);
  }, [isOpen]);

  const filteredTags = useMemo(() => {
    const q = query.trim().toLowerCase();
    const base = q ? allTags.filter((t) => t.toLowerCase().includes(q)) : allTags;
    return base.slice(0, 50);
  }, [allTags, query]);

  const label =
    selectedTags.length === 0 ? 'Tags' : selectedTags.length === 1 ? `Tag: ${selectedTags[0]}` : `Tags: ${selectedTags.length}`;

  return (
    <div className="relative flex-shrink-0 overflow-visible" ref={containerRef}>
      <button type="button" onClick={() => setIsOpen((v) => !v)} className="k-control-btn min-w-[140px] h-10">
        <span className="truncate">{label}</span>
        <svg className="w-4 h-4 ml-auto shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {isOpen && (
        <div className="absolute left-0 top-full mt-1.5 w-64 bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-xl shadow-lg z-[9999] overflow-hidden">
          <div className="p-2 border-b border-zinc-200 dark:border-zinc-800">
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Filter tags…"
              className="w-full px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 text-sm"
            />
          </div>
          <div className="max-h-[280px] overflow-auto">
            {filteredTags.length === 0 && (
              <div className="px-4 py-3 kx-body">No tags</div>
            )}
            {filteredTags.map((tag) => {
              const checked = selectedTags.includes(tag);
              return (
                <button
                  key={tag}
                  type="button"
                  onClick={() => onToggleTag(tag)}
                  className="w-full text-left px-4 py-2.5 text-sm hover:bg-zinc-50 dark:hover:bg-zinc-800 flex items-center gap-2"
                >
                  <span
                    className={`inline-flex items-center justify-center w-4 h-4 rounded border ${
                      checked ? 'bg-emerald-600 border-emerald-600' : 'border-zinc-300 dark:border-zinc-700'
                    }`}
                  >
                    {checked && (
                      <svg className="w-3 h-3 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
                      </svg>
                    )}
                  </span>
                  <span className="truncate">{tag}</span>
                </button>
              );
            })}
          </div>
          {selectedTags.length > 0 && (
            <div className="p-2 border-t border-zinc-200 dark:border-zinc-800">
              <button type="button" onClick={() => selectedTags.forEach(onToggleTag)} className="k-control-btn w-full justify-center">
                Clear selected
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

