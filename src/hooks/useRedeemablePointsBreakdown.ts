'use client';

import { useMemo, useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { readMinecoreRefinementPointsTotal } from '@/lib/game/minecore/read-refinement-points';
import { migrateLegacyCatalogRedemptionsOnce, sumLedgerRedeemableNet } from '@/lib/rewards/hub-ledger';
import { MINECORE_EXTERNAL_PERSIST_EVENT } from '@/lib/game/minecore/deduct-refinement-hub';

function normAddr(a: string): string {
  try {
    return normalizeKaspaAddress(a);
  } catch {
    return a.startsWith('kaspa:') ? a : `kaspa:${a}`;
  }
}

export type RedeemableSourceLine = {
  id: string;
  label: string;
  /** Points toward redeemable UI total (additive line item). Spends are reflected in ledger net already. */
  points: number;
};

export interface UseRedeemablePointsBreakdownResult {
  address: string;
  /** Combined total shown in the halo: gameplay-linked points + hub pts (server when available). */
  totalRedeemable: number;
  lines: RedeemableSourceLine[];
  /** Net redeemable tracked only in the Rewards wallet ledger (local). */
  ledgerNetRedeemable: number;
  minecoreRefinement: number;
  /** Authoritative hub balance from API when fetch succeeded; null if unavailable. */
  serverHubBalance: number | null;
}

/**
 * Local-first redeemable totals for the connected Kaspa address. Matches Rewards wallet math; gameplay-linked points come from saved hub experiences on this device.
 */
export function useRedeemablePointsBreakdown(): UseRedeemablePointsBreakdownResult {
  const { state } = useKaspaWallet();
  const [tick, setTick] = useState(0);
  const [serverHubBalance, setServerHubBalance] = useState<number | null>(null);
  const addr = state.address ? normAddr(state.address) : '';

  useEffect(() => {
    function bump() {
      setTick((n) => n + 1);
    }
    if (typeof window === 'undefined') return;
    window.addEventListener('kasparex-hub-ledger', bump);
    window.addEventListener(MINECORE_EXTERNAL_PERSIST_EVENT, bump);
    window.addEventListener('focus', bump);
    const id = window.setInterval(bump, 5000);
    return () => {
      window.removeEventListener('kasparex-hub-ledger', bump);
      window.removeEventListener(MINECORE_EXTERNAL_PERSIST_EVENT, bump);
      window.removeEventListener('focus', bump);
      window.clearInterval(id);
    };
  }, []);

  useEffect(() => {
    if (!addr) {
      setServerHubBalance(null);
      return;
    }
    let cancelled = false;
    (async () => {
      try {
        const r = await fetch(`/api/kasparex/pts/balance?wallet=${encodeURIComponent(addr)}`);
        const j = (await r.json()) as { balance_pts?: number; error?: string };
        if (cancelled) return;
        if (r.ok && typeof j.balance_pts === 'number' && Number.isFinite(j.balance_pts)) {
          setServerHubBalance(Math.max(0, Math.floor(j.balance_pts)));
        } else {
          setServerHubBalance(null);
        }
      } catch {
        if (!cancelled) setServerHubBalance(null);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [addr, tick]);

  return useMemo(() => {
    if (!addr || typeof window === 'undefined') {
      return {
        address: '',
        totalRedeemable: 0,
        lines: [],
        ledgerNetRedeemable: 0,
        minecoreRefinement: 0,
        serverHubBalance: null,
      };
    }
    migrateLegacyCatalogRedemptionsOnce(addr.toLowerCase());
    const minecoreRefinement = readMinecoreRefinementPointsTotal(addr);
    const ledgerNet = sumLedgerRedeemableNet(addr.toLowerCase());
    const hubPts = serverHubBalance !== null ? serverHubBalance : ledgerNet;
    const total = Math.max(0, minecoreRefinement + hubPts);
    const lines: RedeemableSourceLine[] = [
      {
        id: 'minecore',
        label: 'Gameplay & experiences',
        points: minecoreRefinement,
      },
      {
        id: 'hub_ledger',
        label: serverHubBalance !== null ? 'Rewards hub (synced)' : 'Rewards wallet',
        points: hubPts,
      },
    ];
    return {
      address: addr,
      totalRedeemable: total,
      lines,
      ledgerNetRedeemable: ledgerNet,
      minecoreRefinement,
      serverHubBalance,
    };
  }, [addr, tick, serverHubBalance]);
}
