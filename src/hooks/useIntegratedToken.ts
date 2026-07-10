'use client';

import { useEffect, useState } from 'react';
import {
  getIntegratedTokenForWallet,
  type IntegratedToken,
} from '@/lib/tokens/integratedTokens';
import type { HubUtilityProductId } from '@/lib/tokens/utilityRegistry';

type IntegrationApiResponse = {
  ok?: boolean;
  token?: IntegratedToken | null;
};

const resolvedCache = new Map<string, IntegratedToken | null>();
const inflightByKey = new Map<string, Promise<IntegratedToken | null>>();

function cacheKey(wallet: string, productId: HubUtilityProductId): string {
  return `${wallet.trim().toLowerCase()}:${productId}`;
}

async function fetchIntegratedTokenFromApi(
  wallet: string,
  productId: HubUtilityProductId,
): Promise<IntegratedToken | null> {
  const key = cacheKey(wallet, productId);
  const inflight = inflightByKey.get(key);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const params = new URLSearchParams({ wallet, product: productId });
      const res = await fetch(`/api/tokens/integration?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) return null;
      const json = (await res.json()) as IntegrationApiResponse;
      return json.token ?? null;
    } catch {
      return null;
    }
  })();

  inflightByKey.set(key, promise);
  try {
    return await promise;
  } finally {
    inflightByKey.delete(key);
  }
}

export function useIntegratedToken(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
): { token: IntegratedToken | null; isLoading: boolean } {
  const [token, setToken] = useState<IntegratedToken | null>(null);
  const [isLoading, setIsLoading] = useState(Boolean(wallet));

  useEffect(() => {
    if (!wallet) {
      setToken(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const key = cacheKey(wallet, productId);
    setIsLoading(true);

    const resolve = async () => {
      const local = getIntegratedTokenForWallet(wallet, productId);
      if (local) {
        resolvedCache.set(key, local);
        if (!cancelled) {
          setToken(local);
          setIsLoading(false);
        }
        return;
      }

      if (resolvedCache.has(key)) {
        if (!cancelled) {
          setToken(resolvedCache.get(key) ?? null);
          setIsLoading(false);
        }
        return;
      }

      const remote = await fetchIntegratedTokenFromApi(wallet, productId);
      resolvedCache.set(key, remote);
      if (!cancelled) {
        setToken(remote);
        setIsLoading(false);
      }
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [wallet, productId]);

  return { token, isLoading };
}
