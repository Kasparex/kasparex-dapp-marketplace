'use client';

import { useCallback, useEffect, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import {
  buildCrowdfundPledgeNote,
  getCrowdfundSimulator,
  kasToSompiString,
  payCovenantTreasury,
  type CrowdfundCampaign,
} from '@/lib/covenant';

export function useCovenantCrowdfund() {
  const { state } = useKaspaWallet();
  const sim = getCrowdfundSimulator();
  const [campaigns, setCampaigns] = useState<CrowdfundCampaign[]>([]);
  const [allCampaigns, setAllCampaigns] = useState<CrowdfundCampaign[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    try {
      setAllCampaigns(await sim.listAll());
      if (state.address) {
        setCampaigns(await sim.listForAddress(state.address));
      } else {
        setCampaigns([]);
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Load failed');
    } finally {
      setLoading(false);
    }
  }, [sim, state.address]);

  useEffect(() => {
    void refresh();
  }, [refresh]);

  const createCampaign = useCallback(
    async (args: { title: string; memo: string; goalKas: number; deadline: Date }) => {
      if (!state.address) throw new Error('Connect wallet first');
      const campaign = await sim.create({
        creator: state.address,
        title: args.title,
        memo: args.memo,
        goalSompi: kasToSompiString(args.goalKas),
        deadline: args.deadline.getTime(),
      });
      await refresh();
      return campaign;
    },
    [refresh, sim, state.address]
  );

  const pledge = useCallback(
    async (campaignId: string, amountKas: number) => {
      if (!state.isConnected || !state.address || !state.provider) {
        throw new Error('Connect wallet first');
      }
      const amountSompi = kasToSompiString(amountKas);
      const txHash = await payCovenantTreasury({
        provider: state.provider as KaspaWalletProvider,
        userAddress: state.address,
        amountSompi,
        note: buildCrowdfundPledgeNote({ campaignId, amountSompi }),
        dappId: 'covenant-crowdfund',
        actionType: 'covenant-crowdfund-pledge',
        amountKas,
      });
      const c = await sim.pledge({
        campaignId,
        backer: state.address,
        amountSompi,
        txHash,
      });
      await refresh();
      return c;
    },
    [refresh, sim, state.address, state.isConnected, state.provider]
  );

  const claimFunds = useCallback(
    async (campaignId: string) => {
      if (!state.address) throw new Error('Connect wallet first');
      const c = await sim.claimByCreator(campaignId, state.address);
      await refresh();
      return c;
    },
    [refresh, sim, state.address]
  );

  const refund = useCallback(
    async (campaignId: string, pledgeId: string) => {
      if (!state.address) throw new Error('Connect wallet first');
      const c = await sim.refundPledge(campaignId, pledgeId, state.address);
      await refresh();
      return c;
    },
    [refresh, sim, state.address]
  );

  return {
    campaigns,
    allCampaigns,
    loading,
    error,
    refresh,
    createCampaign,
    pledge,
    claimFunds,
    refund,
  };
}
