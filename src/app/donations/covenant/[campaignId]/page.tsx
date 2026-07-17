'use client';

import { use, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { CROWDKAS_CAMPAIGN_SECTION_NAV } from '@/components/donations/crowdKasCampaignNav';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { CovenantCrowdfundRightColumn } from '@/components/donations/CovenantCrowdfundRightColumn';
import {
  covenantCampaignBackerCount,
  covenantCampaignGoalKas,
  covenantCampaignIsActive,
  covenantCampaignGoalReached,
  covenantCampaignProgress,
  covenantCampaignRaisedKas,
} from '@/lib/donations/covenantCrowdfund';
import { DEFAULT_DONATION_IMAGE } from '@/lib/donations/constants';
import { CrowdKasPrototypeNotice } from '@/components/donations/CrowdKasUi';
import { KxRichTextContent } from '@/components/ui/KxRichTextContent';
import { getAddressExplorerUrl } from '@/lib/walletUi';

export default function CovenantCrowdfundPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);
  const { allCampaigns, loading } = useCovenantCrowdfund();

  const campaign = useMemo(
    () => allCampaigns.find((c) => c.id === campaignId) ?? null,
    [allCampaigns, campaignId]
  );

  if (loading && !campaign) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <div className="animate-pulse space-y-4">
            <div className="h-8 bg-zinc-200 dark:bg-zinc-700 rounded w-2/3" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-full" />
            <div className="h-4 bg-zinc-200 dark:bg-zinc-700 rounded w-1/2" />
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  if (!campaign) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Campaign not found</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2 max-w-md mx-auto">
              This L1 covenant campaign is not on this device. Open the link in the browser where it was created, or
              launch a new campaign from vDonate Studio.
            </p>
            <Link href="/donations" className="inline-block mt-4 text-emerald-600 dark:text-emerald-400 hover:underline">
              ← All campaigns
            </Link>
            <Link
              href="/donations/studio#covenant-create"
              className="inline-block mt-4 ml-4 text-emerald-600 dark:text-emerald-400 hover:underline"
            >
              Create campaign
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const raised = covenantCampaignRaisedKas(campaign);
  const goal = covenantCampaignGoalKas(campaign);
  const progress = covenantCampaignProgress(campaign);
  const backers = covenantCampaignBackerCount(campaign);
  const isLive = covenantCampaignIsActive(campaign);
  const goalReached = covenantCampaignGoalReached(campaign);
  const deadlineDate = new Date(campaign.deadline);
  const creatorExplorer = getAddressExplorerUrl({ kind: 'kaspa-l1', address: campaign.creator });

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          <div className="hidden lg:block flex-shrink-0">
            <DonationsSidebar
              variant="minimal"
              backLink={{ href: '/donations', label: 'All campaigns' }}
              sectionNavItems={CROWDKAS_CAMPAIGN_SECTION_NAV}
            />
          </div>
          <div className="lg:hidden flex-shrink-0">
            <DonationsSidebar
              variant="minimal"
              backLink={{ href: '/donations', label: 'All campaigns' }}
              sectionNavItems={CROWDKAS_CAMPAIGN_SECTION_NAV}
            />
          </div>

          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-8 lg:py-8">
            <Link href="/donations" className="kx-body hover:underline mb-4 inline-block">
              ← All campaigns
            </Link>
            <Link
              href="/donations/help#how-it-works"
              className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline mb-4 ml-4 inline-block"
            >
              What happens after it ends?
            </Link>
            <Link
              href="/donations/help#donors"
              className="kx-body hover:underline mb-4 ml-4 inline-block"
            >
              Donors · Claims &amp; refunds
            </Link>

            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
              <div className="lg:col-span-3 space-y-6">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                  <div id="crowdkas-overview" className="scroll-mt-28">
                    <div className="aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                      <img src={DEFAULT_DONATION_IMAGE} alt="" className="w-full h-full object-cover" />
                    </div>
                    <div className="p-6 md:p-8 pb-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">
                          {campaign.title}
                        </h1>
                        <span className="text-xs px-2 py-1 rounded bg-teal-100 dark:bg-teal-900/40 text-teal-800 dark:text-teal-200 font-medium">
                          L1 • Covenant
                        </span>
                        {goalReached ? (
                          <span className="text-xs px-2 py-1 rounded bg-sky-100 dark:bg-sky-900/40 text-sky-800 dark:text-sky-200 font-medium">
                            Goal reached
                          </span>
                        ) : null}
                        {isLive ? (
                          <span className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                            Active
                          </span>
                        ) : (
                          <span className="text-xs px-2 py-1 rounded bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-100 font-medium">
                            Ended
                          </span>
                        )}
                      </div>
                      <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                        Creator:{' '}
                        {creatorExplorer ? (
                          <a
                            href={creatorExplorer}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="hover:text-emerald-600 dark:hover:text-emerald-400 underline"
                          >
                            {campaign.creator.replace(/^kaspa:/i, '').slice(0, 10)}...
                            {campaign.creator.slice(-8)}
                          </a>
                        ) : (
                          campaign.creator
                        )}
                      </p>
                      <div className="mt-4">
                        <CrowdKasPrototypeNotice />
                      </div>
                    </div>
                  </div>

                  <div
                    id="crowdkas-progress"
                    className="scroll-mt-28 px-6 md:px-8 pb-6 border-t border-zinc-100 dark:border-zinc-800 pt-6"
                  >
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Raised</p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{raised.toFixed(4)} KAS</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Target</p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{goal.toFixed(4)} KAS</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Backers</p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{backers}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ends</p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">
                          {deadlineDate.toLocaleDateString()}
                        </p>
                      </div>
                    </div>
                    <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div
                    id="crowdkas-story"
                    className="scroll-mt-28 px-6 md:px-8 pb-6 border-t border-zinc-100 dark:border-zinc-800 pt-6"
                  >
                    {campaign.memo ? (
                      <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
                        <KxRichTextContent html={campaign.memo} className="kx-prose" />
                      </div>
                    ) : (
                      <p className="kx-body">No description provided for this campaign.</p>
                    )}
                    <div className="mt-4">
                      <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">How this campaign works</h3>
                      <ul className="list-disc list-inside space-y-1 kx-body">
                        <li>All-or-nothing: the creator claims only if the goal is met before the deadline.</li>
                        <li>If the goal is missed, backers can refund their pledges after the deadline.</li>
                        <li>Each pledge locks KAS in a Kaspa L1 covenant UTXO until claim or refund.</li>
                      </ul>
                    </div>
                  </div>

                  <div
                    id="crowdkas-links"
                    className="scroll-mt-28 px-6 md:px-8 pb-8 border-t border-zinc-100 dark:border-zinc-800 pt-6"
                  >
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Links</h3>
                    <div className="flex flex-wrap gap-3 text-sm">
                      <Link href="/donations/help" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                        vDonate Help
                      </Link>
                      <Link href="/dapps/covenant-crowdfund" className="text-emerald-600 dark:text-emerald-400 hover:underline">
                        Covenant Crowdfund dApp
                      </Link>
                      {creatorExplorer ? (
                        <a
                          href={creatorExplorer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-emerald-600 dark:text-emerald-400 hover:underline"
                        >
                          Creator on explorer
                        </a>
                      ) : null}
                    </div>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2">
                <CovenantCrowdfundRightColumn campaign={campaign} />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
