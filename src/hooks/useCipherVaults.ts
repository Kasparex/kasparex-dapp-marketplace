'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import { CIPHER_TICKET_REDEEM_RATE_POINTS, CIPHER_VAULTS_TREASURY_ADDRESS, CIPHER_VAULT_TIERS, type CipherVaultTierId } from '@/lib/game/cipher-vaults-config';
import type { CipherVaultsState } from '@/lib/game/cipher-vaults-types';
import { createInitialCipherVaultsState } from '@/lib/game/cipher-vaults-types';

const STORAGE_KEY = 'cipher-vaults-state';
const SERVER_SYNC_MS = 2500;

function loadPersisted(): CipherVaultsState | null {
  if (typeof window === 'undefined') return null;
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as CipherVaultsState;
    if (!parsed || typeof parsed !== 'object') return null;
    return parsed;
  } catch {
    return null;
  }
}

function savePersisted(state: CipherVaultsState) {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  } catch {
    // ignore
  }
}

async function fetchServerState(address: string): Promise<CipherVaultsState | null> {
  try {
    const r = await fetch(`/api/games/cipher-vaults/state?address=${encodeURIComponent(address)}`);
    const j = (await r.json()) as { state?: CipherVaultsState };
    return j?.state ?? null;
  } catch {
    return null;
  }
}

async function pushServerState(address: string, state: CipherVaultsState): Promise<CipherVaultsState | null> {
  try {
    const r = await fetch('/api/games/cipher-vaults/state', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ address, state }),
    });
    const j = (await r.json()) as { state?: CipherVaultsState };
    return j?.state ?? null;
  } catch {
    return null;
  }
}

export function useCipherVaults() {
  const { state: walletState } = useKaspaWallet();
  const canPayWithL1 =
    walletState.isConnected && (walletState.provider === 'kasware' || walletState.provider === 'kastle');

  const [state, setState] = useState<CipherVaultsState>(() => loadPersisted() ?? createInitialCipherVaultsState());
  const ref = useRef(state);
  ref.current = state;

  useEffect(() => savePersisted(state), [state]);

  useEffect(() => {
    const addr = walletState.address;
    if (!walletState.isConnected || !addr) return;
    let cancelled = false;
    void (async () => {
      const remote = await fetchServerState(addr);
      if (cancelled || !remote) return;
      setState((local) => ((remote.version ?? 0) > (local.version ?? 0) ? remote : local));
    })();
    return () => {
      cancelled = true;
    };
  }, [walletState.isConnected, walletState.address]);

  useEffect(() => {
    const addr = walletState.address;
    if (!walletState.isConnected || !addr) return;
    const t = setTimeout(() => {
      void pushServerState(addr, ref.current).then((remote) => {
        if (remote && (remote.version ?? 0) >= (ref.current.version ?? 0)) setState(remote);
      });
    }, SERVER_SYNC_MS);
    return () => clearTimeout(t);
  }, [state, walletState.isConnected, walletState.address]);

  const tickets = useMemo(() => {
    const total = Math.floor((state.redeemedRefinementPointsTotal ?? 0) / CIPHER_TICKET_REDEEM_RATE_POINTS);
    return { total, available: Math.max(0, total - (state.ticketsSpent ?? 0)) };
  }, [state.redeemedRefinementPointsTotal, state.ticketsSpent]);

  const startRun = useCallback(
    async (tierId: CipherVaultTierId, payWith: 'KAS' | 'TICKET') => {
      const addr = walletState.address;
      if (!walletState.isConnected || !addr) throw new Error('Wallet not connected');

      const tier = CIPHER_VAULT_TIERS.find((t) => t.id === tierId);
      if (!tier) throw new Error('Invalid tier');

      // Never charge unless the server confirms no run is active.
      const remote = await fetchServerState(addr);
      if (remote?.activeRun) {
        throw new Error('You already have an active run. Finish it or end it before starting a new attempt.');
      }

      let entryTxHash: string | undefined;
      if (payWith === 'KAS') {
        if (!canPayWithL1 || !walletState.provider) throw new Error('Connect KasWare or Kastle to pay on L1');
        const sompi = Math.round(tier.entryKAS * 100_000_000);
        const sent = await sendKaspaTransaction(walletState.provider, { to: CIPHER_VAULTS_TREASURY_ADDRESS, amount: String(sompi) });
        if (sent.status === 'failed') throw new Error(sent.error || 'KAS transfer failed');
        entryTxHash = sent.txHash;

        // Record for rewards distribution/analytics
        void fetch('/api/rewards/l1/record', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            txHash: entryTxHash,
            userAddress: addr,
            dappId: 'cipher-vaults',
            actionType: 'vault-entry',
            actionValue: tier.entryKAS,
            network: 'L1' as const,
          }),
        }).catch(() => {});
      } else {
        if (tickets.available <= 0) throw new Error('No tickets available');
      }

      const r = await fetch('/api/games/cipher-vaults/run/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, tierId, paidBy: payWith, entryTxHash }),
      });
      const j = (await r.json()) as any;
      if (!j?.ok) throw new Error(j?.error || 'Failed to start run');
      setState((s) => (j.state ? j.state : s));
      return j as { run: any; puzzle: { size: number; initial: number[]; target: number[]; moveLimit: number } };
    },
    [walletState.isConnected, walletState.address, walletState.provider, canPayWithL1, tickets.available]
  );

  const submitRun = useCallback(
    async (runId: string, moves: unknown[]) => {
      const addr = walletState.address;
      if (!walletState.isConnected || !addr) throw new Error('Wallet not connected');
      const r = await fetch('/api/games/cipher-vaults/run/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, runId, moves }),
      });
      const j = (await r.json()) as any;
      if (j?.state) setState(j.state as CipherVaultsState);
      return j;
    },
    [walletState.isConnected, walletState.address]
  );

  const cancelRun = useCallback(
    async (runId?: string) => {
      const addr = walletState.address;
      if (!walletState.isConnected || !addr) throw new Error('Wallet not connected');
      const r = await fetch('/api/games/cipher-vaults/run/cancel', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, runId }),
      });
      const j = (await r.json()) as any;
      if (j?.state) setState(j.state as CipherVaultsState);
      return j;
    },
    [walletState.isConnected, walletState.address]
  );

  const redeemRefinement = useCallback(
    async (pointsToRedeem: number) => {
      const addr = walletState.address;
      if (!walletState.isConnected || !addr) throw new Error('Wallet not connected');
      const r = await fetch('/api/games/cipher-vaults/redeem', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ address: addr, pointsToRedeem }),
      });
      const j = (await r.json()) as any;
      if (!r.ok) throw new Error(j?.error || 'Redeem failed');
      if (j?.state) setState(j.state as CipherVaultsState);
      return j as { ticketsAvailable: number; ticketsTotal: number; redeemedNow: number };
    },
    [walletState.isConnected, walletState.address]
  );

  const fetchDiamondVeinsRefinementPoints = useCallback(async () => {
    const addr = walletState.address;
    if (!walletState.isConnected || !addr) return 0;
    try {
      // Sync local Diamond Veins state (if newer) so Cipher redeem sees it.
      if (typeof window !== 'undefined') {
        const raw = window.localStorage.getItem('diamond-veins-state');
        if (raw) {
          try {
            const local = JSON.parse(raw) as { version?: number };
            const remoteRes = await fetch(`/api/games/diamond-veins/state?address=${encodeURIComponent(addr)}`, { method: 'GET' });
            const remoteJson = remoteRes.ok ? ((await remoteRes.json()) as { state?: { version?: number } | null; found?: boolean }) : null;
            const remoteVersion = remoteJson?.found && remoteJson?.state ? (remoteJson.state.version ?? 0) : 0;
            const localVersion = typeof local?.version === 'number' ? local.version : 0;
            if (localVersion > remoteVersion) {
              await fetch('/api/games/diamond-veins/state', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ address: addr, state: local }),
              });
            }
          } catch {
            // ignore local parse errors
          }
        }
      }
      const r = await fetch(`/api/games/diamond-veins/state?address=${encodeURIComponent(addr)}`);
      const j = (await r.json()) as { state?: { refinementPointsTotal?: number } };
      return Math.floor(j?.state?.refinementPointsTotal ?? 0);
    } catch {
      return 0;
    }
  }, [walletState.isConnected, walletState.address]);

  return {
    state,
    canPayWithL1,
    tickets,
    startRun,
    submitRun,
    cancelRun,
    redeemRefinement,
    fetchDiamondVeinsRefinementPoints,
  };
}

