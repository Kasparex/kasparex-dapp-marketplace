'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { KxListingCard, KxListingCardBody, KxListingCardMedia } from '@/components/kx/KxListingCard';

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

function ProfileModuleCard({
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
  accent: 'studio';
}) {
  return (
    <KxListingCard accent={accent} className="relative flex min-h-0 flex-col">
      <KxListingCardMedia>
        <div className="absolute inset-0 flex items-center justify-center">
          <svg
            className="h-12 w-12 text-zinc-400 dark:text-zinc-600"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z"
            />
          </svg>
        </div>
        <div className="pointer-events-none absolute left-4 top-4 z-20 opacity-0 transition-opacity duration-200 group-hover:opacity-100">
          <span className="inline-flex items-center rounded-full border border-indigo-500/25 bg-indigo-500/10 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-indigo-800 dark:text-indigo-200">
            {requiredNetwork === 'either' ? 'L1/L2' : requiredNetwork}
          </span>
        </div>
      </KxListingCardMedia>

      <KxListingCardBody className="relative z-10 flex min-h-0 flex-1 flex-col">
        <div className="mb-2 flex items-start justify-between gap-3">
          <h3 className="flex-1 truncate text-[15px] font-semibold text-zinc-900 dark:text-zinc-100" title={title}>
            {title}
          </h3>
        </div>

        <div className="mb-4 min-h-0 flex-grow">
          <p className="line-clamp-3 text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">{description}</p>
        </div>

        <div className="mt-auto border-t border-zinc-100 pt-4 dark:border-zinc-800">
          <div className="flex items-center justify-between gap-3">
            <div className="text-sm font-black tabular-nums text-zinc-900 dark:text-zinc-100">
              {price} {currency}
            </div>
            <button type="button" disabled className="k-control-btn cursor-not-allowed disabled:opacity-50">
              Coming soon
            </button>
          </div>
        </div>
      </KxListingCardBody>
    </KxListingCard>
  );
}

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
                <ProfileModuleCard
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
