'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { getExplorerTxUrl, getKaspaExplorerAddressUrl } from '@/lib/store/utils';
import { CopyableAddress } from '@/components/donations/CopyableAddress';
import { hubNotify } from '@/lib/hub/notify';
import { DAppWidgetShell } from '@/components/dapps/DAppWidgetShell';
import { useRegisterDAppWidgetRailSlot } from '@/lib/dapps/DAppWidgetActionRailContext';
import { useRegisterHubFlowProgress } from '@/hooks/useRegisterHubFlowProgress';
import { useSyncDAppWidgetQuote, useSyncHubQuote } from '@/lib/dapps/PaymentAmountContext';
import { placeholderDApps } from '@/lib/dapps';
import { awardDAppHubPoints } from '@/lib/rewards/awardDAppHubPoints';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { useKaspaTokenBalance } from '@/hooks/useKaspaTokenBalance';
import { useDAppWidgetSection } from '@/lib/dapps/DAppWidgetTabContext';
import { Krc20TickerSearchField } from '@/components/tokens/Krc20TickerSearchField';
import type { Krc20TokenInfo } from '@/lib/tokens/krc20Lookup';
import { fetchKrc20TokenInfo } from '@/lib/tokens/krc20Lookup';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';
import { KX_INFO_DASHED } from '@/lib/hub/shellTokens';
import {
  getKrexWrapPublicConfig,
  isWrapMintLiveForTick,
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
  const { tier, balance: krexBal, refetch } = useKREXBalance();
  const wrapDApp = placeholderDApps.find((d) => d.slug === 'krex-wrap-bridge');
  const config = useMemo(() => getKrexWrapPublicConfig(), []);

  const [tickInput, setTickInput] = useState(config.defaultTick);
  const [selectedToken, setSelectedToken] = useState<Krc20TokenInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [isWorking, setIsWorking] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<KrexWrapRecord[]>([]);

  const tick = (selectedToken?.ticker || tickInput || config.defaultTick).trim().toUpperCase();
  const decimals =
    selectedToken?.decimals != null && Number.isFinite(selectedToken.decimals)
      ? Number(selectedToken.decimals)
      : config.decimals;
  const mintLive = isWrapMintLiveForTick(tick);
  const {
    balance: tokenBalance,
    isLoading: isLoadingBalance,
    refetch: refetchTokenBalance,
  } = useKaspaTokenBalance(selectedToken ? tick : null);

  const parsedAmount = amount && !Number.isNaN(parseFloat(amount)) ? parseFloat(amount) : null;
  const feeKas = quoteKrexWrapFeeKas(tier);

  const hubQuote = useMemo(() => {
    if (!wrapDApp || parsedAmount == null || parsedAmount <= 0 || !selectedToken) return null;
    return buildKrexWrapHubQuote({
      dapp: wrapDApp,
      amount: parsedAmount,
      tick,
      tier,
      krexBalance: krexBal ?? 0,
    });
  }, [wrapDApp, parsedAmount, tick, tier, krexBal, selectedToken]);

  useSyncDAppWidgetQuote(
    feeKas > 0 && selectedToken && parsedAmount && parsedAmount > 0 ? feeKas : null,
    'wrap',
  );
  useSyncHubQuote(hubQuote, [hubQuote]);

  const refreshHistory = useCallback(() => {
    setHistory(listKrexWrapHistory(state.address));
  }, [state.address]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const info = await fetchKrc20TokenInfo(config.defaultTick);
        if (!cancelled && info) {
          setSelectedToken(info);
          setTickInput(info.ticker);
        }
      } catch {
        /* ignore */
      }
    };
    void boot();
    return () => {
      cancelled = true;
    };
  }, [config.defaultTick]);

  const handleWrap = async () => {
    if (!state.isConnected || !state.provider || !state.address) {
      hubNotify.error('Wallet required', 'Connect a Kaspa wallet first');
      return;
    }
    if (state.provider !== 'kasware' && state.provider !== 'kastle' && state.provider !== 'kaspire') {
      hubNotify.warning('Wallet unsupported', 'Wrap requires KasWare, Kastle, or Kaspire');
      return;
    }
    if (!config.ready || !config.vaultAddress || !config.treasuryAddress) {
      hubNotify.error(
        'Wrap not configured',
        'Wrap vault or treasury is not configured yet.',
      );
      return;
    }
    if (!selectedToken) {
      hubNotify.warning('Select a token', 'Look up and select a KRC-20 ticker first');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      hubNotify.warning('Invalid amount', 'Enter a valid wrap amount');
      return;
    }
    if (parsedAmount < config.minWrapAmount) {
      hubNotify.warning('Below minimum', `Minimum wrap is ${config.minWrapAmount} ${tick}`);
      return;
    }
    if (parsedAmount > tokenBalance) {
      hubNotify.error('Insufficient balance', `Not enough ${tick} for this wrap`);
      return;
    }

    setIsWorking(true);
    setSuccess(null);
    const loadingId = hubNotify.loading('Wrapping…', 'Confirm fee and deposit in your wallet');

    const wrapId = newKrexWrapId();
    upsertKrexWrapRecord({
      id: wrapId,
      wallet: state.address,
      tick,
      amount: parsedAmount,
      feeKas,
      status: 'draft',
    });

    try {
      if (feeKas > 0) {
        const plan = buildHubKasListingPlan({
          feeKas,
          treasuryAddress: config.treasuryAddress,
          note: `krc20-wrap:${tick}:${wrapId}`,
        });
        const feeHash = await payHubKasPlan({
          provider: state.provider,
          senderAddress: state.address,
          plan,
        });
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
      updateKrexWrapStatus(wrapId, mintLive ? 'pending_mint' : 'deposited', {
        depositTxHash: hash,
        note: mintLive
          ? 'Deposit submitted. Waiting for KCC20 mint watcher.'
          : 'Deposit submitted. KCC20 mint goes live when a covenant is configured for this tick.',
      });

      try {
        await fetch('/api/krex-wrap/verify', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            depositTxHash: hash,
            wallet: state.address,
            tick,
            amount: parsedAmount,
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

      const successMsg = mintLive
        ? `Wrapped ${parsedAmount} ${tick}. Mint should arrive as KCC20 shortly.`
        : `Locked ${parsedAmount} ${tick} in the wrap vault. KCC20 mint activates when this tick's covenant is live.`;
      setSuccess(successMsg);
      hubNotify.txSuccess({
        id: loadingId,
        title: 'Wrap submitted',
        description: successMsg,
        txHash: hash,
      });
      setAmount('');
      refreshHistory();
      void refetch();
      void refetchTokenBalance();
    } catch (err) {
      updateKrexWrapStatus(wrapId, 'failed', {
        note: err instanceof Error ? err.message : 'Wrap failed',
      });
      let msg = 'Wrap failed';
      if (err instanceof Error) {
        msg = err.message || msg;
        if (msg.includes('rejected')) msg = 'Transaction was rejected';
      }
      hubNotify.update(loadingId, {
        title: 'Wrap failed',
        description: msg,
        variant: 'error',
      });
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
        disabled={isWorking || !selectedToken || !parsedAmount || parsedAmount <= 0 || !config.ready}
        className="w-full k-control-btn !border-[color:var(--hub-accent)] !bg-[color:var(--hub-accent)] !text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isWorking ? 'Wrapping…' : selectedToken ? `Wrap ${tick} → KCC20` : 'Select a token'}
      </button>
    ) : null;

  useRegisterDAppWidgetRailSlot('actions', railActions, [
    tab,
    state.isConnected,
    isWorking,
    amount,
    tick,
    selectedToken,
    config.ready,
  ]);
  useRegisterHubFlowProgress('hubPay', { busy: isWorking, complete: Boolean(success) }, [
    isWorking,
    success,
  ]);

  if (tab === 'history') {
    return (
      <DAppWidgetShell
        title="History"
        heading="Your wraps"
        description="Local wrap history for this browser. Deposits are on Kaspa L1; mint status updates when the watcher is live."
      >
        {history.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No wraps recorded in this browser yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((row) => (
              <li
                key={row.id}
                className="rounded-xl border border-zinc-200 p-4 space-y-2 text-sm dark:border-zinc-700"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {row.amount} {row.tick}
                  </span>
                  <span className="text-xs text-zinc-500">{statusLabel(row.status)}</span>
                </div>
                <div className="text-xs text-zinc-500">
                  Fee {row.feeKas} KAS · {new Date(row.createdAt).toLocaleString()}
                </div>
                {row.depositTxHash ? (
                  <a
                    className="break-all text-xs text-[color:var(--hub-accent)] underline"
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
        description="Two-way release needs a vault that can send KRC-20 back. Disabled until release signing is production-ready."
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          {config.unwrapEnabled
            ? 'Unwrap is flagged on in env. Wire the release watcher before enabling this UI for users.'
            : 'Unwrap is not enabled yet. Use the Wrap tab for one-way KRC-20 → KCC20.'}
        </div>
      </DAppWidgetShell>
    );
  }

  return (
    <DAppWidgetShell
      title="Wrap"
      heading="KRC20 Wrap Bridge"
      description="Lock any KRC-20 in the Hub vault and receive matching KCC20 1:1 when mint is live for that ticker. One-way for now."
    >
      <div className={KX_INFO_DASHED}>
        One-way wrap only. Pay a small KAS fee (KREX tiers discount it), then send the token to the vault shown
        below. CEX deposits still use KRC-20.
      </div>

      {!config.ready ? (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Vault not configured. Set <code className="font-mono text-xs">NEXT_PUBLIC_KREX_WRAP_VAULT</code> and a
          treasury address, then redeploy.
        </div>
      ) : null}

      <HubMetadataStatGrid
        stats={[
          {
            label: 'Mint',
            value: !selectedToken
              ? 'Select a token'
              : mintLive
                ? 'Live for this tick'
                : 'Deposit OK · mint pending',
            hint: selectedToken
              ? mintLive
                ? `KCC20 covenant configured for ${tick}`
                : `Add ${tick} to NEXT_PUBLIC_KRC20_WRAP_COVENANTS when ready`
              : 'Look up a KRC-20 ticker first',
            copyable: false,
          },
          {
            label: 'Wrap fee',
            value: `${feeKas} KAS`,
            hint: 'Base fee after your KREX tier discount',
            copyable: false,
          },
        ]}
      />

      {!state.isConnected ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Connect KasWare, Kastle, or Kaspire from the site header to wrap a KRC-20.
          </p>
        </div>
      ) : (
        <>
          <Krc20TickerSearchField
            value={tickInput}
            onChange={(next) => {
              setTickInput(next);
              setSelectedToken(null);
              setAmount('');
            }}
            onSelect={(info) => {
              setSelectedToken(info);
              if (info) setTickInput(info.ticker);
            }}
            selected={selectedToken}
            disabled={isWorking}
          />

          {config.vaultAddress ? (
            <CopyableAddress
              label="Wrap vault"
              value={config.vaultAddress}
              explorerUrl={getKaspaExplorerAddressUrl(config.vaultAddress)}
              truncate
            />
          ) : null}

          <div>
            <KxFormFieldLabel htmlFor="krc20-wrap-amount">
              Amount
              {selectedToken
                ? ` (${tick}${isLoadingBalance ? '' : ` · bal ${tokenBalance.toLocaleString()}`})`
                : ''}
            </KxFormFieldLabel>
            <div className="mt-1.5 flex gap-2">
              <input
                id="krc20-wrap-amount"
                type="number"
                min={0}
                step="any"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                placeholder="0.0"
                disabled={!selectedToken || isWorking}
                className="k-control-input w-full"
              />
              <button
                type="button"
                className="k-control-btn shrink-0"
                disabled={!selectedToken || isWorking || tokenBalance <= 0}
                onClick={() => setAmount(tokenBalance > 0 ? String(tokenBalance) : '')}
              >
                Max
              </button>
            </div>
          </div>
        </>
      )}
    </DAppWidgetShell>
  );
}
