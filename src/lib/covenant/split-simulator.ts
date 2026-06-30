/**
 * Split payment simulator (1:N covenant fan-out).
 */

import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantWalletContext } from './context';
import { requireCovenantContext } from './context';
import { buildSplitCommitNote } from './payload';
import { maybePayLegacyTreasury, useLegacyTreasuryBinding } from './legacy-treasury';
import type { SplitPaymentRuntime } from './split-runtime';
import type {
  CreateSplitParams,
  SplitListFilter,
  SplitPayment,
  SplitRecipient,
  SplitRecipientInput,
} from './split-types';

const MAX_RECIPIENTS = 8;
const MIN_RECIPIENTS = 2;

function normalizeAddr(addr: string): string {
  return addr.trim().toLowerCase().replace(/^kaspa:/i, '');
}

function randomHex(bytes: number): string {
  const arr = new Uint8Array(bytes);
  if (typeof crypto !== 'undefined' && crypto.getRandomValues) {
    crypto.getRandomValues(arr);
  } else {
    for (let i = 0; i < bytes; i++) arr[i] = Math.floor(Math.random() * 256);
  }
  return Array.from(arr, (b) => b.toString(16).padStart(2, '0')).join('');
}

function allocateAmounts(totalSompi: bigint, recipients: SplitRecipientInput[]): string[] {
  let allocated = 0n;
  const amounts: string[] = [];
  for (let i = 0; i < recipients.length; i++) {
    if (i === recipients.length - 1) {
      amounts.push(String(totalSompi - allocated));
    } else {
      const slice = (totalSompi * BigInt(recipients[i].shareBps)) / 10000n;
      amounts.push(String(slice));
      allocated += slice;
    }
  }
  return amounts;
}

function validateRecipients(recipients: SplitRecipientInput[]): void {
  if (recipients.length < MIN_RECIPIENTS) {
    throw new Error(`At least ${MIN_RECIPIENTS} recipients required`);
  }
  if (recipients.length > MAX_RECIPIENTS) {
    throw new Error(`Maximum ${MAX_RECIPIENTS} recipients`);
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
  if (bpsSum !== 10000) {
    throw new Error('Shares must total 100% (10000 basis points)');
  }
}

class SplitPaymentSimulatorRuntime implements SplitPaymentRuntime {
  readonly mode = 'simulator' as const;
  readonly effectiveMode = 'simulator' as const;

  private splits: Map<string, SplitPayment> = new Map();

  constructor() {
    this.load();
  }

  private load(): void {
    if (typeof window === 'undefined') return;
    try {
      const raw = localStorage.getItem(COVENANT_LAB_CONFIG.splitStorageKey);
      if (!raw) return;
      const parsed = JSON.parse(raw) as [string, SplitPayment][];
      this.splits = new Map(parsed);
    } catch {
      this.splits = new Map();
    }
  }

  private save(): void {
    if (typeof window === 'undefined') return;
    localStorage.setItem(
      COVENANT_LAB_CONFIG.splitStorageKey,
      JSON.stringify(Array.from(this.splits.entries()))
    );
  }

  async createSplit(
    params: CreateSplitParams,
    ctx: CovenantWalletContext
  ): Promise<SplitPayment> {
    requireCovenantContext(ctx);
    const total = BigInt(params.totalSompi);
    const min = BigInt(COVENANT_LAB_CONFIG.minLockSompi);
    if (total < min) {
      throw new Error(`Minimum split total is ${Number(min) / 1e8} KAS`);
    }

    if (params.memo.length > COVENANT_LAB_CONFIG.maxMemoLength) {
      throw new Error(`Memo max ${COVENANT_LAB_CONFIG.maxMemoLength} characters`);
    }

    validateRecipients(params.recipients);
    const amounts = allocateAmounts(total, params.recipients);

    const id = `split_${Date.now()}_${randomHex(4)}`;
    const covenantId = `cov_split_${id.slice(-12)}_${randomHex(6)}`;

    let lockTxHash = params.lockTxHash;
    if (useLegacyTreasuryBinding(this.mode)) {
      lockTxHash = await maybePayLegacyTreasury({
        ctx,
        amountSompi: params.totalSompi,
        note: buildSplitCommitNote({
          splitId: id,
          totalSompi: params.totalSompi,
          recipients: params.recipients,
        }),
        dappId: 'covenant-split',
        actionType: 'covenant-split',
        amountKas: Number(total) / 1e8,
        useLegacy: true,
      });
    }

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
      covenantId,
      status: 'open',
      depositor: params.depositor,
      totalSompi: params.totalSompi,
      memo: params.memo.trim(),
      recipients,
      createdAt: Date.now(),
      lockTxHash,
    };

    this.splits.set(id, split);
    this.save();
    return split;
  }

  async claimShare(
    splitId: string,
    recipientId: string,
    claimer: string,
    _ctx: CovenantWalletContext
  ): Promise<SplitPayment> {
    const split = this.splits.get(splitId);
    if (!split) throw new Error('Split payment not found');
    if (split.status === 'completed') throw new Error('Split already fully claimed');

    const recipient = split.recipients.find((r) => r.id === recipientId);
    if (!recipient) throw new Error('Recipient not found');
    if (recipient.claimed) throw new Error('Share already claimed');

    if (normalizeAddr(claimer) !== normalizeAddr(recipient.address)) {
      throw new Error('Only the assigned recipient can claim this share');
    }

    const updatedRecipients = split.recipients.map((r) =>
      r.id === recipientId
        ? {
            ...r,
            claimed: true,
            claimedAt: Date.now(),
            claimTxHash: `sim_split_claim_${randomHex(12)}`,
          }
        : r
    );

    const allClaimed = updatedRecipients.every((r) => r.claimed);
    const updated: SplitPayment = {
      ...split,
      recipients: updatedRecipients,
      status: allClaimed ? 'completed' : 'open',
    };

    this.splits.set(splitId, updated);
    this.save();
    return updated;
  }

  async getSplit(splitId: string): Promise<SplitPayment | null> {
    return this.splits.get(splitId) ?? null;
  }

  async listSplits(filter?: SplitListFilter): Promise<SplitPayment[]> {
    let list = Array.from(this.splits.values()).sort((a, b) => b.createdAt - a.createdAt);

    if (filter?.status) {
      list = list.filter((s) => s.status === filter.status);
    }

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

let instance: SplitPaymentSimulatorRuntime | null = null;

export function getSplitPaymentSimulatorRuntime(): SplitPaymentSimulatorRuntime {
  if (!instance) instance = new SplitPaymentSimulatorRuntime();
  return instance;
}
