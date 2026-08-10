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
import { buildVDonateL1PledgeFeeOutputs } from '@/lib/donations/l1PledgePayment';
import { assertPledgeTierAllowed, sanitizeCrowdfundTiers } from '@/lib/donations/tiers';
import { placeholderDApps } from '@/lib/dapps';
import { hubNotify, notifyActionError } from '@/lib/hub/notify';
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
          const toastId = hubNotify.loading('Creating campaign…', 'Confirm the studio fee in your Kaspa wallet');
          try {
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
            hubNotify.txSuccess({
              id: toastId,
              title: 'Campaign created',
              txHash: feeTxHash,
              description: 'Studio fee paid on Kaspa L1.',
            });
            return campaign;
          } catch (err) {
            hubNotify.dismiss(toastId);
            throw err;
          }
        }

        const toastId = hubNotify.loading('Creating campaign…', 'Confirm in your Kaspa wallet');
        try {
          const pricing = resolveKpxCovenantDeployPrice('crowdfund', krexTier);
          const campaign = await runKpxCovenantDeployWithFee({
            template: 'crowdfund',
            pricing,
            ctx,
            create: () => runtime.create(createParams),
          });
          await refresh();
          hubNotify.success('Campaign created', 'Your L1 covenant campaign is live.', { id: toastId });
          return campaign;
        } catch (err) {
          hubNotify.dismiss(toastId);
          throw err;
        }
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
      const toastId = hubNotify.loading('Pledging…', 'Confirm the multi-output pledge in your Kaspa wallet');
      try {
        const ctx = walletCtx();
        const existing = (await runtime.listAll()).find((c) => c.id === campaignId);
        if (!existing) throw new Error('Campaign not found');
        assertPledgeTierAllowed({
          tiers: existing.tiers,
          tierId,
          pledgeKas: amountKas,
        });

        // One multi-output tx: covenant lock principal + Hub platform fee / rewards legs.
        const feeBuilt = buildVDonateL1PledgeFeeOutputs({
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
            platformFeeKas: feeBuilt.platformFeeKas,
            extraPaymentOutputs: feeBuilt.outputs,
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
          baseSpendKas: amountKas + (feeBuilt.platformFeeKas || 0),
        });
        await refresh();
        hubNotify.txSuccess({
          id: toastId,
          title: 'Pledge locked',
          txHash,
          description: tierId
            ? 'Reward tier unlocked. Open Rewards to view your perks.'
            : 'Your L1 covenant pledge is on Kaspa.',
        });
        return c;
      } catch (err) {
        hubNotify.dismiss(toastId);
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
      const toastId = hubNotify.loading('Claiming funds…', 'Confirm in your Kaspa wallet');
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
        hubNotify.success('Funds claimed', 'Raised KAS moved to your wallet flow.', { id: toastId });
        return c;
      } catch (err) {
        hubNotify.dismiss(toastId);
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
      const toastId = hubNotify.loading('Refunding…', 'Confirm in your Kaspa wallet');
      try {
        const c = await runtime.refundPledge(
          campaignId,
          pledgeId,
          walletCtx().userAddress,
          walletCtx()
        );
        await refresh();
        hubNotify.success('Refund complete', 'Your pledge was refunded.', { id: toastId });
        return c;
      } catch (err) {
        hubNotify.dismiss(toastId);
        const msg = notifyActionError('Refund failed', err, 'Failed to refund pledge');
        setError(msg);
        throw err;
      }
    },
    [refresh, runtime, walletCtx]
  );

  const updateCampaign = useCallback(
    async (
      campaignId: string,
      patch: CrowdfundCampaignPatch,
      opts?: { studioTotalKas?: number },
    ) => {
      setError(null);
      const toastId = hubNotify.loading(
        'Updating campaign…',
        opts?.studioTotalKas && opts.studioTotalKas > 0
          ? 'Confirm the edit fee in your Kaspa wallet'
          : 'Saving campaign changes',
      );
      try {
        if (!state.address) throw new Error('Connect wallet first');
        if (!state.provider) throw new Error('Kaspa wallet provider unavailable');
        const nextPatch: CrowdfundCampaignPatch = {
          ...patch,
          tiers: patch.tiers !== undefined ? sanitizeCrowdfundTiers(patch.tiers) : undefined,
        };

        let feeTxHash: string | undefined;
        if (opts?.studioTotalKas != null && opts.studioTotalKas > 0) {
          feeTxHash = await payCrowdKasL1StudioFee({
            provider: state.provider,
            totalKas: opts.studioTotalKas,
            action: 'edit',
            senderAddress: state.address,
          });
        }

        const c = await runtime.updateCampaign(campaignId, state.address, nextPatch);
        await refresh();
        if (feeTxHash) {
          hubNotify.txSuccess({
            id: toastId,
            title: 'Campaign updated',
            txHash: feeTxHash,
            description: 'Edit fee paid on Kaspa L1.',
          });
        } else {
          hubNotify.success('Campaign updated', 'Your changes are saved.', { id: toastId });
        }
        return c;
      } catch (err) {
        hubNotify.dismiss(toastId);
        const msg = notifyActionError('Update failed', err, 'Failed to update campaign');
        setError(msg);
        throw err;
      }
    },
    [refresh, runtime, state.address, state.provider],
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
