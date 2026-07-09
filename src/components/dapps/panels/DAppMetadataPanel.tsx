'use client';

import type { DApp } from '@/lib/dapps';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { DAppMetadataTable } from '@/components/dapps/DAppMetadataTable';
import { KX_FORM_PANEL } from '@/lib/hub/shellTokens';

export function DAppMetadataPanel({
  dapp,
  contractAddress,
  listing,
  className = '',
}: {
  dapp: DApp;
  contractAddress?: string;
  listing?: DirectoryListing;
  className?: string;
}) {
  return (
    <div className={`${KX_FORM_PANEL} ${className}`.trim()}>
      <DAppMetadataTable dapp={dapp} contractAddress={contractAddress} listing={listing} />
    </div>
  );
}
