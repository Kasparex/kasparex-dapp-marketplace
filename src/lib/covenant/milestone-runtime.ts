import type { CovenantWalletContext } from './context';
import type { CovenantRuntimeMode } from './types';
import type {
  CreateMilestoneParams,
  MilestoneDeal,
} from './milestone-types';

export interface MilestoneRuntime {
  readonly mode: CovenantRuntimeMode;
  readonly effectiveMode: CovenantRuntimeMode;
  create(params: CreateMilestoneParams, ctx: CovenantWalletContext): Promise<MilestoneDeal>;
  claimMilestone(
    dealId: string,
    stepId: string,
    claimer: string,
    ctx: CovenantWalletContext
  ): Promise<MilestoneDeal>;
  listForAddress(address: string): Promise<MilestoneDeal[]>;
}
