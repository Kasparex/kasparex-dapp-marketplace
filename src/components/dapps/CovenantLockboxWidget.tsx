'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantLockbox } from '@/hooks/useCovenantLockbox';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import type { CovenantVault, CovenantVaultKind } from '@/lib/covenant';

type TabId = 'create' | 'vaults' | 'about';

function sompiToKas(sompi: string): string {
  const n = Number(BigInt(sompi)) / 1e8;
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function shortAddr(addr: string): string {
  const a = addr.replace(/^kaspa:/i, '');
  if (a.length <= 12) return a;
  return `${a.slice(0, 8)}...${a.slice(-6)}`;
}

function formatUnlock(unlockAt: number | null): string {
  if (!unlockAt) return 'Immediate (escrow)';
  return new Date(unlockAt).toLocaleString();
}

function canClaim(vault: CovenantVault, address: string | null): boolean {
  if (!address || vault.status !== 'locked') return false;
  const norm = (s: string) => s.trim().toLowerCase().replace(/^kaspa:/i, '');
  if (norm(vault.beneficiary) !== norm(address)) return false;
  if (vault.kind === 'timelock' && vault.unlockAt && Date.now() < vault.unlockAt) return false;
  return true;
}

export function CovenantLockboxWidget() {
  const { state: kaspaState } = useKaspaWallet();
  const { vaults, isLoading, error, runtimeMode, createVault, claimVault, refreshVaults } =
    useCovenantLockbox();

  const [tab, setTab] = useState<TabId>('create');
  const [kind, setKind] = useState<CovenantVaultKind>('escrow');
  const [beneficiary, setBeneficiary] = useState('');
  const [amountKas, setAmountKas] = useState('0.1');
  const [memo, setMemo] = useState('');
  const [unlockLocal, setUnlockLocal] = useState('');
  const [busy, setBusy] = useState(false);

  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  const myLocked = useMemo(
    () => vaults.filter((v) => v.status === 'locked'),
    [vaults]
  );

  const handleCreate = async () => {
    setBusy(true);
    try {
      const unlockAt =
        kind === 'timelock' && unlockLocal ? new Date(unlockLocal) : null;
      await createVault({
        kind,
        beneficiary: beneficiary.trim(),
        amountKas: parseFloat(amountKas),
        memo: memo.trim(),
        unlockAt,
      });
      setMemo('');
      setTab('vaults');
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  const handleClaim = async (vaultId: string) => {
    setBusy(true);
    try {
      await claimVault(vaultId);
    } catch (e) {
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  if (!kaspaState.isConnected) {
    return (
      <div className="px-6 py-8 text-center">
        <p className="text-zinc-600 dark:text-zinc-400">
          Connect your Kaspa wallet to use Covenant Lab (programmable L1 money prototype).
        </p>
      </div>
    );
  }

  return (
    <div className="px-6 py-4 space-y-6 max-w-2xl mx-auto">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-1">
          Covenant Lab
        </h2>
        <p className="text-sm text-zinc-600 dark:text-zinc-400">
          Lock KAS under rules enforced by covenant state (simulator today, Silverscript after Toccata).
        </p>
        <p className="text-xs text-amber-600 dark:text-amber-400 mt-2">
          Prototype mode: {runtimeMode}. Claims update covenant state locally; on-chain covenant txs ship with Toccata.
        </p>
      </div>

      <div className="flex gap-2 border-b border-zinc-200 dark:border-zinc-700 pb-2">
        {(
          [
            ['create', 'Create lock'],
            ['vaults', `Vaults (${vaults.length})`],
            ['about', 'How it works'],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => setTab(id)}
            className={`px-3 py-1.5 text-sm rounded-lg transition-colors ${
              tab === id
                ? 'bg-[#02abb8] text-white'
                : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {error && (
        <div className="p-3 text-sm bg-red-500/10 border border-red-500/30 text-red-700 dark:text-red-300 rounded-lg">
          {error}
        </div>
      )}

      {tab === 'create' && (
        <div className="space-y-4 bg-zinc-50 dark:bg-zinc-900/50 rounded-xl p-4 border border-zinc-200 dark:border-zinc-800">
          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
              Lock type
            </label>
            <div className="flex gap-2">
              {(
                [
                  ['escrow', 'Escrow (beneficiary claims anytime)'],
                  ['timelock', 'Timelock (claim after date)'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex-1 text-xs sm:text-sm px-3 py-2 rounded-lg border ${
                    kind === k
                      ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Beneficiary (kaspa address)
            </label>
            <input
              type="text"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="kaspa:..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Amount (KAS, min {minKas})
            </label>
            <input
              type="number"
              min={minKas}
              step="0.01"
              value={amountKas}
              onChange={(e) => setAmountKas(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
          </div>

          {kind === 'timelock' && (
            <div>
              <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
                Unlock after (local time)
              </label>
              <input
                type="datetime-local"
                value={unlockLocal}
                onChange={(e) => setUnlockLocal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-1">
              Memo (optional)
            </label>
            <input
              type="text"
              maxLength={COVENANT_LAB_CONFIG.maxMemoLength}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="Payment for..."
              className="w-full px-3 py-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
          </div>

          <button
            type="button"
            disabled={busy || isLoading || !beneficiary.trim()}
            onClick={() => void handleCreate()}
            className="w-full py-2.5 rounded-lg bg-[#02abb8] text-white font-medium hover:bg-[#028a94] disabled:opacity-50"
          >
            {busy ? 'Creating...' : 'Create covenant lock'}
          </button>
          {!COVENANT_LAB_CONFIG.treasuryAddress && (
            <p className="text-xs text-zinc-500">
              No treasury configured: lock is simulator-only (set NEXT_PUBLIC_COVENANT_LAB_TREASURY for L1 payment).
            </p>
          )}
        </div>
      )}

      {tab === 'vaults' && (
        <div className="space-y-3">
          <div className="flex justify-between items-center">
            <span className="text-sm text-zinc-600 dark:text-zinc-400">
              {myLocked.length} active, {vaults.length} total
            </span>
            <button
              type="button"
              onClick={() => void refreshVaults()}
              className="text-xs text-[#02abb8] hover:underline"
            >
              Refresh
            </button>
          </div>
          {isLoading && vaults.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">Loading...</p>
          ) : vaults.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No vaults yet. Create your first lock.</p>
          ) : (
            vaults.map((v) => (
              <div
                key={v.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 bg-white dark:bg-zinc-900/40 space-y-2"
              >
                <div className="flex justify-between items-start gap-2">
                  <div>
                    <span className="text-xs font-mono text-[#02abb8]">{v.kind}</span>
                    <span
                      className={`ml-2 text-xs px-1.5 py-0.5 rounded ${
                        v.status === 'locked'
                          ? 'bg-amber-500/20 text-amber-700 dark:text-amber-300'
                          : 'bg-green-500/20 text-green-700 dark:text-green-300'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {sompiToKas(v.amountSompi)} KAS
                  </span>
                </div>
                <p className="text-sm text-zinc-700 dark:text-zinc-300">{v.memo || '(no memo)'}</p>
                <div className="text-xs text-zinc-500 space-y-0.5">
                  <p>From: {shortAddr(v.depositor)}</p>
                  <p>To: {shortAddr(v.beneficiary)}</p>
                  <p>Unlock: {formatUnlock(v.unlockAt)}</p>
                  <p className="font-mono truncate" title={v.covenantId}>
                    Covenant ID: {v.covenantId}
                  </p>
                  {v.lockTxHash && (
                    <p className="truncate" title={v.lockTxHash}>
                      Lock tx: {v.lockTxHash}
                    </p>
                  )}
                </div>
                {canClaim(v, kaspaState.address) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleClaim(v.id)}
                    className="mt-2 w-full py-2 text-sm rounded-lg border border-[#02abb8] text-[#02abb8] hover:bg-[#02abb8]/10"
                  >
                    Claim (covenant transition)
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'about' && (
        <div className="prose prose-sm dark:prose-invert max-w-none text-zinc-700 dark:text-zinc-300 space-y-3">
          <p>
            Covenant Lab demonstrates <strong>programmable money on Kaspa L1</strong>: KAS locked under
            rules that a future Silverscript contract will enforce at consensus (not via an indexer).
          </p>
          <ul className="list-disc pl-5 space-y-1 text-sm">
            <li>
              <strong>Escrow</strong>: only the beneficiary can release funds (simulated claim).
            </li>
            <li>
              <strong>Timelock</strong>: beneficiary claims only after the unlock time.
            </li>
            <li>
              Each vault gets a <strong>covenant ID</strong> (KIP-20 lineage) in the simulator.
            </li>
            <li>
              Create sends a real L1 KAS tx when treasury is configured; claim is simulator until wallets
              support covenant outputs.
            </li>
          </ul>
          <p className="text-xs text-zinc-500">
            Reference contract: <code>covenant-lockbox/lockbox.sil</code>. Runtime adapter:{' '}
            <code>src/lib/covenant/runtime.ts</code>.
          </p>
        </div>
      )}
    </div>
  );
}
