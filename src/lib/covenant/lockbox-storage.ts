/**
 * LockBox vault storage helpers: keep L1 records separate from simulator demos.
 */

import { COVENANT_LAB_CONFIG } from './config';
import type { CovenantVault } from './types';
import { loadMap, saveMap } from './utils';

function isHex64(value: string | undefined): boolean {
  return Boolean(value && /^[a-f0-9]{64}$/i.test(value.trim()));
}

/** True for local demo / simulator vaults that must not appear beside real locks. */
export function isSimulatedLockboxVault(vault: CovenantVault): boolean {
  if (vault.origin === 'simulator') return true;
  if (vault.origin === 'l1') return false;

  const cid = (vault.covenantId ?? '').trim();
  const tx = (vault.lockTxHash ?? '').trim();

  if (cid.startsWith('cov_')) return true;
  if (tx.startsWith('sim_')) return true;
  if (vault.claimTxHash?.startsWith('sim_')) return true;

  // Real L1 rows: 64-char tx / covenant id, or pending id after broadcast.
  if (isHex64(tx) || isHex64(cid) || cid.startsWith('pending_')) return false;

  // Legacy row with no on-chain fingerprint: treat as simulator.
  return !tx;
}

export function isL1LockboxVault(vault: CovenantVault): boolean {
  return !isSimulatedLockboxVault(vault);
}

/**
 * One-shot migration: move real locks into the L1 store and drop simulator rows
 * from the legacy mixed key so Vaults never lists demo data next to mainnet locks.
 */
export function purgeSimulatedLockboxVaults(): void {
  if (typeof window === 'undefined') return;

  try {
    localStorage.removeItem(COVENANT_LAB_CONFIG.storageKeySim);

    const l1 = loadMap<CovenantVault>(COVENANT_LAB_CONFIG.storageKeyL1);
    const legacy = loadMap<CovenantVault>(COVENANT_LAB_CONFIG.storageKey);

    for (const [id, vault] of legacy.entries()) {
      if (!isL1LockboxVault(vault)) continue;
      if (l1.has(id)) continue;
      l1.set(id, { ...vault, origin: 'l1' });
    }

    // Also strip any simulator rows that landed in the L1 key.
    for (const [id, vault] of Array.from(l1.entries())) {
      if (isSimulatedLockboxVault(vault)) l1.delete(id);
      else if (!vault.origin) l1.set(id, { ...vault, origin: 'l1' });
    }

    saveMap(COVENANT_LAB_CONFIG.storageKeyL1, l1);
    localStorage.removeItem(COVENANT_LAB_CONFIG.storageKey);
  } catch {
    /* ignore storage errors */
  }
}

export function loadL1LockboxVaults(): Map<string, CovenantVault> {
  purgeSimulatedLockboxVaults();
  return loadMap<CovenantVault>(COVENANT_LAB_CONFIG.storageKeyL1);
}

export function saveL1LockboxVaults(map: Map<string, CovenantVault>): void {
  saveMap(COVENANT_LAB_CONFIG.storageKeyL1, map);
}

/** Persist Hub claim-fee tx for fee-first claim retries. */
export function setL1LockboxClaimFeeTxHash(vaultId: string, feeTxHash: string): void {
  const map = loadL1LockboxVaults();
  const vault = map.get(vaultId);
  if (!vault) return;
  map.set(vaultId, { ...vault, claimFeeTxHash: feeTxHash });
  saveL1LockboxVaults(map);
}
