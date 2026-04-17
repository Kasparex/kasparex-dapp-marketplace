'use client';

import { useEffect, useState } from 'react';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

type PfApi = {
  ok?: boolean;
  state?: { display?: string; bio?: string; tags?: string[] } | null;
  indexed?: unknown;
  note?: string;
  error?: string;
};

type VerApi = {
  ok?: boolean;
  verified?: boolean;
  kasparex?: {
    mode?: string;
    inAllowlist?: boolean;
    verifiedBadge?: boolean;
  };
  error?: string;
};

export type UseKpxPublicIdentityResult = {
  loading: boolean;
  error: string | null;
  /** Winning kpx/pf display string, if any. */
  kpxDisplay: string | null;
  /** Kasparex UI verified badge (`?policy=kasparex`). */
  kpxKasparexVerified: boolean;
};

/**
 * Lightweight read for public Hub: mainnet kpx/pf display + Kasparex verified badge.
 * Uses the same reference indexer routes as `/protocols/kpx-tools`.
 */
export function useKpxPublicIdentity(kaspaAddress: string | null | undefined): UseKpxPublicIdentityResult {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [kpxDisplay, setKpxDisplay] = useState<string | null>(null);
  const [kpxKasparexVerified, setKpxKasparexVerified] = useState(false);

  useEffect(() => {
    let cancelled = false;
    const raw = kaspaAddress?.trim() ?? '';
    if (!raw) {
      setKpxDisplay(null);
      setKpxKasparexVerified(false);
      setError(null);
      setLoading(false);
      return;
    }

    let enc: string;
    try {
      enc = encodeURIComponent(normalizeKaspaAddress(raw));
    } catch {
      setKpxDisplay(null);
      setKpxKasparexVerified(false);
      setError(null);
      setLoading(false);
      return;
    }

    const qPf = new URLSearchParams({ net: 'mainnet', limit: '120', offset: '0' });
    const qVer = new URLSearchParams({ net: 'mainnet', limit: '120', offset: '0', policy: 'kasparex' });

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [pfRes, verRes] = await Promise.all([
          fetch(`/api/kpx/pf/${enc}?${qPf}`),
          fetch(`/api/kpx/ver/${enc}?${qVer}`),
        ]);
        const pf = (await pfRes.json()) as PfApi;
        const ver = (await verRes.json()) as VerApi;
        if (cancelled) return;

        if (!pfRes.ok || pf.ok === false) {
          setKpxDisplay(null);
        } else {
          const d = pf.state && typeof pf.state === 'object' ? pf.state.display : undefined;
          setKpxDisplay(typeof d === 'string' && d.trim() ? d.trim() : null);
        }

        if (!verRes.ok || ver.ok === false) {
          setKpxKasparexVerified(false);
        } else {
          setKpxKasparexVerified(Boolean(ver.kasparex?.verifiedBadge));
        }

        const errs: string[] = [];
        if (!pfRes.ok) errs.push(`pf ${pfRes.status}`);
        if (!verRes.ok) errs.push(`ver ${verRes.status}`);
        setError(errs.length ? errs.join(' · ') : null);
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'kpx fetch failed');
          setKpxDisplay(null);
          setKpxKasparexVerified(false);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kaspaAddress]);

  return { loading, error, kpxDisplay, kpxKasparexVerified };
}
