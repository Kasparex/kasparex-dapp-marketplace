/**
 * UTF-8 payload prefix on L1 (hex in KasWare `payload`), distinct from ads (`kxad1:`).
 */
export const MAGAZINE_PAYLOAD_PREFIX = 'kxmag1:';

/** Compact binding token: CID + slug + issue number so scanners can correlate IPFS dag and listing. */
export function buildMagazineBindingPlainNote(args: {
  cid: string;
  magazineSlug: string;
  issueNumber: number;
}): string {
  const cid = args.cid.replace(/^ipfs:\/\//, '').trim();
  const slug = args.magazineSlug.trim().toLowerCase().replace(/\s+/g, '-');
  return `${MAGAZINE_PAYLOAD_PREFIX}${slug}|${Math.max(1, Math.floor(args.issueNumber))}|${cid}`;
}

export function buildMagazineBindingPayloadHex(args: {
  cid: string;
  magazineSlug: string;
  issueNumber: number;
}): string {
  const text = buildMagazineBindingPlainNote(args);
  if (typeof Buffer !== 'undefined') {
    return Buffer.from(text, 'utf8').toString('hex');
  }
  const bytes = new TextEncoder().encode(text);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, '0')).join('');
}
