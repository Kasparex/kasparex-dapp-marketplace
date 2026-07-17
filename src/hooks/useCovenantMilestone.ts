'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  getMilestoneRuntime,
  getSilverscriptMilestoneRuntime,
  getActiveCovenantRuntimeMode,
  kasToSompiString,
  runKpxCovenantDeployWithFee,
  runKpxCovenantClaimWithFee,
  resolveKpxCovenantDeployPrice,
  resolveKpxCovenantClaimPrice,
  type MilestoneDeal,
  type MilestoneInput,
} from '@/lib/covenant';
import { useKREXBalance } from '@/hooks/useKREXBalance';

export function useCovenantMilestone() {
  const { state } = useKaspaWallet();
  const runtime = getMilestoneRuntime();
  const { tier: krexTier } = useKREXBalance();
  const [deals, setDeals] = useState<MilestoneDeal[]>([]);
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
    if (!state.address) return setDeals([]);
    setLoading(true);
    try {
      setDeals(await runtime.listForAddress(state.address));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [runtime, state.address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createDeal = useCallback(
    async (args: {
      beneficiary: string;
      totalKas: number;
      memo: string;
      milestones: MilestoneInput[];
    }) => {
      const pricing = resolveKpxCovenantDeployPrice('milestone', krexTier, {
        premiumSlotCount: args.milestones.length,
      });
      const deal = await runKpxCovenantDeployWithFee({
        template: 'milestone',
        pricing,
        ctx: walletCtx(),
        create: () =>
          runtime.create(
            {
              depositor: walletCtx().userAddress,
              beneficiary: args.beneficiary,
              totalSompi: kasToSompiString(args.totalKas),
              memo: args.memo,
              milestones: args.milestones,
            },
            walletCtx(),
          ),
      });
      await refresh();
      return deal;
    },
    [refresh, runtime, walletCtx, krexTier]
  );

  const claimStep = useCallback(
    async (dealId: string, stepId: string) => {
      const pricing = resolveKpxCovenantClaimPrice('milestone', krexTier);
      const existing = (await runtime.listForAddress(walletCtx().userAddress))
        .find((d) => d.id === dealId)
        ?.milestones.find((s) => s.id === stepId)?.claimFeeTxHash;
      const deal = await runKpxCovenantClaimWithFee({
        template: 'milestone',
        pricing,
        ctx: walletCtx(),
        instanceId: `${dealId}:${stepId}`,
        existingFeeTxHash: existing,
        onFeePaid: async (feeTxHash) => {
          await getSilverscriptMilestoneRuntime().setClaimFeeTxHash(dealId, stepId, feeTxHash);
        },
        claim: () =>
          runtime.claimMilestone(dealId, stepId, walletCtx().userAddress, walletCtx()),
      });
      await refresh();
      return deal;
    },
    [refresh, runtime, walletCtx, krexTier]
  );

  const reclaimStep = useCallback(
    async (dealId: string, stepId: string) => {
      const pricing = resolveKpxCovenantClaimPrice('milestone', krexTier);
      const existing = (await runtime.listForAddress(walletCtx().userAddress))
        .find((d) => d.id === dealId)
        ?.milestones.find((s) => s.id === stepId)?.claimFeeTxHash;
      const deal = await runKpxCovenantClaimWithFee({
        template: 'milestone',
        pricing,
        ctx: walletCtx(),
        instanceId: `${dealId}:${stepId}:reclaim`,
        existingFeeTxHash: existing,
        onFeePaid: async (feeTxHash) => {
          await getSilverscriptMilestoneRuntime().setClaimFeeTxHash(dealId, stepId, feeTxHash);
        },
        claim: () =>
          runtime.reclaimMilestone(dealId, stepId, walletCtx().userAddress, walletCtx()),
      });
      await refresh();
      return deal;
    },
    [refresh, runtime, walletCtx, krexTier]
  );

  return {
    deals,
    loading,
    error,
    runtimeMode: getActiveCovenantRuntimeMode(),
    effectiveMode: runtime.effectiveMode,
    refresh,
    createDeal,
    claimStep,
    reclaimStep,
  };
}
