import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { DonorsGuideContent } from '@/components/donations/DonorsGuideContent';

export default function DonationsDonorsPage() {
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
            <div className="max-w-3xl mx-auto">
              <Link href="/donations" className="kx-body hover:underline mb-4 inline-block">
                ← Back to campaigns
              </Link>
              <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4">
                All donor guides also live on{' '}
                <Link href="/donations/help#donors" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                  vDonate Help
                </Link>
                .
              </p>
              <DonorsGuideContent />
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
