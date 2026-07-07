'use client';

import Link from 'next/link';
import { useChainId } from 'wagmi';
import type { DApp } from '@/lib/dapps';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { contactXProfileUrl } from '@/lib/dapps/listingSubmissions';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxCopyIconButton } from '@/components/ui/KxCopyIconButton';
import { KX_SURFACE_INSET } from '@/lib/hub/shellTokens';

function MetadataRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  if (!value?.trim()) return null;

  return (
    <tr className="border-b border-zinc-200 align-top last:border-b-0 dark:border-zinc-700">
      <th
        scope="row"
        className="w-[34%] px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
      >
        {label}
      </th>
      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">
        <span className="inline-flex items-start gap-1.5 max-w-full">
          <span className={mono ? 'font-mono text-xs break-all' : 'text-sm'}>{value}</span>
          <KxCopyIconButton value={value} label={`Copy ${label}`} className="shrink-0 mt-0.5" />
        </span>
      </td>
    </tr>
  );
}

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

  const rows: { label: string; value: string; mono?: boolean }[] = [
    { label: 'dApp ID', value: dapp.id },
    { label: 'Slug', value: dapp.slug || '' },
    { label: 'Version', value: dapp.version || '' },
    { label: 'Network', value: dapp.network || '' },
    { label: 'Status', value: dapp.status || '' },
    { label: 'Provider', value: dapp.provider || '' },
    { label: 'Contract', value: resolvedContract },
    { label: 'Deployer', value: dapp.deployerAddress || '' },
  ];

  if (listing) {
    rows.push(
      { label: 'Listed', value: new Date(listing.submittedAt).toLocaleString(), mono: false },
      { label: 'Submitter', value: listing.submitterAddress },
      { label: 'Listing fee', value: listing.feeAmountKAS ? `${listing.feeAmountKAS} KAS` : '', mono: false },
      { label: 'Fee tx', value: listing.feeTxHash || '' },
    );
  }

  const visibleRows = rows.filter((row) => row.value?.trim());

  if (visibleRows.length === 0) return null;

  return (
    <section className={className}>
      <DAppSectionHeader
        title="Metadata"
        hint="On-chain identifiers and listing details for this dApp."
        className="mb-3"
      />
      <div className={`overflow-hidden rounded-xl border ${KX_SURFACE_INSET}`}>
        <table className="w-full text-sm">
          <tbody>
            {visibleRows.map((row) => (
              <MetadataRow key={row.label} label={row.label} value={row.value} mono={row.mono !== false} />
            ))}
          </tbody>
        </table>
      </div>

      {explorerUrl ? (
        <p className="mt-3 text-sm">
          <Link href={explorerUrl} target="_blank" rel="noopener noreferrer" className="font-semibold text-[#02abb8] hover:underline">
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
    </section>
  );
}
