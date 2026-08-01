'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  getCrowdfundRuntime,
  getSilverscriptCrowdfundRuntime,
  getActiveCovenantRuntimeMode,
  kasToSompiString,
  runKpxCovenantDeployWithFee,
  runKpxCovenantClaimWithFee,
  resolveKpxCovenantDeployPrice,
  resolveKpxCovenantClaimPrice,
  type CrowdfundCampaign,
} from '@/lib/covenant';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { awardDAppHubPoints } from '@/lib/rewards/awardDAppHubPoints';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { payCrowdKasL1StudioFee } from '@/lib/donations/l1Payment';
import { placeholderDApps } from '@/lib/dapps';

const CROWDFUND_DAPP = placeholderDApps.find((d) => d.slug === 'covenant-crowdfund')!;

export function useCovenantCrowdfund() {
  const { state } = useKaspaWallet();
  const runtime = getCrowdfundRuntime();
  const { tier: krexTier, balance: krexBalance } = useKREXBalance();
  const [campaigns, setCampaigns] = useState<CrowdfundCampaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<CrowdfundCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const walletCtx = useCallback(() => {
    if (!state.isConnected || !state.address || !state.provider) {
      throw new Error('Connect wallet first');
    }
    return {
      provider: state.provider as KaspaWalletProvider,
      userAddress: state.address,
    };
  }, [state.address, state.isConnected, state.provider]);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAllCampaigns(await runtime.listAll());
      if (state.address) {
        setCampaigns(await runtime.listForAddress(state.address));
      } else {
        setCampaigns([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [runtime, state.address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createCampaign = useCallback(
    async (args: {
      title: string;
      memo: string;
      goalKas: number;
      deadline: Date;
      studioTotalKas?: number;
    }) => {
      if (!state.address || !state.provider) throw new Error('Connect wallet first');
      const ctx = walletCtx();

      if (args.studioTotalKas != null && args.studioTotalKas > 0) {
        const feeTxHash = await payCrowdKasL1StudioFee({
          provider: ctx.provider,
          totalKas: args.studioTotalKas,
          action: 'create',
          senderAddress: state.address,
        });
        const campaign = await runtime.create({
          creator: state.address!,
          title: args.title,
          memo: args.memo,
          goalSompi: kasToSompiString(args.goalKas),
          deadline: args.deadline.getTime(),
        });
        appendHubActivityEarn({
          walletRaw: ctx.userAddress,
          source: 'crowdkas_campaign_create',
          redeemableDelta: HUB_EARN_POINTS.crowdkasCampaignCreate,
          krexBalance: krexBalance ?? 0,
          idempotencyKey: `crowdkas:l1:create:${feeTxHash}`,
          meta: { escrow: 'l1-covenant', spendKas: args.studioTotalKas },
        });
        await refresh();
        return campaign;
      }

      const pricing = resolveKpxCovenantDeployPrice('crowdfund', krexTier);
      const campaign = await runKpxCovenantDeployWithFee({
        template: 'crowdfund',
        pricing,
        ctx,
        create: () =>
          runtime.create({
            creator: state.address!,
            title: args.title,
            memo: args.memo,
            goalSompi: kasToSompiString(args.goalKas),
            deadline: args.deadline.getTime(),
          }),
      });
      await refresh();
      return campaign;
    },
    [refresh, runtime, state.address, state.provider, walletCtx, krexTier, krexBalance]
  );

  const pledge = useCallback(
    async (campaignId: string, amountKas: number) => {
      const c = await runtime.pledge(
        campaignId,
        walletCtx().userAddress,
        kasToSompiString(amountKas),
        walletCtx()
      );
      const pledgeEntry = c.pledges[c.pledges.length - 1];
      const txHash = pledgeEntry?.txHash ?? `cf:pledge:${pledgeEntry?.id ?? `${campaignId}:${Date.now()}`}`;
      awardDAppHubPoints({
        walletRaw: walletCtx().userAddress,
        dapp: CROWDFUND_DAPP,
        actionId: 'pledge',
        txHash,
        krexTier,
        krexBalance: krexBalance ?? 0,
        baseSpendKas: amountKas,
      });
      await refresh();
      return c;
    },
    [refresh, runtime, walletCtx, krexTier, krexBalance]
  );

  const claimFunds = useCallback(
    async (campaignId: string) => {
      const pricing = resolveKpxCovenantClaimPrice('crowdfund', krexTier);
      const existing = (await runtime.listAll()).find((c) => c.id === campaignId)?.claimFeeTxHash;
      const c = await runKpxCovenantClaimWithFee({
        template: 'crowdfund',
        pricing,
        ctx: walletCtx(),
        instanceId: campaignId,
        existingFeeTxHash: existing,
        onFeePaid: (feeTxHash) =>
          getSilverscriptCrowdfundRuntime().setClaimFeeTxHash(campaignId, feeTxHash),
        claim: () => runtime.claimByCreator(campaignId, walletCtx().userAddress, walletCtx()),
      });
      await refresh();
      return c;
    },
    [refresh, runtime, walletCtx, krexTier]
  );

  const refund = useCallback(
    async (campaignId: string, pledgeId: string) => {
      const c = await runtime.refundPledge(
        campaignId,
        pledgeId,
        walletCtx().userAddress,
        walletCtx()
      );
      await refresh();
      return c;
    },
    [refresh, runtime, walletCtx]
  );

  const updateCampaign = useCallback(
    async (campaignId: string, patch: { title?: string; memo?: string }) => {
      if (!state.address) throw new Error('Connect wallet first');
      const c = await runtime.updateCampaign(campaignId, state.address, patch);
      await refresh();
      return c;
    },
    [refresh, runtime, state.address],
  );

  const deleteCampaign = useCallback(
    async (campaignId: string, creatorOverride?: string) => {
      const creator = creatorOverride ?? state.address;
      if (!creator) throw new Error('Creator address required');
      await runtime.deleteCampaign(campaignId, creator);
      await refresh();
    },
    [refresh, runtime, state.address],
  );

  return {
    campaigns,
    allCampaigns,
    loading,
    error,
    runtimeMode: getActiveCovenantRuntimeMode(),
    effectiveMode: runtime.effectiveMode,
    refresh,
    createCampaign,
    pledge,
    claimFunds,
    refund,
    updateCampaign,
    deleteCampaign,
  };
}
