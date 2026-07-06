'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantLockbox } from '@/hooks/useCovenantLockbox';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import type { CovenantVault, CovenantVaultKind } from '@/lib/covenant';
import {
  CovenantTabs,
  CovenantFieldLabel,
  CovenantError,
  CovenantHowItWorks,
  covenantInputClass,
  covenantPanelClass,
  covenantCardClass,
  covenantPrimaryBtnClass,
  covenantSecondaryBtnClass,
  shortKaspaAddr,
} from '@/components/dapps/covenant/CovenantWidgetUi';
import {
  KpxCovenantDisconnected,
  KpxCovenantImportPanel,
  KpxCovenantShell,
} from '@/components/dapps/covenant/KpxCovenantShell';
import { KpxCovenantFeePanel } from '@/components/dapps/covenant/KpxCovenantFeePanel';
import { useKpxCovenantDeployFee } from '@/hooks/useKpxCovenantDeployFee';

type TabId = 'create' | 'vaults' | 'about';

function sompiToKas(sompi: string): string {
  const n = Number(BigInt(sompi)) / 1e8;
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function formatUnlock(unlockAt: number | null): string {
  if (!unlockAt) return 'Anytime (escrow)';
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
  const { vaults, isLoading, error, createVault, claimVault, refreshVaults, importByCovenantId, runtimeMode, effectiveMode } =
    useCovenantLockbox();
  const { pricing, krexTier, krexBalance } = useKpxCovenantDeployFee('lockbox');

  const [tab, setTab] = useState<TabId>('create');
  const [kind, setKind] = useState<CovenantVaultKind>('escrow');
  const [beneficiary, setBeneficiary] = useState('');
  const [amountKas, setAmountKas] = useState('0.1');
  const [memo, setMemo] = useState('');
  const [unlockLocal, setUnlockLocal] = useState('');
  const [importId, setImportId] = useState('');
  const [busy, setBusy] = useState(false);

  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  const myLocked = useMemo(() => vaults.filter((v) => v.status === 'locked'), [vaults]);

  const handleCreate = async () => {
    setBusy(true);
    try {
      const unlockAt = kind === 'timelock' && unlockLocal ? new Date(unlockLocal) : null;
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
    return <KpxCovenantDisconnected template="lockbox" />;
  }

  return (
    <KpxCovenantShell template="lockbox" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>

      <CovenantTabs
        tabs={[
          { id: 'create' as const, label: 'Create lock' },
          { id: 'vaults' as const, label: `Vaults (${vaults.length})` },
          { id: 'about' as const, label: 'How it works' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {error && <CovenantError message={error} />}

      {tab === 'create' && (
        <div className={covenantPanelClass}>
          <div>
            <CovenantFieldLabel
              label="Lock type"
              tooltip="Escrow lets the beneficiary claim whenever they are ready. Timelock waits until the date you set before they can claim."
            />
            <div className="flex gap-2">
              {(
                [
                  ['escrow', 'Escrow'],
                  ['timelock', 'Timelock'],
                ] as const
              ).map(([k, label]) => (
                <button
                  key={k}
                  type="button"
                  onClick={() => setKind(k)}
                  className={`flex-1 text-sm px-3 py-2.5 rounded-lg border transition-colors ${
                    kind === k
                      ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                      : 'border-zinc-300 dark:border-zinc-700 text-zinc-600 dark:text-zinc-400 hover:border-zinc-400 dark:hover:border-zinc-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2">
              {kind === 'escrow'
                ? 'Beneficiary can claim as soon as the lock is created.'
                : 'Beneficiary can claim only after the unlock date.'}
            </p>
          </div>

          <div>
            <CovenantFieldLabel
              label="Who receives the KAS"
              htmlFor="lockbox-beneficiary"
              tooltip="The Kaspa address that is allowed to claim the locked amount."
            />
            <input
              id="lockbox-beneficiary"
              type="text"
              value={beneficiary}
              onChange={(e) => setBeneficiary(e.target.value)}
              placeholder="kaspa:..."
              className={covenantInputClass}
            />
          </div>

          <div>
            <CovenantFieldLabel
              label={`Amount (KAS, min ${minKas})`}
              htmlFor="lockbox-amount"
              tooltip="How much KAS to lock under these rules."
            />
            <input
              id="lockbox-amount"
              type="number"
              min={minKas}
              step="0.01"
              value={amountKas}
              onChange={(e) => setAmountKas(e.target.value)}
              className={covenantInputClass}
            />
          </div>

          {kind === 'timelock' && (
            <div>
              <CovenantFieldLabel
                label="Unlock after"
                htmlFor="lockbox-unlock"
                tooltip="The beneficiary cannot claim before this date and time (your local timezone)."
              />
              <input
                id="lockbox-unlock"
                type="datetime-local"
                value={unlockLocal}
                onChange={(e) => setUnlockLocal(e.target.value)}
                className={covenantInputClass}
              />
            </div>
          )}

          <div>
            <CovenantFieldLabel
              label="Memo (optional)"
              htmlFor="lockbox-memo"
              tooltip="A short note stored with the lock, visible to both sides."
            />
            <input
              id="lockbox-memo"
              type="text"
              maxLength={COVENANT_LAB_CONFIG.maxMemoLength}
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
              placeholder="e.g. Payment for design work"
              className={covenantInputClass}
            />
          </div>

          <KpxCovenantFeePanel
            pricing={pricing}
            krexTier={krexTier}
            krexBalance={krexBalance}
            lockAmountKas={parseFloat(amountKas) || 0}
          />

          <button
            type="button"
            disabled={busy || isLoading || !beneficiary.trim()}
            onClick={() => void handleCreate()}
            className={covenantPrimaryBtnClass}
          >
            {busy
              ? 'Creating...'
              : pricing.waived
                ? 'Create lock'
                : `Pay ${pricing.feeKas.toFixed(2)} KAS fee & create lock`}
          </button>
        </div>
      )}

      {tab === 'vaults' && (
        <div className="space-y-4">
          <KpxCovenantImportPanel
            id="lockbox-import-id"
            value={importId}
            onChange={setImportId}
            busy={busy}
            onImport={() => {
              setBusy(true);
              void importByCovenantId(importId)
                .then(() => setImportId(''))
                .catch(console.error)
                .finally(() => setBusy(false));
            }}
          />
          <div className="flex justify-between items-center">
            <span className="kx-body">
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
            <p className="text-center text-zinc-500 py-8">No locks yet. Create your first one.</p>
          ) : (
            vaults.map((v) => (
              <div key={v.id} className={covenantCardClass}>
                <div className="flex justify-between items-start gap-2">
                  <div className="flex items-center gap-2">
                    <span className="text-xs font-medium uppercase tracking-wide text-[#02abb8]">
                      {v.kind}
                    </span>
                    <span
                      className={`text-xs px-1.5 py-0.5 rounded ${
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
                <p className="text-zinc-600 dark:text-zinc-400">{v.memo || '(no memo)'}</p>
                <div className="text-xs text-zinc-500 space-y-1">
                  <p>From: {shortKaspaAddr(v.depositor)}</p>
                  <p>To: {shortKaspaAddr(v.beneficiary)}</p>
                  <p>Unlock: {formatUnlock(v.unlockAt)}</p>
                </div>
                {canClaim(v, kaspaState.address) && (
                  <button
                    type="button"
                    disabled={busy}
                    onClick={() => void handleClaim(v.id)}
                    className={covenantSecondaryBtnClass}
                  >
                    Claim funds
                  </button>
                )}
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'about' && (
        <CovenantHowItWorks>
          <p>
            Covenant Lab lets you hold KAS for someone until rules you set are met. Think of it as a
            simple safe deposit box on Kaspa.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Escrow</strong>: lock coins for a buyer, seller, or collaborator. Only the
              beneficiary address can release them.
            </li>
            <li>
              <strong>Timelock</strong>: same idea, but the beneficiary must wait until a date you
              pick before claiming.
            </li>
            <li>
              <strong>No middleman</strong>: rules are enforced by covenant logic on Kaspa L1
              (simulated here until wallets ship covenant support).
            </li>
          </ul>
          <p className="text-xs text-zinc-500">
            Useful for trades, freelance payments, savings goals, or any transfer where you want
            clear release conditions.
          </p>
        </CovenantHowItWorks>
      )}
    </KpxCovenantShell>
  );
}
