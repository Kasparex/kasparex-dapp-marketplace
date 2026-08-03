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

  const stats: HubMetadataStat[] = [
    { label: 'dApp ID', value: dapp.id, mono: true },
    { label: 'Slug', value: dapp.slug || '', mono: true, copyable: true },
    { label: 'Version', value: dapp.version || '', copyable: false },
    { label: 'Network', value: dapp.network || '', copyable: false },
    { label: 'Status', value: dapp.status || '', copyable: false },
    { label: 'Provider', value: dapp.provider || '', copyable: false },
    { label: 'Contract', value: resolvedContract, mono: true },
    { label: 'Deployer', value: dapp.deployerAddress || '', mono: true },
  ];

  if (dapp.slug === 'krex-wrap-bridge') {
    const wrap = getKrexWrapPublicConfig();
    const covenantTicks = Object.keys(wrap.covenants);
    stats.push(
      {
        label: 'Direction',
        value: 'One-way',
        hint: 'Any KRC-20 → vault → KCC20 mint. Unwrap later.',
        copyable: false,
      },
      {
        label: 'Wrap fee',
        value: `${wrap.baseFeeKas} KAS`,
        hint: 'Base fee before KREX tier discount',
        copyable: false,
      },
      {
        label: 'Vault',
        value: wrap.vaultAddress || 'Not configured',
        hint: wrap.vaultAddress ? 'Shared KRC-20 deposit address' : 'Set NEXT_PUBLIC_KREX_WRAP_VAULT',
        mono: Boolean(wrap.vaultAddress),
        copyable: Boolean(wrap.vaultAddress),
      },
      {
        label: 'Mint live',
        value: covenantTicks.length > 0 ? covenantTicks.join(', ') : 'Pending ops',
        hint:
          covenantTicks.length > 0
            ? 'Ticksers with a configured KCC20 covenant'
            : 'Set NEXT_PUBLIC_KRC20_WRAP_COVENANTS or NEXT_PUBLIC_KREX_KCC20_COVENANT_ID',
        copyable: false,
      },
    );
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
                  className="font-semibold text-[#02abb8] hover:underline"
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
                  className="font-semibold text-[#02abb8] hover:underline"
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
