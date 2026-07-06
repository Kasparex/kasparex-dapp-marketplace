'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  getMilestoneRuntime,
  getActiveCovenantRuntimeMode,
  kasToSompiString,
  runKpxCovenantDeployWithFee,
  awardKpxCovenantClaimPoints,
  resolveKpxCovenantDeployPrice,
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
      const pricing = resolveKpxCovenantDeployPrice('milestone', krexTier);
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
      const deal = await runtime.claimMilestone(
        dealId,
        stepId,
        walletCtx().userAddress,
        walletCtx()
      );
      awardKpxCovenantClaimPoints({
        walletAddress: walletCtx().userAddress,
        template: 'milestone',
        instanceId: `${dealId}:${stepId}`,
        krexTier,
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
  };
}
