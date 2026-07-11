'use client';

import { CampaignEndCountdown } from '@/components/donations/CampaignEndCountdown';
import type { DonationCampaignMetadata } from '@/lib/donations/types';

export function CrowdKasPublicModules({
  metadata,
  deadlineUnix,
  campaignUrl,
}: {
  metadata: DonationCampaignMetadata | null | undefined;
  deadlineUnix?: number;
  campaignUrl?: string;
}) {
  const modules = metadata?.modules;
  if (!modules) return null;

  return (
    <div className="space-y-4 mb-6">
      {modules.countdownHighlight && deadlineUnix ? (
        <div className="rounded-xl border border-emerald-500/25 bg-emerald-500/10 px-4 py-3">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-800 dark:text-emerald-300 mb-2">Deadline</p>
          <CampaignEndCountdown deadlineSec={deadlineUnix} compact />
        </div>
      ) : null}

      {modules.thankYouMessage ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900/50 px-4 py-3">
          <p className="text-sm text-zinc-700 dark:text-zinc-300">{modules.thankYouMessage}</p>
        </div>
      ) : null}

      {modules.shareButtons && campaignUrl ? (
        <div className="flex flex-wrap gap-2">
          <a
            href={`https://twitter.com/intent/tweet?url=${encodeURIComponent(campaignUrl)}`}
            target="_blank"
            rel="noopener noreferrer"
            className="k-control-btn text-sm"
          >
            Share on X
          </a>
          <button
            type="button"
            className="k-control-btn text-sm"
            onClick={() => void navigator.clipboard?.writeText(campaignUrl)}
          >
            Copy link
          </button>
        </div>
      ) : null}

      {modules.donorWall ? (
        <p className="text-xs text-zinc-500 dark:text-zinc-400">
          Donor wall is enabled. See supporters in the backers section.
        </p>
      ) : null}
    </div>
  );
}
