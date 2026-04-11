import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { HowItWorksWizard } from '@/components/donations/HowItWorksWizard';
import { DonorsGuideContent } from '@/components/donations/DonorsGuideContent';

export default function DonationsHelpPage() {
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
              <Link href="/donations" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline mb-4 inline-block">
                ← Back to campaigns
              </Link>

              <nav className="flex flex-wrap gap-2 mb-8 text-sm">
                <a
                  href="#how-it-works"
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Walkthrough
                </a>
                <a
                  href="#donors"
                  className="px-3 py-1.5 rounded-lg border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800"
                >
                  Donors · Claims &amp; refunds
                </a>
              </nav>

              <section id="how-it-works" className="scroll-mt-24">
                <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 mb-12">
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">CrowdKAS</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">What happens after a campaign ends?</h1>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    A super simple guide to funds, safety, and refunds — plus how this fits into Revenue Tree.
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
