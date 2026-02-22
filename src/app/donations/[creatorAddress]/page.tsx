'use client';

import { useParams } from 'next/navigation';
import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { useDonationCampaign, fetchCampaignMetadata } from '@/hooks/useDonationCampaign';
import { DonationBlock } from '@/components/donations/DonationBlock';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { formatEther } from 'viem';
import type { DonationCampaignMetadata } from '@/lib/donations/types';
import { DEFAULT_DONATION_IMAGE } from '@/lib/donations/constants';
import { getGatewayUrl } from '@/lib/ipfs/gateway';

export default function DonationCampaignPage() {
  const params = useParams();
  const creatorAddress = (params?.creatorAddress as string) ?? null;
  const { campaign, isLoading, error } = useDonationCampaign(creatorAddress);
  const [metadata, setMetadata] = useState<DonationCampaignMetadata | null>(null);
  const [metadataLoading, setMetadataLoading] = useState(false);

  useEffect(() => {
    if (!campaign?.ipfsHash) {
      setMetadata(null);
      return;
    }
    let cancelled = false;
    setMetadataLoading(true);
    fetchCampaignMetadata(campaign.ipfsHash)
      .then((m) => {
        if (!cancelled) setMetadata(m ?? null);
      })
      .finally(() => {
        if (!cancelled) setMetadataLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [campaign?.ipfsHash]);

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
              This address has no active donation campaign or the campaign does not exist.
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

  const progress = campaign.targetWei > 0n ? Number((campaign.raisedWei * 10000n) / campaign.targetWei) / 100 : 0;
  const deadlineDate = new Date(Number(campaign.deadline) * 1000);
  const title = metadata?.title ?? `Campaign ${campaign.creatorAddress.slice(0, 6)}...${campaign.creatorAddress.slice(-4)}`;

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 container mx-auto px-4 py-8 max-w-4xl">
        <Link href="/donations" className="text-sm text-zinc-500 dark:text-zinc-400 hover:underline mb-6 inline-block">
          ← All campaigns
        </Link>

        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 overflow-hidden">
          <div className="p-6 md:p-8">
            <div className="flex flex-wrap items-center gap-2 mb-2">
              <h1 className="text-2xl md:text-3xl font-bold text-zinc-900 dark:text-zinc-100">{title}</h1>
              {campaign.verified && (
                <span className="text-xs px-2 py-1 rounded bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300 font-medium">
                  Verified
                </span>
              )}
              {campaign.active && (
                <span className="text-xs px-2 py-1 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300">
                  Active
                </span>
              )}
            </div>

            <p className="text-sm font-mono text-zinc-500 dark:text-zinc-400 mb-6">
              Creator: {campaign.creatorAddress.slice(0, 10)}...{campaign.creatorAddress.slice(-8)}
            </p>

            {/* Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Raised</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatEther(campaign.raisedWei)} iKAS</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Target</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{formatEther(campaign.targetWei)} iKAS</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Donors</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{campaign.donorCount.toString()}</p>
              </div>
              <div>
                <p className="text-xs text-zinc-500 dark:text-zinc-400 uppercase tracking-wider">Ends</p>
                <p className="text-lg font-semibold text-zinc-900 dark:text-zinc-100">{deadlineDate.toLocaleDateString()}</p>
              </div>
            </div>

            <div className="w-full h-3 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden mb-8">
              <div
                className="h-full bg-emerald-500 rounded-full transition-all"
                style={{ width: `${Math.min(progress, 100)}%` }}
              />
            </div>

            {/* Description from IPFS */}
            {metadataLoading && <p className="text-zinc-500 dark:text-zinc-400 text-sm">Loading description...</p>}
            {!metadataLoading && metadata?.description && (
              <div className="prose prose-zinc dark:prose-invert max-w-none mb-6">
                <p className="whitespace-pre-wrap text-zinc-700 dark:text-zinc-300">{metadata.description}</p>
              </div>
            )}

            {/* Goals */}
            {metadata?.goals && metadata.goals.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Goals</h3>
                <ul className="list-disc list-inside space-y-1 text-zinc-600 dark:text-zinc-400">
                  {metadata.goals.map((g, i) => (
                    <li key={i}>{g}</li>
                  ))}
                </ul>
              </div>
            )}

            {/* Social links */}
            {metadata?.socialLinks && Object.keys(metadata.socialLinks).length > 0 && (
              <div className="mb-8">
                <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-2">Links</h3>
                <div className="flex flex-wrap gap-2">
                  {metadata.socialLinks.website && (
                    <a
                      href={metadata.socialLinks.website}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Website
                    </a>
                  )}
                  {metadata.socialLinks.twitter && (
                    <a
                      href={metadata.socialLinks.twitter}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Twitter
                    </a>
                  )}
                  {metadata.socialLinks.discord && (
                    <a
                      href={metadata.socialLinks.discord}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-sm text-emerald-600 dark:text-emerald-400 hover:underline"
                    >
                      Discord
                    </a>
                  )}
                </div>
              </div>
            )}

            {/* Donation block: L1/L2 toggle and actions */}
            <DonationBlock campaign={campaign} />
            </div>
          </div>
        </main>
      <Footer />
    </div>
  );
}
