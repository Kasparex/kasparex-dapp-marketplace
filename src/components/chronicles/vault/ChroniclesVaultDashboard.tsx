'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { ChroniclesHeader } from '@/components/chronicles/ChroniclesHeader';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useNFTStatus } from '@/hooks/useNFTStatus';
import { useChroniclesEntitlements } from '@/lib/chronicles/entitlements/useChroniclesEntitlements';
import { VaultSection } from './VaultSection';
import { UnlockOfferCard } from './UnlockOfferCard';
import { VaultDashboardAside } from './VaultDashboardAside';

const KasWareWalletButton = dynamic(
  () => import('@/components/KasWareWalletButton').then((m) => ({ default: m.KasWareWalletButton })),
  { ssr: false }
);

export function ChroniclesVaultDashboard() {
  const { state } = useKaspaWallet();
  const { catalog, isUnlocked } = useChroniclesEntitlements(state.address);
  const { tier: krexTier, isLoading: krexLoading } = useKREXBalance();
  const { nftStatus, isLoading: nftLoading } = useNFTStatus();

  const chapterOffers = catalog.filter((o) => o.kind === 'chapter');
  const assetOffers = catalog.filter((o) => o.kind === 'asset');

  const unlockedChapters = chapterOffers.filter((o) => isUnlocked(o.id));
  const unlockedAssets = assetOffers.filter((o) => isUnlocked(o.id));
  const lockedOffers = catalog.filter((o) => !isUnlocked(o.id));

  return (
    <div className="pb-16">
      <ChroniclesHeader />
      <div className="mb-8 sm:mb-10">
        <h2 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">Vault &amp; unlocks</h2>
        <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
          Unlocks are activated by a KAS payment to the treasury that includes an encoded payload. Once verified, unlocks are saved in this browser for your Kaspa address.
        </p>
      </div>

      <div className="min-w-0 space-y-14">
        {!state.isConnected ? (
          <div className="chronicles-vault-card rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-zinc-50 to-cyan-500/5 dark:from-zinc-900 dark:to-cyan-950/30 p-7 sm:p-8 max-w-lg mx-auto text-center space-y-6">
            <div className="inline-flex h-14 w-14 items-center justify-center rounded-2xl border border-cyan-500/30 bg-cyan-500/10 text-[#02abb8] mx-auto">
              <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                />
              </svg>
            </div>
            <div>
              <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Connect your Kaspa wallet</h3>
              <p className="text-base text-zinc-500 dark:text-zinc-400 mt-3 leading-relaxed">
                Connect a wallet to view your address and unlocks. Holder discounts are based on collections detected on your Kaspa address.
              </p>
            </div>
            <div className="flex justify-center">
              <KasWareWalletButton />
            </div>
          </div>
        ) : (
          <>
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
              <p className="text-base text-zinc-600 dark:text-zinc-400">
                Connected:{' '}
                <span className="font-mono text-sm text-zinc-900 dark:text-zinc-100 break-all">{state.address}</span>
              </p>
              <Link href="/chronicles" className="text-base font-bold text-[#02abb8] hover:underline">
                Back to lore
              </Link>
            </div>

            <VaultSection
              id="unlocked-chapters"
              title="My unlocked chapters"
              subtitle="Early access SKUs appear here after payment or mock entitlements."
            >
              {unlockedChapters.length === 0 ? (
                <p className="text-base text-zinc-500 col-span-full">No unlocked chapter SKUs yet.</p>
              ) : (
                unlockedChapters.map((o) => <UnlockOfferCard key={o.id} offer={o} unlocked />)
              )}
            </VaultSection>

            <VaultSection
              id="unlocked-assets"
              title="My items"
              subtitle="Gear, tech, and in-universe vault SKUs."
            >
              {unlockedAssets.length === 0 ? (
                <p className="text-base text-zinc-500 col-span-full">No gear or tech unlocked yet.</p>
              ) : (
                unlockedAssets.map((o) => <UnlockOfferCard key={o.id} offer={o} unlocked />)
              )}
            </VaultSection>

            <VaultSection
              id="premium"
              title="Premium & locked offers"
              subtitle="Send the required KAS payment to the treasury. The indexer may take a short moment to confirm your transaction."
            >
              {lockedOffers.length === 0 ? (
                <p className="text-base text-zinc-500 col-span-full">Everything in the catalog is unlocked for this wallet.</p>
              ) : (
                lockedOffers.map((o) => <UnlockOfferCard key={`locked-${o.id}`} offer={o} unlocked={false} />)
              )}
            </VaultSection>
          </>
        )}

        <div className="space-y-6">
          <VaultDashboardAside
            krexTier={krexTier}
            nft={nftStatus}
            isKrexLoading={krexLoading}
            isNftLoading={nftLoading}
          />
        </div>

        <section id="workspace" className="scroll-mt-24 chronicles-vault-card rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-3">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Workspace (source files)</h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Shared lore, KMAG, and community drafts live under{' '}
            <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-1 rounded">content/story-management/</code>. They are
            not published as web pages; sync the canon into{' '}
            <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-1 rounded">data/chronicles</code> when ready.
          </p>
        </section>

        <section id="drafts" className="scroll-mt-24 chronicles-vault-card rounded-2xl border border-dashed border-amber-500/35 bg-amber-500/5 dark:bg-amber-500/10 p-6 sm:p-8 space-y-3">
          <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Draft characters</h2>
          <p className="text-base text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
            Folders such as Axel Vane and Torq appear in the sidebar as drafts until they have a public slug in{' '}
            <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-1 rounded">data/chronicles/characters.json</code> and
            an entry in <code className="text-sm bg-zinc-100 dark:bg-zinc-800 px-1 rounded">story-folder-map.json</code>.
          </p>
        </section>
      </div>
    </div>
  );
}
