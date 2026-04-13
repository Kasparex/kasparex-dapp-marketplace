'use client';

/**
 * Stores a minimal EVM connector id in a host-scoped cookie so injected wallets can
 * reconnect on another *.kasparex.com origin where wagmi localStorage is empty.
 * WalletConnect is skipped (session is not portable across origins).
 */

import { useEffect, useRef } from 'react';
import { useAccount, useConnect, useConnectors } from 'wagmi';

const COOKIE_KEY = 'kaspx_evm_connector_hint';
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;

function kasparexCookieDomain(): string | undefined {
  if (typeof document === 'undefined') return undefined;
  const h = window.location.hostname.toLowerCase();
  return h.endsWith('.kasparex.com') || h === 'kasparex.com' ? '.kasparex.com' : undefined;
}

function readCookie(name: string): string | null {
  if (typeof document === 'undefined') return null;
  const parts = document.cookie ? document.cookie.split('; ') : [];
  for (const c of parts) {
    const idx = c.indexOf('=');
    const k = idx >= 0 ? c.slice(0, idx) : c;
    if (k !== name) continue;
    const v = idx >= 0 ? c.slice(idx + 1) : '';
    try {
      return decodeURIComponent(v);
    } catch {
      return v;
    }
  }
  return null;
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

function parseHint(raw: string | null): HintV1 | null {
  if (!raw) return null;
  try {
    const o = JSON.parse(raw) as HintV1;
    if (o?.v === 1 && typeof o.connectorId === 'string' && o.connectorId.length > 0) return o;
  } catch {
    // ignore
  }
  return null;
}

function isWalletConnectId(id: string): boolean {
  return id === 'walletConnect' || id.startsWith('walletConnect');
}

export function EvmSubdomainReconnectHint() {
  const { status, connector } = useAccount();
  const connectors = useConnectors();
  const { connectAsync } = useConnect();
  const attemptedRef = useRef(false);

  useEffect(() => {
    if (status !== 'connected' || !connector) return;
    const hint: HintV1 = { v: 1, connectorId: connector.id };
    writeCookie(COOKIE_KEY, JSON.stringify(hint), COOKIE_TTL_SECONDS);
  }, [status, connector]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (attemptedRef.current) return;
    if (status !== 'disconnected') return;

    const hint = parseHint(readCookie(COOKIE_KEY));
    if (!hint || isWalletConnectId(hint.connectorId)) return;

    const match = connectors.find((c) => c.id === hint.connectorId);
    if (!match) return;

    attemptedRef.current = true;
    void connectAsync({ connector: match }).catch(() => {
      attemptedRef.current = false;
    });
  }, [status, connectors, connectAsync]);

  return null;
}
