'use client';

import { useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { isValidKaspaAddress } from '@/lib/kaspa/sdk';
import { payKaspaL1 } from '@/lib/games/sdk';
import { getNodesPremiumTreasuryL1Address } from '@/lib/nodes/nodesPremiumTreasury';
import { NodeFirstDiagnosticsPanel } from './NodeFirstDiagnosticsPanel';
import { SectionHeader } from './SectionHeader';
import { NODES_DASH_CARD } from './nodesTabLayout';

const PREMIUM_KAS = 10;
const STORAGE_KEY = 'kasparex:nodes-premium-unlock:v1';

type UnlockRecord = { wallet: string; txHash: string; unlockedAt: number };

function readUnlock(wallet: string | null | undefined): UnlockRecord | null {
  if (typeof window === 'undefined' || !wallet) return null;
  try {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const j = JSON.parse(raw) as UnlockRecord;
    if (!j?.wallet || !j?.txHash) return null;
    if (j.wallet.toLowerCase() !== wallet.toLowerCase()) return null;
    return j;
  } catch {
    return null;
  }
}

function writeUnlock(rec: UnlockRecord) {
  try {
    window.localStorage.setItem(STORAGE_KEY, JSON.stringify(rec));
  } catch {
    // ignore
  }
}

export function NodesPremiumPanel() {
  const { state: kaspa, connect } = useKaspaWallet();
  const treasury = useMemo(() => getNodesPremiumTreasuryL1Address(), []);
  const [unlock, setUnlock] = useState<UnlockRecord | null>(null);

  useEffect(() => {
    setUnlock(readUnlock(kaspa.address));
  }, [kaspa.address]);

  const unlocked = Boolean(kaspa.address && unlock?.wallet && unlock.wallet.toLowerCase() === kaspa.address.toLowerCase());

  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const pay = async () => {
    setError(null);
    if (!kaspa.isConnected || !kaspa.provider || !kaspa.address) {
      try {
        const { detectKaspaWallets } = await import('@/lib/kaspa/wallet');
        const wallets = detectKaspaWallets();
        if (wallets.length > 0) await connect(wallets[0].id);
      } catch {
        // ignore
      }
      setError('Connect your Kaspa wallet to continue.');
      return;
    }
    if (!treasury || !isValidKaspaAddress(treasury)) {
      setError('Treasury address is not configured. Set NEXT_PUBLIC_NODES_PREMIUM_TREASURY_L1 (or game / donations treasury).');
      return;
    }
    setBusy(true);
    try {
      const res = await payKaspaL1({
        provider: kaspa.provider,
        fromKaspaAddress: kaspa.address,
        toKaspaAddress: treasury,
        amountKas: PREMIUM_KAS,
        gameId: 'kasparex-nodes',
        skuId: 'nodes-premium-analytics',
        purchaseType: 'unlock',
      });
      if (!res.ok) throw new Error(res.error);
      const rec: UnlockRecord = { wallet: kaspa.address, txHash: res.txHash, unlockedAt: Date.now() };
      writeUnlock(rec);
      setUnlock(rec);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Payment failed');
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-6 w-full min-w-0">
      <section className={`${NODES_DASH_CARD} space-y-4`}>
        <SectionHeader
          title="Premium analytics"
          hint="Unlocks advanced operator views: node-first diagnostics and live stats comparison. One-time 10 KAS unlock per wallet (stored in this browser)."
          right={<span className="text-xs font-bold text-amber-700 dark:text-amber-300">10 KAS</span>}
        />

        {!unlocked ? (
          <div className="space-y-4">
            <p className="kx-body">
              Payment is sent on Kaspa L1 to the Kasparex treasury address configured for this deployment. After a successful
              transaction, diagnostics and stats tools unlock on this device for the connected wallet.
            </p>
            {treasury ? (
              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-950/60 p-3 text-xs font-mono break-all text-zinc-700 dark:text-zinc-300">
                {treasury}
              </div>
            ) : null}
            {error ? <div className="text-sm text-red-600 dark:text-red-400">{error}</div> : null}
            <button
              type="button"
              disabled={busy}
              onClick={() => void pay()}
              className="w-full sm:w-auto px-6 py-3 rounded-xl bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white font-black text-sm disabled:opacity-60 shadow-lg"
            >
              {busy ? 'Processing…' : `Unlock for ${PREMIUM_KAS} KAS`}
            </button>
          </div>
        ) : (
          <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/40 bg-emerald-50/80 dark:bg-emerald-950/30 p-4 text-sm text-emerald-900 dark:text-emerald-200">
            Unlocked for this wallet. Tx:{' '}
            <span className="font-mono text-xs break-all">{unlock?.txHash}</span>
          </div>
        )}
      </section>

      {unlocked ? <NodeFirstDiagnosticsPanel /> : null}
    </div>
  );
}
