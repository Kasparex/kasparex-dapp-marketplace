export const TOKENS_PAYLOAD_PREFIX = 'ktl1:';

export function utf8ToHex(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8').toString('hex');
  }
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

function hexToUtf8(hex: string): string {
  const clean = hex.replace(/^0x/i, '');
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(clean, 'hex').toString('utf8');
  }
  const bytes = new Uint8Array(clean.match(/.{1,2}/g)?.map((x) => parseInt(x, 16)) ?? []);
  return new TextDecoder().decode(bytes);
}

export function splitPayloadToHexChunks(payload: string, chunkSizeBytes: number): string[] {
  const payloadHex = utf8ToHex(payload);
  const perChunkHexChars = Math.max(2, chunkSizeBytes * 2);
  const chunks: string[] = [];
  for (let i = 0; i < payloadHex.length; i += perChunkHexChars) {
    chunks.push(payloadHex.slice(i, i + perChunkHexChars));
  }
  return chunks.length > 0 ? chunks : [''];
}

export function buildTokenListingCommitPlainNote(args: {
  listingId: string;
  op: 'create' | 'edit';
  chunkTotal: number;
  rootHash: string;
  contentHash: string;
  version?: number;
}): string {
  return `${TOKENS_PAYLOAD_PREFIX}commit:${args.listingId}:${args.op}:${args.chunkTotal}:${args.rootHash}:${args.contentHash}:${args.version ?? 1}`;
}

export function buildTokenListingCommitPayloadHex(args: Parameters<typeof buildTokenListingCommitPlainNote>[0]): string {
  return utf8ToHex(buildTokenListingCommitPlainNote(args));
}

export function computeTokenListingRootHash(chunkHexList: string[]): string {
  let hash = 0x811c9dc5;
  const joined = chunkHexList.join('|');
  for (let i = 0; i < joined.length; i++) {
    hash ^= joined.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return (hash >>> 0).toString(16).padStart(8, '0');
}

export function parseTokenListingCommitPayload(payload: string | null | undefined): {
  listingId: string;
  op: 'create' | 'edit';
  chunkTotal: number;
  rootHash: string;
  contentHash: string;
} | null {
  if (!payload || typeof payload !== 'string') return null;
  let text = payload.trim();
  if (/^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0) {
    try {
      text = hexToUtf8(text).trim();
    } catch {
      return null;
    }
  }
  if (!text.startsWith(TOKENS_PAYLOAD_PREFIX)) return null;
  const rest = text.slice(TOKENS_PAYLOAD_PREFIX.length);
  const parts = rest.split(':');
  if (parts[0] !== 'commit' || parts.length < 6) return null;
  const listingId = parts[1]?.trim();
  const op = parts[2] === 'edit' ? 'edit' : 'create';
  const chunkTotal = Number(parts[3]);
  const rootHash = parts[4]?.trim();
  const contentHash = parts[5]?.trim();
  if (!listingId || !rootHash || !contentHash || !Number.isFinite(chunkTotal)) return null;
  return { listingId, op, chunkTotal, rootHash, contentHash };
}

/** Legacy single-hash commit (pre-chunk listings). */
export function parseTokenListingLegacyCommitPayload(payload: string | null | undefined): {
  listingId: string;
  op: 'create' | 'edit';
  contentHash: string;
} | null {
  if (!payload || typeof payload !== 'string') return null;
  let text = payload.trim();
  if (/^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0) {
    try {
      text = hexToUtf8(text).trim();
    } catch {
      return null;
    }
  }
  if (!text.startsWith(TOKENS_PAYLOAD_PREFIX)) return null;
  const rest = text.slice(TOKENS_PAYLOAD_PREFIX.length);
  const parts = rest.split(':');
  if (parts[0] !== 'commit' || parts.length === 6) return null;
  if (parts.length < 4) return null;
  const listingId = parts[1]?.trim();
  const op = parts[2] === 'edit' ? 'edit' : 'create';
  const contentHash = parts[3]?.trim();
  if (!listingId || !contentHash) return null;
  return { listingId, op, contentHash };
}
