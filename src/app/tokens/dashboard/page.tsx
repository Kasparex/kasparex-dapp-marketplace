'use client';

import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokensListingSidebar } from '@/components/tokens/TokensListingSidebar';
import { TokenDeveloperDashboard } from '@/components/tokens/TokenDeveloperDashboard';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { VBLOG_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';
import { TOKENS_GRADIENT_TEXT } from '@/lib/tokens/theme';

function TokensDashboardPageContent() {
  return (
    <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 min-h-[calc(100vh-4rem)]">
        <div className="flex flex-col lg:flex-row h-full">
          <TokensListingSidebar />

          <div className="flex-1 min-w-0 p-4 sm:p-8 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800 text-base sm:text-lg">
            <div className="max-w-6xl mx-auto">
              <div className="mb-8">
                <p className="mb-4 text-xs font-black uppercase tracking-widest text-[#02abb8]">
                  Developer dashboard
                </p>
                <div className="flex items-center gap-3 mb-2">
                  <span
                    className="h-7 w-1.5 shrink-0 rounded-full bg-[#02abb8] shadow-[0_0_10px_rgba(2,171,184,0.35)]"
                    aria-hidden="true"
                  />
                  <h1 className="text-3xl sm:text-4xl font-bold text-zinc-900 dark:text-zinc-100 leading-tight tracking-tight">
                    Token <span className={TOKENS_GRADIENT_TEXT}>Builder</span>
                  </h1>
                </div>
                <p className="kx-body max-w-3xl">
                  List your project, verify ownership on-chain, and publish modular token landing pages with Kasparex
                  Hub utility.
                </p>
              </div>

              <HubWalletGateShell mode="replace" config={VBLOG_DASHBOARD_GATE}>
                <TokenDeveloperDashboard />
              </HubWalletGateShell>
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

export default function TokensDashboardPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
          <Header />
          <main className="flex flex-1 items-center justify-center p-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading dashboard…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <TokensDashboardPageContent />
    </Suspense>
  );
}
