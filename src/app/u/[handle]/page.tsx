import { Suspense } from 'react';
import { createKnsClient } from '@/lib/kns/client';
import { isValidKaspaAddress, normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { isAddress } from 'viem';
import { ProfileHubContent } from './profile-hub-content';

export const dynamic = 'force-dynamic';

interface PageProps {
  params: Promise<{
    handle: string;
  }>;
}

export async function generateStaticParams(): Promise<Array<{ handle: string }>> {
  return [];
}

export async function generateMetadata({ params }: PageProps) {
  const { handle } = await params;
  return {
    title: `Profile: ${decodeURIComponent(handle)} - Kasparex Hub`,
  };
}

function looksLikeKnsName(value: string): boolean {
  const v = value.trim().toLowerCase();
  return v.endsWith('.kas');
}

export default async function PublicProfilePage({ params }: PageProps) {
  const { handle: rawHandle } = await params;
  const handle = decodeURIComponent(rawHandle || '').trim();

  const kns = createKnsClient();

  let kaspaAddress: string | null = null;
  let knsName: string | null = null;
  let evmAddress: string | null = null;

  if (looksLikeKnsName(handle)) {
    knsName = handle.toLowerCase();
    try {
      const owner = await kns.getDomainOwner(knsName);
      const addr =
        (owner.ownerAddress as string | undefined) ||
        (owner.owner_address as string | undefined) ||
        (owner.owner as string | undefined) ||
        null;
      if (addr && isValidKaspaAddress(addr)) {
        kaspaAddress = normalizeKaspaAddress(addr).toLowerCase();
      }
    } catch {
      // keep null; UI will show a not found state
    }
  } else if (isValidKaspaAddress(handle)) {
    kaspaAddress = normalizeKaspaAddress(handle).toLowerCase();
  } else if (isAddress(handle)) {
    // L2 (EVM) profile: canonical identity for this page is the EVM wallet itself.
    evmAddress = handle.toLowerCase();
    kaspaAddress = null;
  }

  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-50 p-6 dark:bg-zinc-950">
          <p className="text-sm text-zinc-500 dark:text-zinc-400">Loading profile…</p>
        </div>
      }
    >
      <ProfileHubContent
        initialHandle={handle}
        initialKaspaAddress={kaspaAddress}
        initialKnsName={knsName}
        initialEvmAddress={evmAddress}
      />
    </Suspense>
  );
}

