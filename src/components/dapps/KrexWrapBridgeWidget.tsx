'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { queryL1KREXBalance } from '@/lib/krex/l1-balance';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { Alert } from '@/components/Alert';
import { KxAlertRegion } from '@/components/ui/KxAlertRegion';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { getExplorerTxUrl, getKaspaExplorerAddressUrl } from '@/lib/store/utils';
import { CopyableAddress } from '@/components/donations/CopyableAddress';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { useRegisterHubFlowProgress } from '@/hooks/useRegisterHubFlowProgress';
import { useSyncDAppWidgetQuote, useSyncHubQuote } from '@/lib/dapps/PaymentAmountContext';
import { placeholderDApps } from '@/lib/dapps';
import { awardDAppHubPoints } from '@/lib/rewards/awardDAppHubPoints';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useDAppWidgetSection } from '@/lib/dapps/DAppWidgetTabContext';
import {
  getKrexWrapPublicConfig,
  getKrexWrapTick,
  getKrexWrapDecimals,
} from '@/lib/krex/wrap/config';
import { buildKrexWrapHubQuote, quoteKrexWrapFeeKas } from '@/lib/krex/wrap/fees';
import {
  listKrexWrapHistory,
  newKrexWrapId,
  upsertKrexWrapRecord,
  updateKrexWrapStatus,
} from '@/lib/krex/wrap/history';
import type { KrexWrapRecord } from '@/lib/krex/wrap/types';
import {
  buildHubKasListingPlan,
  payHubKasPlan,
} from '@/lib/payments/hubPayRail';

function statusLabel(status: KrexWrapRecord['status']): string {
  switch (status) {
    case 'fee_paid':
      return 'Fee paid';
    case 'deposited':
      return 'Deposited';
    case 'pending_mint':
      return 'Pending mint';
    case 'minted':
      return 'Minted';
    case 'failed':
      return 'Failed';
    default:
      return status;
  }
}

export function KrexWrapBridgeWidget() {
  const { state } = useKaspaWallet();
  const tab = useDAppWidgetSection('wrap');
  const { tier, balance: krexBal, kcc20Balance, refetch } = useKREXBalance();
  const wrapDApp = placeholderDApps.find((d) => d.slug === 'krex-wrap-bridge');
  const config = useMemo(() => getKrexWrapPublicConfig(), []);

  const [amount, setAmount] = useState('');
  const [krexBalance, setKrexBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [feeTxHash, setFeeTxHash] = useState<string | null>(null);
  const [depositTxHash, setDepositTxHash] = useState<string | null>(null);
  const [history, setHistory] = useState<KrexWrapRecord[]>([]);

  const tick = getKrexWrapTick();
  const decimals = getKrexWrapDecimals();
  const parsedAmount = amount && !Number.isNaN(parseFloat(amount)) ? parseFloat(amount) : null;
  const feeKas = quoteKrexWrapFeeKas(tier);

  const hubQuote = useMemo(() => {
    if (!wrapDApp || parsedAmount == null || parsedAmount <= 0) return null;
    return buildKrexWrapHubQuote({
      dapp: wrapDApp,
      amountKrex: parsedAmount,
      tier,
      krexBalance: krexBal ?? 0,
    });
  }, [wrapDApp, parsedAmount, tier, krexBal]);

  useSyncDAppWidgetQuote(feeKas > 0 && parsedAmount && parsedAmount > 0 ? feeKas : null, 'wrap');
  useSyncHubQuote(hubQuote, [hubQuote]);

  const refreshHistory = useCallback(() => {
    setHistory(listKrexWrapHistory(state.address));
  }, [state.address]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    const fetchBalance = async () => {
      if (state.isConnected && state.address) {
        setIsLoadingBalance(true);
        try {
          const bal = await queryL1KREXBalance(state.address);
          setKrexBalance(bal);
        } catch {
          setKrexBalance(0);
        } finally {
          setIsLoadingBalance(false);
        }
      } else {
        setKrexBalance(0);
      }
    };
    void fetchBalance();
  }, [state.isConnected, state.address]);

  const handleWrap = async () => {
    if (!state.isConnected || !state.provider || !state.address) {
      setError('Connect a Kaspa wallet first');
      return;
    }
    if (state.provider !== 'kasware' && state.provider !== 'kastle' && state.provider !== 'kaspire') {
      setError('Wrap requires KasWare, Kastle, or Kaspire');
      return;
    }
    if (!config.ready || !config.vaultAddress || !config.treasuryAddress) {
      setError('Wrap vault or treasury is not configured yet. Set NEXT_PUBLIC_KREX_WRAP_VAULT and treasury env.');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      setError('Enter a valid wrap amount');
      return;
    }
    if (parsedAmount < config.minWrapKrex) {
      setError(`Minimum wrap is ${config.minWrapKrex} ${tick}`);
      return;
    }
    if (parsedAmount > krexBalance) {
      setError(`Insufficient ${tick} balance`);
      return;
    }

    setIsWorking(true);
    setError(null);
    setSuccess(null);
    setFeeTxHash(null);
    setDepositTxHash(null);

    const wrapId = newKrexWrapId();
    upsertKrexWrapRecord({
      id: wrapId,
      wallet: state.address,
      amountKrex: parsedAmount,
      feeKas,
      status: 'draft',
    });

    try {
      if (feeKas > 0) {
        const plan = buildHubKasListingPlan({
          feeKas,
          treasuryAddress: config.treasuryAddress,
          note: `krex-wrap:${wrapId}`,
        });
        const feeHash = await payHubKasPlan({
          provider: state.provider,
          senderAddress: state.address,
          plan,
        });
        setFeeTxHash(feeHash);
        updateKrexWrapStatus(wrapId, 'fee_paid', { feeTxHash: feeHash });
      }

      const amountInSmallestUnit = Math.floor(parsedAmount * Math.pow(10, decimals));
      const inscribeJson = {
        p: 'KRC-20',
        op: 'transfer',
        tick,
        amt: amountInSmallestUnit.toString(),
        to: config.vaultAddress,
      };
      const hash = await signKrc20Transfer(
        state.provider,
        JSON.stringify(inscribeJson),
        4,
        config.vaultAddress,
        0.001,
      );
      setDepositTxHash(hash);
      updateKrexWrapStatus(wrapId, config.mintLive ? 'pending_mint' : 'deposited', {
        depositTxHash: hash,
        note: config.mintLive
          ? 'Deposit submitted. Waiting for KCC20 mint watcher.'
          : 'Deposit submitted. KCC20 mint goes live when the covenant + watcher are configured.',
      });

      try {
        await fetch('/api/krex-wrap/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            depositTxHash: hash,
            wallet: state.address,
            amountKrex: parsedAmount,
          }),
        });
      } catch {
        // soft verify; indexer may lag
      }

      if (wrapDApp) {
        awardDAppHubPoints({
          walletRaw: state.address,
          dapp: wrapDApp,
          actionId: 'wrap',
          txHash: hash,
          krexTier: tier,
          krexBalance: krexBal ?? 0,
          baseSpendKas: feeKas,
        });
      }

      setSuccess(
        config.mintLive
          ? `Wrapped ${parsedAmount} ${tick}. Mint should arrive as KCC20 shortly.`
          : `Locked ${parsedAmount} ${tick} in the wrap vault. KCC20 mint activates when the covenant is live.`,
      );
      setAmount('');
      refreshHistory();
      void refetch();
      if (state.address) {
        try {
          setKrexBalance(await queryL1KREXBalance(state.address));
        } catch {
          /* ignore */
        }
      }
    } catch (err) {
      updateKrexWrapStatus(wrapId, 'failed', {
        note: err instanceof Error ? err.message : 'Wrap failed',
      });
      let msg = 'Wrap failed';
      if (err instanceof Error) {
        msg = err.message || msg;
        if (msg.includes('rejected')) msg = 'Transaction was rejected';
      }
      setError(msg);
      refreshHistory();
    } finally {
      setIsWorking(false);
    }
  };

  const railActions =
    tab === 'wrap' && state.isConnected ? (
      <button
        type="button"
        onClick={() => void handleWrap()}
        disabled={isWorking || !parsedAmount || parsedAmount <= 0 || !config.ready}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isWorking ? 'Wrapping...' : `Wrap ${tick} → KCC20`}
      </button>
    ) : null;

  const railAlerts =
    error || success ? (
      <KxAlertRegion>
        {error ? (
          <Alert type="error" compact region onDismiss={() => setError(null)}>
            {error}
          </Alert>
        ) : null}
        {success ? (
          <Alert type="success" compact region onDismiss={() => setSuccess(null)}>
            {success}
          </Alert>
        ) : null}
        {feeTxHash ? (
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Fee tx:{' '}
            <a className="underline" href={getExplorerTxUrl(feeTxHash)} target="_blank" rel="noreferrer">
              {feeTxHash.slice(0, 12)}…
            </a>
          </div>
        ) : null}
        {depositTxHash ? (
          <div className="text-xs text-zinc-600 dark:text-zinc-400">
            Deposit tx:{' '}
            <a className="underline" href={getExplorerTxUrl(depositTxHash)} target="_blank" rel="noreferrer">
              {depositTxHash.slice(0, 12)}…
            </a>
          </div>
        ) : null}
      </KxAlertRegion>
    ) : null;

  useRegisterDAppWidgetRailSlot('actions', railActions, [
    tab,
    state.isConnected,
    isWorking,
    amount,
    config.ready,
  ]);
  useRegisterDAppWidgetRailSlot('alerts', railAlerts, [error, success, feeTxHash, depositTxHash]);
  useRegisterHubFlowProgress('hubPay', { busy: isWorking, complete: Boolean(success) }, [
    isWorking,
    success,
  ]);

  if (tab === 'history') {
    return (
      <DAppWidgetShell
        title="History"
        heading="Your wraps"
        description="Client-side wrap history for this browser. Deposits are on Kaspa L1; mint status updates when the watcher is live."
      >
        {history.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No wraps recorded in this browser yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-4 space-y-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {row.amountKrex} {tick}
                  </span>
                  <span className="text-xs text-zinc-500">{statusLabel(row.status)}</span>
                </div>
                <div className="text-xs text-zinc-500">
                  Fee {row.feeKas} KAS · {new Date(row.createdAt).toLocaleString()}
                </div>
                {row.depositTxHash ? (
                  <a
                    className="text-xs text-[#02abb8] underline break-all"
                    href={getExplorerTxUrl(row.depositTxHash)}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Deposit {row.depositTxHash}
                  </a>
                ) : null}
                {row.note ? <p className="text-xs text-zinc-500">{row.note}</p> : null}
              </li>
            ))}
          </ul>
        )}
      </DAppWidgetShell>
    );
  }

  if (tab === 'unwrap') {
    return (
      <DAppWidgetShell
        title="Unwrap"
        heading="KCC20 → KRC-20"
        description="Two-way release needs a vault that can send KRC-20 back. That path stays disabled until release signing is production-ready."
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {config.unwrapEnabled
            ? 'Unwrap is flagged on in env. Wire the release watcher before enabling this UI for users.'
            : 'Unwrap is not enabled yet. One-way wrap (burn-in) is available on the Wrap tab.'}
        </div>
      </DAppWidgetShell>
    );
  }

  return (
    <DAppWidgetShell
      title="Wrap"
      heading="KREX Wrap Bridge"
      description="Move KRC-20 KREX into the wrap vault. When mint is live, you receive matching KCC20 (counted toward Hub tiers). One-way until unwrap is enabled."
    >
      {!config.ready ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Vault not configured. Set <code className="font-mono text-xs">NEXT_PUBLIC_KREX_WRAP_VAULT</code> and a
          treasury address, then redeploy. The UI and fee rails are ready.
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2 text-xs text-zinc-600 dark:text-zinc-400">
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Mint status</div>
          {config.mintLive ? 'Live (covenant configured)' : 'Vault deposits accepted; KCC20 mint pending ops'}
        </div>
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 p-3">
          <div className="font-semibold text-zinc-900 dark:text-zinc-100 mb-1">Your KCC20 KREX</div>
          {kcc20Balance > 0 ? `${kcc20Balance.toLocaleString()} wKREX` : '0 (shows after mint + covenant id)'}
        </div>
      </div>

      {!state.isConnected ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Connect KasWare, Kastle, or Kaspire from the site header to wrap KREX.
          </p>
        </div>
      ) : (
        <>
          {config.vaultAddress ? (
            <CopyableAddress
              label="Wrap vault"
              value={config.vaultAddress}
              explorerUrl={getKaspaExplorerAddressUrl(config.vaultAddress)}
              truncate
            />
          ) : null}

          <div>
            <KxFormFieldLabel htmlFor="krex-wrap-amount">
              Amount ({tick}
              {isLoadingBalance ? '' : ` · bal ${krexBalance.toLocaleString()}`})
            </KxFormFieldLabel>
            <div className="mt-1.5 flex gap-2">
              <input
                id="krex-wrap-amount"
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                className="k-control-input w-full"
              />
              <button
                type="button"
                className="k-control-btn shrink-0"
                onClick={() => setAmount(krexBalance > 0 ? String(krexBalance) : '')}
              >
                Max
              </button>
            </div>
          </div>

          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            You pay ~{feeKas} KAS wrap fee (tier-discounted), then send {tick} 1:1 to the vault. Wrapped KCC20
            keeps the same Hub tier benefits once the covenant id is set.
          </p>
        </>
      )}
    </DAppWidgetShell>
  );
}
