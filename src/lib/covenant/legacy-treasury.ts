import type { CovenantWalletContext } from './context';
import { COVENANT_LAB_CONFIG } from './config';
import { payCovenantTreasury } from './treasury';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';

/**
 * Optional legacy treasury binding (Phase 1 simulator path only).
 * Silverscript mode uses real covenant UTXOs instead.
 */
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

export function shouldUseLegacyTreasury(mode: string): boolean {
  return mode === 'simulator' && Boolean(COVENANT_LAB_CONFIG.treasuryAddress);
}
