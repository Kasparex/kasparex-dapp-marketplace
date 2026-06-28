'use client';

import { useMemo } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { useAccount, useReadContracts } from 'wagmi';
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
import { HubWalletGateShell } from '@/components/hub/HubWalletGateShell';
import { CROWDKAS_L2_MODULES_GATE } from '@/lib/hub/gateConfigs';

const ROADMAP_ITEMS = [
  { title: 'Campaign updates feed', detail: 'Milestones and optional IPFS attachments - planned.' },
  { title: 'Custom CTA buttons', detail: 'Extra links on campaign pages - planned.' },
  { title: 'Supporter roles', detail: 'Lightweight tiers - planned.' },
] as const;

export default function CrowdKasModulesPage() {
  const searchParams = useSearchParams();
  const qCampaignId = searchParams.get('campaignId')?.trim() ?? '';

  const { address } = useAccount();
  const igraEscrowV2Address = getContractAddress(CROWDKAS_CHAIN_ID, 'DonationEscrowV2') ?? '';
  /** L2 unlock must target CrowdKAS chain escrow, not whatever chain the wallet happens to be on. */
  const writeEscrowV2Address = (igraEscrowV2Address || undefined) as Address | undefined;
  const crowdkasName = getChainById(CROWDKAS_CHAIN_ID)?.name ?? 'Igra Mainnet';

  const {
    campaigns: myCampaignsV2,
    isLoading: myCampaignsLoading,
    refetch: refetchMyCampaignsV2,
  } = useMyDonationCampaignsV2(address as Address | undefined);

  const effectiveCampaign = useMemo(() => {
    if (myCampaignsV2.length === 0) return null;
    if (qCampaignId && /^\d+$/.test(qCampaignId)) {
      const hit = myCampaignsV2.find((c) => c.campaignId.toString() === qCampaignId);
      if (hit) return hit;
    }
    return myCampaignsV2[0];
  }, [myCampaignsV2, qCampaignId]);

  const effectiveCampaignId = effectiveCampaign?.campaignId.toString() ?? '';

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
              <p className="kx-body max-w-3xl">
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

            {v2Ready && (
              <HubWalletGateShell config={CROWDKAS_L2_MODULES_GATE} mode="overlay">
                {myCampaignsLoading && <p className="text-sm text-zinc-500">Loading your campaigns…</p>}

                {!myCampaignsLoading && myCampaignsV2.length === 0 && (
                  <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-6">
                    <p className="text-sm text-zinc-700 dark:text-zinc-300 mb-3">You don’t have any V2 campaigns yet. Modules attach to a specific campaign id.</p>
                    <Link href="/donations/studio#create" className="k-control-btn inline-flex">
                      Create a V2 campaign
                    </Link>
                  </div>
                )}

                {myCampaignsV2.length > 0 && effectiveCampaign && (
                  <div className="space-y-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                      <p className="text-sm text-zinc-700 dark:text-zinc-300">
                        Modules for <span className="font-mono font-semibold">#{effectiveCampaign.campaignId.toString()}</span>
                        {effectiveCampaign.method === 'L2_ESCROW' ? ' · L2 escrow' : ' · L1 direct'}
                      </p>
                      {myCampaignsV2.length > 1 && (
                        <div className="flex flex-wrap gap-2">
                          {myCampaignsV2.map((c) => {
                            const id = c.campaignId.toString();
                            const active = id === effectiveCampaignId;
                            return (
                              <Link
                                key={id}
                                href={`/donations/modules?campaignId=${id}`}
                                className={
                                  active
                                    ? 'px-3 py-1 rounded-full text-xs font-semibold bg-emerald-600 text-white'
                                    : 'px-3 py-1 rounded-full text-xs font-medium border border-zinc-300 dark:border-zinc-600 text-zinc-700 dark:text-zinc-300 hover:border-emerald-500'
                                }
                              >
                                #{id}
                              </Link>
                            );
                          })}
                        </div>
                      )}
                    </div>

                    <div className="grid gap-4 md:grid-cols-2">
                      <DonationEscrowModuleUnlockCard
                        offer={DONATION_MODULE_OFFERS.featured}
                        campaignId={effectiveCampaign.campaignId}
                        igraEscrowV2Address={igraEscrowV2Address}
                        writeEscrowV2Address={writeEscrowV2Address}
                        creatorEvmAddress={address as Address}
                        isUnlocked={Boolean(unlockForEffective?.featured)}
                        onUnlockedOnChain={refetchUnlocks}
                        accent="emerald"
                        className="hover:border-emerald-500 dark:hover:border-emerald-500 transition-colors"
                      />
                      <DonationEscrowModuleUnlockCard
                        offer={DONATION_MODULE_OFFERS.l1Tips}
                        campaignId={effectiveCampaign.campaignId}
                        igraEscrowV2Address={igraEscrowV2Address}
                        writeEscrowV2Address={writeEscrowV2Address}
                        creatorEvmAddress={address as Address}
                        isUnlocked={Boolean(unlockForEffective?.l1Tips)}
                        onUnlockedOnChain={refetchUnlocks}
                        accent="amber"
                        className="hover:border-amber-500 dark:hover:border-amber-500 transition-colors"
                      />
                    </div>
                  </div>
                )}
              </HubWalletGateShell>
            )}

            <div className="rounded-2xl border border-dashed border-zinc-300 dark:border-zinc-700 p-6 space-y-3">
              <p className="text-xs font-bold uppercase tracking-widest text-zinc-500 dark:text-zinc-400">Later</p>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">Roadmap ideas (not available to purchase yet):</p>
              <ul className="text-sm text-zinc-500 dark:text-zinc-400 space-y-2 list-disc pl-5">
                {ROADMAP_ITEMS.map((item) => (
                  <li key={item.title}>
                    <span className="font-medium text-zinc-700 dark:text-zinc-300">{item.title}</span> - {item.detail}
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
