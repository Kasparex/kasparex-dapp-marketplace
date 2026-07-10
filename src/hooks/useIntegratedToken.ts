'use client';

import { useEffect, useState } from 'react';
import { bootstrapHubContent } from '@/lib/hub/contentSync';
import {
  getIntegratedTokenForWallet,
  type IntegratedToken,
} from '@/lib/tokens/integratedTokens';
import type { HubUtilityProductId } from '@/lib/tokens/utilityRegistry';

type IntegrationApiResponse = {
  ok?: boolean;
  token?: IntegratedToken | null;
};

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
    setIsLoading(true);

    const resolve = async () => {
      const local = getIntegratedTokenForWallet(wallet, productId);
      if (local) {
        if (!cancelled) {
          setToken(local);
          setIsLoading(false);
        }
        return;
      }

      await bootstrapHubContent(['tokens']);
      const synced = getIntegratedTokenForWallet(wallet, productId);
      if (synced) {
        if (!cancelled) {
          setToken(synced);
          setIsLoading(false);
        }
        return;
      }

      try {
        const params = new URLSearchParams({
          wallet,
          product: productId,
        });
        const res = await fetch(`/api/tokens/integration?${params.toString()}`, { cache: 'no-store' });
        if (!res.ok) throw new Error('Integration lookup failed');
        const json = (await res.json()) as IntegrationApiResponse;
        if (!cancelled) {
          setToken(json.token ?? null);
        }
      } catch {
        if (!cancelled) setToken(null);
      } finally {
        if (!cancelled) setIsLoading(false);
      }
    };

    void resolve();
    return () => {
      cancelled = true;
    };
  }, [wallet, productId]);

  return { token, isLoading };
}
