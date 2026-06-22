export type CrowdfundStatus = 'funding' | 'succeeded' | 'failed';

export interface CrowdfundPledge {
  id: string;
  backer: string;
  amountSompi: string;
  txHash?: string;
  refunded: boolean;
  createdAt: number;
}

export interface CrowdfundCampaign {
  id: string;
  covenantId: string;
  status: CrowdfundStatus;
  creator: string;
  title: string;
  memo: string;
  goalSompi: string;
  raisedSompi: string;
  deadline: number;
  pledges: CrowdfundPledge[];
  createdAt: number;
  claimedAt: number | null;
}

export interface CreateCrowdfundParams {
  creator: string;
  title: string;
  memo: string;
  goalSompi: string;
  deadline: number;
}

export interface PledgeParams {
  campaignId: string;
  backer: string;
  amountSompi: string;
  txHash?: string;
}
