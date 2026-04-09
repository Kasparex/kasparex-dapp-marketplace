'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';

type MockModule = {
  id: string;
  title: string;
  description: string;
  status: 'mock' | 'planned';
  perks: string[];
};

const MOCK_MODULES: MockModule[] = [
  {
    id: 'featured_image_plus',
    title: 'Featured image + (advanced)',
    description: 'More image slots, gallery header, and social preview tuning for your campaign.',
    status: 'mock',
    perks: ['Up to 5 images', 'Auto OG image', 'Gallery header block'],
  },
  {
    id: 'updates_feed',
    title: 'Campaign updates feed',
    description: 'Post updates to your supporters with optional IPFS attachments and milestones.',
    status: 'mock',
    perks: ['Update posts', 'Milestones', 'Optional supporter-only updates'],
  },
  {
    id: 'custom_cta',
    title: 'Custom CTA buttons',
    description: 'Add extra links/buttons (website, docs, store) to your campaign page and cards.',
    status: 'planned',
    perks: ['1–3 CTAs', 'Icon + label', 'Tracking-ready links'],
  },
  {
    id: 'supporter_roles',
    title: 'Supporter roles',
    description: 'Lightweight supporter tiers (off-chain first, on-chain later) and perks gating.',
    status: 'planned',
    perks: ['Roles', 'Badges', 'Private links'],
  },
];

export default function CrowdKasModulesPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <DonationsSidebar variant="minimal" backLink={{ href: '/donations', label: 'All campaigns' }} />
        </div>
        <div className="lg:hidden flex-shrink-0">
          <DonationsSidebar variant="minimal" backLink={{ href: '/donations', label: 'All campaigns' }} />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="rounded-2xl border border-cyan-500/20 bg-gradient-to-br from-white via-cyan-500/5 to-transparent dark:from-zinc-900 dark:via-cyan-500/10 dark:to-zinc-950 p-8 sm:p-10">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-[#02abb8] mb-4">Vaults & unlocks</p>
              <h1 className="text-3xl sm:text-4xl lg:text-5xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">
                Unlock CrowdKAS modules (mock)
              </h1>
              <p className="text-lg sm:text-xl text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                This page is a placeholder for CrowdKAS upgrades you’ll be able to unlock to enhance the campaign editor and public campaign pages.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/donations/studio" className="k-control-btn">Go to Studio</Link>
                <Link href="/donations" className="k-control-btn">Explore campaigns</Link>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {MOCK_MODULES.map((m) => (
                <div
                  key={m.id}
                  className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6 space-y-4"
                >
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-lg font-black text-zinc-900 dark:text-zinc-100">{m.title}</p>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mt-1">{m.description}</p>
                    </div>
                    <span
                      className={`text-[10px] font-black uppercase tracking-widest px-2 py-1 rounded-full border ${
                        m.status === 'mock'
                          ? 'border-emerald-500/30 bg-emerald-500/10 text-emerald-800 dark:text-emerald-300'
                          : 'border-amber-500/30 bg-amber-500/10 text-amber-900 dark:text-amber-200'
                      }`}
                    >
                      {m.status === 'mock' ? 'Mock' : 'Planned'}
                    </span>
                  </div>

                  <ul className="text-sm text-zinc-600 dark:text-zinc-400 list-disc pl-5 space-y-1">
                    {m.perks.map((p) => (
                      <li key={p}>{p}</li>
                    ))}
                  </ul>

                  <div className="flex flex-wrap gap-3">
                    <button type="button" className="k-control-btn !border-cyan-500/30 !bg-cyan-500/10 !text-[#017a84] dark:!text-[#8ff1f8]">
                      Unlock (mock)
                    </button>
                    <button type="button" className="k-control-btn">
                      Learn more
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}

