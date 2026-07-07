'use client';

import { useMemo } from 'react';
import type { DApp } from '@/lib/dapps';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { directoryListingToDApp } from '@/lib/dapps/listingSubmissions';
import { DAppPageHeader } from '@/components/dapps/DAppPageHeader';
import { KxPanel } from '@/components/kx/KxPanel';

export type ListingPreviewDraft = Partial<
  Pick<
    DirectoryListing,
    | 'name'
    | 'shortDescription'
    | 'category'
    | 'tags'
    | 'networkLayer'
    | 'supportedChains'
    | 'websiteUrl'
    | 'socialLinks'
    | 'utility'
    | 'fullDescription'
  >
> & {
  logoUrl?: string | null;
  featureImageUrl?: string | null;
};

function buildPreviewListing(draft: ListingPreviewDraft, submitterAddress: string): DirectoryListing {
  const now = new Date().toISOString();
  return {
    id: 'preview',
    slug: 'preview',
    name: draft.name?.trim() || 'Your dApp name',
    shortDescription: draft.shortDescription?.trim() || 'Short description preview',
    fullDescription: draft.fullDescription?.trim() || draft.shortDescription?.trim() || '',
    category: draft.category || 'general',
    tags: draft.tags ?? [],
    utility: draft.utility || draft.shortDescription || '',
    process: '',
    benefits: '',
    feesOverview: '',
    feesPricing: '',
    feesCosts: '',
    supportedChains: draft.supportedChains ?? [],
    networkLayer: draft.networkLayer || 'L1',
    websiteUrl: draft.websiteUrl || '',
    socialLinks: draft.socialLinks ?? [],
    documentationLinks: [],
    actionButtons: [],
    logoUrl: draft.logoUrl || undefined,
    featureImageUrl: draft.featureImageUrl || undefined,
    galleryCids: [],
    galleryFileNames: [],
    galleryUrls: [],
    optionalFileCids: [],
    optionalFileNames: [],
    optionalFileUrls: [],
    contactX: '',
    contactTelegram: '',
    contactDiscord: '',
    additionalNotes: '',
    submitterAddress,
    status: 'active',
    submittedAt: now,
    updatedAt: now,
    paymentCurrency: 'KAS',
    feeAmountKAS: 0,
    feeTxHash: '',
  };
}

export function DAppListingPreview({
  draft,
  submitterAddress = 'kaspa:preview',
  compact = false,
}: {
  draft: ListingPreviewDraft;
  submitterAddress?: string;
  compact?: boolean;
}) {
  const listing = useMemo(() => buildPreviewListing(draft, submitterAddress), [draft, submitterAddress]);
  const dapp: DApp = useMemo(() => directoryListingToDApp(listing), [listing]);

  if (compact) {
    return (
      <KxPanel variant="inset" className="overflow-hidden !p-0 scale-[0.92] origin-top">
        <div className="pointer-events-none max-h-[220px] overflow-hidden">
          <DAppPageHeader dapp={dapp} listing={listing} />
        </div>
      </KxPanel>
    );
  }

  return (
    <KxPanel>
      <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-3">Live preview</p>
      <div className="pointer-events-none overflow-hidden rounded-xl border border-zinc-200 dark:border-zinc-800">
        <DAppPageHeader dapp={dapp} listing={listing} />
      </div>
    </KxPanel>
  );
}
