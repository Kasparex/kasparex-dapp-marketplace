import type { CovenantWalletContext } from './context';
import type { CovenantRuntimeMode } from './types';
import type { CreateVoucherParams, VoucherLock } from './voucher-types';

export interface VoucherRuntime {
  readonly mode: CovenantRuntimeMode;
  readonly effectiveMode: CovenantRuntimeMode;
  create(params: CreateVoucherParams, ctx: CovenantWalletContext): Promise<VoucherLock>;
  claim(
    voucherId: string,
    secret: string,
    claimer: string,
    ctx: CovenantWalletContext
  ): Promise<VoucherLock>;
  listOpen(): Promise<VoucherLock[]>;
  listForAddress(address: string): Promise<VoucherLock[]>;
}
