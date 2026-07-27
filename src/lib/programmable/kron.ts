/**
 * KRON (kron.technology) external L1 launchpad + DEX helpers.
 * Hub does not deploy tokens; creators launch on KRON, then connect the covenant id here.
 */

export const KRON_BASE_URL =
  (typeof process !== 'undefined' && process.env.NEXT_PUBLIC_KRON_BASE?.trim()) ||
  'https://kron.technology';

export function kronBase(): string {
  return KRON_BASE_URL.replace(/\/$/, '');
}

/** Bonding-curve launchpad home. */
export function kronLaunchExploreUrl(): string {
  return `${kronBase()}/launch`;
}

/** Create a new token on KRON (wallet required on their site). */
export function kronLaunchNewUrl(): string {
  return `${kronBase()}/launch/new`;
}

/** Wallet integrator / partner program. */
export function kronWalletsUrl(): string {
  return `${kronBase()}/wallets`;
}

/** Per-token trade page (curve or graduated pool). */
export function kronTokenUrl(covenantId: string): string {
  const id = covenantId.trim().toLowerCase();
  return `${kronBase()}/token/${encodeURIComponent(id)}`;
}

const HEX_64 = /^[a-f0-9]{64}$/i;

/**
 * Extract a 64-char hex id from raw paste: bare id, or a KRON token URL.
 * Returns lowercase hex or null.
 */
export function parseKronCovenantInput(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;

  if (HEX_64.test(trimmed)) return trimmed.toLowerCase();

  try {
    const url = new URL(trimmed);
    const host = url.hostname.replace(/^www\./, '').toLowerCase();
    if (host !== 'kron.technology' && host !== 'www.kron.technology') {
      // Still allow path-style paste without insisting on host when path matches
      if (!/kron\.technology/i.test(trimmed)) return null;
    }
    const parts = url.pathname.split('/').filter(Boolean);
    const tokenIdx = parts.findIndex((p) => p.toLowerCase() === 'token');
    if (tokenIdx >= 0 && parts[tokenIdx + 1] && HEX_64.test(parts[tokenIdx + 1])) {
      return parts[tokenIdx + 1].toLowerCase();
    }
  } catch {
    // not a URL
  }

  const match = trimmed.match(/kron\.technology\/token\/([a-f0-9]{64})/i);
  if (match?.[1]) return match[1].toLowerCase();

  return null;
}

/** Normalize connect-field input: KRON URL → covenant id, else trimmed lowercase. */
export function normalizeKcc20ConnectPaste(raw: string): string {
  const fromKron = parseKronCovenantInput(raw);
  if (fromKron) return fromKron;
  return raw.trim().toLowerCase();
}

export function kronMarketEntry(covenantId: string): {
  name: string;
  description: string;
  url: string;
  venueType: 'dex';
} {
  return {
    name: 'KRON',
    description:
      'Kaspa L1 launchpad and DEX: trade on the bonding curve, then on locked AMM pools after graduation.',
    url: kronTokenUrl(covenantId),
    venueType: 'dex',
  };
}

/** Hub deep-link after launching on KRON: paste covenant id into List a Token. */
export function kasparexConnectFromKronPath(covenantId: string, network: 'mainnet' | 'testnet-10' = 'mainnet'): string {
  const id = covenantId.trim().toLowerCase();
  const params = new URLSearchParams({
    from: 'kron',
    covenant: id,
    network,
  });
  return `/tokens/dashboard?${params.toString()}`;
}
