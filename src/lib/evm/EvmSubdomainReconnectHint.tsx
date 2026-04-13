'use client';

/**
 * Mirrors a minimal EVM connector hint in a shared cookie so injected wallets can
 * reconnect on another *.kasparex.com host where wagmi localStorage is empty.
 * WalletConnect sessions are not shared across origins; those are skipped.
 */

import { useEffect, useRef } from 'react';
import { useAccount, useConnect, useConnectors } from 'wagmi';
import { getSharedCookie, setSharedCookie } from '@/lib/storage/sharedCookie';

const COOKIE_KEY = 'kaspx_evm_connector_hint';
const COOKIE_TTL_SECONDS = 60 * 60 * 24 * 30;

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
    setSharedCookie(COOKIE_KEY, JSON.stringify(hint), { maxAgeSeconds: COOKIE_TTL_SECONDS });
  }, [status, connector]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    if (attemptedRef.current) return;
    if (status !== 'disconnected') return;

    const hint = parseHint(getSharedCookie(COOKIE_KEY));
    if (!hint || isWalletConnectId(hint.connectorId)) return;

    const match = connectors.find((c) => c.id === hint.connectorId);
    if (!match) return;

    attemptedRef.current = true;
    void connectAsync({ connector: match }).catch(() => {
      // Allow retry if the extension was not ready yet (e.g. slow subdomain load).
      attemptedRef.current = false;
    });
  }, [status, connectors, connectAsync]);

  return null;
}
