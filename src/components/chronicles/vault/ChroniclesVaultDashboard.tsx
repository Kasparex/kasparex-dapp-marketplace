'use client';

import dynamic from 'next/dynamic';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useChroniclesEntitlements } from '@/lib/chronicles/entitlements/useChroniclesEntitlements';
import { VaultSection } from './VaultSection';
import { UnlockOfferCard } from './UnlockOfferCard';

const KasWareWalletButton = dynamic(
  () => import('@/components/KasWareWalletButton').then((m) => ({ default: m.KasWareWalletButton })),
  { ssr: false }
);

export function ChroniclesVaultDashboard() {
  const { state } = useKaspaWallet();
  const { catalog, isUnlocked } = useChroniclesEntitlements(state.address);

  const chapterOffers = catalog.filter((o) => o.kind === 'chapter');
  const assetOffers = catalog.filter((o) => o.kind === 'asset');
  const premiumOffers = catalog.filter((o) => o.kind === 'lore' || o.kind === 'character');

  const unlockedChapters = chapterOffers.filter((o) => isUnlocked(o.id));
  const unlockedAssets = assetOffers.filter((o) => isUnlocked(o.id));
  const lockedOffers = catalog.filter((o) => !isUnlocked(o.id));

  return (
    <div className="space-y-14 pb-16">
      <div>
        <p className="text-xs font-black uppercase tracking-widest text-[#02abb8] mb-2">Chronicles vault</p>
        <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Unlocks & premium access
        </h1>
        <p className="text-base text-zinc-600 dark:text-zinc-400 mt-3 max-w-2xl leading-relaxed">
          Connect with KasWare to see your unlocked chapters and items. Purchases and on-chain verification are not live yet;
          this dashboard uses mock data so we can ship the UX first.
        </p>
      </div>

      {!state.isConnected ? (
        <div className="chronicles-vault-card rounded-2xl border border-cyan-500/25 bg-gradient-to-br from-zinc-50 to-cyan-500/5 dark:from-zinc-900 dark:to-cyan-950/30 p-8 sm:p-10 max-w-lg mx-auto text-center space-y-6">
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
            <h2 className="text-xl font-black text-zinc-900 dark:text-zinc-100">Connect your Kaspa wallet</h2>
            <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-2 leading-relaxed">
              Use KasWare to open your Chronicles vault. When monetization goes live, ownership will be tied to your address.
            </p>
          </div>
          <div className="flex justify-center">
            <KasWareWalletButton />
          </div>
          <p className="text-xs text-zinc-400">
            Tip: add your <code className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1 rounded">kaspa:</code> address to{' '}
            <code className="text-[10px] bg-zinc-200 dark:bg-zinc-800 px-1 rounded">data/chronicles/entitlements-mock.json</code>{' '}
            to preview unlocks.
          </p>
        </div>
      ) : (
        <>
          <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/50 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
            <p className="text-sm text-zinc-600 dark:text-zinc-400">
              Connected:{' '}
              <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all">{state.address}</span>
            </p>
            <Link href="/chronicles" className="text-sm font-bold text-[#02abb8] hover:underline">
              Back to lore
            </Link>
          </div>

          <VaultSection
            id="unlocked-chapters"
            title="My unlocked chapters"
            subtitle="Early access and paid chapter SKUs (mock). Unlocked when your address appears in entitlements-mock."
          >
            {unlockedChapters.length === 0 ? (
              <p className="text-sm text-zinc-500 col-span-full">No unlocked chapter SKUs yet.</p>
            ) : (
              unlockedChapters.map((o) => <UnlockOfferCard key={o.id} offer={o} unlocked />)
            )}
          </VaultSection>

          <VaultSection
            id="unlocked-assets"
            title="My items"
            subtitle="Gear, tech, and in-universe asset placeholders."
          >
            {unlockedAssets.length === 0 ? (
              <p className="text-sm text-zinc-500 col-span-full">No gear or tech unlocked yet.</p>
            ) : (
              unlockedAssets.map((o) => <UnlockOfferCard key={o.id} offer={o} unlocked />)
            )}
          </VaultSection>

          <VaultSection
            id="premium"
            title="Premium content access"
            subtitle="Everything you have not unlocked yet. Purchase flow is disabled until we wire KAS or token payments."
          >
            {lockedOffers.length === 0 ? (
              <p className="text-sm text-zinc-500 col-span-full">You have full mock access to all catalog items.</p>
            ) : (
              lockedOffers.map((o) => <UnlockOfferCard key={`locked-${o.id}`} offer={o} unlocked={false} />)
            )}
          </VaultSection>
        </>
      )}

      <section id="workspace" className="scroll-mt-24 chronicles-vault-card rounded-2xl border border-zinc-200 dark:border-zinc-800 p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Workspace (source files)</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
          Shared lore, KMAG, and community drafts live under{' '}
          <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">content/story-management/</code>. They are
          not published as web pages; sync the canon into{' '}
          <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">data/chronicles</code> when ready.
        </p>
      </section>

      <section id="drafts" className="scroll-mt-24 chronicles-vault-card rounded-2xl border border-dashed border-amber-500/35 bg-amber-500/5 dark:bg-amber-500/10 p-6 sm:p-8 space-y-3">
        <h2 className="text-lg font-black text-zinc-900 dark:text-zinc-100">Draft characters</h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
          Folders such as Axel Vane and Torq appear in the sidebar as drafts until they have a public slug in{' '}
          <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">data/chronicles/characters.json</code> and an
          entry in <code className="text-xs bg-zinc-100 dark:bg-zinc-800 px-1 rounded">story-folder-map.json</code>.
        </p>
      </section>
    </div>
  );
}
