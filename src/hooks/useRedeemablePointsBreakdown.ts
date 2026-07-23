'use client';

import { useMemo, useState, useEffect } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { readMinecoreRefinementPointsTotal } from '@/lib/game/minecore/read-refinement-points';
import {
  DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT,
  DIAMOND_VEINS_STORAGE_PREFIX,
  readDiamondVeinsRefinementPointsTotal,
} from '@/lib/game/diamond-veins-hub';
import { migrateLegacyCatalogRedemptionsOnce, sumLedgerRedeemableNet } from '@/lib/rewards/hub-ledger';
import { KASAPEX_HUB_LEDGER_LS_PREFIX } from '@/lib/rewards/hub-ledger-storage';
import { MINECORE_STORAGE_PREFIX } from '@/lib/game/minecore/config';
import {
  MINECORE_EXTERNAL_PERSIST_EVENT,
  REDEEMABLE_BREAKDOWN_REFRESH_EVENT,
} from '@/lib/game/minecore/deduct-refinement-hub';
import {
  getServerHubBalanceForAddr,
  refreshServerHubBalance,
  subscribeServerHubBalance,
} from '@/lib/rewards/serverHubBalanceCoordinator';

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
  diamondVeinsRefinement: number;
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
    function bumpLocal() {
      setTick((n) => n + 1);
    }
    function bumpWithServerSync() {
      bumpLocal();
      refreshServerHubBalance();
    }
    if (typeof window === 'undefined') return;
    function onStorage(ev: StorageEvent) {
      if (!ev.key) return;
      if (
        ev.key.startsWith(`${KASAPEX_HUB_LEDGER_LS_PREFIX}:`) ||
        ev.key.startsWith(`${MINECORE_STORAGE_PREFIX}:`) ||
        ev.key.startsWith(`${DIAMOND_VEINS_STORAGE_PREFIX}:`) ||
        ev.key === DIAMOND_VEINS_STORAGE_PREFIX
      ) {
        bumpWithServerSync();
      }
    }
    window.addEventListener('kasparex-hub-ledger', bumpWithServerSync);
    window.addEventListener(MINECORE_EXTERNAL_PERSIST_EVENT, bumpWithServerSync);
    window.addEventListener(DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT, bumpWithServerSync);
    window.addEventListener(REDEEMABLE_BREAKDOWN_REFRESH_EVENT, bumpLocal);
    window.addEventListener('focus', bumpWithServerSync);
    window.addEventListener('storage', onStorage);
    return () => {
      window.removeEventListener('kasparex-hub-ledger', bumpWithServerSync);
      window.removeEventListener(MINECORE_EXTERNAL_PERSIST_EVENT, bumpWithServerSync);
      window.removeEventListener(DIAMOND_VEINS_EXTERNAL_PERSIST_EVENT, bumpWithServerSync);
      window.removeEventListener(REDEEMABLE_BREAKDOWN_REFRESH_EVENT, bumpLocal);
      window.removeEventListener('focus', bumpWithServerSync);
      window.removeEventListener('storage', onStorage);
    };
  }, []);

  useEffect(() => {
    return subscribeServerHubBalance(addr, () => {
      setServerHubBalance(getServerHubBalanceForAddr(addr));
    });
  }, [addr]);

  useEffect(() => {
    if (!addr || typeof window === 'undefined') return;
    migrateLegacyCatalogRedemptionsOnce(addr.toLowerCase());
  }, [addr]);

  return useMemo(() => {
    if (!addr || typeof window === 'undefined') {
      return {
        address: '',
        totalRedeemable: 0,
        lines: [],
        ledgerNetRedeemable: 0,
        minecoreRefinement: 0,
        diamondVeinsRefinement: 0,
        serverHubBalance: null,
      };
    }
    const minecoreRefinement = readMinecoreRefinementPointsTotal(addr);
    const diamondVeinsRefinement = readDiamondVeinsRefinementPointsTotal(addr);
    const gameplayPts = minecoreRefinement + diamondVeinsRefinement;
    const ledgerNet = sumLedgerRedeemableNet(addr.toLowerCase());
    const hubPts =
      serverHubBalance !== null ? Math.max(ledgerNet, serverHubBalance) : ledgerNet;
    const total = Math.max(0, gameplayPts + hubPts);
    const lines: RedeemableSourceLine[] = [
      {
        id: 'minecore',
        label: 'Minecore diamonds',
        points: minecoreRefinement,
      },
      {
        id: 'diamond-veins',
        label: 'Diamond Veins',
        points: diamondVeinsRefinement,
      },
      {
        id: 'hub_ledger',
        label: 'Rewards hub (one balance)',
        points: hubPts,
      },
    ];
    return {
      address: addr,
      totalRedeemable: total,
      lines,
      ledgerNetRedeemable: ledgerNet,
      minecoreRefinement,
      diamondVeinsRefinement,
      serverHubBalance,
    };
  }, [addr, tick, serverHubBalance]);
}
