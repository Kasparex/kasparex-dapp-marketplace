import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantWalletContext } from './context';
import { requireCovenantContext } from './context';
import { buildMilestoneCommitNote } from './payload';
import { maybePayLegacyTreasury, shouldUseLegacyTreasury } from './legacy-treasury';
import type { MilestoneRuntime } from './milestone-runtime';
import type { CreateMilestoneParams, MilestoneDeal, MilestoneStep } from './milestone-types';
import {
  allocateBps,
  loadMap,
  normalizeAddr,
  randomHex,
  randomId,
  saveMap,
} from './utils';

const STORAGE = () => COVENANT_LAB_CONFIG.milestoneStorageKey;

class MilestoneSimulator implements MilestoneRuntime {
  readonly mode = 'simulator' as const;
  readonly effectiveMode = 'simulator' as const;

  private deals = loadMap<MilestoneDeal>(STORAGE());

  private persist(): void {
    saveMap(STORAGE(), this.deals);
  }

  async create(params: CreateMilestoneParams, ctx: CovenantWalletContext): Promise<MilestoneDeal> {
    requireCovenantContext(ctx);
    const total = BigInt(params.totalSompi);
    const min = BigInt(COVENANT_LAB_CONFIG.minLockSompi);
    if (total < min) throw new Error(`Minimum total is ${Number(min) / 1e8} KAS`);
    if (!params.beneficiary.trim()) throw new Error('Beneficiary required');
    if (params.milestones.length < 2 || params.milestones.length > 5) {
      throw new Error('Use 2 to 5 milestones');
    }

    let bps = 0;
    let prevUnlock = 0;
    for (const m of params.milestones) {
      if (m.shareBps <= 0) throw new Error('Each milestone needs a positive share');
      bps += m.shareBps;
      if (m.unlockAt <= Date.now()) throw new Error('Milestone unlock times must be in the future');
      if (m.unlockAt < prevUnlock) throw new Error('Milestone unlock times must be ascending');
      prevUnlock = m.unlockAt;
    }
    if (bps !== 10000) throw new Error('Milestone shares must total 100%');

    const amounts = allocateBps(total, params.milestones.map((m) => m.shareBps));
    const id = randomId('ms');
    let lockTxHash = params.lockTxHash;
    if (shouldUseLegacyTreasury(this.mode)) {
      lockTxHash = await maybePayLegacyTreasury({
        ctx,
        amountSompi: params.totalSompi,
        note: buildMilestoneCommitNote({
          dealId: id,
          totalSompi: params.totalSompi,
          beneficiary: params.beneficiary,
        }),
        dappId: 'covenant-milestone',
        actionType: 'covenant-milestone-lock',
        amountKas: Number(total) / 1e8,
        useLegacy: true,
      });
    }

    const milestones: MilestoneStep[] = params.milestones.map((m, i) => ({
      id: `step_${i}_${randomHex(3)}`,
      label: m.label.trim() || `Milestone ${i + 1}`,
      shareBps: m.shareBps,
      amountSompi: amounts[i],
      unlockAt: m.unlockAt,
      claimed: false,
      claimedAt: null,
    }));

    const deal: MilestoneDeal = {
      id,
      covenantId: `cov_ms_${randomHex(10)}`,
      status: 'active',
      depositor: params.depositor,
      beneficiary: params.beneficiary.trim(),
      totalSompi: params.totalSompi,
      memo: params.memo.trim(),
      milestones,
      createdAt: Date.now(),
      lockTxHash,
    };
    this.deals.set(id, deal);
    this.persist();
    return deal;
  }

  async claimMilestone(
    dealId: string,
    stepId: string,
    claimer: string,
    _ctx: CovenantWalletContext
  ): Promise<MilestoneDeal> {
    const deal = this.deals.get(dealId);
    if (!deal) throw new Error('Deal not found');
    if (normalizeAddr(claimer) !== normalizeAddr(deal.beneficiary)) {
      throw new Error('Only the beneficiary can claim milestones');
    }
    const step = deal.milestones.find((s) => s.id === stepId);
    if (!step) throw new Error('Milestone not found');
    if (step.claimed) throw new Error('Milestone already claimed');
    if (Date.now() < step.unlockAt) throw new Error('Milestone not unlocked yet');

    const milestones = deal.milestones.map((s) =>
      s.id === stepId ? { ...s, claimed: true, claimedAt: Date.now() } : s
    );
    const updated: MilestoneDeal = {
      ...deal,
      milestones,
      status: milestones.every((s) => s.claimed) ? 'completed' : 'active',
    };
    this.deals.set(dealId, updated);
    this.persist();
    return updated;
  }

  async listForAddress(address: string): Promise<MilestoneDeal[]> {
    const norm = normalizeAddr(address);
    return Array.from(this.deals.values())
      .filter(
        (d) => normalizeAddr(d.depositor) === norm || normalizeAddr(d.beneficiary) === norm
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

let instance: MilestoneSimulator | null = null;
export function getMilestoneSimulator(): MilestoneSimulator {
  if (!instance) instance = new MilestoneSimulator();
  return instance;
}
