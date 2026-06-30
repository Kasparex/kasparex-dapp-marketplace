import { CovenantNotReadyError } from '@/lib/programmability/errors';
import type { SplitPaymentRuntime } from './split-runtime';
import type { MilestoneRuntime } from './milestone-runtime';
import type { CrowdfundRuntime } from './crowdfund-runtime';
import type { VoucherRuntime } from './voucher-runtime';
import { getSplitPaymentSimulatorRuntime } from './split-simulator';
import {
  getSilverscriptSplitRuntime,
  getSilverscriptMilestoneRuntime,
  getSilverscriptCrowdfundRuntime,
  getSilverscriptVoucherRuntime,
} from './silverscript-extras';
import { getMilestoneSimulator } from './milestone-simulator';
import { getCrowdfundSimulator } from './crowdfund-simulator';
import { getVoucherSimulator } from './voucher-simulator';

async function withHybridFallback<T>(
  primary: () => Promise<T>,
  fallback: () => Promise<T>
): Promise<T> {
  try {
    return await primary();
  } catch (err) {
    if (!(err instanceof CovenantNotReadyError)) throw err;
    return fallback();
  }
}

class HybridSplitRuntime implements SplitPaymentRuntime {
  readonly mode = 'hybrid' as const;
  readonly effectiveMode = 'hybrid' as const;
  private primary = getSilverscriptSplitRuntime();
  private fallback = getSplitPaymentSimulatorRuntime();

  createSplit = (...args: Parameters<SplitPaymentRuntime['createSplit']>) =>
    withHybridFallback(
      () => this.primary.createSplit(...args),
      () => this.fallback.createSplit(...args)
    );

  claimShare = (...args: Parameters<SplitPaymentRuntime['claimShare']>) =>
    withHybridFallback(
      () => this.primary.claimShare(...args),
      () => this.fallback.claimShare(...args)
    );

  getSplit = (id: string) => this.primary.getSplit(id).then((r) => r ?? this.fallback.getSplit(id));
  listSplits = (filter?: Parameters<SplitPaymentRuntime['listSplits']>[0]) =>
    this.primary.listSplits(filter).then((list) => (list.length ? list : this.fallback.listSplits(filter)));
}

class HybridMilestoneRuntime implements MilestoneRuntime {
  readonly mode = 'hybrid' as const;
  readonly effectiveMode = 'hybrid' as const;
  private primary = getSilverscriptMilestoneRuntime();
  private fallback = getMilestoneSimulator();

  create = (...args: Parameters<MilestoneRuntime['create']>) =>
    withHybridFallback(
      () => this.primary.create(...args),
      () => this.fallback.create(...args)
    );

  claimMilestone = (...args: Parameters<MilestoneRuntime['claimMilestone']>) =>
    withHybridFallback(
      () => this.primary.claimMilestone(...args),
      () => this.fallback.claimMilestone(...args)
    );

  listForAddress = (address: string) =>
    this.primary.listForAddress(address).then((list) =>
      list.length ? list : this.fallback.listForAddress(address)
    );
}

class HybridCrowdfundRuntime implements CrowdfundRuntime {
  readonly mode = 'hybrid' as const;
  readonly effectiveMode = 'hybrid' as const;
  private primary = getSilverscriptCrowdfundRuntime();
  private fallback = getCrowdfundSimulator();

  create = (params: Parameters<CrowdfundRuntime['create']>[0]) =>
    this.primary.create(params);

  pledge = (...args: Parameters<CrowdfundRuntime['pledge']>) =>
    withHybridFallback(
      () => this.primary.pledge(...args),
      () => this.fallback.pledge(...args)
    );

  claimByCreator = (...args: Parameters<CrowdfundRuntime['claimByCreator']>) =>
    withHybridFallback(
      () => this.primary.claimByCreator(...args),
      () => this.fallback.claimByCreator(...args)
    );

  refundPledge = (...args: Parameters<CrowdfundRuntime['refundPledge']>) =>
    withHybridFallback(
      () => this.primary.refundPledge(...args),
      () => this.fallback.refundPledge(...args)
    );

  listAll = () => this.primary.listAll().then((list) => (list.length ? list : this.fallback.listAll()));
  listForAddress = (address: string) =>
    this.primary.listForAddress(address).then((list) =>
      list.length ? list : this.fallback.listForAddress(address)
    );
}

class HybridVoucherRuntime implements VoucherRuntime {
  readonly mode = 'hybrid' as const;
  readonly effectiveMode = 'hybrid' as const;
  private primary = getSilverscriptVoucherRuntime();
  private fallback = getVoucherSimulator();

  create = (...args: Parameters<VoucherRuntime['create']>) =>
    withHybridFallback(
      () => this.primary.create(...args),
      () => this.fallback.create(...args)
    );

  claim = (...args: Parameters<VoucherRuntime['claim']>) =>
    withHybridFallback(
      () => this.primary.claim(...args),
      () => this.fallback.claim(...args)
    );

  listOpen = () => this.primary.listOpen().then((list) => (list.length ? list : this.fallback.listOpen()));
  listForAddress = (address: string) =>
    this.primary.listForAddress(address).then((list) =>
      list.length ? list : this.fallback.listForAddress(address)
    );
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
