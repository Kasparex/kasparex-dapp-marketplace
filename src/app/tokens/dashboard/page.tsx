'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { TokensListingSidebar } from '@/components/tokens/TokensListingSidebar';
import { TokensBenefitsPanel } from '@/components/tokens/TokensBenefitsPanel';
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { VBLOG_DASHBOARD_GATE } from '@/lib/hub/gateConfigs';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { TOKEN_MODULE_OFFERS } from '@/lib/tokens/modules';
import { TOKENS_GRADIENT_TEXT, TOKENS_ACCENT } from '@/lib/tokens/theme';

export default function TokensDashboardPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <TokensListingSidebar />

        <div className="min-h-[calc(100vh-4rem)] flex-1 min-w-0 overflow-y-auto border-l border-zinc-200 p-4 sm:p-8 lg:p-12 dark:border-zinc-800 text-base sm:text-lg">
          <div className="mx-auto max-w-6xl">
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
                Claim your project, verify ownership on-chain, and publish modular token landing pages with Kasparex Hub utility.
              </p>
            </div>

            <HubWalletGateShell mode="replace" config={VBLOG_DASHBOARD_GATE}>
              <div className="space-y-8">
                <div
                  className="rounded-2xl border p-6 sm:p-8"
                  style={{ borderColor: `${TOKENS_ACCENT}40`, backgroundColor: `${TOKENS_ACCENT}08` }}
                >
                  <DAppSectionHeader title="Coming soon" className="mb-3" />
                  <p className="kx-body-sm mb-6 max-w-2xl">
                    Phase 2 brings claim and verify flows, IPFS publish, and the modular page editor.
                    Connect your wallet now to prepare for launch.
                  </p>
                  <div className="flex flex-wrap gap-3">
                    <Link href="/tokens" className="k-cta-secondary">
                      Browse tokens
                    </Link>
                    <Link href="/deploy-token" className="k-cta-primary">
                      Deploy a token
                    </Link>
                  </div>
                </div>

                <TokensBenefitsPanel variant="panel" />

                <section>
                  <DAppSectionHeader title="Premium module catalog" className="mb-4" />
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {TOKEN_MODULE_OFFERS.map((module) => (
                      <div
                        key={module.id}
                        className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4"
                      >
                        <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{module.title}</h3>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">{module.description}</p>
                        <p className="text-xs font-semibold mt-3 text-[#02abb8]">{module.unlockPriceKas} KAS unlock</p>
                      </div>
                    ))}
                  </div>
                </section>
              </div>
            </HubWalletGateShell>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}
