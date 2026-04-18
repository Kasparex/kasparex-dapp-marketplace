'use client';

import Link from 'next/link';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import type { ProtocolFamilySlug } from '@/lib/protocolFamilies';

const NAV: { id: string; label: string }[] = [
  { id: 'overview', label: 'Overview' },
  { id: 'tools', label: 'Tools' },
  { id: 'apis', label: 'APIs' },
  { id: 'use-cases', label: 'Use cases' },
  { id: 'docs', label: 'Docs' },
];

export function ProtocolFamilySidebar({ slug, name }: { slug: ProtocolFamilySlug; name: string }) {
  return (
    <UnifiedSidebar
      storageKeyPrefix={`protocol-${slug}`}
      header={(onHide) => <SidebarHeader backHref="/protocols" backLabel="All protocols" onHide={onHide} />}
    >
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">In this protocol</p>
      <p className="mb-4 text-sm font-bold text-zinc-800 dark:text-zinc-100">{name}</p>
      <nav className="space-y-0.5">
        {NAV.map((item) => (
          <Link
            key={item.id}
            href={`/protocols/${slug}#${item.id}`}
            className="block rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/70"
          >
            {item.label}
          </Link>
        ))}
      </nav>
    </UnifiedSidebar>
  );
}
