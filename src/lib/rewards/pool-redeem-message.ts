/**
 * Kaspa-signed authorization for /api/kasparex/pts/pool-redeem (GRID/KREX pool on Igra).
 */

export const POOL_REDEEM_MESSAGE_VERSION = 'v1';

export function buildPoolRedeemKaspaMessage(args: {
  walletKaspa: string;
  evmBeneficiary: string;
  catalogItemId: string;
  ptsSpent: number;
  expiresUnix: number;
  /** Passed through to Worker as request_id for idempotent retries. */
  nonce: string;
}): string {
  const w = (args.walletKaspa ?? '').trim();
  const evm = (args.evmBeneficiary ?? '').trim().toLowerCase();
  const nonce = (args.nonce ?? '').trim();
  if (!nonce) throw new Error('pool redeem nonce required');
  return [
    `Kasparex pool redeem ${POOL_REDEEM_MESSAGE_VERSION}`,
    `wallet:${w}`,
    `evm:${evm}`,
    `catalog:${args.catalogItemId.trim()}`,
    `pts:${Math.floor(args.ptsSpent)}`,
    `exp:${Math.floor(args.expiresUnix)}`,
    `nonce:${nonce}`,
  ].join('\n');
}

export type ParsedPoolRedeemMessage = {
  walletKaspa: string;
  evmBeneficiary: string;
  catalogItemId: string;
  ptsSpent: number;
  expiresUnix: number;
  nonce: string;
};

export function parsePoolRedeemKaspaMessage(message: string): ParsedPoolRedeemMessage | null {
  const lines = message.replace(/\r\n/g, '\n').trim().split('\n');
  if (lines.length < 7) return null;
  const head = lines[0]!.trim();
  if (head !== `Kasparex pool redeem ${POOL_REDEEM_MESSAGE_VERSION}`) return null;
  const map = new Map<string, string>();
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i]!;
    const idx = line.indexOf(':');
    if (idx < 1) return null;
    map.set(line.slice(0, idx).trim().toLowerCase(), line.slice(idx + 1).trim());
  }
  const wallet = map.get('wallet');
  const evm = map.get('evm');
  const catalog = map.get('catalog');
  const ptsRaw = map.get('pts');
  const expRaw = map.get('exp');
  const nonce = map.get('nonce');
  if (!wallet || !evm || !catalog || !ptsRaw || !expRaw || !nonce) return null;
  const ptsSpent = Number(ptsRaw);
  const expiresUnix = Number(expRaw);
  if (!Number.isFinite(ptsSpent) || ptsSpent < 1) return null;
  if (!Number.isFinite(expiresUnix)) return null;
  return {
    walletKaspa: wallet,
    evmBeneficiary: evm,
    catalogItemId: catalog,
    ptsSpent: Math.floor(ptsSpent),
    expiresUnix: Math.floor(expiresUnix),
    nonce: nonce.trim(),
  };
}
