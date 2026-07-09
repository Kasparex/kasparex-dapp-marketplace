'use client';

import { DApp } from '@/lib/dapps';
import { DAppAboutSections } from '@/components/dapps/panels/DAppAboutSections';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';

export function DAppDescriptionsPanel({
  dapp,
  contractAddress: _contractAddress,
  listing: _listing,
}: {
  dapp: DApp;
  contractAddress?: string;
  listing?: DirectoryListing;
}) {
  return (
    <DAppAboutSections
      fields={{
        slug: dapp.slug,
        description: dapp.description,
        utility: dapp.utility,
        process: dapp.process,
        benefits: dapp.benefits,
        security: dapp.security,
        roadmap: dapp.roadmap,
      }}
    />
  );
}
