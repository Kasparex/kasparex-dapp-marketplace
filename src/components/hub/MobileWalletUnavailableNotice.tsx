'use client';

import { useState } from 'react';
import { useIsMobileViewport } from '@/hooks/useIsMobileViewport';

export type MobileWalletNetworkHint = 'L1' | 'L2' | 'both';

const HEADLINE: Record<MobileWalletNetworkHint, string> = {
  L1: 'L1 wallet connection is not available on mobile yet',
  L2: 'L2 wallet connection is not available on mobile yet',
  both: 'Wallet connection is not available on mobile yet',
};

const DETAIL: Record<MobileWalletNetworkHint, string> = {
  L1: 'Kaspa L1 wallets (KasWare, Kastle, and similar) are supported on desktop browsers for now. Use a desktop computer to connect, publish, pay fees, and manage your content.',
  L2: 'EVM / L2 wallets (MetaMask, Rainbow, WalletConnect, and similar) are supported on desktop browsers for now. Use a desktop computer to connect and use L2 features.',
  both: 'L1 Kaspa and L2 EVM wallet connections are supported on desktop browsers for now. Use a desktop computer to connect, publish, pay fees, and access creator dashboards.',
};

export function MobileWalletUnavailableNotice({
  networks = 'both',
  className = '',
  defaultOpen = false,
}: {
  networks?: MobileWalletNetworkHint;
  className?: string;
  defaultOpen?: boolean;
}) {
  const isMobile = useIsMobileViewport();
  const [open, setOpen] = useState(defaultOpen);

  if (!isMobile) return null;

  return (
    <div
      className={`rounded-xl border border-amber-500/35 bg-amber-500/10 dark:bg-amber-500/5 ${className}`.trim()}
      role="note"
    >
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-3 px-3.5 py-3 text-left"
        aria-expanded={open}
      >
        <span className="mt-0.5 shrink-0 text-amber-600 dark:text-amber-400" aria-hidden>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
        </span>
        <span className="min-w-0 flex-1">
          <span className="block text-sm font-semibold text-amber-950 dark:text-amber-100">
            {HEADLINE[networks]}
          </span>
          <span className="mt-0.5 block text-xs text-amber-900/80 dark:text-amber-200/80">
            Tap for details. Desktop required for now.
          </span>
        </span>
        <svg
          className={`mt-1 h-4 w-4 shrink-0 text-amber-700 dark:text-amber-300 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          aria-hidden
        >
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
        </svg>
      </button>
      {open ? (
        <div className="border-t border-amber-500/25 px-3.5 py-3 text-xs leading-relaxed text-amber-950/90 dark:text-amber-100/90">
          {DETAIL[networks]} You can still browse public content on mobile.
        </div>
      ) : null}
    </div>
  );
}
