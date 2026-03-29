'use client';

import { useEffect, useId, useState, type ReactNode } from 'react';
import Link from 'next/link';

const STORAGE_KEY = 'chronicles-nav-expanded';

function loadExpanded(): Record<string, boolean> {
  if (typeof window === 'undefined') return {};
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return {};
    const p = JSON.parse(raw) as Record<string, boolean>;
    return typeof p === 'object' && p !== null ? p : {};
  } catch {
    return {};
  }
}

function saveExpanded(next: Record<string, boolean>) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
  } catch {
    /* ignore */
  }
}

export function ChroniclesNavGroup({
  groupId,
  label,
  icon,
  defaultOpen = false,
  children,
  active,
}: {
  groupId: string;
  label: string;
  icon?: ReactNode;
  defaultOpen?: boolean;
  children: ReactNode;
  active?: boolean;
}) {
  const baseId = useId();
  const panelId = `${baseId}-panel`;
  const [open, setOpen] = useState(defaultOpen);

  useEffect(() => {
    const stored = loadExpanded();
    if (stored[groupId] !== undefined) {
      setOpen(stored[groupId]!);
    } else {
      setOpen(defaultOpen);
    }
  }, [groupId, defaultOpen]);

  const toggle = () => {
    setOpen((prev) => {
      const next = !prev;
      const all = loadExpanded();
      all[groupId] = next;
      saveExpanded(all);
      return next;
    });
  };

  const activeClass = active ? 'k-sidebar-item-active' : '';

  return (
    <div className="rounded-lg border border-transparent">
      <button
        type="button"
        onClick={toggle}
        aria-expanded={open}
        aria-controls={panelId}
        className={`k-sidebar-item group w-full text-left ${activeClass}`.trim()}
      >
        {icon != null && (
          <span className="flex-shrink-0 inline-flex items-center justify-center k-sidebar-icon">{icon}</span>
        )}
        <span className="text-xs font-bold uppercase tracking-wide flex-1 min-w-0 leading-snug break-words line-clamp-2 text-left">
          {label}
        </span>
        <svg
          className={`w-4 h-4 text-zinc-500 transition-transform shrink-0 ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? (
        <div id={panelId} className="mt-1 ml-2 pl-2 border-l border-zinc-200 dark:border-zinc-800 space-y-0.5 pb-1">
          {children}
        </div>
      ) : null}
    </div>
  );
}

export function ChroniclesNavSublink({
  href,
  label,
  active,
  draft,
}: {
  href?: string;
  label: string;
  active?: boolean;
  draft?: boolean;
}) {
  const activeClass = active ? 'k-sidebar-item-active' : '';
  if (draft || !href) {
    return (
      <div
        className={`k-sidebar-item group opacity-60 cursor-default text-zinc-500 dark:text-zinc-500 ${activeClass}`.trim()}
        title="Draft: sync from content/story-management to data/chronicles or unlock via Vault"
      >
        <span className="text-xs font-bold uppercase tracking-wide flex-1 min-w-0 leading-snug break-words line-clamp-2 pl-6 text-left">
          {label}
        </span>
        <span className="text-[10px] font-black uppercase text-amber-600 dark:text-amber-500 shrink-0">Draft</span>
      </div>
    );
  }
  return (
    <Link href={href}>
      <div className={`k-sidebar-item group ${activeClass}`.trim()}>
        <span className="text-xs font-bold uppercase tracking-wide flex-1 min-w-0 leading-snug break-words line-clamp-2 pl-6 text-left">
          {label}
        </span>
      </div>
    </Link>
  );
}
