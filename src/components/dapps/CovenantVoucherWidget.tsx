'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantVoucher } from '@/hooks/useCovenantVoucher';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
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
import { KpxCovenantDisconnected, KpxCovenantShell } from '@/components/dapps/covenant/KpxCovenantShell';
import { KpxCovenantMetadataView } from '@/components/dapps/covenant/KpxCovenantMetadataView';
import { useCovenantWidgetRail } from '@/hooks/useCovenantWidgetRail';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { useKpxCovenantDeployFee } from '@/hooks/useKpxCovenantDeployFee';
import { voucherMetadataInstances } from '@/lib/covenant/kpxCovenantMetadata';

type TabId = 'create' | 'claim' | 'metadata' | 'about';

export function CovenantVoucherWidget() {
  const { state } = useKaspaWallet();
  const { openVouchers, loading, error, createVoucher, claimVoucher, refresh, runtimeMode, effectiveMode } =
    useCovenantVoucher();
  const { pricing, krexTier, krexBalance } = useKpxCovenantDeployFee('voucher');
  const [tab, setTab] = useState<TabId>('create');
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
      setTab('claim');
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
    deps: [tab, busy, expires, pricing, amountKas],
  });

  if (!state.isConnected) {
    return <KpxCovenantDisconnected template="voucher" />;
  }

  return (
    <KpxCovenantShell template="voucher" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>

      <CovenantTabs
        tabs={[
          { id: 'create' as const, label: 'Mint voucher' },
          { id: 'claim' as const, label: 'Redeem' },
          { id: 'metadata' as const, label: 'Metadata' },
          { id: 'about' as const, label: 'How it works' },
        ]}
        active={tab}
        onChange={setTab}
      />

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
        <DAppWidgetShell
          title="Interact"
          heading="Mint voucher"
          description="Create a KAS gift card with a secret code. Platform fee and Hub points are in the calculation breakdown."
        >
          <div>
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

          <div>
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

          <div>
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

        </DAppWidgetShell>
      )}

      {tab === 'claim' && (
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
              {busy ? 'Redeeming...' : 'Redeem voucher'}
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
      )}

      {tab === 'metadata' && (
        <KpxCovenantMetadataView
          template="voucher"
          runtimeMode={runtimeMode}
          effectiveMode={effectiveMode}
          instances={metadataInstances}
        />
      )}

      {tab === 'about' && (
        <CovenantHowItWorks>
          <p>
            Covenant Voucher works like a gift card for KAS. You lock coins on-chain, then give someone a secret
            code so only they can claim it.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Mint</strong>: choose an amount and expiry date. You get a voucher ID and a secret code.
            </li>
            <li>
              <strong>Share off-chain</strong>: send the code to the recipient by message or email. Do not post it
              publicly.
            </li>
            <li>
              <strong>Redeem once</strong>: whoever enters the correct code first claims the KAS. Each voucher works
              only one time.
            </li>
            <li>
              <strong>Expires</strong>: unredeemed vouchers stop working after the expiry date you set.
            </li>
          </ul>
          <p className="text-xs text-zinc-500">
            Great for tips, gifts, promo credits, or paying someone without needing their wallet address up front.
          </p>
        </CovenantHowItWorks>
      )}
    </KpxCovenantShell>
  );
}
