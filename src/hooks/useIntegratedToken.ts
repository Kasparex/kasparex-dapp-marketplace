'use client';

import { useEffect, useState } from 'react';
import { bootstrapHubContent } from '@/lib/hub/contentSync';
import {
  getIntegratedTokensForWallet,
  type IntegratedToken,
} from '@/lib/tokens/integratedTokens';
import type { HubUtilityProductId } from '@/lib/tokens/utilityRegistry';

type IntegratedApiResponse = {
  ok?: boolean;
  tokens?: IntegratedToken[];
};

const tokenCache = new Map<string, IntegratedToken[]>();
const inflightByKey = new Map<string, Promise<IntegratedToken[]>>();

function cacheKey(wallet: string | undefined, productId: HubUtilityProductId): string {
  return `${(wallet ?? '').trim().toLowerCase()}:${productId}`;
}

export function clearIntegratedTokenCache(): void {
  tokenCache.clear();
}

async function fetchIntegratedTokensFromApi(
  wallet: string | undefined,
  productId: HubUtilityProductId,
): Promise<IntegratedToken[]> {
  const key = cacheKey(wallet, productId);
  const inflight = inflightByKey.get(key);
  if (inflight) return inflight;

  const promise = (async () => {
    try {
      const params = new URLSearchParams({ product: productId });
      if (wallet) params.set('wallet', wallet);
      const res = await fetch(`/api/tokens/integrated?${params.toString()}`, { cache: 'no-store' });
      if (!res.ok) return [];
      const json = (await res.json()) as IntegratedApiResponse;
      return json.tokens ?? [];
    } catch {
      return [];
    }
  })();

  inflightByKey.set(key, promise);
  try {
    return await promise;
  } finally {
    inflightByKey.delete(key);
  }
}

async function resolveIntegratedTokens(
  wallet: string | undefined,
  productId: HubUtilityProductId,
): Promise<IntegratedToken[]> {
  if (wallet) {
    const local = getIntegratedTokensForWallet(wallet, productId);
    if (local.length > 0) return local;
  }

  await bootstrapHubContent(['tokens']).catch(() => {});

  if (wallet) {
    const synced = getIntegratedTokensForWallet(wallet, productId);
    if (synced.length > 0) return synced;
  }

  return fetchIntegratedTokensFromApi(wallet, productId);
}

export function useIntegratedTokens(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
): { tokens: IntegratedToken[]; isLoading: boolean } {
  const [tokens, setTokens] = useState<IntegratedToken[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!wallet) {
      setTokens([]);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    const key = cacheKey(wallet, productId);

    const cached = tokenCache.get(key);
    if (cached) {
      setTokens(cached);
      setIsLoading(false);
    } else {
      setIsLoading(true);
    }

    const run = async () => {
      const resolved = await resolveIntegratedTokens(wallet, productId);
      if (cancelled) return;
      if (resolved.length > 0) {
        tokenCache.set(key, resolved);
      }
      setTokens(resolved);
      setIsLoading(false);
    };

    void run();
    return () => {
      cancelled = true;
    };
  }, [wallet, productId]);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const onListingsUpdated = () => {
      clearIntegratedTokenCache();
    };
    window.addEventListener('tokens-listings-updated', onListingsUpdated);
    return () => window.removeEventListener('tokens-listings-updated', onListingsUpdated);
  }, []);

  return { tokens, isLoading };
}

/** First integrated token for a wallet + product (most flows use a single ticker). */
export function useIntegratedToken(
  wallet: string | null | undefined,
  productId: HubUtilityProductId,
): { token: IntegratedToken | null; isLoading: boolean } {
  const { tokens, isLoading } = useIntegratedTokens(wallet, productId);
  return { token: tokens[0] ?? null, isLoading };
}
