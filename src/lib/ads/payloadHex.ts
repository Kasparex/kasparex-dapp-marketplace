import { AD_PAYLOAD_PREFIX } from '@/lib/ads/constants';

/** Hex-encoded UTF-8 payload for Kaspa L1 transaction (KasWare `sendKaspa` options). */
export function buildAdsBindingPayloadHex(metadataCid: string): string {
  const text = `${AD_PAYLOAD_PREFIX}${metadataCid.replace(/^ipfs:\/\//, '')}`;
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8').toString('hex');
  }
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildAdsBindingPlainNote(metadataCid: string): string {
  return `${AD_PAYLOAD_PREFIX}${metadataCid.replace(/^ipfs:\/\//, '')}`;
}
