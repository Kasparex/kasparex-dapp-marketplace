import type { CovenantWalletContext } from './context';
import type { CovenantRuntimeMode } from './types';
import type {
  CreateCrowdfundParams,
  CrowdfundCampaign,
  CrowdfundCampaignPatch,
} from './crowdfund-types';

export type CrowdfundPledgeOptions = {
  tierId?: string;
  feeTxHash?: string;
  platformFeeKas?: number;
};

export interface CrowdfundRuntime {
  readonly mode: CovenantRuntimeMode;
  readonly effectiveMode: CovenantRuntimeMode;
  create(params: CreateCrowdfundParams): Promise<CrowdfundCampaign>;
  pledge(
    campaignId: string,
    backer: string,
    amountSompi: string,
    ctx: CovenantWalletContext,
    options?: CrowdfundPledgeOptions,
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
  updateCampaign(
    campaignId: string,
    creator: string,
    patch: CrowdfundCampaignPatch,
  ): Promise<CrowdfundCampaign>;
  deleteCampaign(campaignId: string, creator: string): Promise<void>;
}
