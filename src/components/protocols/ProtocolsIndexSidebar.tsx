'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { PROTOCOL_FAMILIES } from '@/lib/protocolFamilies';

export function ProtocolsIndexSidebar() {
  const pathname = usePathname();
  const backHref = pathname?.startsWith('/protocols/') && pathname !== '/protocols' ? '/protocols' : '/dapps';
  const backLabel = pathname === '/protocols' ? 'Back to dApps' : 'Back to protocols';

  return (
    <UnifiedSidebar storageKeyPrefix="protocols-index" header={(onHide) => <SidebarHeader backHref={backHref} backLabel={backLabel} onHide={onHide} />}>
      <div className="mb-6 space-y-2">
        <Link href="/knowledge-base" className="k-control-btn w-full">
          Knowledge Base
        </Link>
        <Link href="/dapps" className="k-control-btn w-full">
          dApps marketplace
        </Link>
      </div>
      <p className="mb-2 text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Protocols</p>
      <nav className="space-y-1">
        {PROTOCOL_FAMILIES.map((f) => (
          <Link
            key={f.slug}
            href={`/protocols/${f.slug}`}
            className="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-zinc-700 transition-colors hover:bg-zinc-100 dark:text-zinc-200 dark:hover:bg-zinc-800/70"
          >
            <span>{f.shortLabel}</span>
            <span className="text-[10px] font-bold uppercase text-zinc-400">{f.status}</span>
          </Link>
        ))}
      </nav>
    </UnifiedSidebar>
  );
}
