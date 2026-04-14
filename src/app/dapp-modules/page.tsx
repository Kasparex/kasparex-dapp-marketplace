'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

type ModuleCurrency = 'KAS' | 'KREX';

const MOCK_MODULES: Array<{
  id: string;
  title: string;
  description: string;
  price: number;
  currency: ModuleCurrency;
  requiredNetwork: 'L1' | 'L2' | 'either';
  accent: 'dapps';
}> = [
  {
    id: 'mod-featured',
    title: 'Featured placement',
    description: 'Boost visibility for your profile or dApp with a featured slot placement for a limited time window.',
    price: 25,
    currency: 'KAS',
    requiredNetwork: 'L1',
    accent: 'dapps',
  },
  {
    id: 'mod-unlocks',
    title: 'Unlocks pack',
    description: 'Unlock extra features across Kasparex: premium card accents, extra slots, and advanced actions.',
    price: 50,
    currency: 'KAS',
    requiredNetwork: 'either',
    accent: 'dapps',
  },
  {
    id: 'mod-krex-addon',
    title: 'KREX add-on',
    description: 'Pay with KREX to unlock exclusive perks and discounted upgrades across supported sections.',
    price: 1500,
    currency: 'KREX',
    requiredNetwork: 'L2',
    accent: 'dapps',
  },
] as const;

function ModuleCard({
  title,
  description,
  price,
  currency,
  requiredNetwork,
  accent,
}: {
  title: string;
  description: string;
  price: number;
  currency: ModuleCurrency;
  requiredNetwork: 'L1' | 'L2' | 'either';
  accent: 'dapps';
}) {
  return (
    <KxListingCard accent={accent} className="relative flex flex-col min-h-0">
      <KxListingCardMedia>
        {/* Default placeholder plate (matches listing card behavior). */}
        <div className="absolute inset-0 flex items-center justify-center">
          <svg className="h-12 w-12 text-zinc-400 dark:text-zinc-600" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
        </div>
        <div className="pointer-events-none absolute left-4 top-4 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="inline-flex items-center rounded-full border px-2.5 py-1 text-[10px] font-black uppercase tracking-widest bg-cyan-500/10 border-cyan-500/25 text-cyan-800 dark:text-cyan-200">
            {requiredNetwork === 'either' ? 'L1/L2' : requiredNetwork}
          </span>
        </div>
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex flex-1 min-h-0 flex-col">
        <div className="flex items-start justify-between gap-3 mb-2">
          <h3 className="flex-1 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100" title={title}>
            {title}
          </h3>
        </div>

        <div className="mb-4 flex-grow min-h-0">
          <p className="text-sm text-zinc-600 dark:text-zinc-400 line-clamp-3 leading-relaxed">{description}</p>
        </div>

        <div className="mt-auto pt-4 border-t border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
              {price} {currency}
            </div>
            <button type="button" disabled className="k-control-btn disabled:opacity-50 disabled:cursor-not-allowed">
              Coming soon
            </button>
          </div>
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}

export default function DAppModulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <UnifiedSidebar
            storageKeyPrefix="dapp-modules"
            header={(onHide) => <SidebarHeader backHref="/dapps" backLabel="Back to dApps" onHide={onHide} />}
          >
            <SidebarSection title="Quick actions" className="mb-8">
              <div className="space-y-2">
                <Link href="/list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/tree/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/dapp-modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </SidebarSection>
          </UnifiedSidebar>
        </div>

        <div className="lg:hidden flex-shrink-0">
          <UnifiedSidebar
            storageKeyPrefix="dapp-modules"
            header={(onHide) => <SidebarHeader backHref="/dapps" backLabel="Back to dApps" onHide={onHide} />}
          >
            <SidebarSection title="Quick actions" className="mb-8">
              <div className="space-y-2">
                <Link href="/list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/tree/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/dapp-modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </SidebarSection>
          </UnifiedSidebar>
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-white via-cyan-500/5 to-transparent dark:from-zinc-900 dark:via-cyan-500/10 dark:to-zinc-950 p-8 sm:p-10">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-cyan-800 dark:text-cyan-300 mb-4">
                dApp modules
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                Add-ons, unlocks & extras
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                Modules are paid add-ons (KAS or KREX) that unlock extra features across Kasparex.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {MOCK_MODULES.map((m) => (
                <ModuleCard
                  key={m.id}
                  title={m.title}
                  description={m.description}
                  price={m.price}
                  currency={m.currency}
                  requiredNetwork={m.requiredNetwork}
                  accent={m.accent}
                />
              ))}
            </div>
          </div>
        </div>
      </main>

      <Footer />
    </div>
  );
}

