/**
 * KCC-20 payment rail (catalog + CTA wiring).
 * Full Writer assembly (presence UTXO + KRON-compatible transfer) lands on this rail next;
 * until then we return an actionable error with the KRON trade URL.
 */

import { kronTokenUrl } from '@/lib/programmable/kron';
import type { HubPaymentCurrencyOption } from '@/lib/payments/hubPaymentTypes';

export type Kcc20PayResult =
  | { ok: true; txHash: string }
  | { ok: false; error: string; tradeUrl?: string };

/**
 * Attempt a Hub KCC-20 transfer to `toAddress`.
 * Catalog and currency selection are live; direct Hub transfer signing ships on this same API.
 */
export async function transferKcc20Payment(args: {
  currency: HubPaymentCurrencyOption;
  amount: number;
  toAddress: string;
  senderAddress: string;
  provider: string;
}): Promise<Kcc20PayResult> {
  void args.amount;
  void args.toAddress;
  void args.senderAddress;
  void args.provider;

  const covenantId = args.currency.covenantId?.trim().toLowerCase();
  if (!covenantId || !/^[a-f0-9]{64}$/.test(covenantId)) {
    return { ok: false, error: 'Invalid KCC-20 covenant id on the selected currency.' };
  }

  const tradeUrl = kronTokenUrl(covenantId);
  return {
    ok: false,
    error:
      'KCC-20 is available in the payment catalog. Direct Hub covenant transfers are enabling next; trade or fund on KRON for now, or pay Hub fees in KAS / KREX.',
    tradeUrl,
  };
}
