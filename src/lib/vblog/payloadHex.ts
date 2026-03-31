import { fnv1aHex } from '@/lib/vblog/pricing';

export const VBLOG_PAYLOAD_PREFIX = 'kvb1:';

function utf8ToHex(text: string): string {
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

export function buildVBlogChunkPlainNote(args: {
  articleId: string;
  op: 'create' | 'edit';
  chunkIndex: number;
  chunkTotal: number;
  contentHash: string;
  chunkDataHex: string;
}): string {
  const idx = args.chunkIndex + 1;
  return `${VBLOG_PAYLOAD_PREFIX}chunk:${args.articleId}:${args.op}:${idx}/${args.chunkTotal}:${args.contentHash}:${args.chunkDataHex}`;
}

export function buildVBlogCommitPlainNote(args: {
  articleId: string;
  op: 'create' | 'edit';
  chunkTotal: number;
  rootHash: string;
  version?: number;
}): string {
  return `${VBLOG_PAYLOAD_PREFIX}commit:${args.articleId}:${args.op}:${args.chunkTotal}:${args.rootHash}:${args.version ?? 1}`;
}

export function buildVBlogChunkPayloadHex(args: Parameters<typeof buildVBlogChunkPlainNote>[0]): string {
  return utf8ToHex(buildVBlogChunkPlainNote(args));
}

export function buildVBlogCommitPayloadHex(args: Parameters<typeof buildVBlogCommitPlainNote>[0]): string {
  return utf8ToHex(buildVBlogCommitPlainNote(args));
}

export function computeVBlogRootHash(chunkHexList: string[]): string {
  return fnv1aHex(chunkHexList.join('|'));
}

export function parseVBlogPayloadBinding(payload: string | null | undefined): null | {
  type: 'chunk' | 'commit';
  articleId: string;
  op: 'create' | 'edit';
} {
  if (!payload || typeof payload !== 'string') return null;
  const text = /^[0-9a-fA-F]+$/.test(payload) ? hexToUtf8(payload) : payload;
  if (!text.startsWith(VBLOG_PAYLOAD_PREFIX)) return null;
  const parts = text.split(':');
  if (parts.length < 5) return null;
  if (parts[1] === 'chunk') {
    return {
      type: 'chunk',
      articleId: parts[2],
      op: parts[3] === 'edit' ? 'edit' : 'create',
    };
  }
  if (parts[1] === 'commit') {
    return {
      type: 'commit',
      articleId: parts[2],
      op: parts[3] === 'edit' ? 'edit' : 'create',
    };
  }
  return null;
}
