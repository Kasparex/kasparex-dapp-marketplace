import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantWalletContext } from './context';
import { requireCovenantContext } from './context';
import type { VoucherRuntime } from './voucher-runtime';
import type { CreateVoucherParams, VoucherLock } from './voucher-types';
import { loadMap, randomHex, randomId, saveMap, sha256Hex } from './utils';

const STORAGE = () => COVENANT_LAB_CONFIG.voucherStorageKey;

function effectiveStatus(v: VoucherLock): VoucherLock['status'] {
  if (v.status === 'claimed') return 'claimed';
  if (Date.now() > v.expiresAt) return 'expired';
  return 'open';
}

class VoucherSimulator implements VoucherRuntime {
  readonly mode = 'simulator' as const;
  readonly effectiveMode = 'simulator' as const;

  private vouchers = loadMap<VoucherLock>(STORAGE());

  private persist(): void {
    saveMap(STORAGE(), this.vouchers);
  }

  async create(params: CreateVoucherParams, ctx: CovenantWalletContext): Promise<VoucherLock> {
    requireCovenantContext(ctx);
    const amount = BigInt(params.amountSompi);
    const min = BigInt(COVENANT_LAB_CONFIG.minLockSompi);
    if (amount < min) throw new Error(`Minimum voucher is ${Number(min) / 1e8} KAS`);
    if (params.expiresAt <= Date.now()) throw new Error('Expiry must be in the future');
    if (!params.secretHash || params.secretHash.length !== 64) {
      throw new Error('Invalid secret hash');
    }

    const id = randomId('vch');

    const voucher: VoucherLock = {
      id,
      covenantId: `cov_vch_${randomHex(10)}`,
      status: 'open',
      creator: params.creator,
      amountSompi: params.amountSompi,
      secretHash: params.secretHash.toLowerCase(),
      memo: params.memo.trim(),
      expiresAt: params.expiresAt,
      createdAt: Date.now(),
      lockTxHash: params.lockTxHash,
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
    _ctx: CovenantWalletContext
  ): Promise<VoucherLock> {
    const voucher = this.vouchers.get(voucherId);
    if (!voucher) throw new Error('Voucher not found');
    const status = effectiveStatus(voucher);
    if (status === 'claimed') throw new Error('Voucher already claimed');
    if (status === 'expired') throw new Error('Voucher expired');

    const hash = await sha256Hex(secret.trim());
    if (hash !== voucher.secretHash) {
      throw new Error('Invalid claim secret');
    }

    const updated: VoucherLock = {
      ...voucher,
      status: 'claimed',
      claimedBy: claimer,
      claimedAt: Date.now(),
    };
    this.vouchers.set(voucherId, updated);
    this.persist();
    return updated;
  }

  async getById(id: string): Promise<VoucherLock | null> {
    const v = this.vouchers.get(id);
    if (!v) return null;
    return { ...v, status: effectiveStatus(v) };
  }

  async listForAddress(address: string): Promise<VoucherLock[]> {
    const norm = address.trim().toLowerCase().replace(/^kaspa:/i, '');
    return Array.from(this.vouchers.values())
      .map((v) => ({ ...v, status: effectiveStatus(v) }))
      .filter(
        (v) =>
          v.creator.toLowerCase().replace(/^kaspa:/i, '') === norm ||
          (v.claimedBy && v.claimedBy.toLowerCase().replace(/^kaspa:/i, '') === norm)
      )
      .sort((a, b) => b.createdAt - a.createdAt);
  }

  async listOpen(): Promise<VoucherLock[]> {
    return Array.from(this.vouchers.values())
      .map((v) => ({ ...v, status: effectiveStatus(v) }))
      .filter((v) => v.status === 'open')
      .sort((a, b) => b.createdAt - a.createdAt);
  }
}

let instance: VoucherSimulator | null = null;
export function getVoucherSimulator(): VoucherSimulator {
  if (!instance) instance = new VoucherSimulator();
  return instance;
}
