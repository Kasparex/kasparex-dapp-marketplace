'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantVoucher } from '@/hooks/useCovenantVoucher';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
import {
  CovenantFieldLabel,
  CovenantError,
  CovenantTabPanel,
  CovenantCreateShell,
  covenantInputClass,
  covenantPanelClass,
  covenantCardClass,
  covenantSecondaryBtnClass,
  shortKaspaAddr,
} from '@/components/dapps/covenant/CovenantWidgetUi';
import { KpxCovenantDisconnected, KpxCovenantShell } from '@/components/dapps/covenant/KpxCovenantShell';
import { KpxCovenantMetadataView } from '@/components/dapps/covenant/KpxCovenantMetadataView';
import { useCovenantWidgetRail } from '@/hooks/useCovenantWidgetRail';
import { useKpxCovenantDeployFee, useKpxCovenantClaimFee } from '@/hooks/useKpxCovenantDeployFee';
import { voucherMetadataInstances } from '@/lib/covenant/kpxCovenantMetadata';
import {
  useDAppWidgetSection,
  useNavigateDAppWidgetTab,
} from '@/lib/dapps/DAppWidgetTabContext';

type TabId = 'create' | 'claim' | 'metadata';

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
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;
  const metadataInstances = useMemo(() => voucherMetadataInstances(openVouchers), [openVouchers]);

  const handleCreate = async () => {
    if (!expires) return;
    setBusy(true);
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
      setBusy(false);
    }
  };

  const handleClaim = async () => {
    setBusy(true);
    try {
      await claimVoucher(claimId.trim(), claimSecret);
      setClaimSecret('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  useCovenantWidgetRail(pricing, krexBalance, {
    lockAmountKas: tab === 'create' ? parseFloat(amountKas) || 0 : undefined,
    enabled: tab === 'create',
    primaryAction: (
      <button
        type="button"
        disabled={busy || !expires}
        onClick={() => void handleCreate()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busy
          ? 'Minting...'
          : pricing.waived
            ? 'Mint voucher'
            : `Pay ${pricing.feeKas.toFixed(2)} KAS fee & mint voucher`}
      </button>
    ),
    deps: [tab, busy, expires, pricing, amountKas, memo],
  });

  if (!state.isConnected) {
    return <KpxCovenantDisconnected template="voucher" />;
  }

  return (
    <KpxCovenantShell template="voucher" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>

      {error && <CovenantError message={error} />}

      {issuedSecret && issuedId && (
        <div className="p-4 bg-amber-500/10 border border-amber-500/40 rounded-xl text-sm space-y-2">
          <p className="font-medium text-amber-800 dark:text-amber-200">
            Save this secret code (shown once):
          </p>
          <p className="font-mono break-all text-zinc-900 dark:text-zinc-100">{issuedSecret}</p>
          <p className="text-xs text-zinc-500">Voucher ID: {issuedId}</p>
        </div>
      )}

      {tab === 'create' && (
        <CovenantCreateShell template="voucher" heading="Mint voucher">
          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label={`Amount (KAS, min ${minKas})`}
              htmlFor="voucher-amount"
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
            <CovenantFieldLabel
              label="Expires"
              htmlFor="voucher-expires"
              tooltip="After this date the voucher can no longer be redeemed."
            />
            <input
              id="voucher-expires"
              type="datetime-local"
              className={covenantInputClass}
              value={expires}
              onChange={(e) => setExpires(e.target.value)}
            />
          </div>

          <div className="k-form-group !mb-0">
            <CovenantFieldLabel
              label="Memo (optional)"
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

            <button
              type="button"
              disabled={busy || !claimId.trim() || !claimSecret}
              onClick={() => void handleClaim()}
              className={covenantSecondaryBtnClass}
            >
              {busy
                ? 'Redeeming...'
                : claimPricing.waived
                  ? 'Redeem voucher'
                  : `Redeem · pay ${claimPricing.feeKas.toFixed(2)} KAS fee`}
            </button>
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
                <button
                  key={v.id}
                  type="button"
                  className={`${covenantCardClass} w-full text-left flex justify-between items-center hover:border-[#02abb8]/60 transition-colors cursor-pointer`}
                  onClick={() => setClaimId(v.id)}
                >
                  <span className="font-medium text-zinc-900 dark:text-zinc-100">
                    {sompiToKasNumber(v.amountSompi)} KAS
                  </span>
                  <span className="text-zinc-500 text-xs">{shortKaspaAddr(v.creator)}</span>
                </button>
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
    </KpxCovenantShell>
  );
}
