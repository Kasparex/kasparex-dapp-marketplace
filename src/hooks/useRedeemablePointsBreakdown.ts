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
  /** Combined total shown in the halo: gameplay-linked points + Rewards wallet net (+ legacy migration once). */
  totalRedeemable: number;
  lines: RedeemableSourceLine[];
  /** Net redeemable tracked only in the Rewards wallet ledger. */
  ledgerNetRedeemable: number;
  minecoreRefinement: number;
}

/**
 * Local-first redeemable totals for the connected Kaspa address. Matches Rewards wallet math; gameplay-linked points come from saved hub experiences on this device.
 */
export function useRedeemablePointsBreakdown(): UseRedeemablePointsBreakdownResult {
  const { state } = useKaspaWallet();
  const [tick, setTick] = useState(0);
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

  return useMemo(() => {
    if (!addr || typeof window === 'undefined') {
      return {
        address: '',
        totalRedeemable: 0,
        lines: [],
        ledgerNetRedeemable: 0,
        minecoreRefinement: 0,
      };
    }
    migrateLegacyCatalogRedemptionsOnce(addr.toLowerCase());
    const minecoreRefinement = readMinecoreRefinementPointsTotal(addr);
    const ledgerNet = sumLedgerRedeemableNet(addr.toLowerCase());
    const total = Math.max(0, minecoreRefinement + ledgerNet);
    const lines: RedeemableSourceLine[] = [
      {
        id: 'minecore',
        label: 'Gameplay & experiences',
        points: minecoreRefinement,
      },
      {
        id: 'hub_ledger',
        label: 'Rewards wallet',
        points: ledgerNet,
      },
    ];
    return {
      address: addr,
      totalRedeemable: total,
      lines,
      ledgerNetRedeemable: ledgerNet,
      minecoreRefinement,
    };
  }, [addr, tick]);
}
