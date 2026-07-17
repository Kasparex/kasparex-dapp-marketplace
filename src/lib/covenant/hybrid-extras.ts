import { CovenantNotReadyError } from '@/lib/programmability/errors';
import type { SplitPaymentRuntime } from './split-runtime';
import type { MilestoneRuntime } from './milestone-runtime';
import type { CrowdfundRuntime } from './crowdfund-runtime';
import type { VoucherRuntime } from './voucher-runtime';
import {
  getSilverscriptSplitRuntime,
  getSilverscriptMilestoneRuntime,
  getSilverscriptCrowdfundRuntime,
  getSilverscriptVoucherRuntime,
} from './silverscript-extras';
import { requireL1CovenantReady } from './l1';

/**
 * Hybrid extras: prefer real L1 (silverscript). No simulator fallback
 * (same policy as LockBox hybrid-runtime).
 */
class HybridSplitRuntime implements SplitPaymentRuntime {
  readonly mode = 'hybrid' as const;
  readonly effectiveMode = 'hybrid' as const;
  private primary = getSilverscriptSplitRuntime();

  createSplit = (...args: Parameters<SplitPaymentRuntime['createSplit']>) =>
    requireL1CovenantReady('Covenant Split', () => this.primary.createSplit(...args));

  claimShare = (...args: Parameters<SplitPaymentRuntime['claimShare']>) =>
    requireL1CovenantReady('Covenant Split', () => this.primary.claimShare(...args));

  getSplit = (id: string) => this.primary.getSplit(id);
  listSplits = (filter?: Parameters<SplitPaymentRuntime['listSplits']>[0]) =>
    this.primary.listSplits(filter);
}

class HybridMilestoneRuntime implements MilestoneRuntime {
  readonly mode = 'hybrid' as const;
  readonly effectiveMode = 'hybrid' as const;
  private primary = getSilverscriptMilestoneRuntime();

  create = (...args: Parameters<MilestoneRuntime['create']>) =>
    requireL1CovenantReady('Covenant Milestone', () => this.primary.create(...args));

  claimMilestone = (...args: Parameters<MilestoneRuntime['claimMilestone']>) =>
    requireL1CovenantReady('Covenant Milestone', () => this.primary.claimMilestone(...args));

  reclaimMilestone = (...args: Parameters<MilestoneRuntime['reclaimMilestone']>) =>
    requireL1CovenantReady('Covenant Milestone', () => this.primary.reclaimMilestone(...args));

  listForAddress = (address: string) => this.primary.listForAddress(address);
}

class HybridCrowdfundRuntime implements CrowdfundRuntime {
  readonly mode = 'hybrid' as const;
  readonly effectiveMode = 'hybrid' as const;
  private primary = getSilverscriptCrowdfundRuntime();

  create = (params: Parameters<CrowdfundRuntime['create']>[0]) => this.primary.create(params);

  pledge = (...args: Parameters<CrowdfundRuntime['pledge']>) =>
    requireL1CovenantReady('Covenant Crowdfund', () => this.primary.pledge(...args));

  claimByCreator = (...args: Parameters<CrowdfundRuntime['claimByCreator']>) =>
    requireL1CovenantReady('Covenant Crowdfund', () => this.primary.claimByCreator(...args));

  refundPledge = (...args: Parameters<CrowdfundRuntime['refundPledge']>) =>
    requireL1CovenantReady('Covenant Crowdfund', () => this.primary.refundPledge(...args));

  listAll = () => this.primary.listAll();
  listForAddress = (address: string) => this.primary.listForAddress(address);
  updateCampaign = (...args: Parameters<CrowdfundRuntime['updateCampaign']>) =>
    this.primary.updateCampaign(...args);
  deleteCampaign = (...args: Parameters<CrowdfundRuntime['deleteCampaign']>) =>
    this.primary.deleteCampaign(...args);
}

class HybridVoucherRuntime implements VoucherRuntime {
  readonly mode = 'hybrid' as const;
  readonly effectiveMode = 'hybrid' as const;
  private primary = getSilverscriptVoucherRuntime();

  create = (...args: Parameters<VoucherRuntime['create']>) =>
    requireL1CovenantReady('Covenant Voucher', () => this.primary.create(...args));

  claim = (...args: Parameters<VoucherRuntime['claim']>) =>
    requireL1CovenantReady('Covenant Voucher', () => this.primary.claim(...args));

  listOpen = () => this.primary.listOpen();
  listForAddress = (address: string) => this.primary.listForAddress(address);
}

let hybridSplit: HybridSplitRuntime | null = null;
let hybridMilestone: HybridMilestoneRuntime | null = null;
let hybridCrowdfund: HybridCrowdfundRuntime | null = null;
let hybridVoucher: HybridVoucherRuntime | null = null;

export function getHybridSplitRuntime(): HybridSplitRuntime {
  if (!hybridSplit) hybridSplit = new HybridSplitRuntime();
  return hybridSplit;
}

export function getHybridMilestoneRuntime(): HybridMilestoneRuntime {
  if (!hybridMilestone) hybridMilestone = new HybridMilestoneRuntime();
  return hybridMilestone;
}

export function getHybridCrowdfundRuntime(): HybridCrowdfundRuntime {
  if (!hybridCrowdfund) hybridCrowdfund = new HybridCrowdfundRuntime();
  return hybridCrowdfund;
}

export function getHybridVoucherRuntime(): HybridVoucherRuntime {
  if (!hybridVoucher) hybridVoucher = new HybridVoucherRuntime();
  return hybridVoucher;
}

/** @deprecated Hybrid no longer falls back; kept for call-site clarity. */
export function assertNoSimulatorFallback(err: unknown, label: string): never {
  if (err instanceof CovenantNotReadyError) {
    throw new CovenantNotReadyError(
      `${err.message} Local simulator fallback is disabled for ${label}.`,
    );
  }
  throw err instanceof Error ? err : new Error(String(err));
}
