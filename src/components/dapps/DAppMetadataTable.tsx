'use client';

import Link from 'next/link';
import { useChainId } from 'wagmi';
import type { DApp } from '@/lib/dapps';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { contactXProfileUrl } from '@/lib/dapps/listingSubmissions';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubMetadataStatGrid, type HubMetadataStat } from '@/components/hub/HubMetadataStatGrid';
import { getKrexWrapPublicConfig } from '@/lib/krex/wrap/config';

export function DAppMetadataTable({
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
  const chainId = useChainId();
  const resolvedContract = contractAddress || dapp.contractAddress || '';
  const explorerUrl =
    resolvedContract?.startsWith('0x') && chainId ? getExplorerUrl(resolvedContract, chainId) : null;

  const stats: HubMetadataStat[] = [];
  const id = dapp.id?.trim() || '';
  const slug = dapp.slug?.trim() || '';
  // Smart: do not duplicate id when it matches slug.
  if (id && id !== slug) {
    stats.push({ label: 'dApp ID', value: id, mono: true });
  }
  if (slug) {
    stats.push({ label: 'Slug', value: slug, mono: true, copyable: true });
  }
  if (dapp.version) {
    stats.push({ label: 'Version', value: dapp.version, copyable: false });
  }
  if (dapp.network) {
    stats.push({ label: 'Network', value: dapp.network, copyable: false });
  }
  if (dapp.status) {
    stats.push({ label: 'Status', value: dapp.status, copyable: false });
  }
  if (dapp.provider) {
    stats.push({ label: 'Provider', value: dapp.provider, copyable: false });
  }
  if (resolvedContract) {
    stats.push({ label: 'Contract', value: resolvedContract, mono: true });
  }
  if (dapp.deployerAddress) {
    stats.push({ label: 'Deployer', value: dapp.deployerAddress, mono: true });
  }

  if (dapp.slug === 'kcc20-bridge' || dapp.slug === 'krex-wrap-bridge') {
    const bridge = getKrexWrapPublicConfig('mainnet');
    stats.push(
      {
        label: 'Direction',
        value: 'One-way',
        tooltipTitle: 'Direction',
        tooltipDescription: bridge.migrateV2Enabled
          ? 'KRC-20 burn to keyless sink → attested claim → KCC20. No reverse path.'
          : 'KRC-20 → vault → KCC20. Reverse migration comes later.',
        copyable: false,
      },
      {
        label: 'Bridge fee',
        value: `${bridge.baseFeeKas} KAS`,
        tooltipTitle: 'Bridge fee',
        tooltipDescription: 'Base KAS fee before your KREX tier discount.',
        copyable: false,
      },
    );
    if (bridge.migrateV2Enabled && bridge.sinkAddress) {
      stats.push({
        label: 'Burn sink',
        value: bridge.sinkAddress,
        tooltipTitle: 'Keyless burn sink',
        tooltipDescription: 'Unspendable P2SH sink. Send only the selected KRC-20 here from the Migrate tab.',
        mono: true,
        copyable: true,
      });
    } else if (bridge.vaultAddress) {
      stats.push({
        label: 'Vault',
        value: bridge.vaultAddress,
        tooltipTitle: 'Deposit vault',
        tooltipDescription: 'Send only the selected KRC-20 to this address from the Migrate tab.',
        mono: true,
        copyable: true,
      });
    }
  }

  if (listing) {
    stats.push(
      {
        label: 'Listed',
        value: new Date(listing.submittedAt).toLocaleString(),
        copyable: false,
      },
      { label: 'Submitter', value: listing.submitterAddress, mono: true },
      {
        label: 'Listing fee',
        value: listing.feeAmountKAS ? `${listing.feeAmountKAS} KAS` : '',
        copyable: false,
      },
      { label: 'Fee tx', value: listing.feeTxHash || '', mono: true },
    );
  }

  return (
    <section className={className}>
      <DAppSectionHeader
        title="Metadata"
        hint="Key identifiers and listing details for this dApp."
        className="mb-4"
      />
      <HubMetadataStatGrid
        stats={stats}
        footer={
          <>
            {explorerUrl ? (
              <p className="mt-4 text-sm">
                <Link
                  href={explorerUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[color:var(--hub-accent)] hover:underline"
                >
                  View contract on explorer ↗
                </Link>
              </p>
            ) : null}
            {listing?.contactX ? (
              <p className="mt-2 text-sm">
                <Link
                  href={contactXProfileUrl(listing.contactX) || '#'}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="font-semibold text-[color:var(--hub-accent)] hover:underline"
                >
                  Contact on X ↗
                </Link>
              </p>
            ) : null}
          </>
        }
      />
    </section>
  );
}
