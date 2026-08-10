'use client';

import { use, useMemo, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
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
import { VDonateCampaignDetailShell } from '@/components/donations/VDonateCampaignDetailShell';
import type { CrowdfundTier } from '@/lib/covenant/crowdfund-types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { getViewerUnlockedTierIds, viewerHasPremiumAccess } from '@/lib/donations/tiers';

export default function CovenantCrowdfundPage({
  params,
}: {
  params: Promise<{ campaignId: string }>;
}) {
  const { campaignId } = use(params);
  const { state } = useKaspaWallet();
  const { allCampaigns, loading, pledge, refresh } = useCovenantCrowdfund();
  const [selectedTierId, setSelectedTierId] = useState<string | null>(null);
  const [rewardBusy, setRewardBusy] = useState(false);

  const campaign = useMemo(
    () => allCampaigns.find((c) => c.id === campaignId) ?? null,
    [allCampaigns, campaignId],
  );

  const otherCampaigns = useMemo(() => {
    if (!campaign) return [];
    return allCampaigns
      .filter((c) => c.creator === campaign.creator && c.id !== campaign.id)
      .slice(0, 6)
      .map((c) => ({ href: `/donations/covenant/${c.id}`, title: c.title }));
  }, [allCampaigns, campaign]);

  const unlockedTierIds = useMemo(
    () => (campaign ? getViewerUnlockedTierIds(campaign, state.address) : new Set<string>()),
    [campaign, state.address],
  );
  const premiumUnlocked = useMemo(
    () => (campaign ? viewerHasPremiumAccess(campaign, state.address) : false),
    [campaign, state.address],
  );

  const handleRewardPledge = async (tier: CrowdfundTier) => {
    if (!campaign) return;
    setSelectedTierId(tier.id);
    setRewardBusy(true);
    try {
      await pledge(campaign.id, tier.minKas, tier.id);
      await refresh();
    } catch {
      /* hook toasts */
    } finally {
      setRewardBusy(false);
    }
  };

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
              This L1 covenant campaign is not indexed on this device. Open it where it was created, or launch a new
              campaign from vDonate Studio.
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

  return (
    <VDonateCampaignDetailShell
      view={{
        title: campaign.title,
        creatorAddress: campaign.creator,
        imageUrl: campaign.imageUrl,
        imageHash: campaign.imageHash,
        shortDescription: campaign.memo,
        mainContentHtml: campaign.mainContent || campaign.memo,
        isLive,
        goalReached,
        network: 'l1',
        raisedLabel: `${raised.toFixed(4)} KAS`,
        goalLabel: `${goal.toFixed(4)} KAS`,
        backersLabel: String(backers),
        endsLabel: new Date(campaign.deadline).toLocaleDateString(),
        progressPct: progress,
        tiers: campaign.tiers,
        faq: campaign.faq,
        updates: campaign.updates,
        socialLinks: campaign.socialLinks,
        premiumTabEnabled: campaign.premiumTabEnabled,
        premiumTabTitle: campaign.premiumTabTitle,
        premiumTabContent: campaign.premiumTabContent,
        premiumUnlocked,
        unlockedTierIds,
        otherCampaigns,
      }}
      onSelectTier={(id) => setSelectedTierId(id)}
      onRewardPledge={(tier) => void handleRewardPledge(tier)}
      rewardBusy={rewardBusy}
      rightColumn={
        <CovenantCrowdfundRightColumn
          campaign={campaign}
          selectedTierId={selectedTierId}
          onSelectedTierIdChange={setSelectedTierId}
        />
      }
    />
  );
}
