/**
 * Silverscript L1 runtimes for split, milestone, crowdfund, and voucher.
 * Same deploy/spend path as LockBox via shared `l1.ts` helpers.
 */
import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantWalletContext } from './context';
import { requireCovenantContext } from './context';
import { deployL1CovenantLock, resolveCovenantUtxoRef, spendL1CovenantLock } from './l1';
import {
  isRealL1Crowdfund,
  isRealL1Milestone,
  isRealL1Split,
  isRealL1Voucher,
  purgeDemoCovenantLabRows,
} from './l1-rows';
import { normalizeCovenantMemo } from './participants';
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
import type { CovenantUtxoRef } from './types';
import {
  allocateBps,
  loadMap,
  normalizeAddr,
  randomHex,
  randomId,
  saveMap,
  sha256Hex,
} from './utils';

function withResolvedUtxo<T extends { utxo?: CovenantUtxoRef; lockTxHash?: string; txHash?: string }>(
  row: T,
): T {
  const utxo = resolveCovenantUtxoRef({
    utxo: row.utxo,
    lockTxHash: row.lockTxHash,
    txHash: row.txHash,
  });
  if (!utxo) return row;
  if (row.utxo?.txId === utxo.txId && row.utxo?.index === utxo.index) return row;
  return {
    ...row,
    utxo,
    lockTxHash: row.lockTxHash ?? utxo.txId,
  };
}

function hydrateSplit(split: SplitPayment): SplitPayment {
  const recipients = split.recipients.map((r) => {
    const hydrated = withResolvedUtxo({
      ...r,
      lockTxHash: r.lockTxHash ?? (r.utxo ? undefined : undefined),
    });
    // Legacy single-lock splits: recipients had no per-share tx; only top-level lockTxHash.
    if (!hydrated.utxo && split.lockTxHash && split.recipients.length === 1) {
      const utxo = resolveCovenantUtxoRef({ lockTxHash: split.lockTxHash });
      if (utxo) {
        return { ...hydrated, utxo, lockTxHash: hydrated.lockTxHash ?? utxo.txId };
      }
    }
    return hydrated;
  });
  return { ...split, recipients };
}

function hydrateMilestone(deal: MilestoneDeal): MilestoneDeal {
  return {
    ...deal,
    milestones: deal.milestones.map((m) => withResolvedUtxo(m)),
  };
}

function hydrateCampaign(campaign: CrowdfundCampaign): CrowdfundCampaign {
  return {
    ...campaign,
    pledges: campaign.pledges.map((p) =>
      withResolvedUtxo({
        ...p,
        lockTxHash: p.txHash,
      }),
    ),
  };
}

function hydrateVoucher(voucher: VoucherLock): VoucherLock {
  return withResolvedUtxo(voucher);
}

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

function assertMinLockSompi(amountSompi: string, label: string): void {
  const min = BigInt(COVENANT_LAB_CONFIG.minLockSompi);
  if (BigInt(amountSompi) < min) {
    throw new Error(`${label} must be at least ${Number(min) / 1e8} KAS`);
  }
}

class SilverscriptSplitRuntime implements SplitPaymentRuntime {
  readonly mode = 'silverscript' as const;
  readonly effectiveMode = 'silverscript' as const;
  private splits = loadMap<SplitPayment>(COVENANT_LAB_CONFIG.splitStorageKey);

  private persist(): void {
    saveMap(COVENANT_LAB_CONFIG.splitStorageKey, this.splits);
  }

  private reload(): void {
    this.splits = loadMap<SplitPayment>(COVENANT_LAB_CONFIG.splitStorageKey);
  }

  async createSplit(
    params: CreateSplitParams,
    ctx: CovenantWalletContext,
  ): Promise<SplitPayment> {
    requireCovenantContext(ctx);
    this.reload();
    validateSplitRecipients(params.recipients);

    const total = BigInt(params.totalSompi);
    const amounts = allocateBps(
      total,
      params.recipients.map((r) => r.shareBps),
    );
    for (const amount of amounts) {
      assertMinLockSompi(amount, 'Each recipient share');
    }

    const memo = normalizeCovenantMemo(params.memo, COVENANT_LAB_CONFIG.maxMemoLength);
    const id = randomId('split');
    const recipients: SplitRecipient[] = [];

    for (let i = 0; i < params.recipients.length; i++) {
      const r = params.recipients[i];
      const amountSompi = amounts[i];
      const deployed = await deployL1CovenantLock(ctx, {
        template: 'split',
        amountSompi,
        payloadArgs: [
          { name: 'beneficiary', type: 'address', value: r.address.trim() },
          { name: 'depositor', type: 'address', value: params.depositor.trim() },
          { name: 'shareBps', type: 'u64', value: String(r.shareBps) },
          { name: 'memo', type: 'string', value: memo },
          { name: 'splitId', type: 'string', value: id },
        ],
        payloadMeta: memo ? { label: memo.slice(0, 80) } : undefined,
        params: {
          beneficiary: r.address.trim(),
          depositor: params.depositor,
          shareBps: r.shareBps,
          memo,
          splitId: id,
        },
      });

      recipients.push({
        id: `rcp_${i}_${randomHex(3)}`,
        address: r.address.trim(),
        shareBps: r.shareBps,
        amountSompi,
        claimed: false,
        claimedAt: null,
        covenantId: deployed.covenantId,
        lockTxHash: deployed.txHash,
        utxo: deployed.utxo?.txId
          ? deployed.utxo
          : { txId: deployed.txHash, index: 0 },
        origin: 'l1',
      });
    }

    const split: SplitPayment = {
      id,
      covenantId: recipients[0]?.covenantId ?? `pending_${randomHex(16)}`,
      status: 'open',
      depositor: params.depositor,
      totalSompi: params.totalSompi,
      memo,
      recipients,
      createdAt: Date.now(),
      lockTxHash: recipients[0]?.lockTxHash,
      origin: 'l1',
    };
    this.splits.set(id, split);
    this.persist();
    return split;
  }

  async claimShare(
    splitId: string,
    recipientId: string,
    claimer: string,
    ctx: CovenantWalletContext,
  ): Promise<SplitPayment> {
    requireCovenantContext(ctx);
    this.reload();
    const split = this.splits.get(splitId);
    if (!split) throw new Error('Split payment not found');
    const recipient = split.recipients.find((r) => r.id === recipientId);
    if (!recipient) throw new Error('Recipient not found');
    if (recipient.claimed) throw new Error('Share already claimed');
    if (normalizeAddr(claimer) !== normalizeAddr(recipient.address)) {
      throw new Error('Only the assigned recipient can claim this share');
    }

    const hydrated = hydrateSplit(split);
    const hydratedRecipient = hydrated.recipients.find((r) => r.id === recipientId) ?? recipient;
    let utxo = resolveCovenantUtxoRef({
      utxo: hydratedRecipient.utxo,
      lockTxHash: hydratedRecipient.lockTxHash,
    });
    // Legacy: one funding tx for the whole split (only safe when a single share remains).
    if (!utxo && split.lockTxHash) {
      const unclaimed = hydrated.recipients.filter((r) => !r.claimed);
      if (unclaimed.length === 1 && unclaimed[0].id === recipientId) {
        utxo = resolveCovenantUtxoRef({ lockTxHash: split.lockTxHash });
      }
    }
    if (!utxo) {
      throw new Error(
        'Share is missing an on-chain UTXO reference. This split was likely created before per-share L1 locks. Create a new split to claim on-chain.',
      );
    }

    // Persist resolved outpoint so retries do not fail again.
    if (!recipient.utxo?.txId) {
      const patched = {
        ...split,
        recipients: split.recipients.map((r) =>
          r.id === recipientId
            ? { ...r, utxo, lockTxHash: r.lockTxHash ?? utxo!.txId }
            : r,
        ),
      };
      this.splits.set(splitId, patched);
      this.persist();
    }

    const spent = await spendL1CovenantLock(ctx, {
      template: 'split',
      utxo,
      amountSompi: recipient.amountSompi,
      toAddress: claimer,
      functionNameFallback: 'distribute',
      params: {
        action: 'claim',
        splitId,
        recipientId,
        beneficiary: claimer.trim(),
      },
    });

    this.reload();
    const latest = this.splits.get(splitId) ?? split;
    const updatedRecipients = latest.recipients.map((r) =>
      r.id === recipientId
        ? {
            ...r,
            utxo: r.utxo ?? utxo,
            lockTxHash: r.lockTxHash ?? utxo.txId,
            claimed: true,
            claimedAt: Date.now(),
            claimTxHash: spent.txHash,
          }
        : r,
    );
    const updated: SplitPayment = {
      ...latest,
      recipients: updatedRecipients,
      status: updatedRecipients.every((r) => r.claimed) ? 'completed' : 'open',
    };
    this.splits.set(splitId, updated);
    this.persist();
    return updated;
  }

  async setClaimFeeTxHash(
    splitId: string,
    recipientId: string,
    feeTxHash: string,
  ): Promise<void> {
    this.reload();
    const split = this.splits.get(splitId);
    if (!split) throw new Error('Split payment not found');
    const recipients = split.recipients.map((r) =>
      r.id === recipientId ? { ...r, claimFeeTxHash: feeTxHash } : r,
    );
    this.splits.set(splitId, { ...split, recipients });
    this.persist();
  }

  async getSplit(splitId: string): Promise<SplitPayment | null> {
    this.reload();
    const split = this.splits.get(splitId);
    return split ? hydrateSplit(split) : null;
  }

  async listSplits(filter?: SplitListFilter): Promise<SplitPayment[]> {
    purgeDemoCovenantLabRows();
    this.reload();
    let dirty = false;
    const hydrated = Array.from(this.splits.values())
      .filter(isRealL1Split)
      .map((s) => {
      const next = hydrateSplit(s);
      if (JSON.stringify(next.recipients) !== JSON.stringify(s.recipients)) {
        this.splits.set(s.id, next);
        dirty = true;
      }
      return next;
    });
    if (dirty) this.persist();

    let list = hydrated.sort((a, b) => b.createdAt - a.createdAt);
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

  private reload(): void {
    this.deals = loadMap<MilestoneDeal>(COVENANT_LAB_CONFIG.milestoneStorageKey);
  }

  async create(params: CreateMilestoneParams, ctx: CovenantWalletContext): Promise<MilestoneDeal> {
    requireCovenantContext(ctx);
    this.reload();

    if (params.milestones.length < 1) throw new Error('At least one milestone is required');
    const bpsSum = params.milestones.reduce((s, m) => s + m.shareBps, 0);
    if (bpsSum !== 10000) throw new Error('Milestone shares must total 100%');

    const total = BigInt(params.totalSompi);
    const amounts = allocateBps(
      total,
      params.milestones.map((m) => m.shareBps),
    );
    for (const amount of amounts) {
      assertMinLockSompi(amount, 'Each milestone share');
    }

    const memo = normalizeCovenantMemo(params.memo, COVENANT_LAB_CONFIG.maxMemoLength);
    const beneficiary = params.beneficiary.trim();
    const id = randomId('ms');
    const milestones: MilestoneStep[] = [];

    for (let i = 0; i < params.milestones.length; i++) {
      const m = params.milestones[i];
      const amountSompi = amounts[i];
      const unlockAt = m.unlockAt;
      const deployed = await deployL1CovenantLock(ctx, {
        template: 'milestone',
        amountSompi,
        payloadArgs: [
          { name: 'beneficiary', type: 'address', value: beneficiary },
          { name: 'depositor', type: 'address', value: params.depositor.trim() },
          { name: 'unlockTimeMs', type: 'u64', value: String(unlockAt) },
          { name: 'stepIndex', type: 'u64', value: String(i + 1) },
          { name: 'memo', type: 'string', value: memo },
          { name: 'dealId', type: 'string', value: id },
        ],
        payloadMeta: memo ? { label: memo.slice(0, 80) } : undefined,
        params: {
          beneficiary,
          depositor: params.depositor,
          unlockTime: Math.floor(unlockAt / 1000),
          stepIndex: i + 1,
          memo,
          dealId: id,
        },
      });

      milestones.push({
        id: `step_${i}_${randomHex(3)}`,
        label: m.label.trim() || `Milestone ${i + 1}`,
        shareBps: m.shareBps,
        amountSompi,
        unlockAt,
        claimed: false,
        claimedAt: null,
        covenantId: deployed.covenantId,
        lockTxHash: deployed.txHash,
        utxo: deployed.utxo?.txId
          ? deployed.utxo
          : { txId: deployed.txHash, index: 0 },
        origin: 'l1',
      });
    }

    const deal: MilestoneDeal = {
      id,
      covenantId: milestones[0]?.covenantId ?? `pending_${randomHex(16)}`,
      status: 'active',
      depositor: params.depositor,
      beneficiary,
      totalSompi: params.totalSompi,
      memo,
      milestones,
      createdAt: Date.now(),
      lockTxHash: milestones[0]?.lockTxHash,
      origin: 'l1',
    };
    this.deals.set(id, deal);
    this.persist();
    return deal;
  }

  async claimMilestone(
    dealId: string,
    stepId: string,
    claimer: string,
    ctx: CovenantWalletContext,
  ): Promise<MilestoneDeal> {
    requireCovenantContext(ctx);
    this.reload();
    const deal = this.deals.get(dealId);
    if (!deal) throw new Error('Deal not found');
    if (normalizeAddr(claimer) !== normalizeAddr(deal.beneficiary)) {
      throw new Error('Only the beneficiary can claim milestones');
    }
    const step = deal.milestones.find((s) => s.id === stepId);
    if (!step) throw new Error('Milestone not found');
    if (step.claimed) throw new Error('Milestone already claimed');
    if (Date.now() < step.unlockAt) throw new Error('Milestone has not unlocked yet');
    const utxo = resolveCovenantUtxoRef({
      utxo: step.utxo,
      lockTxHash: step.lockTxHash,
    });
    if (!utxo) {
      throw new Error(
        'Milestone is missing an on-chain UTXO reference. Create a new deal to claim on L1.',
      );
    }
    if (!step.utxo?.txId) {
      const patched = {
        ...deal,
        milestones: deal.milestones.map((s) =>
          s.id === stepId ? { ...s, utxo, lockTxHash: s.lockTxHash ?? utxo.txId } : s,
        ),
      };
      this.deals.set(dealId, patched);
      this.persist();
    }

    const spent = await spendL1CovenantLock(ctx, {
      template: 'milestone',
      utxo,
      amountSompi: step.amountSompi,
      toAddress: claimer,
      functionNameFallback: 'release_next',
      params: {
        action: 'claim',
        dealId,
        stepId,
        beneficiary: claimer.trim(),
      },
    });

    this.reload();
    const latest = this.deals.get(dealId) ?? deal;
    const milestones = latest.milestones.map((s) =>
      s.id === stepId
        ? {
            ...s,
            utxo: s.utxo ?? utxo,
            lockTxHash: s.lockTxHash ?? utxo.txId,
            claimed: true,
            claimedAt: Date.now(),
            claimTxHash: spent.txHash,
          }
        : s,
    );
    const updated: MilestoneDeal = {
      ...latest,
      milestones,
      status: milestones.every((s) => s.claimed) ? 'completed' : 'active',
    };
    this.deals.set(dealId, updated);
    this.persist();
    return updated;
  }

  async setClaimFeeTxHash(dealId: string, stepId: string, feeTxHash: string): Promise<void> {
    this.reload();
    const deal = this.deals.get(dealId);
    if (!deal) throw new Error('Deal not found');
    const milestones = deal.milestones.map((s) =>
      s.id === stepId ? { ...s, claimFeeTxHash: feeTxHash } : s,
    );
    this.deals.set(dealId, { ...deal, milestones });
    this.persist();
  }

  async listForAddress(address: string): Promise<MilestoneDeal[]> {
    purgeDemoCovenantLabRows();
    this.reload();
    const norm = normalizeAddr(address);
    let dirty = false;
    const deals = Array.from(this.deals.values())
      .filter(isRealL1Milestone)
      .map((d) => {
      const next = hydrateMilestone(d);
      if (JSON.stringify(next.milestones) !== JSON.stringify(d.milestones)) {
        this.deals.set(d.id, next);
        dirty = true;
      }
      return next;
    });
    if (dirty) this.persist();
    return deals
      .filter(
        (d) => normalizeAddr(d.depositor) === norm || normalizeAddr(d.beneficiary) === norm,
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

  private reload(): void {
    this.campaigns = loadMap<CrowdfundCampaign>(COVENANT_LAB_CONFIG.crowdfundStorageKey);
  }

  async create(params: CreateCrowdfundParams): Promise<CrowdfundCampaign> {
    this.reload();
    const id = randomId('cf');
    const campaign: CrowdfundCampaign = {
      id,
      covenantId: `pending_${randomHex(16)}`,
      status: 'funding',
      creator: params.creator,
      title: params.title.trim(),
      memo: normalizeCovenantMemo(params.memo, COVENANT_LAB_CONFIG.maxMemoLength),
      goalSompi: params.goalSompi,
      raisedSompi: '0',
      deadline: params.deadline,
      pledges: [],
      createdAt: Date.now(),
      claimedAt: null,
      origin: 'l1',
    };
    this.campaigns.set(id, campaign);
    this.persist();
    return campaign;
  }

  async pledge(
    campaignId: string,
    backer: string,
    amountSompi: string,
    ctx: CovenantWalletContext,
  ): Promise<CrowdfundCampaign> {
    requireCovenantContext(ctx);
    this.reload();
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (campaign.status !== 'funding') throw new Error('Campaign is not accepting pledges');
    if (Date.now() > campaign.deadline) throw new Error('Campaign deadline has passed');
    assertMinLockSompi(amountSompi, 'Pledge amount');

    const pledgeId = randomId('plg');
    const deployed = await deployL1CovenantLock(ctx, {
      template: 'crowdfund',
      amountSompi,
      payloadArgs: [
        { name: 'creator', type: 'address', value: campaign.creator },
        { name: 'backer', type: 'address', value: backer.trim() },
        { name: 'campaignId', type: 'string', value: campaignId },
        { name: 'goalSompi', type: 'u64', value: campaign.goalSompi },
        { name: 'deadline', type: 'u64', value: String(campaign.deadline) },
      ],
      payloadMeta: { label: campaign.title.slice(0, 80) },
      params: {
        creator: campaign.creator,
        backer: backer.trim(),
        campaignId,
        goalSompi: campaign.goalSompi,
        deadline: campaign.deadline,
      },
    });

    const pledges = [
      ...campaign.pledges,
      {
        id: pledgeId,
        backer: backer.trim(),
        amountSompi,
        txHash: deployed.txHash,
        refunded: false,
        createdAt: Date.now(),
        covenantId: deployed.covenantId,
      utxo: deployed.utxo?.txId
        ? deployed.utxo
        : { txId: deployed.txHash, index: 0 },
      origin: 'l1' as const,
      },
    ];
    const raised = pledges
      .filter((p) => !p.refunded)
      .reduce((s, p) => s + BigInt(p.amountSompi), 0n);
    const updated: CrowdfundCampaign = {
      ...campaign,
      pledges,
      raisedSompi: String(raised),
      covenantId: deployed.covenantId,
      origin: 'l1',
    };
    this.campaigns.set(campaignId, updated);
    this.persist();
    return updated;
  }

  async claimByCreator(
    campaignId: string,
    creator: string,
    ctx: CovenantWalletContext,
  ): Promise<CrowdfundCampaign> {
    requireCovenantContext(ctx);
    this.reload();
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (normalizeAddr(creator) !== normalizeAddr(campaign.creator)) {
      throw new Error('Only the creator can claim funds');
    }
    if (BigInt(campaign.raisedSompi) < BigInt(campaign.goalSompi)) {
      throw new Error('Goal not reached');
    }
    if (campaign.status === 'succeeded') throw new Error('Already claimed');

    const active = campaign.pledges.filter((p) => !p.refunded);
    const resolvedPledges = active.map((pledge) => {
      const utxo = resolveCovenantUtxoRef({
        utxo: pledge.utxo,
        lockTxHash: pledge.txHash,
        txHash: pledge.txHash,
      });
      if (!utxo) {
        throw new Error(
          'Pledge is missing an on-chain UTXO reference. Create a new pledge on L1 to claim.',
        );
      }
      return { pledge, utxo };
    });

    for (const { pledge, utxo } of resolvedPledges) {
      await spendL1CovenantLock(ctx, {
        template: 'crowdfund',
        utxo,
        amountSompi: pledge.amountSompi,
        toAddress: creator,
        functionNameFallback: 'verify_goal',
        params: {
          action: 'claim',
          campaignId,
          creator: creator.trim(),
          goalSompi: campaign.goalSompi,
          raisedSompi: campaign.raisedSompi,
        },
      });
    }

    const updated = {
      ...campaign,
      status: 'succeeded' as const,
      claimedAt: Date.now(),
    };
    this.campaigns.set(campaignId, updated);
    this.persist();
    return updated;
  }

  async refundPledge(
    campaignId: string,
    pledgeId: string,
    backer: string,
    ctx: CovenantWalletContext,
  ): Promise<CrowdfundCampaign> {
    requireCovenantContext(ctx);
    this.reload();
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (Date.now() <= campaign.deadline) {
      throw new Error('Refunds open after the deadline when the goal is missed');
    }
    if (BigInt(campaign.raisedSompi) >= BigInt(campaign.goalSompi)) {
      throw new Error('Goal was reached; refunds are not available');
    }

    const pledge = campaign.pledges.find((p) => p.id === pledgeId);
    if (!pledge) throw new Error('Pledge not found');
    if (pledge.refunded) throw new Error('Pledge already refunded');
    if (normalizeAddr(backer) !== normalizeAddr(pledge.backer)) {
      throw new Error('Only the backer can refund this pledge');
    }
    const utxo = resolveCovenantUtxoRef({
      utxo: pledge.utxo,
      lockTxHash: pledge.txHash,
      txHash: pledge.txHash,
    });
    if (!utxo) {
      throw new Error(
        'Pledge is missing an on-chain UTXO reference. Create a new pledge on L1 to refund.',
      );
    }

    await spendL1CovenantLock(ctx, {
      template: 'crowdfund',
      utxo,
      amountSompi: pledge.amountSompi,
      toAddress: backer,
      functionNameFallback: 'verify_goal',
      params: {
        action: 'refund',
        campaignId,
        pledgeId,
        backer: backer.trim(),
      },
    });

    const pledges = campaign.pledges.map((p) =>
      p.id === pledgeId ? { ...p, refunded: true } : p,
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
    purgeDemoCovenantLabRows();
    this.reload();
    let dirty = false;
    const campaigns = Array.from(this.campaigns.values())
      .filter(isRealL1Crowdfund)
      .map((c) => {
      const next = hydrateCampaign(c);
      if (JSON.stringify(next.pledges) !== JSON.stringify(c.pledges)) {
        this.campaigns.set(c.id, next);
        dirty = true;
      }
      return next;
    });
    if (dirty) this.persist();
    return campaigns.sort((a, b) => b.createdAt - a.createdAt);
  }

  async listForAddress(address: string): Promise<CrowdfundCampaign[]> {
    const norm = normalizeAddr(address);
    return (await this.listAll()).filter(
      (c) =>
        normalizeAddr(c.creator) === norm ||
        c.pledges.some((p) => normalizeAddr(p.backer) === norm),
    );
  }

  async updateCampaign(
    campaignId: string,
    creator: string,
    patch: { title?: string; memo?: string },
  ): Promise<CrowdfundCampaign> {
    this.reload();
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (normalizeAddr(campaign.creator) !== normalizeAddr(creator)) {
      throw new Error('Only the creator can edit');
    }
    const updated: CrowdfundCampaign = {
      ...campaign,
      title: patch.title?.trim() ? patch.title.trim() : campaign.title,
      memo:
        patch.memo !== undefined
          ? normalizeCovenantMemo(patch.memo, COVENANT_LAB_CONFIG.maxMemoLength)
          : campaign.memo,
    };
    this.campaigns.set(campaignId, updated);
    this.persist();
    return updated;
  }

  async deleteCampaign(campaignId: string, creator: string): Promise<void> {
    this.reload();
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    if (normalizeAddr(campaign.creator) !== normalizeAddr(creator)) {
      throw new Error('Only the creator can delete');
    }
    const activePledges = campaign.pledges.filter((p) => !p.refunded).length;
    if (activePledges > 0) throw new Error('Cannot delete a campaign that has received pledges');
    this.campaigns.delete(campaignId);
    this.persist();
  }

  async setClaimFeeTxHash(campaignId: string, feeTxHash: string): Promise<void> {
    this.reload();
    const campaign = this.campaigns.get(campaignId);
    if (!campaign) throw new Error('Campaign not found');
    this.campaigns.set(campaignId, { ...campaign, claimFeeTxHash: feeTxHash });
    this.persist();
  }
}

class SilverscriptVoucherRuntime implements VoucherRuntime {
  readonly mode = 'silverscript' as const;
  readonly effectiveMode = 'silverscript' as const;
  private vouchers = loadMap<VoucherLock>(COVENANT_LAB_CONFIG.voucherStorageKey);

  private persist(): void {
    saveMap(COVENANT_LAB_CONFIG.voucherStorageKey, this.vouchers);
  }

  private reload(): void {
    this.vouchers = loadMap<VoucherLock>(COVENANT_LAB_CONFIG.voucherStorageKey);
  }

  async create(params: CreateVoucherParams, ctx: CovenantWalletContext): Promise<VoucherLock> {
    requireCovenantContext(ctx);
    this.reload();
    assertMinLockSompi(params.amountSompi, 'Voucher amount');
    const memo = normalizeCovenantMemo(params.memo, COVENANT_LAB_CONFIG.maxMemoLength);

    const deployed = await deployL1CovenantLock(ctx, {
      template: 'voucher',
      amountSompi: params.amountSompi,
      payloadArgs: [
        { name: 'creator', type: 'address', value: params.creator.trim() },
        { name: 'secretHash', type: 'hex', value: params.secretHash.toLowerCase() },
        { name: 'expiresAt', type: 'u64', value: String(params.expiresAt) },
        { name: 'memo', type: 'string', value: memo },
      ],
      payloadMeta: memo ? { label: memo.slice(0, 80) } : undefined,
      params: {
        creator: params.creator,
        secretHash: params.secretHash.toLowerCase(),
        expiresAt: params.expiresAt,
        memo,
      },
    });

    const id = randomId('vch');
    const voucher: VoucherLock = {
      id,
      covenantId: deployed.covenantId,
      status: 'open',
      creator: params.creator,
      amountSompi: params.amountSompi,
      secretHash: params.secretHash.toLowerCase(),
      memo,
      expiresAt: params.expiresAt,
      createdAt: Date.now(),
      lockTxHash: deployed.txHash,
      utxo: deployed.utxo?.txId
        ? deployed.utxo
        : { txId: deployed.txHash, index: 0 },
      claimedBy: null,
      claimedAt: null,
      origin: 'l1',
    };
    this.vouchers.set(id, voucher);
    this.persist();
    return voucher;
  }

  async claim(
    voucherId: string,
    secret: string,
    claimer: string,
    ctx: CovenantWalletContext,
  ): Promise<VoucherLock> {
    requireCovenantContext(ctx);
    this.reload();
    const voucher = this.vouchers.get(voucherId);
    if (!voucher) throw new Error('Voucher not found');
    if (voucher.status !== 'open') throw new Error('Voucher is not open');
    if (Date.now() > voucher.expiresAt) throw new Error('Voucher has expired');
    const hash = await sha256Hex(secret.trim());
    if (hash !== voucher.secretHash) throw new Error('Invalid claim secret');
    const utxo = resolveCovenantUtxoRef({
      utxo: voucher.utxo,
      lockTxHash: voucher.lockTxHash,
    });
    if (!utxo) {
      throw new Error(
        'Voucher is missing an on-chain UTXO reference. Create a new voucher to redeem on L1.',
      );
    }
    if (!voucher.utxo?.txId) {
      this.vouchers.set(voucherId, {
        ...voucher,
        utxo,
        lockTxHash: voucher.lockTxHash ?? utxo.txId,
      });
      this.persist();
    }

    const spent = await spendL1CovenantLock(ctx, {
      template: 'voucher',
      utxo,
      amountSompi: voucher.amountSompi,
      toAddress: claimer,
      functionNameFallback: 'redeem',
      extraArgs: { preimage: secret.trim(), secret_hash: voucher.secretHash },
      params: {
        action: 'redeem',
        voucherId,
        secret: secret.trim(),
        claimer: claimer.trim(),
      },
    });

    const updated: VoucherLock = {
      ...voucher,
      utxo,
      lockTxHash: voucher.lockTxHash ?? utxo.txId,
      status: 'claimed',
      claimedBy: claimer,
      claimedAt: Date.now(),
      claimTxHash: spent.txHash,
    };
    this.vouchers.set(voucherId, updated);
    this.persist();
    return updated;
  }

  async setClaimFeeTxHash(voucherId: string, feeTxHash: string): Promise<void> {
    this.reload();
    const voucher = this.vouchers.get(voucherId);
    if (!voucher) throw new Error('Voucher not found');
    this.vouchers.set(voucherId, { ...voucher, claimFeeTxHash: feeTxHash });
    this.persist();
  }

  async listOpen(): Promise<VoucherLock[]> {
    purgeDemoCovenantLabRows();
    this.reload();
    let dirty = false;
    const vouchers = Array.from(this.vouchers.values())
      .filter(isRealL1Voucher)
      .map((v) => {
      const next = hydrateVoucher(v);
      if (next.utxo?.txId !== v.utxo?.txId) {
        this.vouchers.set(v.id, next);
        dirty = true;
      }
      return next;
    });
    if (dirty) this.persist();
    return vouchers
      .filter((v) => v.status === 'open' && Date.now() <= v.expiresAt)
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async listForAddress(address: string): Promise<VoucherLock[]> {
    purgeDemoCovenantLabRows();
    this.reload();
    const norm = normalizeAddr(address);
    let dirty = false;
    const vouchers = Array.from(this.vouchers.values())
      .filter(isRealL1Voucher)
      .map((v) => {
      const next = hydrateVoucher(v);
      if (next.utxo?.txId !== v.utxo?.txId) {
        this.vouchers.set(v.id, next);
        dirty = true;
      }
      return next;
    });
    if (dirty) this.persist();
    return vouchers
      .filter(
        (v) =>
          normalizeAddr(v.creator) === norm ||
          (v.claimedBy && normalizeAddr(v.claimedBy) === norm),
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
