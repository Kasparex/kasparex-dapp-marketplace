'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';

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
              <Link href="/donations" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline mb-4 inline-block">
                ← Back to campaigns
              </Link>

              <div className="rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 sm:p-8 space-y-6">
                <div>
                  <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-2">CrowdKAS · Donors</p>
                  <h1 className="text-2xl sm:text-3xl font-bold text-zinc-900 dark:text-zinc-100 mb-2">Claims, refunds &amp; what you should know</h1>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Short guide for people who donate — especially on <strong>L2 escrow</strong> campaigns.
                  </p>
                </div>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">L2 escrow (Igra / Kasplex)</h2>
                  <ul className="list-disc pl-5 text-sm text-zinc-600 dark:text-zinc-400 space-y-2">
                    <li>
                      Your donation is held in the <strong>escrow contract</strong> until the campaign ends or the creator claims after success.
                    </li>
                    <li>
                      If the campaign <strong>reaches its goal</strong> and the deadline passes, the <strong>creator</strong> can claim the pooled funds (minus the on-chain fee split).
                    </li>
                    <li>
                      If the campaign <strong>does not reach the goal</strong> by the deadline, funds are not automatically sent back to everyone. You use{' '}
                      <strong>Claim refund</strong> yourself when the contract allows it — connect the same wallet you donated with and submit the refund transaction.
                    </li>
                    <li>Always confirm the campaign page and contract match the network you expect (e.g. Igra Mainnet).</li>
                  </ul>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">L1 direct (Kaspa)</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    Donations go straight to the creator&apos;s Kaspa address. There is <strong>no escrow refund path</strong> on-chain like L2 — support is between you and the creator.
                    Perks or points may still apply according to how the app records or displays them.
                  </p>
                </section>

                <section className="space-y-3">
                  <h2 className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">Revenue Tree &amp; fees</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">
                    On L2 escrow, part of the donation may route to the platform fee system (Revenue Tree) as defined in the contract. That does not replace your refund rights when a
                    campaign fails — refunds are still handled through the escrow <strong>claim refund</strong> flow when applicable.
                  </p>
                </section>

                <div className="flex flex-wrap gap-3 pt-2">
                  <Link
                    href="/donations/how-it-works"
                    className="k-control-btn !border-emerald-500/30 !bg-emerald-500/10 !text-emerald-800 dark:!text-emerald-300"
                  >
                    Full walkthrough (wizard)
                  </Link>
                  <Link href="/donations" className="k-control-btn">
                    Browse campaigns
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
