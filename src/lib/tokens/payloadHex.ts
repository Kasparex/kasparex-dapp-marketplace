export const TOKENS_PAYLOAD_PREFIX = 'ktl1:';

export function utf8ToHex(text: string): string {
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8').toString('hex');
  }
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}

export function buildTokenListingCommitPlainNote(args: {
  listingId: string;
  op: 'create' | 'edit';
  contentHash: string;
  version?: number;
}): string {
  return `${TOKENS_PAYLOAD_PREFIX}commit:${args.listingId}:${args.op}:${args.contentHash}:${args.version ?? 1}`;
}

export function buildTokenListingCommitPayloadHex(args: Parameters<typeof buildTokenListingCommitPlainNote>[0]): string {
  return utf8ToHex(buildTokenListingCommitPlainNote(args));
}

export function parseTokenListingCommitPayload(payload: string | null | undefined): {
  listingId: string;
  op: 'create' | 'edit';
  contentHash: string;
} | null {
  if (!payload || typeof payload !== 'string') return null;
  let text = payload.trim();
  if (/^[0-9a-fA-F]+$/.test(text) && text.length % 2 === 0) {
    try {
      text =
        typeof Buffer !== 'undefined'
          ? Buffer.from(text, 'hex').toString('utf8').trim()
          : new TextDecoder().decode(
              new Uint8Array(text.match(/.{1,2}/g)?.map((x) => parseInt(x, 16)) ?? []),
            ).trim();
    } catch {
      return null;
    }
  }
  if (!text.startsWith(TOKENS_PAYLOAD_PREFIX)) return null;
  const rest = text.slice(TOKENS_PAYLOAD_PREFIX.length);
  const parts = rest.split(':');
  if (parts[0] !== 'commit' || parts.length < 4) return null;
  const listingId = parts[1]?.trim();
  const op = parts[2] === 'edit' ? 'edit' : 'create';
  const contentHash = parts[3]?.trim();
  if (!listingId || !contentHash) return null;
  return { listingId, op, contentHash };
}
