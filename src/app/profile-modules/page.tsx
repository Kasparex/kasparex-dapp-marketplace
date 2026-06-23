'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { HubModuleListingCard } from '@/components/hub/HubModuleListingCard';

type ModuleCurrency = 'KAS' | 'KREX';

const MOCK_PROFILE_MODULES: Array<{
  id: string;
  title: string;
  description: string;
  price: number;
  currency: ModuleCurrency;
  requiredNetwork: 'L1' | 'L2' | 'either';
  accent: 'studio';
}> = [
  {
    id: 'ph-profile-boost',
    title: 'Profile spotlight',
    description: 'Highlight your Profile Hub on Kasparex discovery surfaces for a limited window.',
    price: 15,
    currency: 'KAS',
    requiredNetwork: 'L1',
    accent: 'studio',
  },
  {
    id: 'ph-analytics',
    title: 'Creator analytics pack',
    description: 'Deeper views across articles, products, and dApps tied to your wallet identity.',
    price: 35,
    currency: 'KAS',
    requiredNetwork: 'either',
    accent: 'studio',
  },
  {
    id: 'ph-krex-perks',
    title: 'KREX profile perks',
    description: 'Unlock discounted listing fees and accent styling across your Profile Hub cards.',
    price: 1200,
    currency: 'KREX',
    requiredNetwork: 'L2',
    accent: 'studio',
  },
] as const;

export default function ProfileModulesPage() {
  return (
    <div className="flex min-h-screen flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex flex-1 flex-col lg:flex-row">
        <div className="hidden flex-shrink-0 lg:block">
          <UnifiedSidebar
            storageKeyPrefix="profile-modules"
            header={(onHide) => <SidebarHeader backHref="/u" backLabel="Back to Profile Hub" onHide={onHide} />}
          >
            <div className="mb-8">
              <div className="space-y-2">
                <Link href="/u" className="k-control-btn w-full">
                  Profile Hub
                </Link>
                <Link href="/profile-modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </div>
          </UnifiedSidebar>
        </div>

        <div className="flex-shrink-0 lg:hidden">
          <UnifiedSidebar
            storageKeyPrefix="profile-modules"
            header={(onHide) => <SidebarHeader backHref="/u" backLabel="Back to Profile Hub" onHide={onHide} />}
          >
            <div className="mb-8">
              <div className="space-y-2">
                <Link href="/u" className="k-control-btn w-full">
                  Profile Hub
                </Link>
                <Link href="/profile-modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </div>
          </UnifiedSidebar>
        </div>

        <div className="min-w-0 flex-1 overflow-y-auto border-l border-zinc-200 p-4 sm:p-6 lg:p-12 dark:border-zinc-800">
          <div className="mx-auto max-w-6xl space-y-8">
            <div className="rounded-xl border border-indigo-500/20 bg-gradient-to-br from-white via-indigo-500/5 to-transparent p-8 dark:from-zinc-900 dark:via-indigo-500/10 dark:to-zinc-950 sm:p-10">
              <p className="mb-4 text-sm font-black uppercase tracking-[0.2em] text-indigo-800 dark:text-indigo-300">
                Profile modules
              </p>
              <h1 className="mb-4 text-3xl font-black tracking-tight text-zinc-900 dark:text-zinc-100 sm:text-4xl">
                Add-ons for your Profile Hub
              </h1>
              <p className="max-w-3xl text-lg leading-relaxed text-zinc-600 dark:text-zinc-400">
                Future paid modules (KAS or KREX) that extend creator tools, visibility, and analytics for your wallet
                identity.
              </p>
            </div>

            <div className="grid gap-6 md:grid-cols-2 xl:grid-cols-3">
              {MOCK_PROFILE_MODULES.map((m) => (
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
