import type { CovenantWalletContext } from './context';
import type { CovenantRuntimeMode } from './types';
import type {
  CreateCrowdfundParams,
  CrowdfundCampaign,
} from './crowdfund-types';

export interface CrowdfundRuntime {
  readonly mode: CovenantRuntimeMode;
  readonly effectiveMode: CovenantRuntimeMode;
  create(params: CreateCrowdfundParams): Promise<CrowdfundCampaign>;
  pledge(
    campaignId: string,
    backer: string,
    amountSompi: string,
    ctx: CovenantWalletContext
  ): Promise<CrowdfundCampaign>;
  claimByCreator(campaignId: string, creator: string, ctx: CovenantWalletContext): Promise<CrowdfundCampaign>;
  refundPledge(
    campaignId: string,
    pledgeId: string,
    backer: string,
    ctx: CovenantWalletContext
  ): Promise<CrowdfundCampaign>;
  listAll(): Promise<CrowdfundCampaign[]>;
  listForAddress(address: string): Promise<CrowdfundCampaign[]>;
}
