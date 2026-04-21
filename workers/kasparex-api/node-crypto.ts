/**
 * HMAC-SHA256 helpers for Krex Node enrollment tokens and request signing.
 */

const encoder = new TextEncoder();

async function importHmacKey(secret: string): Promise<CryptoKey> {
  return crypto.subtle.importKey(
    'raw',
    encoder.encode(secret),
    { name: 'HMAC', hash: 'SHA-256' },
    false,
    ['sign', 'verify']
  );
}

export async function hmacSha256Hex(secret: string, data: string): Promise<string> {
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(data));
  return [...new Uint8Array(sig)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

function base64urlEncode(bytes: Uint8Array): string {
  let bin = '';
  for (let i = 0; i < bytes.length; i++) bin += String.fromCharCode(bytes[i]!);
  return btoa(bin).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/g, '');
}

function base64urlDecode(s: string): Uint8Array {
  const pad = s.length % 4 === 0 ? '' : '='.repeat(4 - (s.length % 4));
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/') + pad;
  const bin = atob(b64);
  const out = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) out[i] = bin.charCodeAt(i);
  return out;
}

export async function signJwtHs256(secret: string, payload: Record<string, unknown>): Promise<string> {
  const header = { alg: 'HS256', typ: 'JWT' };
  const h = base64urlEncode(encoder.encode(JSON.stringify(header)));
  const p = base64urlEncode(encoder.encode(JSON.stringify(payload)));
  const hp = `${h}.${p}`;
  const key = await importHmacKey(secret);
  const sig = await crypto.subtle.sign('HMAC', key, encoder.encode(hp));
  return `${hp}.${base64urlEncode(new Uint8Array(sig))}`;
}

export async function verifyJwtHs256(
  secret: string,
  token: string
): Promise<Record<string, unknown> | null> {
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const [h, p, s] = parts;
  if (!h || !p || !s) return null;
  const hp = `${h}.${p}`;
  const key = await importHmacKey(secret);
  const sigBytes = base64urlDecode(s);
  const ok = await crypto.subtle.verify('HMAC', key, sigBytes, encoder.encode(hp));
  if (!ok) return null;
  try {
    const payload = JSON.parse(new TextDecoder().decode(base64urlDecode(p))) as Record<string, unknown>;
    const exp = Number(payload.exp);
    if (Number.isFinite(exp) && exp < Date.now() / 1000) return null;
    return payload;
  } catch {
    return null;
  }
}

export function randomHex(bytes: number): string {
  const buf = new Uint8Array(bytes);
  crypto.getRandomValues(buf);
  return [...buf].map((b) => b.toString(16).padStart(2, '0')).join('');
}

export async function sha256Hex(data: string): Promise<string> {
  const digest = await crypto.subtle.digest('SHA-256', encoder.encode(data));
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

/** Verify X-Krex-Signature = hex(HMAC-SHA256(secret, `${ts}.${nonce}.${bodySha256}`)) */
export async function verifyNodeRequestHmac(
  secret: string,
  tsStr: string | null,
  nonce: string | null,
  bodyText: string,
  sigHex: string | null,
  maxSkewSec: number
): Promise<{ ok: true } | { ok: false; error: string }> {
  if (!sigHex || !tsStr || !nonce) return { ok: false, error: 'Missing HMAC headers' };
  const ts = Number(tsStr);
  if (!Number.isFinite(ts)) return { ok: false, error: 'Invalid timestamp' };
  const now = Math.floor(Date.now() / 1000);
  if (Math.abs(now - ts) > maxSkewSec) return { ok: false, error: 'Timestamp skew' };
  const bodySha = await sha256Hex(bodyText);
  const expected = await hmacSha256Hex(secret, `${ts}.${nonce}.${bodySha}`);
  if (expected !== sigHex.toLowerCase()) return { ok: false, error: 'Invalid signature' };
  return { ok: true };
}
