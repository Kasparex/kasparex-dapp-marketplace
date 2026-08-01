/**
 * Shared copy / helpers so public Payment split matches what KasWare shows.
 * Wallet always adds a change output back to the payer (UTXO). That is not an extra charge.
 */

import { HUB_TOKEN_RAIL_FEE_MIN_KAS } from '@/lib/payments/tokenRailKasFee';

export const HUB_PAYMENT_CHANGE_NOTE =
  'Wallet lists the payment outputs above, then change back to your address (extra output). Change is your own KAS returning, not a third fee.';

export function hubPaymentSplitFooter(opts?: { isTokenCommit?: boolean }): string {
  if (opts?.isTokenCommit) {
    return `L1 commit is a fixed ${HUB_TOKEN_RAIL_FEE_MIN_KAS} KAS to treasury (payload). ${HUB_PAYMENT_CHANGE_NOTE}`;
  }
  return `One multi-out payment. ${HUB_PAYMENT_CHANGE_NOTE}`;
}
