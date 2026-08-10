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
  type CrowdfundCampaignPatch,
  type CreateCrowdfundParams,
} from '@/lib/covenant';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { awardDAppHubPoints } from '@/lib/rewards/awardDAppHubPoints';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { payCrowdKasL1StudioFee } from '@/lib/donations/l1Payment';
import { payVDonateL1PledgePlatformFee } from '@/lib/donations/l1PledgePayment';
import { assertPledgeTierAllowed, sanitizeCrowdfundTiers } from '@/lib/donations/tiers';
import { placeholderDApps } from '@/lib/dapps';
import { notifyActionError } from '@/lib/hub/notify';
import { sompiToKasNumber } from '@/lib/covenant';

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
      const msg = notifyActionError('Load failed', e, 'Load failed');
      setError(msg);
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
      mainContent?: string;
      imageUrl?: string;
      imageHash?: string;
      category?: string;
      tags?: string[];
      tiers?: CreateCrowdfundParams['tiers'];
      faq?: CreateCrowdfundParams['faq'];
      socialLinks?: CreateCrowdfundParams['socialLinks'];
      premiumTabEnabled?: boolean;
      premiumTabTitle?: string;
      premiumTabContent?: string;
    }) => {
      setError(null);
      try {
        if (!state.address || !state.provider) throw new Error('Connect wallet first');
        const ctx = walletCtx();
        const createParams: CreateCrowdfundParams = {
          creator: state.address!,
          title: args.title,
          memo: args.memo,
          goalSompi: kasToSompiString(args.goalKas),
          deadline: args.deadline.getTime(),
          mainContent: args.mainContent,
          imageUrl: args.imageUrl,
          imageHash: args.imageHash,
          category: args.category,
          tags: args.tags,
          tiers: sanitizeCrowdfundTiers(args.tiers),
          faq: args.faq,
          socialLinks: args.socialLinks,
          premiumTabEnabled: args.premiumTabEnabled,
          premiumTabTitle: args.premiumTabTitle,
          premiumTabContent: args.premiumTabContent,
        };

        if (args.studioTotalKas != null && args.studioTotalKas > 0) {
          const feeTxHash = await payCrowdKasL1StudioFee({
            provider: ctx.provider,
            totalKas: args.studioTotalKas,
            action: 'create',
            senderAddress: state.address,
          });
          const campaign = await runtime.create(createParams);
          appendHubActivityEarn({
            walletRaw: ctx.userAddress,
            source: 'crowdkas_campaign_create',
            redeemableDelta: HUB_EARN_POINTS.crowdkasCampaignCreate,
            krexBalance: krexBalance ?? 0,
            idempotencyKey: `vdonate:l1:create:${feeTxHash}`,
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
          create: () => runtime.create(createParams),
        });
        await refresh();
        return campaign;
      } catch (err) {
        const msg = notifyActionError('Create failed', err, 'Failed to create campaign');
        setError(msg);
        throw err;
      }
    },
    [refresh, runtime, state.address, state.provider, walletCtx, krexTier, krexBalance]
  );

  const pledge = useCallback(
    async (campaignId: string, amountKas: number, tierId?: string) => {
      setError(null);
      try {
        const ctx = walletCtx();
        const existing = (await runtime.listAll()).find((c) => c.id === campaignId);
        if (!existing) throw new Error('Campaign not found');
        assertPledgeTierAllowed({
          tiers: existing.tiers,
          tierId,
          pledgeKas: amountKas,
        });

        // Platform fee first (shared multi-out KAS rail), then L1 covenant lock for the pledge.
        const feePaid = await payVDonateL1PledgePlatformFee({
          provider: ctx.provider,
          senderAddress: ctx.userAddress,
          pledgeKas: amountKas,
          campaignId,
        });

        const c = await runtime.pledge(
          campaignId,
          ctx.userAddress,
          kasToSompiString(amountKas),
          ctx,
          {
            tierId,
            feeTxHash: feePaid.feeTxHash,
            platformFeeKas: feePaid.platformFeeKas,
          },
        );
        const pledgeEntry = c.pledges[c.pledges.length - 1];
        const txHash = pledgeEntry?.txHash ?? `cf:pledge:${pledgeEntry?.id ?? `${campaignId}:${Date.now()}`}`;
        awardDAppHubPoints({
          walletRaw: ctx.userAddress,
          dapp: CROWDFUND_DAPP,
          actionId: 'pledge',
          txHash,
          krexTier,
          krexBalance: krexBalance ?? 0,
          baseSpendKas: amountKas + (feePaid.platformFeeKas || 0),
        });
        await refresh();
        return c;
      } catch (err) {
        const msg = notifyActionError('Pledge failed', err, 'Failed to pledge');
        setError(msg);
        throw err;
      }
    },
    [refresh, runtime, walletCtx, krexTier, krexBalance]
  );

  const claimFunds = useCallback(
    async (campaignId: string) => {
      setError(null);
      try {
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
      } catch (err) {
        const msg = notifyActionError('Claim failed', err, 'Failed to claim funds');
        setError(msg);
        throw err;
      }
    },
    [refresh, runtime, walletCtx, krexTier]
  );

  const refund = useCallback(
    async (campaignId: string, pledgeId: string) => {
      setError(null);
      try {
        const c = await runtime.refundPledge(
          campaignId,
          pledgeId,
          walletCtx().userAddress,
          walletCtx()
        );
        await refresh();
        return c;
      } catch (err) {
        const msg = notifyActionError('Refund failed', err, 'Failed to refund pledge');
        setError(msg);
        throw err;
      }
    },
    [refresh, runtime, walletCtx]
  );

  const updateCampaign = useCallback(
    async (campaignId: string, patch: CrowdfundCampaignPatch) => {
      setError(null);
      try {
        if (!state.address) throw new Error('Connect wallet first');
        const nextPatch: CrowdfundCampaignPatch = {
          ...patch,
          tiers: patch.tiers !== undefined ? sanitizeCrowdfundTiers(patch.tiers) : undefined,
        };
        const c = await runtime.updateCampaign(campaignId, state.address, nextPatch);
        await refresh();
        return c;
      } catch (err) {
        const msg = notifyActionError('Update failed', err, 'Failed to update campaign');
        setError(msg);
        throw err;
      }
    },
    [refresh, runtime, state.address],
  );

  const deleteCampaign = useCallback(
    async (campaignId: string, creatorOverride?: string) => {
      setError(null);
      try {
        const creator = creatorOverride ?? state.address;
        if (!creator) throw new Error('Creator address required');
        await runtime.deleteCampaign(campaignId, creator);
        await refresh();
      } catch (err) {
        const msg = notifyActionError('Delete failed', err, 'Failed to delete campaign');
        setError(msg);
        throw err;
      }
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
    /** Helper for UI fee copy. */
    sompiToKasNumber,
  };
}
