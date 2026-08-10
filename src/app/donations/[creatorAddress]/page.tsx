'use client';

import { Suspense, useEffect, useState } from 'react';
import { useParams, useSearchParams } from 'next/navigation';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { fetchCampaignMetadata } from '@/hooks/useDonationCampaign';
import { useDonationCampaignPage } from '@/hooks/useDonationCampaignPage';
import { DonationCampaignRightColumn } from '@/components/donations/DonationCampaignRightColumn';
import { formatEther } from 'viem';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { progressPercent, totalDonorCount, totalRaisedWei } from '@/lib/donations/totals';
import { CrowdKasPublicModules } from '@/components/donations/CrowdKasPublicModules';
import { CrowdKasPremiumSectionUnlock } from '@/components/donations/CrowdKasPremiumSectionUnlock';
import { useQuery } from '@tanstack/react-query';
import { VDonateCampaignDetailShell } from '@/components/donations/VDonateCampaignDetailShell';
import { vdonateCommentsArticleId } from '@/lib/donations/defaultFaqs';

function DonationCampaignPageContent() {
  const params = useParams();
  const searchParams = useSearchParams();
  const creatorAddress = (params?.creatorAddress as string) ?? null;
  const campaignIdParam = searchParams?.get('campaignId') ?? null;
  const { campaign, isLoading, error, refetch: refetchCampaign, isV2Detail } = useDonationCampaignPage(
    creatorAddress,
    campaignIdParam
  );
  const [previewDonationAmount, setPreviewDonationAmount] = useState(10);
  const [nowSec, setNowSec] = useState(() => Math.floor(Date.now() / 1000));
  useEffect(() => {
    const t = setInterval(() => setNowSec(Math.floor(Date.now() / 1000)), 30_000);
    return () => clearInterval(t);
  }, []);

  const { data: metadata, isLoading: metadataLoading } = useQuery({
    queryKey: ['donation-meta', campaign?.ipfsHash ?? ''],
    queryFn: async (): Promise<DonationCampaignMetadata | null> => {
      if (!campaign?.ipfsHash) return null;
      return await fetchCampaignMetadata(campaign.ipfsHash);
    },
    enabled: Boolean(campaign?.ipfsHash),
    staleTime: 60 * 60 * 1000,
    refetchOnWindowFocus: false,
  });

  useEffect(() => {
    const pledge = searchParams?.get('pledge');
    if (pledge && Number.isFinite(parseFloat(pledge))) {
      setPreviewDonationAmount(parseFloat(pledge));
    }
  }, [searchParams]);

  if (isLoading || !creatorAddress) {
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

  if (error || !campaign) {
    return (
      <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
        <Header />
        <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-12 text-center">
            <h2 className="text-xl font-semibold text-zinc-900 dark:text-zinc-100">Campaign not found</h2>
            <p className="text-zinc-500 dark:text-zinc-400 mt-2">
              {isV2Detail && campaignIdParam
                ? 'This campaign id does not exist, or it belongs to another creator.'
                : 'This address has no active donation campaign or the campaign does not exist.'}
            </p>
            <Link href="/donations" className="inline-block mt-4 text-emerald-600 dark:text-emerald-400 hover:underline">
              ← Back to donations
            </Link>
          </div>
        </main>
        <Footer />
      </div>
    );
  }

  const v2Campaign = campaign.campaignIdV2 != null;
  const progress = progressPercent(campaign, campaign.targetWei, { escrowOnly: v2Campaign });
  const raisedTotal = v2Campaign ? campaign.raisedWei : totalRaisedWei(campaign);
  const donorsTotal = v2Campaign ? campaign.donorCount : totalDonorCount(campaign);
  const deadlineDate = new Date(Number(campaign.deadline) * 1000);
  const title =
    metadata?.title ?? `Campaign ${campaign.creatorAddress.slice(0, 6)}...${campaign.creatorAddress.slice(-4)}`;
  const isLive = campaign.active && Number(campaign.deadline) > nowSec;
  const goalReached = raisedTotal >= campaign.targetWei;
  const isL1Direct = campaign.methodV2 === 'L1_DIRECT';

  return (
    <VDonateCampaignDetailShell
      view={{
        title,
        creatorAddress: campaign.creatorAddress,
        imageUrl: metadata?.imageUrl,
        imageHash: metadata?.imageHash,
        shortDescription: metadata?.description?.replace(/<[^>]*>/g, '') ?? null,
        mainContentHtml: metadata?.mainContent?.trim() || metadata?.description || '',
        isLive,
        goalReached,
        network: isL1Direct ? 'l1' : 'l2',
        featured: campaign.modulesUnlocked?.featured,
        raisedLabel: `${formatEther(raisedTotal)} iKAS`,
        goalLabel: `${formatEther(campaign.targetWei)} iKAS`,
        backersLabel: donorsTotal.toString(),
        endsLabel: deadlineDate.toLocaleDateString(),
        progressPct: progress,
        tiers: metadata?.tiers?.map((t) => ({
          id: t.id,
          title: t.title,
          description: t.description,
          minKas: t.minKas,
          reward: t.reward,
          limitedQty: t.limitedQty,
          claimedCount: 0,
        })),
        socialLinks: metadata?.socialLinks,
        premiumTabEnabled: Boolean(metadata?.modules?.premiumSectionEnabled),
        premiumTabTitle: 'Premium',
        campaignExtras: (
          <div className="space-y-4 pt-2">
            <CrowdKasPublicModules
              metadata={metadata}
              deadlineUnix={Number(campaign.deadline)}
              campaignUrl={typeof window !== 'undefined' ? window.location.href : undefined}
            />
            {metadata?.goals && metadata.goals.length > 0 ? (
              <div>
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Goals</h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
                  {metadata.goals.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            ) : null}
            {metadataLoading ? <p className="text-sm text-zinc-500">Loading…</p> : null}
          </div>
        ),
        premiumModule: (
          <CrowdKasPremiumSectionUnlock
            campaign={campaign}
            metadata={metadata}
            onDonationRecorded={refetchCampaign}
          />
        ),
        commentsArticleId: vdonateCommentsArticleId({
          network: isL1Direct ? 'l1' : 'l2',
          campaignId:
            campaign.campaignIdV2 != null
              ? campaign.campaignIdV2.toString()
              : campaign.creatorAddress.toLowerCase(),
        }),
      }}
      rightColumn={
        <DonationCampaignRightColumn
          campaign={campaign}
          creatorAddress={creatorAddress}
          previewDonationAmount={previewDonationAmount}
          metadata={metadata}
          onL2DonationConfirmed={refetchCampaign}
          onL2AmountChange={setPreviewDonationAmount}
        />
      }
    />
  );
}

export default function DonationCampaignPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col">
          <Header />
          <main className="flex flex-1 items-center justify-center p-8">
            <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading campaign…</p>
          </main>
          <Footer />
        </div>
      }
    >
      <DonationCampaignPageContent />
    </Suspense>
  );
}
