/** UTF-8 JSON → hex for KasWare / Kastle `sendKaspa` `options.payload`. */
export function kpxUtf8JsonToPayloadHex(json: string): string {
  const s = String(json || '').trim();
  if (!s) return '';
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(s, 'utf8').toString('hex');
  }
  const bytes = new TextEncoder().encode(s);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
