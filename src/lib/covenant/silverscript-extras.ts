/**
 * Silverscript L1 runtimes for split, milestone, crowdfund, and voucher dApps.
 */
import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantWalletContext } from './context';
import { requireCovenantContext } from './context';
import { submitTemplateCovenantTx } from './silverscript-base';
import type { SplitPaymentRuntime } from './split-runtime';
import type {
  CreateSplitParams,
  SplitListFilter,
  SplitPayment,
  SplitRecipient,
  SplitRecipientInput,
} from './split-types';
import type { MilestoneRuntime } from './milestone-runtime';
import type { CreateMilestoneParams, MilestoneDeal, MilestoneStep } from './milestone-types';
import type { CrowdfundRuntime } from './crowdfund-runtime';
import type { CreateCrowdfundParams, CrowdfundCampaign } from './crowdfund-types';
import type { VoucherRuntime } from './voucher-runtime';
import type { CreateVoucherParams, VoucherLock } from './voucher-types';
import {
  allocateBps,
  loadMap,
  normalizeAddr,
  randomHex,
  randomId,
  saveMap,
  sha256Hex,
} from './utils';

const MAX_SPLIT_RECIPIENTS = 8;

function validateSplitRecipients(recipients: SplitRecipientInput[]): void {
  if (recipients.length < 2) throw new Error('At least 2 recipients required');
  if (recipients.length > MAX_SPLIT_RECIPIENTS) {
    throw new Error(`Maximum ${MAX_SPLIT_RECIPIENTS} recipients`);
  }
  const addrs = new Set<string>();
  let bpsSum = 0;
  for (const r of recipients) {
    if (!r.address?.trim()) throw new Error('Each recipient needs an address');
    const norm = normalizeAddr(r.address);
    if (addrs.has(norm)) throw new Error('Duplicate recipient address');
    addrs.add(norm);
    if (r.shareBps <= 0) throw new Error('Each share must be greater than 0%');
    bpsSum += r.shareBps;
  }
  if (bpsSum !== 10000) throw new Error('Shares must total 100%');
}

class SilverscriptSplitRuntime implements SplitPaymentRuntime {
  readonly mode = 'silverscript' as const;
  readonly effectiveMode = 'silverscript' as const;
  private splits = loadMap<SplitPayment>(COVENANT_LAB_CONFIG.splitStorageKey);

  private persist(): void {
    saveMap(COVENANT_LAB_CONFIG.splitStorageKey, this.splits);
  }

  async createSplit(
    params: CreateSplitParams,
    ctx: CovenantWalletContext
  ): Promise<SplitPayment> {
    requireCovenantContext(ctx);
    validateSplitRecipients(params.recipients);
    const total = BigInt(params.totalSompi);
    const tx = await submitTemplateCovenantTx(ctx, 'split', {
      depositor: params.depositor,
      totalSompi: params.totalSompi,
      recipients: params.recipients,
      memo: params.memo,
    });
    const amounts = allocateBps(total, params.recipients.map((r) => r.shareBps));
    const id = randomId('split');
    const recipients: SplitRecipient[] = params.recipients.map((r, i) => ({
      id: `rcp_${i}_${randomHex(3)}`,
      address: r.address.trim(),
      shareBps: r.shareBps,
      amountSompi: amounts[i],
      claimed: false,
      claimedAt: null,
    }));
    const split: SplitPayment = {
      id,
      covenantId: tx.covenantId ?? `pending_${randomHex(16)}`,
      status: 'open',
      depositor: params.depositor,
      totalSompi: params.totalSompi,
      memo: params.memo.trim(),
      recipients,
      createdAt: Date.now(),
      lockTxHash: tx.txHash,
    };
    this.splits.set(id, split);
    this.persist();
    return split;
  }

  async claimShare(
    splitId: string,
    recipientId: string,
    claimer: string,
    ctx: CovenantWalletContext
  ): Promise<SplitPayment> {
    requireCovenantContext(ctx);
    const split = this.splits.get(splitId);
    if (!split) throw new Error('Split payment not found');
    const recipient = split.recipients.find((r) => r.id === recipientId);
    if (!recipient) throw new Error('Recipient not found');
    if (recipient.claimed) throw new Error('Share already claimed');
    if (normalizeAddr(claimer) !== normalizeAddr(recipient.address)) {
      throw new Error('Only the assigned recipient can claim this share');
    }
    const tx = await submitTemplateCovenantTx(ctx, 'split', {
      action: 'claim',
      splitId,
      recipientId,
      amountSompi: recipient.amountSompi,
    });
    const updatedRecipients = split.recipients.map((r) =>
      r.id === recipientId
        ? { ...r, claimed: true, claimedAt: Date.now(), claimTxHash: tx.txHash }
        : r
    );
    const updated: SplitPayment = {
      ...split,
      recipients: updatedRecipients,
      status: updatedRecipients.every((r) => r.claimed) ? 'completed' : 'open',
    };
    this.splits.set(splitId, updated);
    this.persist();
    return updated;
  }

  async getSplit(splitId: string): Promise<SplitPayment | null> {
    return this.splits.get(splitId) ?? null;
  }

  async listSplits(filter?: SplitListFilter): Promise<SplitPayment[]> {
    let list = Array.from(this.splits.values()).sort((a, b) => b.createdAt - a.createdAt);
    if (filter?.status) list = list.filter((s) => s.status === filter.status);
    if (filter?.address) {
      const norm = normalizeAddr(filter.address);
      const role = filter.role ?? 'any';
      list = list.filter((s) => {
        const dep = normalizeAddr(s.depositor);
        if (role === 'depositor') return dep === norm;
        if (role === 'recipient') {
          return s.recipients.some((r) => normalizeAddr(r.address) === norm);
        }
        return dep === norm || s.recipients.some((r) => normalizeAddr(r.address) === norm);
      });
    }
    return list;
  }
}

class SilverscriptMilestoneRuntime implements MilestoneRuntime {
  readonly mode = 'silverscript' as const;
  readonly effectiveMode = 'silverscript' as const;
  private deals = loadMap<MilestoneDeal>(COVENANT_LAB_CONFIG.milestoneStorageKey);

  private persist(): void {
    saveMap(COVENANT_LAB_CONFIG.milestoneStorageKey, this.deals);
  }

  async create(params: CreateMilestoneParams, ctx: CovenantWalletContext): Promise<MilestoneDeal> {
    requireCovenantContext(ctx);
    const tx = await submitTemplateCovenantTx(ctx, 'milestone', {
      depositor: params.depositor,
      beneficiary: params.beneficiary,
      totalSompi: params.totalSompi,
      milestones: params.milestones,
      memo: params.memo,
    });
    const total = BigInt(params.totalSompi);
    const amounts = allocateBps(total, params.milestones.map((m) => m.shareBps));
    const id = randomId('ms');
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
      covenantId: tx.covenantId ?? `pending_${randomHex(16)}`,
      status: 'active',
      depositor: params.depositor,
      beneficiary: params.beneficiary.trim(),
      totalSompi: params.totalSompi,
      memo: params.memo.trim(),
      milestones,
      createdAt: Date.now(),
      lockTxHash: tx.txHash,
    };
    this.deals.set(id, deal);
    this.persist();
    return deal;
  }

  async claimMilestone(
    dealId: string,
    stepId: string,
    claimer: string,
    ctx: CovenantWalletContext
  ): Promise<MilestoneDeal> {
    requireCovenantContext(ctx);
    const deal = this.deals.get(dealId);
    if (!deal) throw new Error('Deal not found');
    const step = deal.milestones.find((s) => s.id === stepId);
    if (!step) throw new Error('Milestone not found');
    await submitTemplateCovenantTx(ctx, 'milestone', {
      action: 'claim',
      dealId,
      stepId,
      claimer,
      amountSompi: step.amountSompi,
      unlockAt: step.unlockAt,
    });
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

class SilverscriptCrowdfundRuntime implements CrowdfundRuntime {
  readonly mode = 'silverscript' as const;
  readonly effectiveMode = 'silverscript' as const;
  private campaigns = loadMap<CrowdfundCampaign>(COVENANT_LAB_CONFIG.crowdfundStorageKey);

  private persist(): void {
    saveMap(COVENANT_LAB_CONFIG.crowdfundStorageKey, this.campaigns);
  }

  async create(params: CreateCrowdfundParams): Promise<CrowdfundCampaign> {
    const id = randomId('cf');
    const campaign: CrowdfundCampaign = {
      id,
      covenantId: `pending_${randomHex(16)}`,
      status: 'funding',
      creator: params.creator,
      title: params.title.trim(),
      memo: params.memo.trim(),
      goalSompi: params.goalSompi,
      raisedSompi: '0',
      deadline: params.deadline,
      pledges: [],
      createdAt: Date.now(),
      claimedAt: null,
    };
    this.campaigns.set(id, campaign);
    this.persist();
    return campaign;
  }

  async pledge(
    campaignId: string,
    backer: string,
    amountSompi: string,
    ctx: CovenantWalletContext
  ): Promise<CrowdfundCampaign> {
    requireCovenantContext(ctx);
    const tx = await submitTemplateCovenantTx(ctx, 'crowdfund', {
      action: 'pledge',
      campaignId,
      backer,
      amountSompi,
    });
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    const pledges = [
      ...campaign.pledges,
      {
        id: randomId('plg'),
        backer,
        amountSompi,
        txHash: tx.txHash,
        refunded: false,
        createdAt: Date.now(),
      },
    ];
    const raised = pledges
      .filter((p) => !p.refunded)
      .reduce((s, p) => s + BigInt(p.amountSompi), 0n);
    const updated: CrowdfundCampaign = {
      ...campaign,
      pledges,
      raisedSompi: String(raised),
      covenantId: tx.covenantId ?? campaign.covenantId,
    };
    this.campaigns.set(campaignId, updated);
    this.persist();
    return updated;
  }

  async claimByCreator(
    campaignId: string,
    creator: string,
    ctx: CovenantWalletContext
  ): Promise<CrowdfundCampaign> {
    requireCovenantContext(ctx);
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    await submitTemplateCovenantTx(ctx, 'crowdfund', {
      action: 'claim',
      campaignId,
      creator,
      goalSompi: campaign.goalSompi,
      deadline: campaign.deadline,
    });
    const updated = { ...campaign, status: 'succeeded' as const, claimedAt: Date.now() };
    this.campaigns.set(campaignId, updated);
    this.persist();
    return updated;
  }

  async refundPledge(
    campaignId: string,
    pledgeId: string,
    backer: string,
    ctx: CovenantWalletContext
  ): Promise<CrowdfundCampaign> {
    requireCovenantContext(ctx);
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    await submitTemplateCovenantTx(ctx, 'crowdfund', {
      action: 'refund',
      campaignId,
      pledgeId,
      backer,
    });
    const pledges = campaign.pledges.map((p) =>
      p.id === pledgeId ? { ...p, refunded: true } : p
    );
    const raised = pledges
      .filter((p) => !p.refunded)
      .reduce((s, p) => s + BigInt(p.amountSompi), 0n);
    const updated: CrowdfundCampaign = {
      ...campaign,
      status: 'failed',
      pledges,
      raisedSompi: String(raised),
    };
    this.campaigns.set(campaignId, updated);
    this.persist();
    return updated;
  }

  async listAll(): Promise<CrowdfundCampaign[]> {
    return Array.from(this.campaigns.values()).sort((a, b) => b.createdAt - a.createdAt);
  }

  async listForAddress(address: string): Promise<CrowdfundCampaign[]> {
    const norm = normalizeAddr(address);
    return (await this.listAll()).filter(
      (c) =>
        normalizeAddr(c.creator) === norm ||
        c.pledges.some((p) => normalizeAddr(p.backer) === norm)
    );
  }
}

class SilverscriptVoucherRuntime implements VoucherRuntime {
  readonly mode = 'silverscript' as const;
  readonly effectiveMode = 'silverscript' as const;
  private vouchers = loadMap<VoucherLock>(COVENANT_LAB_CONFIG.voucherStorageKey);

  private persist(): void {
    saveMap(COVENANT_LAB_CONFIG.voucherStorageKey, this.vouchers);
  }

  async create(params: CreateVoucherParams, ctx: CovenantWalletContext): Promise<VoucherLock> {
    requireCovenantContext(ctx);
    const tx = await submitTemplateCovenantTx(ctx, 'voucher', {
      creator: params.creator,
      amountSompi: params.amountSompi,
      secretHash: params.secretHash,
      expiresAt: params.expiresAt,
      memo: params.memo,
    });
    const id = randomId('vch');
    const voucher: VoucherLock = {
      id,
      covenantId: tx.covenantId ?? `pending_${randomHex(16)}`,
      status: 'open',
      creator: params.creator,
      amountSompi: params.amountSompi,
      secretHash: params.secretHash.toLowerCase(),
      memo: params.memo.trim(),
      expiresAt: params.expiresAt,
      createdAt: Date.now(),
      lockTxHash: tx.txHash,
      claimedBy: null,
      claimedAt: null,
    };
    this.vouchers.set(id, voucher);
    this.persist();
    return voucher;
  }

  async claim(
    voucherId: string,
    secret: string,
    claimer: string,
    ctx: CovenantWalletContext
  ): Promise<VoucherLock> {
    requireCovenantContext(ctx);
    const voucher = this.vouchers.get(voucherId);
    if (!voucher) throw new Error('Voucher not found');
    const hash = await sha256Hex(secret.trim());
    if (hash !== voucher.secretHash) throw new Error('Invalid claim secret');
    const tx = await submitTemplateCovenantTx(ctx, 'voucher', {
      action: 'redeem',
      voucherId,
      secret,
      claimer,
      amountSompi: voucher.amountSompi,
    });
    const updated: VoucherLock = {
      ...voucher,
      status: 'claimed',
      claimedBy: claimer,
      claimedAt: Date.now(),
      lockTxHash: tx.txHash ?? voucher.lockTxHash,
    };
    this.vouchers.set(voucherId, updated);
    this.persist();
    return updated;
  }

  async listOpen(): Promise<VoucherLock[]> {
    return Array.from(this.vouchers.values())
      .filter((v) => v.status === 'open' && Date.now() <= v.expiresAt)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async listForAddress(address: string): Promise<VoucherLock[]> {
    const norm = normalizeAddr(address);
    return Array.from(this.vouchers.values())
      .filter(
        (v) =>
          normalizeAddr(v.creator) === norm ||
          (v.claimedBy && normalizeAddr(v.claimedBy) === norm)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

let splitInstance: SilverscriptSplitRuntime | null = null;
let milestoneInstance: SilverscriptMilestoneRuntime | null = null;
let crowdfundInstance: SilverscriptCrowdfundRuntime | null = null;
let voucherInstance: SilverscriptVoucherRuntime | null = null;

export function getSilverscriptSplitRuntime(): SilverscriptSplitRuntime {
  if (!splitInstance) splitInstance = new SilverscriptSplitRuntime();
  return splitInstance;
}

export function getSilverscriptMilestoneRuntime(): SilverscriptMilestoneRuntime {
  if (!milestoneInstance) milestoneInstance = new SilverscriptMilestoneRuntime();
  return milestoneInstance;
}

export function getSilverscriptCrowdfundRuntime(): SilverscriptCrowdfundRuntime {
  if (!crowdfundInstance) crowdfundInstance = new SilverscriptCrowdfundRuntime();
  return crowdfundInstance;
}

export function getSilverscriptVoucherRuntime(): SilverscriptVoucherRuntime {
  if (!voucherInstance) voucherInstance = new SilverscriptVoucherRuntime();
  return voucherInstance;
}
