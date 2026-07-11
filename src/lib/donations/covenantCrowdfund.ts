import type { CrowdfundCampaign } from '@/lib/covenant/crowdfund-types';
import { sompiToKasNumber } from '@/lib/covenant';

export function covenantCampaignRaisedKas(c: CrowdfundCampaign): number {
  return sompiToKasNumber(c.raisedSompi);
}

export function covenantCampaignGoalKas(c: CrowdfundCampaign): number {
  return sompiToKasNumber(c.goalSompi);
}

export function covenantCampaignProgress(c: CrowdfundCampaign): number {
  const goal = covenantCampaignGoalKas(c);
  const raised = covenantCampaignRaisedKas(c);
  return goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
}

export function covenantCampaignIsActive(c: CrowdfundCampaign): boolean {
  return c.status === 'funding' && Date.now() < c.deadline;
}

export function covenantCampaignGoalReached(c: CrowdfundCampaign): boolean {
  if (c.status === 'succeeded') return true;
  return BigInt(c.raisedSompi) >= BigInt(c.goalSompi);
}

export function covenantCampaignBackerCount(c: CrowdfundCampaign): number {
  return c.pledges.filter((p) => !p.refunded).length;
}

export function filterCovenantCampaigns(
  campaigns: CrowdfundCampaign[],
  args: {
    status: 'all' | 'active' | 'ended' | 'goal_reached';
    search?: string;
    network: 'all' | 'l1' | 'l2';
    currencies?: string[];
  }
): CrowdfundCampaign[] {
  if (args.network === 'l2') return [];
  if (args.currencies && args.currencies.length > 0 && !args.currencies.includes('KAS')) return [];

  let list = campaigns;
  if (args.status === 'active') {
    list = list.filter((c) => covenantCampaignIsActive(c));
  } else if (args.status === 'ended') {
    list = list.filter((c) => !covenantCampaignIsActive(c));
  } else if (args.status === 'goal_reached') {
    list = list.filter((c) => covenantCampaignGoalReached(c));
  }

  const q = args.search?.trim().toLowerCase();
  if (q) {
    list = list.filter(
      (c) =>
        c.title.toLowerCase().includes(q) ||
        c.memo.toLowerCase().includes(q) ||
        c.creator.toLowerCase().includes(q)
    );
  }

  return list;
}

export function covenantStatusCounts(campaigns: CrowdfundCampaign[]) {
  let active = 0;
  let ended = 0;
  let goal_reached = 0;
  campaigns.forEach((c) => {
    if (covenantCampaignIsActive(c)) active++;
    else ended++;
    if (covenantCampaignGoalReached(c)) goal_reached++;
  });
  return { all: campaigns.length, active, ended, goal_reached };
}
