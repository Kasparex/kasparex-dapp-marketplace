'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { UnifiedSidebar } from '@/components/UnifiedSidebar';
import { SidebarHeader } from '@/components/sidebar/SidebarHeader';
import { SidebarSection } from '@/components/sidebar/SidebarSection';

type ModuleCurrency = 'KAS' | 'KREX';
type ModuleAccent = 'emerald' | 'amber';

const MOCK_MODULES: Array<{
  id: string;
  title: string;
  description: string;
  price: number;
  currency: ModuleCurrency;
  accent: ModuleAccent;
  tags?: string[];
}> = [
  {
    id: 'mod-featured',
    title: 'Featured placement',
    description: 'Boost visibility for your profile or dApp with a featured slot placement for a limited time window.',
    price: 25,
    currency: 'KAS',
    accent: 'emerald',
    tags: ['Boost', 'Visibility'],
  },
  {
    id: 'mod-unlocks',
    title: 'Unlocks pack',
    description: 'Unlock extra features across Kasparex: premium card accents, extra slots, and advanced actions.',
    price: 50,
    currency: 'KAS',
    accent: 'amber',
    tags: ['Unlocks', 'Premium'],
  },
  {
    id: 'mod-krex-addon',
    title: 'KREX add-on',
    description: 'Pay with KREX to unlock exclusive perks and discounted upgrades across supported sections.',
    price: 1500,
    currency: 'KREX',
    accent: 'emerald',
    tags: ['KREX', 'Discounts'],
  },
] as const;

function ModuleCard({
  title,
  description,
  price,
  currency,
  accent,
  tags = [],
}: {
  title: string;
  description: string;
  price: number;
  currency: ModuleCurrency;
  accent: ModuleAccent;
  tags?: string[];
}) {
  const borderClass =
    accent === 'amber'
      ? 'border-amber-300/50 dark:border-amber-600/35'
      : 'border-emerald-300/50 dark:border-emerald-600/35';
  const heroGradient =
    accent === 'amber'
      ? 'from-amber-500/30 via-zinc-100 to-zinc-50 dark:from-amber-500/18 dark:via-zinc-900 dark:to-zinc-950'
      : 'from-emerald-500/30 via-zinc-100 to-zinc-50 dark:from-emerald-500/18 dark:via-zinc-900 dark:to-zinc-950';
  const btnClass =
    accent === 'amber'
      ? '!bg-amber-600 hover:!bg-amber-700 !text-white !border-amber-500/30'
      : '!bg-emerald-600 hover:!bg-emerald-700 !text-white !border-emerald-500/30';

  return (
    <div className={`rounded-2xl border bg-white/95 dark:bg-zinc-900/80 overflow-hidden flex flex-col ${borderClass}`}>
      <div
        className={`relative aspect-[16/9] bg-gradient-to-br ${heroGradient} border-b border-zinc-200 dark:border-zinc-800 flex flex-col items-center justify-center px-4 text-center`}
      >
        <p className="text-xs font-black uppercase tracking-[0.2em] text-zinc-500 dark:text-zinc-400 mb-2">
          Module add-on
        </p>
        <h3 className="text-xl sm:text-2xl font-black text-zinc-900 dark:text-zinc-100 leading-tight">{title}</h3>
      </div>
      <div className="p-4 sm:p-5 space-y-3 flex flex-col flex-1 min-h-0">
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed">{description}</p>

        <div className="mt-1 space-y-2">
          <div className="flex items-baseline gap-3 flex-wrap">
            <span className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tabular-nums">
              {price} {currency}
            </span>
            <span className="text-sm font-mono text-zinc-500">one-time unlock</span>
          </div>

          {tags.length ? (
            <div className="flex flex-wrap gap-2">
              {tags.slice(0, 3).map((t) => (
                <span
                  key={t}
                  className="px-2 py-0.5 rounded-full bg-cyan-500/10 border border-cyan-500/25 text-cyan-800 dark:text-cyan-200 text-xs font-bold uppercase tracking-wider"
                >
                  {t}
                </span>
              ))}
            </div>
          ) : null}

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Mock module. Payment + unlock flow will be wired next.
          </p>
        </div>

        <button
          type="button"
          disabled
          className={`w-full k-control-btn justify-center mt-auto ${btnClass} disabled:opacity-50 disabled:cursor-not-allowed`}
        >
          Coming soon
        </button>
      </div>
    </div>
  );
}

export default function ModulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />

      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <UnifiedSidebar
            storageKeyPrefix="modules"
            header={(onHide) => <SidebarHeader backHref="/dapps" backLabel="Back to dApps" onHide={onHide} />}
          >
            <SidebarSection title="Quick actions" className="mb-8">
              <div className="space-y-2">
                <Link href="/list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </SidebarSection>
          </UnifiedSidebar>
        </div>

        <div className="lg:hidden flex-shrink-0">
          <UnifiedSidebar
            storageKeyPrefix="modules"
            header={(onHide) => <SidebarHeader backHref="/dapps" backLabel="Back to dApps" onHide={onHide} />}
          >
            <SidebarSection title="Quick actions" className="mb-8">
              <div className="space-y-2">
                <Link href="/list-dapp" className="k-control-btn w-full">
                  List dApp
                </Link>
                <Link href="/dashboard" className="k-control-btn w-full">
                  Revenue Tree
                </Link>
                <Link href="/modules" className="k-control-btn w-full">
                  Modules
                </Link>
              </div>
            </SidebarSection>
          </UnifiedSidebar>
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-white via-emerald-500/5 to-transparent dark:from-zinc-900 dark:via-emerald-500/10 dark:to-zinc-950 p-8 sm:p-10">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 mb-4">
                Modules
              </p>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                Add-ons, unlocks & extras
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                Modules are paid add-ons (KAS or KREX) that unlock extra features across Kasparex.
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {MOCK_MODULES.map((m) => (
                <ModuleCard
                  key={m.id}
                  title={m.title}
                  description={m.description}
                  price={m.price}
                  currency={m.currency}
                  accent={m.accent}
                  tags={m.tags}
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

