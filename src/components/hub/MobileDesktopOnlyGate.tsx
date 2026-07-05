'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';
import { MobileWalletUnavailableNotice } from '@/components/hub/MobileWalletUnavailableNotice';

export function MobileDesktopOnlyGate({
  title,
  description,
  backHref = '/',
  backLabel = 'Back to Hub',
  children,
}: {
  title: string;
  description?: string;
  backHref?: string;
  backLabel?: string;
  children: ReactNode;
}) {
  const isMobile = useIsMobileViewport();

  if (!isMobile) return <>{children}</>;

  return (
    <div className="mx-auto max-w-lg space-y-5 py-8">
      <MobileWalletUnavailableNotice networks="both" defaultOpen />
      <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm dark:border-zinc-800 dark:bg-zinc-900">
        <p className="text-xs font-black uppercase tracking-widest text-[#02abb8] mb-2">Desktop only</p>
        <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">{title}</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
          {description ??
            'This creator dashboard and its wallet-powered tools are available on desktop browsers only. Mobile is read-only for browsing public content.'}
        </p>
        <Link
          href={backHref}
          className="mt-5 inline-flex rounded-xl bg-[#02abb8] px-4 py-2.5 text-sm font-semibold text-white hover:opacity-90 transition-opacity"
        >
          {backLabel}
        </Link>
      </div>
    </div>
  );
}
