'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';
import { HubModuleListingCard } from '@/components/hub/HubModuleListingCard';

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
            <div className="mb-8">
              <div className="space-y-2">
                <Link href="/u?tab=my-dapps&view=list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/tree/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/dapp-modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </div>
          </UnifiedSidebar>
        </div>

        <div className="lg:hidden flex-shrink-0">
          <UnifiedSidebar
            storageKeyPrefix="dapp-modules"
            header={(onHide) => <SidebarHeader backHref="/dapps" backLabel="Back to dApps" onHide={onHide} />}
          >
            <div className="mb-8">
              <div className="space-y-2">
                <Link href="/u?tab=my-dapps&view=list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/tree/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/dapp-modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </div>
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
              <p className="kx-body max-w-3xl">
                Modules are paid add-ons (KAS or KREX) that unlock extra features across Kasparex.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {MOCK_MODULES.map((m) => (
                <HubModuleListingCard
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

