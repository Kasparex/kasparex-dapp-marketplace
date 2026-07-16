'use client';

import { useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantLockbox } from '@/hooks/useCovenantLockbox';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import type { CovenantVault, CovenantVaultKind } from '@/lib/covenant';
import {
  CovenantFieldLabel,
  CovenantError,
  CovenantTabPanel,
  covenantInputClass,
  covenantCardClass,
  covenantSecondaryBtnClass,
  shortKaspaAddr,
} from '@/components/dapps/covenant/CovenantWidgetUi';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { getKpxCovenantBrand } from '@/lib/covenant/kpxBranding';
import {
  KpxCovenantDisconnected,
  KpxCovenantImportPanel,
  KpxCovenantShell,
} from '@/components/dapps/covenant/KpxCovenantShell';
import { KpxCovenantMetadataView } from '@/components/dapps/covenant/KpxCovenantMetadataView';
import { LockboxVaultDetailModal } from '@/components/dapps/covenant/LockboxVaultDetailModal';
import { useCovenantWidgetRail } from '@/hooks/useCovenantWidgetRail';
import { useKpxCovenantDeployFee } from '@/hooks/useKpxCovenantDeployFee';
import { lockboxMetadataInstances } from '@/lib/covenant/kpxCovenantMetadata';
import {
  covenantPremiumAddButtonLabel,
  resolveKpxCovenantClaimPrice,
} from '@/lib/covenant/kpxCovenantPricing';
import { isAddressInClaimers, resolveVaultClaimers } from '@/lib/covenant/participants';
import { KX_FORM_ADD_BTN_CLASS } from '@/components/ui/KxLinkRowsEditor';
import {
  useDAppWidgetSection,
  useNavigateDAppWidgetTab,
  useRegisterWidgetTabLabel,
} from '@/lib/dapps/DAppWidgetTabContext';

type TabId = 'create' | 'vaults' | 'metadata';

interface ClaimerRow {
  key: string;
  address: string;
}

function newClaimerRow(): ClaimerRow {
  return { key: `c_${Math.random().toString(36).slice(2, 9)}`, address: '' };
}

const UNLOCK_PRESETS = [
  { label: '+1 min', ms: 60_000 },
  { label: '+10 min', ms: 600_000 },
  { label: '+1 h', ms: 3_600_000 },
  { label: '+1 d', ms: 86_400_000 },
] as const;

function sompiToKas(sompi: string): string {
  const n = Number(BigInt(sompi)) / 1e8;
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
}

function toDatetimeLocalValue(ms: number): string {
  const d = new Date(ms);
  const pad = (n: number) => String(n).padStart(2, '0');
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

function formatUnlock(unlockAt: number | null): string {
  if (!unlockAt) return 'Anytime (escrow)';
  return new Date(unlockAt).toLocaleString();
}

function unlockProgress(
  vault: CovenantVault,
  now: number,
): { percent: number; label: string; unlocked: boolean } | null {
  if (vault.kind !== 'timelock' || !vault.unlockAt) return null;
  if (vault.status === 'claimed') {
    return { percent: 100, label: 'Claimed', unlocked: true };
  }
  const start = vault.createdAt || vault.unlockAt - 60_000;
  const end = vault.unlockAt;
  if (now >= end) {
    return { percent: 100, label: 'Unlocked', unlocked: true };
  }
  const span = Math.max(end - start, 1);
  const percent = Math.max(0, Math.min(99, Math.floor(((now - start) / span) * 100)));
  const remainingMs = end - now;
  const remainingMin = Math.ceil(remainingMs / 60_000);
  const label =
    remainingMin < 60
      ? `${remainingMin} min left`
      : remainingMin < 60 * 48
        ? `${Math.ceil(remainingMin / 60)} h left`
        : `${Math.ceil(remainingMin / (60 * 24))} d left`;
  return { percent, label, unlocked: false };
}

function canClaim(vault: CovenantVault, address: string | null): boolean {
  if (!address || vault.status !== 'locked') return false;
  if (!isAddressInClaimers(resolveVaultClaimers(vault), address)) return false;
  if (vault.kind === 'timelock' && vault.unlockAt && Date.now() < vault.unlockAt) return false;
  return true;
}

export function CovenantLockboxWidget() {
  const { state: kaspaState } = useKaspaWallet();
  const {
    vaults,
    isLoading,
    error,
    createVault,
    claimVault,
    refreshVaults,
    importByCovenantId,
    runtimeMode,
    effectiveMode,
  } = useCovenantLockbox();
  const [kind, setKind] = useState<CovenantVaultKind>('escrow');
  const [claimerRows, setClaimerRows] = useState<ClaimerRow[]>([{ key: 'primary', address: '' }]);
  const { pricing, krexTier, krexBalance } = useKpxCovenantDeployFee('lockbox', claimerRows.length);
  const claimPricing = useMemo(
    () => resolveKpxCovenantClaimPrice('lockbox', krexTier),
    [krexTier],
  );
  const [amountKas, setAmountKas] = useState('10');
  const [memo, setMemo] = useState('');
  const [unlockLocal, setUnlockLocal] = useState(() => toDatetimeLocalValue(Date.now() + 60_000));
  const [customAddMinutes, setCustomAddMinutes] = useState('5');
  const [importId, setImportId] = useState('');
  const [busy, setBusy] = useState(false);
  const [detailVaultId, setDetailVaultId] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());

  const tab = useDAppWidgetSection('create') as TabId;
  const navigateTab = useNavigateDAppWidgetTab();
  useRegisterWidgetTabLabel('vaults', `Vaults (${vaults.length})`, [vaults.length]);

  useEffect(() => {
    const t = setInterval(() => setNow(Date.now()), 15_000);
    return () => clearInterval(t);
  }, []);

  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  const myLocked = useMemo(() => vaults.filter((v) => v.status === 'locked'), [vaults]);
  const metadataInstances = useMemo(() => lockboxMetadataInstances(vaults), [vaults]);
  const detailInstance = useMemo(
    () => metadataInstances.find((i) => i.id === detailVaultId) ?? null,
    [metadataInstances, detailVaultId],
  );

  const bumpUnlockByMs = (ms: number) => {
    const base = unlockLocal ? new Date(unlockLocal).getTime() : Date.now();
    const from = Number.isFinite(base) ? Math.max(base, Date.now()) : Date.now();
    setUnlockLocal(toDatetimeLocalValue(from + ms));
  };

  const primaryClaimerFilled = Boolean(claimerRows[0]?.address.trim());

  const handleCreate = async () => {
    setBusy(true);
    try {
      if (kind === 'timelock' && !unlockLocal) {
        throw new Error('Choose an unlock date for timelock');
      }
      const unlockAt = kind === 'timelock' && unlockLocal ? new Date(unlockLocal) : null;
      await createVault({
        kind,
        beneficiaries: claimerRows.map((r) => r.address),
        amountKas: parseFloat(amountKas),
        memo: memo.trim(),
        unlockAt,
      });
      setMemo('');
      setClaimerRows([{ key: 'primary', address: '' }]);
      setUnlockLocal(toDatetimeLocalValue(Date.now() + 60_000));
      navigateTab('vaults');
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

  const lockAmount = parseFloat(amountKas) || 0;

  useCovenantWidgetRail(pricing, krexBalance, {
    lockAmountKas: tab === 'create' ? lockAmount : undefined,
    primaryAction: (
      <button
        type="button"
        disabled={
          busy || isLoading || !primaryClaimerFilled || (kind === 'timelock' && !unlockLocal)
        }
        onClick={() => void handleCreate()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? 'Creating...'
          : pricing.waived
            ? 'Create lock'
            : `Pay ${pricing.feeKas.toFixed(2)} KAS fee & create lock`}
      </button>
    ),
    deps: [busy, isLoading, primaryClaimerFilled, pricing, amountKas, kind, unlockLocal, claimerRows],
    enabled: tab === 'create',
  });

  const brand = getKpxCovenantBrand('lockbox');

  if (!kaspaState.isConnected) {
    return <KpxCovenantDisconnected template="lockbox" />;
  }

  return (
    <KpxCovenantShell template="lockbox" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>
      {error && <CovenantError message={error} />}

      {tab === 'create' && (
        <DAppWidgetShell title="Interact" heading="Create lock" description={brand.tagline}>
          <div className="k-form-group !mb-0">
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
                  onClick={() => {
                    setKind(k);
                    if (k === 'timelock' && !unlockLocal) {
                      setUnlockLocal(toDatetimeLocalValue(Date.now() + 60_000));
                    }
                  }}
                  className={`flex-1 rounded-lg border px-3 py-2.5 text-sm transition-colors ${
                    kind === k
                      ? 'border-[#02abb8] bg-[#02abb8]/10 text-[#02abb8]'
                      : 'border-zinc-300 text-zinc-600 hover:border-zinc-400 dark:border-zinc-700 dark:text-zinc-400 dark:hover:border-zinc-600'
                  }`}
                >
                  {label}
                </button>
              ))}
            </div>
            <p className="mt-2 text-xs text-zinc-500 dark:text-zinc-400">
              {kind === 'escrow'
                ? 'Beneficiary can claim as soon as the lock is created.'
                : 'Beneficiary can claim only after the unlock date.'}
            </p>
          </div>

          <div className="k-form-group !mb-0 space-y-3">
            <CovenantFieldLabel
              label="Who can claim"
              tooltip="First address is required. Add more claimers so any of them can unlock the full amount. Each extra claimer adds +5 KAS to the Hub deploy fee."
            />
            {claimerRows.map((row, index) => (
              <div key={row.key} className="flex gap-2">
                <input
                  type="text"
                  value={row.address}
                  onChange={(e) =>
                    setClaimerRows((prev) =>
                      prev.map((r) => (r.key === row.key ? { ...r, address: e.target.value } : r)),
                    )
                  }
                  placeholder={index === 0 ? 'Primary claimer (kaspa:...)' : 'Extra claimer (kaspa:...)'}
                  className={covenantInputClass}
                />
                {claimerRows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setClaimerRows((prev) => prev.filter((r) => r.key !== row.key))
                    }
                    className="shrink-0 rounded-lg border border-zinc-300 px-2 text-xs text-zinc-500 hover:border-rose-400 hover:text-rose-500 dark:border-zinc-700"
                    aria-label="Remove claimer"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            {claimerRows.length < 8 ? (
              <button
                type="button"
                onClick={() => setClaimerRows((prev) => [...prev, newClaimerRow()])}
                className={KX_FORM_ADD_BTN_CLASS}
              >
                {covenantPremiumAddButtonLabel('lockbox', claimerRows.length)}
              </button>
            ) : null}
          </div>

          <div className="k-form-group !mb-0">
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

          {kind === 'timelock' ? (
            <div className="k-form-group !mb-0 space-y-2">
              <CovenantFieldLabel
                label="Unlock after"
                htmlFor="lockbox-unlock"
                tooltip="The beneficiary cannot claim before this date and time (your local timezone)."
              />
              <input
                id="lockbox-unlock"
                type="datetime-local"
                value={unlockLocal}
                min={toDatetimeLocalValue(Date.now())}
                onChange={(e) => setUnlockLocal(e.target.value)}
                className={covenantInputClass}
              />
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => setUnlockLocal(toDatetimeLocalValue(Date.now()))}
                  className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 hover:border-[#02abb8] hover:text-[#02abb8] dark:border-zinc-700 dark:text-zinc-400"
                >
                  Now
                </button>
                {UNLOCK_PRESETS.map((p) => (
                  <button
                    key={p.label}
                    type="button"
                    onClick={() => bumpUnlockByMs(p.ms)}
                    className="rounded-lg border border-zinc-300 px-2.5 py-1.5 text-xs text-zinc-600 hover:border-[#02abb8] hover:text-[#02abb8] dark:border-zinc-700 dark:text-zinc-400"
                  >
                    {p.label}
                  </button>
                ))}
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={1}
                  step={1}
                  value={customAddMinutes}
                  onChange={(e) => setCustomAddMinutes(e.target.value)}
                  className={`${covenantInputClass} !w-24`}
                  aria-label="Minutes to add"
                />
                <button
                  type="button"
                  onClick={() => {
                    const mins = Math.max(1, Math.floor(Number(customAddMinutes) || 0));
                    bumpUnlockByMs(mins * 60_000);
                  }}
                  className="rounded-lg border border-[#02abb8]/50 bg-[#02abb8]/10 px-2.5 py-1.5 text-xs font-medium text-[#02abb8] hover:bg-[#02abb8]/20"
                >
                  Add minutes
                </button>
              </div>
            </div>
          ) : null}

          <div className="k-form-group !mb-0">
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
        </DAppWidgetShell>
      )}

      {tab === 'vaults' && (
        <CovenantTabPanel
          title="Vaults"
          heading="Your locks"
          description="Only locks where you are depositor or beneficiary. Tap a card for full metadata. Simulated demos are hidden."
        >
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
              vaults.map((v) => {
                const progress = unlockProgress(v, now);
                return (
                  <div
                    key={v.id}
                    role="button"
                    tabIndex={0}
                    onClick={() => setDetailVaultId(v.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault();
                        setDetailVaultId(v.id);
                      }
                    }}
                    className={`${covenantCardClass} cursor-pointer transition-colors hover:border-[#02abb8]/60`}
                  >
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
                    <p className="text-zinc-600 dark:text-zinc-400">{v.memo?.trim() || '(no memo)'}</p>
                    <div className="text-xs text-zinc-500 space-y-1">
                      <p>From: {shortKaspaAddr(v.depositor)}</p>
                      <p>
                        Claimers:{' '}
                        {resolveVaultClaimers(v)
                          .map((a) => shortKaspaAddr(a))
                          .join(', ')}
                      </p>
                      <p>Unlock: {formatUnlock(v.unlockAt)}</p>
                    </div>
                    {progress ? (
                      <div className="space-y-1.5 pt-1">
                        <div className="flex items-center justify-between text-[11px] text-zinc-500 dark:text-zinc-400">
                          <span>Unlock progress</span>
                          <span className="tabular-nums">
                            {progress.label}
                            {progress.unlocked ? '' : ` · ${progress.percent}%`}
                          </span>
                        </div>
                        <div className="relative h-2 overflow-hidden rounded-full bg-zinc-200 dark:bg-zinc-800">
                          <div
                            className="absolute inset-y-0 left-0 rounded-full bg-[#02abb8] transition-all duration-500 ease-out"
                            style={{ width: `${progress.percent}%` }}
                          />
                        </div>
                      </div>
                    ) : null}
                    {canClaim(v, kaspaState.address) && (
                      <button
                        type="button"
                        disabled={busy}
                        onClick={(e) => {
                          e.stopPropagation();
                          void handleClaim(v.id);
                        }}
                        className={covenantSecondaryBtnClass}
                      >
                        {busy
                          ? 'Claiming...'
                          : claimPricing.waived
                            ? 'Claim funds'
                            : `Claim · pay ${claimPricing.feeKas.toFixed(2)} KAS fee`}
                      </button>
                    )}
                  </div>
                );
              })
            )}
          </div>
        </CovenantTabPanel>
      )}

      {tab === 'metadata' && (
        <CovenantTabPanel
          title="Metadata"
          heading="On-chain references"
          description="Template, runtime, and explorer links. Open a vault card for per-lock details."
        >
          <KpxCovenantMetadataView
            template="lockbox"
            runtimeMode={runtimeMode}
            effectiveMode={effectiveMode}
            instances={metadataInstances}
            showInstances={false}
          />
        </CovenantTabPanel>
      )}

      {detailInstance ? (
        <LockboxVaultDetailModal instance={detailInstance} onClose={() => setDetailVaultId(null)} />
      ) : null}
    </KpxCovenantShell>
  );
}
