'use client';

import { useCallback, useEffect, useState } from 'react';
import type { KpxNet } from '@/lib/kpx/types';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';

export type KpxIndexerPfJson = {
  ok?: boolean;
  state?: unknown;
  provenance?: unknown;
  indexed?: unknown;
  note?: string;
  error?: string;
};

export type KpxIndexerVerJson = {
  ok?: boolean;
  verified?: boolean;
  provenance?: unknown;
  indexed?: unknown;
  note?: string;
  error?: string;
};

export type KpxIndexerLnkJson = {
  ok?: boolean;
  evm?: string | null;
  provenance?: unknown;
  indexed?: unknown;
  note?: string;
  error?: string;
};

export type KpxIndexerCmSummaryJson = {
  ok?: boolean;
  resources?: Array<{ rt: string; rid: string; commit?: unknown; provenance?: unknown }>;
  indexed?: unknown;
  note?: string;
  error?: string;
};

export type UseKpxIndexerOptions = {
  /** Raw wallet address (with or without `kaspa:`). Empty disables fetches. */
  kaspaAddress: string | null | undefined;
  net: KpxNet;
  /** Kaspa REST page size (clamped 20–500). */
  limit?: number;
  /** Kaspa REST `offset` (clamped 0–50_000). */
  offset?: number;
  /** `max_resources` for `/api/kpx/cm/.../summary` (clamped 1–500). */
  maxCmResources?: number;
  /** Increment to refetch (e.g. after a successful broadcast). */
  refreshNonce?: number;
};

export type UseKpxIndexerResult = {
  loading: boolean;
  error: string | null;
  pf: KpxIndexerPfJson | null;
  ver: KpxIndexerVerJson | null;
  lnk: KpxIndexerLnkJson | null;
  cm: KpxIndexerCmSummaryJson | null;
  /** Manually trigger the same fetch again. */
  refetch: () => void;
};

function clampLimit(n: number): number {
  return Math.min(500, Math.max(20, Math.trunc(n)));
}

function clampOffset(n: number): number {
  return Math.min(50_000, Math.max(0, Math.trunc(n)));
}

function clampMaxCm(n: number): number {
  return Math.min(500, Math.max(1, Math.trunc(n)));
}

export function useKpxIndexer(options: UseKpxIndexerOptions): UseKpxIndexerResult {
  const {
    kaspaAddress,
    net,
    limit: limitOpt,
    offset: offsetOpt,
    maxCmResources: maxCmOpt,
    refreshNonce = 0,
  } = options;

  const limit = clampLimit(limitOpt === undefined || !Number.isFinite(limitOpt) ? 200 : limitOpt);
  const offset = clampOffset(offsetOpt === undefined || !Number.isFinite(offsetOpt) ? 0 : offsetOpt);
  const maxCmResources = clampMaxCm(maxCmOpt === undefined || !Number.isFinite(maxCmOpt) ? 40 : maxCmOpt);

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pf, setPf] = useState<KpxIndexerPfJson | null>(null);
  const [ver, setVer] = useState<KpxIndexerVerJson | null>(null);
  const [lnk, setLnk] = useState<KpxIndexerLnkJson | null>(null);
  const [cm, setCm] = useState<KpxIndexerCmSummaryJson | null>(null);
  const [localNonce, setLocalNonce] = useState(0);

  const refetch = useCallback(() => {
    setLocalNonce((n) => n + 1);
  }, []);

  useEffect(() => {
    let cancelled = false;
    const addrRaw = kaspaAddress?.trim() ?? '';
    if (!addrRaw) {
      setPf(null);
      setVer(null);
      setLnk(null);
      setCm(null);
      setError(null);
      setLoading(false);
      return;
    }

    let canonical: string;
    try {
      canonical = normalizeKaspaAddress(addrRaw);
    } catch {
      setPf(null);
      setVer(null);
      setLnk(null);
      setCm(null);
      setError('Invalid Kaspa address for indexer fetch.');
      setLoading(false);
      return;
    }

    const enc = encodeURIComponent(canonical);
    const q = new URLSearchParams({
      net,
      limit: String(limit),
      offset: String(offset),
    });
    const qCm = new URLSearchParams({
      net,
      limit: String(limit),
      offset: String(offset),
      max_resources: String(maxCmResources),
    });

    setLoading(true);
    setError(null);

    (async () => {
      try {
        const [pfRes, verRes, lnkRes, cmRes] = await Promise.all([
          fetch(`/api/kpx/pf/${enc}?${q}`),
          fetch(`/api/kpx/ver/${enc}?${q}`),
          fetch(`/api/kpx/lnk/${enc}?${q}`),
          fetch(`/api/kpx/cm/${enc}/summary?${qCm}`),
        ]);
        const [pfJson, verJson, lnkJson, cmJson] = await Promise.all([
          pfRes.json() as Promise<KpxIndexerPfJson>,
          verRes.json() as Promise<KpxIndexerVerJson>,
          lnkRes.json() as Promise<KpxIndexerLnkJson>,
          cmRes.json() as Promise<KpxIndexerCmSummaryJson>,
        ]);
        if (cancelled) return;
        setPf(pfJson);
        setVer(verJson);
        setLnk(lnkJson);
        setCm(cmJson);

        const httpErrs: string[] = [];
        if (!pfRes.ok) httpErrs.push(`pf ${pfRes.status}`);
        if (!verRes.ok) httpErrs.push(`ver ${verRes.status}`);
        if (!lnkRes.ok) httpErrs.push(`lnk ${lnkRes.status}`);
        if (!cmRes.ok) httpErrs.push(`cm ${cmRes.status}`);
        if (httpErrs.length) {
          setError(httpErrs.join(' · '));
        } else {
          const appErr =
            pfJson.ok === false && pfJson.error
              ? pfJson.error
              : verJson.ok === false && verJson.error
                ? verJson.error
                : lnkJson.ok === false && lnkJson.error
                  ? lnkJson.error
                  : cmJson.ok === false && cmJson.error
                    ? cmJson.error
                    : null;
          setError(appErr ?? null);
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : 'Indexer fetch failed');
          setPf(null);
          setVer(null);
          setLnk(null);
          setCm(null);
        }
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, [kaspaAddress, net, limit, offset, maxCmResources, refreshNonce, localNonce]);

  return { loading, error, pf, ver, lnk, cm, refetch };
}
