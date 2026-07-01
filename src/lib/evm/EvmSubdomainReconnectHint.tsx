'use client';

/**
 * Stores a minimal EVM connector id in a host-scoped cookie for potential cross-subdomain UX.
 * Wagmi reconnectOnMount restores the last EVM session on refresh when the wallet allows it.
 */

import { useEffect } from 'react';
import { useAccount } from 'wagmi';

const COOKIE_KEY = 'kaspx_evm_connector_hint';
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;

function kasparexCookieDomain(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const h = window.location.hostname.toLowerCase();
  return h.endsWith('.kasparex.com') || h === 'kasparex.com' ? '.kasparex.com' : undefined;
}

function writeCookie(name: string, value: string, maxAgeSeconds: number): void {
  if (typeof document === 'undefined') return;
  const domain = kasparexCookieDomain();
  const secure = window.location.protocol === 'https:';
  let s = `${name}=${encodeURIComponent(value)}; Path=/; SameSite=Lax`;
  if (domain) s += `; Domain=${domain}`;
  if (secure) s += '; Secure';
  s += `; Max-Age=${maxAgeSeconds}`;
  document.cookie = s;
}

type HintV1 = { v: 1; connectorId: string };

export function EvmSubdomainReconnectHint() {
  const { status, connector } = useAccount();

  useEffect(() => {
    if (status !== 'connected' || !connector) return;
    const hint: HintV1 = { v: 1, connectorId: connector.id };
    writeCookie(COOKIE_KEY, JSON.stringify(hint), COOKIE_TTL_SECONDS);
  }, [status, connector]);

  return null;
}
