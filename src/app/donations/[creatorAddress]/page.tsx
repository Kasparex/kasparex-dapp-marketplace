'use client';

import { useParams, useSearchParams } from 'next/navigation';
import { useState, useEffect } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { ReferralTracker } from '@/components/revenue-tree/ReferralTracker';
import { fetchCampaignMetadata } from '@/hooks/useDonationCampaign';
import { useDonationCampaignPage } from '@/hooks/useDonationCampaignPage';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { DonationCampaignRightColumn } from '@/components/donations/DonationCampaignRightColumn';
import { formatEther } from 'viem';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { DEFAULT_DONATION_IMAGE } from '@/lib/donations/constants';
import { getGatewayUrl } from '@/lib/ipfs/gateway';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';
import { progressPercent, totalDonorCount, totalRaisedWei } from '@/lib/donations/totals';
import { useQuery } from '@tanstack/react-query';
import type { ReactNode } from 'react';

const CROWDKAS_CAMPAIGN_SECTION_NAV: { id: string; label: string; icon: ReactNode }[] = [
  {
    id: 'crowdkas-overview',
    label: 'Overview',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h10" />
      </svg>
    ),
  },
  {
    id: 'crowdkas-progress',
    label: 'Progress & time',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
        />
      </svg>
    ),
  },
  {
    id: 'crowdkas-story',
    label: 'Story & goals',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
        />
      </svg>
    ),
  },
  {
    id: 'crowdkas-links',
    label: 'Links',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1"
        />
      </svg>
    ),
  },
  {
    id: 'crowdkas-donate',
    label: 'Donate',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z"
        />
      </svg>
    ),
  },
  {
    id: 'crowdkas-supporters',
    label: 'Supporters',
    icon: (
      <svg className="w-4 h-4 k-sidebar-icon" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"
        />
      </svg>
    ),
  },
];

export default function DonationCampaignPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const chainId = useChainId();
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
  const l1TipsWei = v2Campaign ? (campaign.l1RecordedTotalWei ?? 0n) : 0n;
  const explorerChainId = chainId || CROWDKAS_CHAIN_ID;
  const deadlineDate = new Date(Number(campaign.deadline) * 1000);
  const title = metadata?.title ?? `Campaign ${campaign.creatorAddress.slice(0, 6)}...${campaign.creatorAddress.slice(-4)}`;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <ReferralTracker contentType="donation" contentSlug={creatorAddress} />
      <main className="flex-1 flex flex-col">
        <div className="flex-1 flex flex-col lg:flex-row">
          {/* Left sidebar - same as donations listing */}
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

          {/* Two columns: campaign (left) | info + leaderboard + Revenue Tree (right) */}
          <div className="flex-1 min-w-0 p-4 sm:p-6 lg:px-8 lg:py-8">
            <Link href="/donations" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline mb-4 inline-block">
              ← All campaigns
            </Link>
            <Link href="/donations/help#how-it-works" className="text-sm text-emerald-700 dark:text-emerald-400 hover:underline mb-4 ml-4 inline-block">
              What happens after it ends?
            </Link>
            <Link href="/donations/help#donors" className="text-sm text-zinc-600 dark:text-zinc-400 hover:underline mb-4 ml-4 inline-block">
              Donors · Claims &amp; refunds
            </Link>
            <div className="grid grid-cols-1 lg:grid-cols-5 gap-6 lg:gap-10">
              {/* Left column: campaign content - 3/5 */}
              <div className="lg:col-span-3 space-y-6">
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
                  <div id="crowdkas-overview" className="scroll-mt-28">
                    <div className="aspect-[16/9] w-full bg-zinc-100 dark:bg-zinc-800 relative overflow-hidden">
                      <img
                        src={metadata?.imageUrl || (metadata?.imageHash ? getGatewayUrl(metadata.imageHash) : DEFAULT_DONATION_IMAGE)}
                        alt=""
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="p-6 md:p-8 pb-4">
                      <div className="flex flex-wrap items-center gap-2 mb-2">
                        <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
                        {campaign.verified && (
                          <span className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                            Verified
                          </span>
                        )}
                        {campaign.modulesUnlocked?.featured && (
                          <span className="text-xs px-2 py-1 rounded bg-amber-100 dark:bg-amber-900/40 text-amber-800 dark:text-amber-200 font-medium">
                            Featured
                          </span>
                        )}
                        {(() => {
                          const live = campaign.active && Number(campaign.deadline) > nowSec;
                          return live ? (
                            <span className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                              Active
                            </span>
                          ) : (
                            <span className="text-xs px-2 py-1 rounded bg-zinc-300 dark:bg-zinc-600 text-zinc-800 dark:text-zinc-100 font-medium">
                              Ended
                            </span>
                          );
                        })()}
                      </div>

                      <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400">
                        Creator:{' '}
                        <a
                          href={getExplorerUrl(campaign.creatorAddress, explorerChainId)}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="hover:text-emerald-600 dark:hover:text-emerald-400 underline"
                        >
                          {campaign.creatorAddress.slice(0, 10)}...{campaign.creatorAddress.slice(-8)}
                        </a>
                      </p>
                    </div>
                  </div>

                  <div id="crowdkas-progress" className="scroll-mt-28 px-6 md:px-8 pb-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">
                          Raised {v2Campaign ? '(L2 goal)' : ''}
                        </p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatEther(raisedTotal)} iKAS</p>
                        {v2Campaign && l1TipsWei > 0n && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                            + {formatEther(l1TipsWei)} iKAS L1 tips (not in goal)
                          </p>
                        )}
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Target</p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatEther(campaign.targetWei)} iKAS</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Donors</p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{donorsTotal.toString()}</p>
                      </div>
                      <div>
                        <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ends</p>
                        <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{deadlineDate.toLocaleDateString()}</p>
                      </div>
                    </div>

                    <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
                      <div
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${Math.min(progress, 100)}%` }}
                      />
                    </div>
                  </div>

                  <div id="crowdkas-story" className="scroll-mt-28 px-6 md:px-8 pb-6 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    {metadataLoading && <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading description...</p>}
                    {!metadataLoading && metadata?.description && (
                      <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
                        <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{metadata.description}</p>
                      </div>
                    )}

                    {metadata?.goals && metadata.goals.length > 0 && (
                      <div>
                        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Goals</h3>
                        <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
                          {metadata.goals.map((g, i) => (
                            <li key={i}>{g}</li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </div>

                  <div id="crowdkas-links" className="scroll-mt-28 px-6 md:px-8 pb-8 border-t border-zinc-100 dark:border-zinc-800 pt-6">
                    <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Links</h3>
                    {metadata?.socialLinks && Object.keys(metadata.socialLinks).length > 0 ? (
                      <div className="flex flex-wrap gap-2">
                        {metadata.socialLinks.website && (
                          <a href={metadata.socialLinks.website} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">Website</a>
                        )}
                        {metadata.socialLinks.twitter && (
                          <a href={metadata.socialLinks.twitter} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">Twitter</a>
                        )}
                        {metadata.socialLinks.discord && (
                          <a href={metadata.socialLinks.discord} target="_blank" rel="noopener noreferrer" className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline">Discord</a>
                        )}
                      </div>
                    ) : (
                      <p className="text-sm text-zinc-500 dark:text-zinc-400">No external links on this campaign.</p>
                    )}
                  </div>
                </div>
              </div>

              {/* Right column: summary + leaderboard + Revenue Tree - 2/5 */}
              <div className="lg:col-span-2">
                <DonationCampaignRightColumn
                  campaign={campaign}
                  creatorAddress={creatorAddress}
                  previewDonationAmount={previewDonationAmount}
                  metadata={metadata}
                  onL2DonationConfirmed={refetchCampaign}
                  onL2AmountChange={setPreviewDonationAmount}
                />
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
