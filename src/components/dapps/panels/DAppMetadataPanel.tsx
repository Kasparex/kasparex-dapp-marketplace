'use client';

import { useCallback, useState } from 'react';
import Link from 'next/link';
import { useChainId } from 'wagmi';
import type { DApp } from '@/lib/dapps';
import type { DirectoryListing } from '@/lib/dapps/listingSubmissions';
import { getExplorerUrl } from '@/lib/dapps/deployer';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { KxPanel } from '@/components/kx/KxPanel';
import { KX_TAB_SECTION } from '@/lib/hub/shellTokens';
import { contactXProfileUrl } from '@/lib/dapps/listingSubmissions';

function CopyRow({ label, value, mono = true }: { label: string; value: string; mono?: boolean }) {
  const [copied, setCopied] = useState(false);

  const copy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(value);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      /* ignore */
    }
  }, [value]);

  if (!value?.trim()) return null;

  return (
    <tr className="border-b border-zinc-200 dark:border-zinc-800 last:border-b-0 align-top">
      <th
        scope="row"
        className="w-[34%] px-3 py-2.5 text-left text-xs font-semibold uppercase tracking-wide text-zinc-500 dark:text-zinc-400"
      >
        {label}
      </th>
      <td className="px-3 py-2.5 text-zinc-800 dark:text-zinc-200">
        <div className="flex items-start gap-2">
          <span className={mono ? 'font-mono text-xs break-all' : 'text-sm'}>{value}</span>
          <button
            type="button"
            onClick={copy}
            className="shrink-0 text-xs font-semibold text-[#02abb8] hover:underline"
          >
            {copied ? 'Copied' : 'Copy'}
          </button>
        </div>
      </td>
    </tr>
  );
}

export function DAppMetadataPanel({
  dapp,
  contractAddress,
  listing,
}: {
  dapp: DApp;
  contractAddress?: string;
  listing?: DirectoryListing;
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
      { label: 'Listed', value: new Date(listing.submittedAt).toLocaleString() },
      { label: 'Submitter', value: listing.submitterAddress },
      { label: 'Listing fee', value: listing.feeAmountKAS ? `${listing.feeAmountKAS} KAS` : '' },
      { label: 'Fee tx', value: listing.feeTxHash || '' },
    );
  }

  return (
    <div className={KX_TAB_SECTION}>
      <KxPanel>
        <DAppSectionHeader title="On-chain and listing metadata" className="mb-4" />
        <div className="overflow-hidden rounded-lg border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-sm">
            <tbody>
              {rows.map((row) => (
                <CopyRow key={row.label} label={row.label} value={row.value} mono={row.mono !== false} />
              ))}
            </tbody>
          </table>
        </div>

        {explorerUrl ? (
          <p className="mt-4 text-sm">
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
      </KxPanel>
    </div>
  );
}
