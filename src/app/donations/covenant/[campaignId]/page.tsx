'use client';

import { use, useEffect, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { CovenantCrowdfundDetailView } from '@/components/donations/CovenantCrowdfundDetailView';
import { getCrowdfundSimulator } from '@/lib/covenant';

export default function CovenantCrowdfundPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);
  const { allCampaigns, loading, refresh } = useCovenantCrowdfund();

  const campaign = useMemo(
    () => allCampaigns.find((c) => c.id === campaignId) ?? null,
    [allCampaigns, campaignId]
  );

  useEffect(() => {
    void getCrowdfundSimulator()
      .getById(campaignId)
      .then((c) => {
        if (c) void refresh();
      });
  }, [campaignId, refresh]);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <div className="flex flex-1">
        <div className="hidden lg:block flex-shrink-0">
          <DonationsSidebar variant="minimal" backLink={{ href: '/donations', label: 'All campaigns' }} />
        </div>
        <div className="lg:hidden flex-shrink-0">
          <DonationsSidebar variant="minimal" backLink={{ href: '/donations', label: 'All campaigns' }} />
        </div>
        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 overflow-y-auto">
          <div className="max-w-2xl mx-auto">
            <Link href="/donations" className="text-sm text-zinc-500 hover:underline mb-6 inline-block">
              ← All campaigns
            </Link>
            {loading && !campaign ? (
              <p className="text-center text-zinc-500 py-12">Loading campaign...</p>
            ) : !campaign ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center space-y-3">
                <p className="font-medium text-zinc-700 dark:text-zinc-300">Campaign not found on this device</p>
                <p className="text-sm text-zinc-500">
                  L1 covenant campaigns are stored locally in the simulator. Open the link on the browser where it was
                  created, or launch a new one from CrowdKAS Studio.
                </p>
                <Link
                  href="/donations/studio#covenant-create"
                  className="inline-block mt-2 px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700"
                >
                  Create campaign
                </Link>
              </div>
            ) : (
              <CovenantCrowdfundDetailView campaign={campaign} />
            )}
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}
