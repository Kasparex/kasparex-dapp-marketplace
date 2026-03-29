import { VAULT_PAYLOAD_PREFIX } from '@/lib/chronicles/vault/constants';

function utf8ToHex(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8').toString('hex');
  }
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

/** Binding: kxv1:<offerId>:<kaspaNormalizedAddress> */
export function buildVaultUnlockPlainNote(offerId: string, payerKaspaAddress: string): string {
  return `${VAULT_PAYLOAD_PREFIX}${offerId}:${payerKaspaAddress.trim()}`;
}

export function buildVaultUnlockPayloadHex(offerId: string, payerKaspaAddress: string): string {
  return utf8ToHex(buildVaultUnlockPlainNote(offerId, payerKaspaAddress));
}
