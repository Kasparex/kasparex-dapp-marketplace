'use client';

import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import type { DApp } from '@/lib/dapps';
import { DAppAboutSections } from '@/components/dapps/panels/DAppAboutSections';

type DirectoryDAppDescriptionsPanelProps = {
  dapp: DApp;
  listing: DirectoryListing;
};

export function DirectoryDAppDescriptionsPanel({ dapp, listing }: DirectoryDAppDescriptionsPanelProps) {
  const descriptionText = listing.fullDescription || listing.shortDescription;

  return (
    <DAppAboutSections
      fields={{
        slug: dapp.slug,
        description: descriptionText,
        utility: listing.utility,
        process: listing.process,
        benefits: listing.benefits,
      }}
    />
  );
}
