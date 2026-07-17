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
  covenantSmallInputClass,
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
import { CovenantInstanceDetailModal } from '@/components/dapps/covenant/CovenantInstanceDetailModal';
import {
  CovenantDatetimeField,
  toDatetimeLocalValue,
} from '@/components/dapps/covenant/CovenantDatetimeField';
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
  percent: string;
}

function newClaimerRow(percent = ''): ClaimerRow {
  return { key: `c_${Math.random().toString(36).slice(2, 9)}`, address: '', percent };
}

function sompiToKas(sompi: string): string {
  const n = Number(BigInt(sompi)) / 1e8;
  return n.toLocaleString(undefined, { maximumFractionDigits: 8 });
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
  const [claimerRows, setClaimerRows] = useState<ClaimerRow[]>([
    { key: 'primary', address: '', percent: '100' },
  ]);
  const { pricing, krexTier, krexBalance } = useKpxCovenantDeployFee('lockbox', claimerRows.length);
  const claimPricing = useMemo(
    () => resolveKpxCovenantClaimPrice('lockbox', krexTier),
    [krexTier],
  );
  const [amountKas, setAmountKas] = useState('10');
  const [memo, setMemo] = useState('');
  const [unlockLocal, setUnlockLocal] = useState(() => toDatetimeLocalValue(Date.now() + 60_000));
  const [importId, setImportId] = useState('');
  const [busyKey, setBusyKey] = useState<null | 'create' | `claim:${string}`>(null);
  const [detailVaultId, setDetailVaultId] = useState<string | null>(null);
  const busy = busyKey != null;
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

  const primaryClaimerFilled = Boolean(claimerRows[0]?.address.trim());
  const percentSum = useMemo(
    () => claimerRows.reduce((s, r) => s + (parseFloat(r.percent) || 0), 0),
    [claimerRows],
  );
  const lockAmount = parseFloat(amountKas) || 0;
  const claimerPreview = useMemo(
    () =>
      claimerRows.map((r) => ({
        ...r,
        kas: lockAmount > 0 ? ((parseFloat(r.percent) || 0) / 100) * lockAmount : 0,
      })),
    [claimerRows, lockAmount],
  );
  const sharesValid =
    claimerRows.length === 1
      ? true
      : Math.abs(percentSum - 100) < 0.01 && claimerRows.every((r) => (parseFloat(r.percent) || 0) > 0);

  const updateClaimerRow = (key: string, patch: Partial<ClaimerRow>) => {
    setClaimerRows((prev) => prev.map((r) => (r.key === key ? { ...r, ...patch } : r)));
  };

  const addClaimerRow = () => {
    setClaimerRows((prev) => {
      if (prev.length >= 8) return prev;
      if (prev.length === 1) {
        return [
          { ...prev[0], percent: prev[0].percent || '50' },
          newClaimerRow('50'),
        ];
      }
      return [...prev, newClaimerRow('')];
    });
  };

  const handleCreate = async () => {
    setBusyKey('create');
    try {
      if (kind === 'timelock' && !unlockLocal) {
        throw new Error('Choose an unlock date for timelock');
      }
      if (!sharesValid) {
        throw new Error('Claimer shares must total 100%');
      }
      const unlockAt = kind === 'timelock' && unlockLocal ? new Date(unlockLocal) : null;
      await createVault({
        kind,
        recipients: claimerRows.map((r) => ({
          address: r.address,
          shareBps:
            claimerRows.length === 1
              ? 10000
              : Math.round((parseFloat(r.percent) || 0) * 100),
        })),
        amountKas: parseFloat(amountKas),
        memo: memo.trim(),
        unlockAt,
      });
      setMemo('');
      setClaimerRows([{ key: 'primary', address: '', percent: '100' }]);
      setUnlockLocal(toDatetimeLocalValue(Date.now() + 60_000));
      navigateTab('vaults');
    } catch (e) {
      console.error(e);
    } finally {
      setBusyKey(null);
    }
  };

  const handleClaim = async (vaultId: string) => {
    setBusyKey(`claim:${vaultId}`);
    try {
      await claimVault(vaultId);
    } catch (e) {
      console.error(e);
    } finally {
      setBusyKey(null);
    }
  };

  useCovenantWidgetRail(pricing, krexBalance, {
    lockAmountKas: tab === 'create' ? lockAmount : undefined,
    enabled: tab === 'create',
    flowAlwaysVisible: true,
    flowBusy: busy,
    flowPreset:
      typeof busyKey === 'string' && busyKey.startsWith('claim:')
        ? 'covenantClaim'
        : 'covenantCreate',
    primaryAction: (
      <button
        type="button"
        disabled={
          busy ||
          isLoading ||
          !primaryClaimerFilled ||
          !sharesValid ||
          (kind === 'timelock' && !unlockLocal)
        }
        onClick={() => void handleCreate()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busyKey === 'create'
          ? claimerRows.length > 1
            ? 'Creating locks...'
            : 'Creating...'
          : pricing.waived
            ? claimerRows.length > 1
              ? `Create ${claimerRows.length} share locks`
              : 'Create lock'
            : `Pay ${pricing.feeKas.toFixed(2)} KAS fee & create lock`}
      </button>
    ),
    deps: [
      busyKey,
      isLoading,
      primaryClaimerFilled,
      sharesValid,
      pricing,
      amountKas,
      kind,
      unlockLocal,
      claimerRows,
      memo,
      percentSum,
    ],
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
            <div className="flex justify-between items-center gap-2">
              <CovenantFieldLabel
                label="Who can claim"
                tooltip="Add Kaspa addresses and a share for each. Shares must total 100%. Each claimer gets their own lock for that slice (you will sign once per claimer). Extra claimers add +5 KAS to the Hub deploy fee."
              />
              {claimerRows.length > 1 ? (
                <span
                  className={`text-xs font-medium ${
                    sharesValid
                      ? 'text-green-600 dark:text-green-400'
                      : 'text-amber-600 dark:text-amber-400'
                  }`}
                >
                  Total: {percentSum.toFixed(1)}%
                </span>
              ) : null}
            </div>
            {claimerPreview.map((row, index) => (
              <div key={row.key} className="flex gap-2 items-start">
                <div className="flex-1 space-y-1">
                  <input
                    type="text"
                    value={row.address}
                    onChange={(e) => updateClaimerRow(row.key, { address: e.target.value })}
                    placeholder={index === 0 ? 'Claimer (kaspa:...)' : 'Extra claimer (kaspa:...)'}
                    className={covenantInputClass}
                  />
                  {claimerRows.length > 1 ? (
                    <p className="text-xs text-zinc-500 pl-1">~{row.kas.toFixed(4)} KAS</p>
                  ) : null}
                </div>
                {claimerRows.length > 1 ? (
                  <div className="w-24 shrink-0">
                    <input
                      type="number"
                      min={0.01}
                      max={100}
                      step={0.1}
                      value={row.percent}
                      onChange={(e) => updateClaimerRow(row.key, { percent: e.target.value })}
                      className={`${covenantSmallInputClass} text-center`}
                      aria-label="Share percent"
                    />
                    <p className="text-[10px] text-center text-zinc-500 mt-1">%</p>
                  </div>
                ) : null}
                {claimerRows.length > 1 ? (
                  <button
                    type="button"
                    onClick={() =>
                      setClaimerRows((prev) => {
                        const next = prev.filter((r) => r.key !== row.key);
                        if (next.length === 1) {
                          return [{ ...next[0], percent: '100' }];
                        }
                        return next;
                      })
                    }
                    className="mt-2.5 shrink-0 rounded-lg border border-zinc-300 px-2 text-xs text-zinc-500 hover:border-rose-400 hover:text-rose-500 dark:border-zinc-700"
                    aria-label="Remove claimer"
                  >
                    Remove
                  </button>
                ) : null}
              </div>
            ))}
            {claimerRows.length < 8 ? (
              <button type="button" onClick={addClaimerRow} className={KX_FORM_ADD_BTN_CLASS}>
                {covenantPremiumAddButtonLabel('lockbox', claimerRows.length)}
              </button>
            ) : null}
            {claimerRows.length > 1 ? (
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Multi-claimer creates one lock per wallet for their %. You will approve one lock transaction per
                claimer, then the Hub deploy fee once.
              </p>
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
            <div className="k-form-group !mb-0">
              <CovenantDatetimeField
                id="lockbox-unlock"
                label="Unlock after"
                tooltip="The beneficiary cannot claim before this date and time (your local timezone)."
                value={unlockLocal}
                onChange={setUnlockLocal}
              />
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
          description="Only locks where you are depositor or beneficiary. Tap a card for full metadata."
        >
          <div className="space-y-4">
            <KpxCovenantImportPanel
              id="lockbox-import-id"
              value={importId}
              onChange={setImportId}
              busy={busy}
              onImport={() => {
                setBusyKey('create');
                void importByCovenantId(importId)
                  .then(() => setImportId(''))
                  .catch(console.error)
                  .finally(() => setBusyKey(null));
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
                        Claimer: {shortKaspaAddr(v.beneficiary)}
                        {typeof v.shareBps === 'number'
                          ? ` · ${(v.shareBps / 100).toFixed(1)}%`
                          : ''}
                      </p>
                      {v.groupId ? (
                        <p className="text-[11px] text-zinc-400">Share group · {v.groupId.slice(0, 12)}</p>
                      ) : null}
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
                        {busyKey === `claim:${v.id}`
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
          description="Product info and explorer links. Open a vault card for per-lock details."
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
        <CovenantInstanceDetailModal
          instance={detailInstance}
          onClose={() => setDetailVaultId(null)}
        />
      ) : null}
    </KpxCovenantShell>
  );
}
