'use client';

import { DApp } from '@/lib/dapps';
import { DAppMetadataTable } from '@/components/dapps/DAppMetadataTable';
import { DAppAboutSections } from '@/components/dapps/panels/DAppAboutSections';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';

export function DAppDescriptionsPanel({
  dapp,
  contractAddress,
  listing,
}: {
  dapp: DApp;
  contractAddress?: string;
  listing?: DirectoryListing;
}) {
  return (
    <div className="space-y-6">
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
      <DAppMetadataTable dapp={dapp} contractAddress={contractAddress} listing={listing} />
    </div>
  );
}
