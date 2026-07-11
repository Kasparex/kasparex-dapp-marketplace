'use client';

import Link from 'next/link';
import type { ReactNode } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { HowItWorksWizard } from '@/components/donations/HowItWorksWizard';
import { DonorsGuideContent } from '@/components/donations/DonorsGuideContent';

const HELP_SECTION_NAV: { id: string; label: string; icon: ReactNode }[] = [
  {
    id: 'how-it-works',
    label: 'Walkthrough',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
      </svg>
    ),
  },
  {
    id: 'donors',
    label: 'Donors · Claims & refunds',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
        />
      </svg>
    ),
  },
];

export default function DonationsHelpPage() {
  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="hidden lg:block flex-shrink-0">
            <DonationsSidebar
              variant="minimal"
              backLink={{ href: '/donations', label: 'All campaigns' }}
              sectionNavItems={HELP_SECTION_NAV}
            />
          </div>
          <div className="lg:hidden flex-shrink-0">
            <DonationsSidebar
              variant="minimal"
              backLink={{ href: '/donations', label: 'All campaigns' }}
              sectionNavItems={HELP_SECTION_NAV}
            />
          </div>

          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-8 lg:py-10">
            <div className="max-w-4xl mx-auto">
              <Link href="/donations" className="kx-body hover:underline mb-4 inline-block">
                ← Back to campaigns
              </Link>

              <section id="how-it-works" className="scroll-mt-24">
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 mb-12">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">vDonate</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">What happens after a campaign ends?</h1>
                  <p className="kx-body">
                    A super simple guide to funds, safety, and refunds - plus how this fits into Revenue Tree.
                  </p>
                  <HowItWorksWizard />
                </div>
              </section>

              <section id="donors" className="scroll-mt-24">
                <DonorsGuideContent />
              </section>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
