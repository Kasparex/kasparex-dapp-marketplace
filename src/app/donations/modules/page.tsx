'use client';

import { useMemo, useState } from 'react';
import Link from 'next/link';
import { useAccount, useChainId, useSwitchChain, useReadContracts } from 'wagmi';
import type { Address } from 'viem';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { DonationsSidebar } from '@/components/donations/DonationsSidebar';
import { getContractAddress } from '@/lib/contracts/addresses';
import { DONATION_ESCROW_V2_ABI } from '@/lib/contracts/abis';
import { CROWDKAS_CHAIN_ID } from '@/lib/donations/chain';
import { DONATION_MODULE_IDS, DONATION_MODULE_OFFERS } from '@/lib/donations/modules';
import { useMyDonationCampaignsV2 } from '@/hooks/useMyDonationCampaigns';
import { DonationEscrowModuleUnlockCard } from '@/components/donations/DonationEscrowModuleUnlockCard';
import { getChainById } from '@/lib/wagmi';

/** Same shell as `DonationCampaignCard` (listing) for visual consistency. */
const MODULE_CARD_FRAME =
  'rounded-xl border border-zinc-200 dark:border-zinc-800 overflow-hidden bg-white dark:bg-zinc-900 hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors';

const ROADMAP_ITEMS = [
  { title: 'Campaign updates feed', detail: 'Milestones and optional IPFS attachments — planned.' },
  { title: 'Custom CTA buttons', detail: 'Extra links on campaign pages — planned.' },
  { title: 'Supporter roles', detail: 'Lightweight tiers — planned.' },
] as const;

export default function CrowdKasModulesPage() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();
  const { switchChain, isPending: isSwitchPending } = useSwitchChain();
  const igraEscrowV2Address = getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrowV2') ?? '';
  const writeEscrowV2Address = getContractAddress(chainId, 'DonationEscrowV2') as Address | undefined;
  const crowdkasName = getChainById(CROWDKAS_CHAIN_ID)?.name ?? 'Igra Mainnet';
  const onCrowdkasChain = chainId === CROWDKAS_CHAIN_ID;

  const {
    campaigns: myCampaignsV2,
    isLoading: myCampaignsLoading,
    refetch: refetchMyCampaignsV2,
  } = useMyDonationCampaignsV2(address as Address | undefined);

  const [selectedCampaignId, setSelectedCampaignId] = useState<string>('');

  const moduleUnlockReads = useMemo(() => {
    if (!igraEscrowV2Address || myCampaignsV2.length === 0) return [];
    const addr = igraEscrowV2Address as Address;
    const fe = DONATION_MODULE_IDS.featured;
    const l1 = DONATION_MODULE_IDS.l1Tips;
    return myCampaignsV2.flatMap((c) => [
      {
        chainId: CROWDKAS_CHAIN_ID,
        address: addr,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'moduleUnlocked' as const,
        args: [c.campaignId, fe] as const,
      },
      {
        chainId: CROWDKAS_CHAIN_ID,
        address: addr,
        abi: DONATION_ESCROW_V2_ABI,
        functionName: 'moduleUnlocked' as const,
        args: [c.campaignId, l1] as const,
      },
    ]);
  }, [myCampaignsV2, igraEscrowV2Address]);

  const { data: moduleUnlockResults, refetch: refetchModuleUnlocks } = useReadContracts({
    contracts: moduleUnlockReads,
    allowFailure: true,
    query: { enabled: moduleUnlockReads.length > 0 },
  });

  const unlockByCampaignId = useMemo(() => {
    const m = new Map<string, { featured: boolean; l1Tips: boolean }>();
    if (!moduleUnlockResults?.length || !myCampaignsV2.length) return m;
    myCampaignsV2.forEach((c, i) => {
      const fr = moduleUnlockResults[i * 2];
      const l1r = moduleUnlockResults[i * 2 + 1];
      m.set(c.campaignId.toString(), {
        featured: fr?.status === 'success' && Boolean(fr.result),
        l1Tips: l1r?.status === 'success' && Boolean(l1r.result),
      });
    });
    return m;
  }, [moduleUnlockResults, myCampaignsV2]);

  const effectiveCampaignId =
    selectedCampaignId ||
    (myCampaignsV2.length > 0 ? myCampaignsV2[0].campaignId.toString() : '');
  const effectiveCampaign = myCampaignsV2.find((c) => c.campaignId.toString() === effectiveCampaignId) ?? null;
  const unlockForEffective = effectiveCampaignId ? unlockByCampaignId.get(effectiveCampaignId) : undefined;

  const refetchUnlocks = () => {
    void refetchMyCampaignsV2();
    void refetchModuleUnlocks();
  };

  const v2Ready = Boolean(igraEscrowV2Address);

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950">
      <Header />
      <main className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <DonationsSidebar variant="minimal" backLink={{ href: '/donations', label: 'All campaigns' }} />
        </div>
        <div className="lg:hidden flex-shrink-0">
          <DonationsSidebar variant="minimal" backLink={{ href: '/donations', label: 'All campaigns' }} />
        </div>

        <div className="flex-1 min-w-0 p-4 sm:p-6 lg:p-12 overflow-y-auto border-l border-zinc-200 dark:border-zinc-800">
          <div className="max-w-6xl mx-auto space-y-8">
            <div className="rounded-2xl border border-emerald-500/20 bg-gradient-to-br from-white via-emerald-500/5 to-transparent dark:from-zinc-900 dark:via-emerald-500/10 dark:to-zinc-950 p-8 sm:p-10">
              <p className="text-sm font-black uppercase tracking-[0.2em] text-emerald-700 dark:text-emerald-400 mb-4">CrowdKAS modules</p>
              <h1 className="text-3xl sm:text-4xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight mb-4">Unlock campaign upgrades</h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400 leading-relaxed max-w-3xl">
                Paid modules are recorded on <strong>DonationEscrowV2</strong>: pay with Kaspa (L1), then confirm one transaction on {crowdkasName}. Discounts may apply from KREX
                tier and NFTs.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                <Link href="/donations/studio" className="k-control-btn">
                  Open Studio
                </Link>
                <Link href="/donations" className="k-control-btn">
                  Explore campaigns
                </Link>
              </div>
            </div>

            {!v2Ready && (
              <p className="text-sm text-amber-700 dark:text-amber-300 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                CrowdKAS V2 escrow is not configured for this deployment. Set <code className="font-mono text-xs">NEXT_PUBLIC_DONATION_ESCROW_V2_ADDRESS_IGRA_MAINNET</code> (or
                38833) to enable module unlocks.
              </p>
            )}

            {v2Ready && isConnected && !onCrowdkasChain && (
              <div className="rounded-xl border border-amber-200 dark:border-amber-800 bg-amber-50 dark:bg-amber-950/30 p-4 text-sm text-amber-900 dark:text-amber-200 space-y-2">
                <p>
                  Final on-chain unlock uses your EVM wallet on <strong>{crowdkasName}</strong>.
                </p>
                <button
                  type="button"
                  disabled={isSwitchPending}
                  onClick={() => switchChain?.({ chainId: CROWDKAS_CHAIN_ID })}
                  className="k-control-btn !bg-amber-600 !text-white !border-amber-500/30"
                >
                  {isSwitchPending ? 'Switching…' : `Switch to ${crowdkasName}`}
                </button>
              </div>
            )}

            <div className="grid gap-4 md:grid-cols-2">
              <div className={MODULE_CARD_FRAME}>
                <div className="aspect-[16/9] bg-gradient-to-br from-emerald-500/25 via-zinc-50 to-zinc-100 dark:from-emerald-500/15 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-emerald-800 dark:text-emerald-300">Featured</span>
                </div>
                <div className="p-4 space-y-2">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{DONATION_MODULE_OFFERS.featured.title}</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{DONATION_MODULE_OFFERS.featured.description}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">From {DONATION_MODULE_OFFERS.featured.basePriceKas} KAS (discounts may apply).</p>
                </div>
              </div>
              <div className={MODULE_CARD_FRAME}>
                <div className="aspect-[16/9] bg-gradient-to-br from-amber-500/20 via-zinc-50 to-zinc-100 dark:from-amber-500/12 dark:via-zinc-900 dark:to-zinc-800 flex items-center justify-center">
                  <span className="text-xs font-black uppercase tracking-[0.2em] text-amber-800 dark:text-amber-300">L1 tips</span>
                </div>
                <div className="p-4 space-y-2">
                  <h2 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{DONATION_MODULE_OFFERS.l1Tips.title}</h2>
                  <p className="text-sm text-zinc-600 dark:text-zinc-400">{DONATION_MODULE_OFFERS.l1Tips.description}</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-400">From {DONATION_MODULE_OFFERS.l1Tips.basePriceKas} KAS (discounts may apply).</p>
                </div>
              </div>
            </div>

            {!isConnected && (
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Connect your EVM wallet to select a campaign and unlock modules. New here?{' '}
                <Link href="/donations/studio" className="text-emerald-600 dark:text-emerald-400 font-medium hover:underline">
                  Create a V2 campaign in Studio
                </Link>
                .
              </p>
            )}

            {isConnected && myCampaignsLoading && <p className="text-sm text-zinc-500">Loading your campaigns…</p>}

            {isConnected && !myCampaignsLoading && myCampaignsV2.length === 0 && (
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
                <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">You don’t have any V2 campaigns yet. Modules attach to a specific campaign id.</p>
                <Link href="/donations/studio#create" className="k-control-btn inline-flex">
                  Create a V2 campaign
                </Link>
              </div>
            )}

            {isConnected && myCampaignsV2.length > 0 && effectiveCampaign && (
              <div className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                  <label className="text-sm font-medium text-zinc-700 dark:text-zinc-300 shrink-0">Campaign</label>
                  <select
                    value={effectiveCampaignId}
                    onChange={(e) => setSelectedCampaignId(e.target.value)}
                    className="w-full sm:max-w-md px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 text-sm"
                  >
                    {myCampaignsV2.map((c) => (
                      <option key={c.campaignId.toString()} value={c.campaignId.toString()}>
                        #{c.campaignId.toString()} · {c.method === 'L2_ESCROW' ? 'L2 escrow' : 'L1 direct'}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                  <div className={MODULE_CARD_FRAME}>
                    <DonationEscrowModuleUnlockCard
                      offer={DONATION_MODULE_OFFERS.featured}
                      campaignId={effectiveCampaign.campaignId}
                      igraEscrowV2Address={igraEscrowV2Address}
                      writeEscrowV2Address={writeEscrowV2Address}
                      creatorEvmAddress={address as Address}
                      isUnlocked={Boolean(unlockForEffective?.featured)}
                      onUnlockedOnChain={refetchUnlocks}
                      accent="emerald"
                      className="!rounded-none !border-0 shadow-none ring-0"
                    />
                  </div>
                  <div className={MODULE_CARD_FRAME}>
                    <DonationEscrowModuleUnlockCard
                      offer={DONATION_MODULE_OFFERS.l1Tips}
                      campaignId={effectiveCampaign.campaignId}
                      igraEscrowV2Address={igraEscrowV2Address}
                      writeEscrowV2Address={writeEscrowV2Address}
                      creatorEvmAddress={address as Address}
                      isUnlocked={Boolean(unlockForEffective?.l1Tips)}
                      onUnlockedOnChain={refetchUnlocks}
                      accent="amber"
                      className="!rounded-none !border-0 shadow-none ring-0"
                    />
                  </div>
                </div>
              </div>
            )}

            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Later</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Roadmap ideas (not available to purchase yet):</p>
              <ul className="text-sm text-zinc-500 dark:text-zinc-400 space-y-2 list-disc pl-5">
                {ROADMAP_ITEMS.map((item) => (
                  <li key={item.title}>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.title}</span> — {item.detail}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
