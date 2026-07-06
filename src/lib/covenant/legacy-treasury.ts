/**
 * @deprecated Use payKpxCovenantDeployFee from platform-fee.ts for deploy fees.
 * Lock principal must never be sent to treasury.
 */

import type { CovenantWalletContext } from './context';
import { COVENANT_LAB_CONFIG } from './config';
import { payCovenantTreasury } from './treasury';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

/** @deprecated */
export async function maybePayLegacyTreasury(args: {
  ctx: CovenantWalletContext;
  amountSompi: string;
  note: string;
  dappId: string;
  actionType: string;
  amountKas: number;
  useLegacy: boolean;
}): Promise<string | undefined> {
  if (!args.useLegacy || !COVENANT_LAB_CONFIG.treasuryAddress) return undefined;
  return payCovenantTreasury({
    provider: args.ctx.provider as KaspaWalletProvider,
    userAddress: args.ctx.userAddress,
    amountSompi: args.amountSompi,
    note: args.note,
    dappId: args.dappId,
    actionType: args.actionType,
    amountKas: args.amountKas,
  });
}

/** @deprecated Simulators no longer charge treasury on lock principal. */
export function shouldUseLegacyTreasury(_mode: string): boolean {
  return false;
}
