import { createHash, createHmac, randomBytes } from 'node:crypto';

export function sha256Hex(body: string): string {
  return createHash('sha256').update(body, 'utf8').digest('hex');
}

/** Headers expected by workers/kasparex-api/node-crypto.ts verifyNodeRequestHmac */
export function nodeRequestSignHeaders(secret: string, body: string): Record<string, string> {
  const ts = Math.floor(Date.now() / 1000).toString();
  const nonce = randomBytes(16).toString('hex');
  const bodySha = sha256Hex(body);
  const sig = createHmac('sha256', secret).update(`${ts}.${nonce}.${bodySha}`, 'utf8').digest('hex');
  return {
    'Content-Type': 'application/json',
    'X-Krex-Timestamp': ts,
    'X-Krex-Nonce': nonce,
    'X-Krex-Signature': sig,
  };
}
