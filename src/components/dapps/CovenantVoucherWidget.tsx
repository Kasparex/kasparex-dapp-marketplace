'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantVoucher } from '@/hooks/useCovenantVoucher';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
import {
  CovenantFieldLabel,
  CovenantTabPanel,
  CovenantCreateShell,
  covenantInputClass,
  covenantPanelClass,
  covenantCardClass,
} from '@/components/dapps/covenant/CovenantWidgetUi';
import {
  CovenantRailAlerts,
  renderCovenantFormAlerts,
} from '@/components/dapps/covenant/CovenantRailAlerts';
import { Alert } from '@/components/Alert';
import { KpxCovenantDisconnected, KpxCovenantShell } from '@/components/dapps/covenant/KpxCovenantShell';
import { KpxCovenantMetadataView } from '@/components/dapps/covenant/KpxCovenantMetadataView';
import { useCovenantWidgetRail } from '@/hooks/useCovenantWidgetRail';
import { useKpxCovenantDeployFee, useKpxCovenantClaimFee } from '@/hooks/useKpxCovenantDeployFee';
import { voucherMetadataInstances } from '@/lib/covenant/kpxCovenantMetadata';
import { CovenantInstanceDetailModal } from '@/components/dapps/covenant/CovenantInstanceDetailModal';
import { CovenantDatetimeField } from '@/components/dapps/covenant/CovenantDatetimeField';
import { AuthorInline } from '@/components/ui/AuthorInline';
import {
  hasBlockingCovenantAlert,
  validateFutureDeadline,
} from '@/lib/covenant/datetimeValidation';
import {
  useDAppWidgetSection,
  useNavigateDAppWidgetTab,
} from '@/lib/dapps/DAppWidgetTabContext';

type TabId = 'create' | 'claim' | 'metadata';
type BusyKey = null | 'create' | 'claim';

export function CovenantVoucherWidget() {
  const { state } = useKaspaWallet();
  const { openVouchers, loading, error, createVoucher, claimVoucher, refresh, runtimeMode, effectiveMode } =
    useCovenantVoucher();
  const { pricing, krexTier, krexBalance } = useKpxCovenantDeployFee('voucher');
  const { pricing: claimPricing } = useKpxCovenantClaimFee('voucher');
  const tab = useDAppWidgetSection('create') as TabId;
  const navigateTab = useNavigateDAppWidgetTab();
  const [amountKas, setAmountKas] = useState('0.1');
  const [memo, setMemo] = useState('');
  const [expires, setExpires] = useState('');
  const [issuedSecret, setIssuedSecret] = useState<string | null>(null);
  const [issuedId, setIssuedId] = useState<string | null>(null);
  const [claimId, setClaimId] = useState('');
  const [claimSecret, setClaimSecret] = useState('');
  const [busyKey, setBusyKey] = useState<BusyKey>(null);
  const [detailVoucherId, setDetailVoucherId] = useState<string | null>(null);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;
  const metadataInstances = useMemo(() => voucherMetadataInstances(openVouchers), [openVouchers]);
  const detailInstance = useMemo(
    () => metadataInstances.find((i) => i.id === detailVoucherId) ?? null,
    [metadataInstances, detailVoucherId],
  );
  const busy = busyKey != null;

  const handleCreate = async () => {
    if (!expires) return;
    setBusyKey('create');
    try {
      const { voucher, secret } = await createVoucher({
        amountKas: parseFloat(amountKas),
        memo,
        expiresAt: new Date(expires),
      });
      setIssuedSecret(secret);
      setIssuedId(voucher.id);
      navigateTab('claim');
    } finally {
      setBusyKey(null);
    }
  };

  const handleClaim = async () => {
    setBusyKey('claim');
    try {
      await claimVoucher(claimId.trim(), claimSecret);
      setClaimSecret('');
      await refresh();
    } finally {
      setBusyKey(null);
    }
  };

  const isClaimTab = tab === 'claim';
  const expiryAlerts = expires.trim()
    ? validateFutureDeadline(expires, { label: 'Expiry' })
    : [];
  useCovenantWidgetRail(isClaimTab ? claimPricing : pricing, krexBalance, {
    lockAmountKas: tab === 'create' ? parseFloat(amountKas) || 0 : undefined,
    enabled: tab === 'create' || isClaimTab,
    flowAlwaysVisible: true,
    flowBusy: busy,
    flowPreset: isClaimTab || busyKey === 'claim' ? 'covenantClaim' : 'covenantCreate',
    flowFeeWaived: isClaimTab || busyKey === 'claim' ? claimPricing.waived : pricing.waived,
    alerts: (
      <CovenantRailAlerts>
        {error ? (
          <Alert type="error" compact region>
            {error}
          </Alert>
        ) : null}
        {issuedSecret && issuedId ? (
          <Alert type="warning" compact region>
            <p className="font-medium">Save this secret (shown once)</p>
            <p className="font-mono break-all text-xs mt-1">{issuedSecret}</p>
            <p className="text-[11px] mt-1 opacity-80">Voucher ID: {issuedId}</p>
          </Alert>
        ) : null}
        {tab === 'create' ? (
          <>
            <Alert type="info" compact region>
              After expiry the voucher can no longer be redeemed. Share the secret only with the recipient.
            </Alert>
            {renderCovenantFormAlerts(expiryAlerts)}
          </>
        ) : null}
      </CovenantRailAlerts>
    ),
    primaryAction: isClaimTab ? (
      <button
        type="button"
        disabled={busy || !claimId.trim() || !claimSecret}
        onClick={() => void handleClaim()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busyKey === 'claim'
          ? 'Redeeming...'
          : claimPricing.waived
            ? 'Redeem voucher'
            : `Redeem · pay ${claimPricing.feeKas.toFixed(2)} KAS fee`}
      </button>
    ) : (
      <button
        type="button"
        disabled={busy || !expires || hasBlockingCovenantAlert(expiryAlerts)}
        onClick={() => void handleCreate()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busyKey === 'create'
          ? 'Minting voucher...'
          : pricing.waived
            ? 'Mint voucher'
            : `Pay ${pricing.feeKas.toFixed(2)} KAS fee & mint voucher`}
      </button>
    ),
    deps: [
      tab,
      busyKey,
      expires,
      pricing,
      claimPricing,
      amountKas,
      memo,
      claimId,
      claimSecret,
      error,
      issuedSecret,
      issuedId,
    ],
  });

  if (!state.isConnected) {
    return <KpxCovenantDisconnected template="voucher" />;
  }

  return (
    <KpxCovenantShell template="voucher" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>

      {tab === 'create' && (
        <CovenantCreateShell template="voucher" heading="Mint voucher">
          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label={`Amount (KAS, min ${minKas})`}
              htmlFor="voucher-amount"
              required
              tooltip="How much KAS the voucher is worth. This amount is locked when you mint."
            />
            <input
              id="voucher-amount"
              type="number"
              min={minKas}
              step="0.01"
              className={covenantInputClass}
              value={amountKas}
              onChange={(e) => setAmountKas(e.target.value)}
            />
          </div>

          <div className="k-form-group !mb-0">
            <CovenantDatetimeField
              id="voucher-expires"
              label="Expires"
              required
              tooltip="After this date the voucher can no longer be redeemed."
              value={expires}
              onChange={setExpires}
            />
          </div>

          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label="Memo"
              htmlFor="voucher-memo"
              tooltip="A note for yourself or the recipient, e.g. Happy birthday."
            />
            <input
              id="voucher-memo"
              className={covenantInputClass}
              placeholder="e.g. Thanks for the help!"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
        </CovenantCreateShell>
      )}

      {tab === 'claim' && (
        <CovenantTabPanel
          title="Redeem"
          heading="Redeem a voucher"
          description="Enter the voucher ID and secret code shared by the sender."
        >
        <div className="space-y-4">
          <div className={covenantPanelClass}>
            <div>
              <CovenantFieldLabel
                label="Voucher ID"
                htmlFor="voucher-claim-id"
                required
                tooltip="The ID shown when the voucher was created, or pick one from the list below."
              />
              <input
                id="voucher-claim-id"
                className={covenantInputClass}
                placeholder="Paste voucher ID"
                value={claimId}
                onChange={(e) => setClaimId(e.target.value)}
              />
            </div>

            <div>
              <CovenantFieldLabel
                label="Secret code"
                htmlFor="voucher-claim-secret"
                required
                tooltip="The one-time code the sender shared with you. Only someone with this code can redeem."
              />
              <input
                id="voucher-claim-secret"
                className={covenantInputClass}
                placeholder="Paste secret code"
                value={claimSecret}
                onChange={(e) => setClaimSecret(e.target.value)}
              />
            </div>
          </div>

          <div className="space-y-3">
            <p className="text-sm font-medium text-zinc-700 dark:text-zinc-300">
              Open vouchers ({openVouchers.length})
            </p>
            {loading ? (
              <p className="text-zinc-500 text-sm">Loading...</p>
            ) : openVouchers.length === 0 ? (
              <p className="text-zinc-500 text-sm">No open vouchers right now.</p>
            ) : (
              openVouchers.map((v) => (
                <div
                  key={v.id}
                  className={`${covenantCardClass} w-full flex flex-wrap justify-between items-center gap-2 cursor-pointer hover:border-[#02abb8]/60 transition-colors`}
                  role="button"
                  tabIndex={0}
                  onClick={() => setDetailVoucherId(v.id)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setDetailVoucherId(v.id);
                    }
                  }}
                >
                  <div>
                    <span className="font-medium text-zinc-900 dark:text-zinc-100">
                      {sompiToKasNumber(v.amountSompi)} KAS
                    </span>
                    <p className="text-[11px] text-[#02abb8] mt-0.5">Tap for details</p>
                  </div>
                  <div className="flex items-center gap-2 min-w-0">
                    <AuthorInline address={v.creator} className="min-w-0" />
                    <button
                      type="button"
                      className="text-xs px-2 py-1 rounded-lg border border-[#02abb8] text-[#02abb8] shrink-0"
                      onClick={(e) => {
                        e.stopPropagation();
                        setClaimId(v.id);
                      }}
                    >
                      Use ID
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
        </CovenantTabPanel>
      )}

      {tab === 'metadata' && (
        <CovenantTabPanel
          title="Metadata"
          heading="On-chain references"
          description="Covenant IDs, payload templates, and explorer links for your vouchers."
        >
        <KpxCovenantMetadataView
          template="voucher"
          runtimeMode={runtimeMode}
          effectiveMode={effectiveMode}
          instances={metadataInstances}
        />
        </CovenantTabPanel>
      )}

      {detailInstance ? (
        <CovenantInstanceDetailModal
          instance={detailInstance}
          onClose={() => setDetailVoucherId(null)}
        />
      ) : null}
    </KpxCovenantShell>
  );
}
