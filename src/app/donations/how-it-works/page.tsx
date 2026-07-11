'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { HowItWorksWizard } from '@/components/donations/HowItWorksWizard';

export default function DonationsHowItWorksPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="hidden lg:block flex-shrink-0">
            <DonationsSidebar variant="minimal" backLink={{ href: '/donations', label: 'All campaigns' }} />
          </div>
          <div className="lg:hidden flex-shrink-0">
            <DonationsSidebar variant="minimal" backLink={{ href: '/donations', label: 'All campaigns' }} />
          </div>

          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-8 lg:py-10">
            <div className="max-w-4xl mx-auto">
              <Link href="/donations" className="kx-body hover:underline mb-4 inline-block">
                ← Back to campaigns
              </Link>

              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8">
                <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">vDonate</p>
                <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">What happens after a campaign ends?</h1>
                <p className="kx-body">
                  A super simple guide to funds, safety, and refunds - plus how this fits into Revenue Tree.
                </p>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
                  Prefer one page with donor tips?{' '}
                  <Link href="/donations/help" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                    Open vDonate Help
                  </Link>
                  .
                </p>
                <HowItWorksWizard />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
