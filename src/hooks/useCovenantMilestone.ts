'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  buildMilestoneCommitNote,
  getMilestoneSimulator,
  kasToSompiString,
  payCovenantTreasury,
  type MilestoneDeal,
  type MilestoneInput,
} from '@/lib/covenant';

export function useCovenantMilestone() {
  const { state } = useKaspaWallet();
  const sim = getMilestoneSimulator();
  const [deals, setDeals] = useState<MilestoneDeal[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!state.address) return setDeals([]);
    setLoading(true);
    try {
      setDeals(await sim.listForAddress(state.address));
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [sim, state.address]);

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
      if (!state.isConnected || !state.address || !state.provider) {
        throw new Error('Connect wallet first');
      }
      const totalSompi = kasToSompiString(args.totalKas);
      const draftId = `draft_${Date.now()}`;
      const lockTxHash = await payCovenantTreasury({
        provider: state.provider as KaspaWalletProvider,
        userAddress: state.address,
        amountSompi: totalSompi,
        note: buildMilestoneCommitNote({
          dealId: draftId,
          totalSompi,
          beneficiary: args.beneficiary,
        }),
        dappId: 'covenant-milestone',
        actionType: 'covenant-milestone-lock',
        amountKas: args.totalKas,
      });
      const deal = await sim.create({
        depositor: state.address,
        beneficiary: args.beneficiary,
        totalSompi,
        memo: args.memo,
        milestones: args.milestones,
        lockTxHash,
      });
      await refresh();
      return deal;
    },
    [refresh, sim, state.address, state.isConnected, state.provider]
  );

  const claimStep = useCallback(
    async (dealId: string, stepId: string) => {
      if (!state.address) throw new Error('Connect wallet first');
      const deal = await sim.claimMilestone(dealId, stepId, state.address);
      await refresh();
      return deal;
    },
    [refresh, sim, state.address]
  );

  return { deals, loading, error, refresh, createDeal, claimStep };
}
