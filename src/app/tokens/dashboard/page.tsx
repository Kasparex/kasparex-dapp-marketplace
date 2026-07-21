'use client';

import { Suspense } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokensListingSidebar } from '@/components/tokens/TokensListingSidebar';
import { TokenDeveloperDashboard } from '@/components/tokens/TokenDeveloperDashboard';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { VBLOG_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';
import { HubAccentScope } from '@/components/hub/HubAccentScope';
import { HubDashboardPageHeader } from '@/components/hub/HubDashboardPageHeader';

function TokensDashboardPageContent() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="min-h-[calc(100vh-4rem)] flex-1">
        <HubAccentScope projectId="kasparex-tokens" className="flex h-full flex-col lg:flex-row">
          <TokensListingSidebar backHref="/tokens" backLabel="Back to Tokens" />

          <div className="min-w-0 flex-1 overflow-y-auto border-l border-zinc-200 p-4 text-base sm:p-8 sm:text-lg lg:p-12 dark:border-zinc-800">
            <div className="mx-auto max-w-6xl">
              <HubDashboardPageHeader
                kicker="Developer dashboard"
                title="Token"
                titleAccent="Builder"
                excerpt="List your project, verify ownership on-chain, and publish modular token landing pages with Kasparex Hub utility."
              />

              <HubWalletGateShell mode="replace" config={VBLOG_DASHBOARD_GATE}>
                <TokenDeveloperDashboard />
              </HubWalletGateShell>
            </div>
          </div>
        </HubAccentScope>
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
