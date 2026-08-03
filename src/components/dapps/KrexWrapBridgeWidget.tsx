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
import { useDAppWidgetSection } from '@/lib/dapps/DAppWidgetTabContext';
import { Krc20TickerSearchField } from '@/components/tokens/Krc20TickerSearchField';
import type { Krc20TokenInfo } from '@/lib/tokens/krc20Lookup';
import { HubMetadataStatGrid } from '@/components/hub/HubMetadataStatGrid';
import { KX_INFO_DASHED, KX_DASHBOARD_TAB_BTN, KX_DASHBOARD_TAB_BTN_ACTIVE } from '@/lib/hub/shellTokens';
import {
  getKrexWrapPublicConfig,
  isWrapMintLiveForTick,
} from '@/lib/krex/wrap/config';
import { fetchKrc20BalanceOnNetwork, fetchKrc20TokenInfoOnNetwork } from '@/lib/krex/wrap/networkFetch';
import { buildKrexWrapHubQuote, quoteKrexWrapFeeKas } from '@/lib/krex/wrap/fees';
import {
  listKrexWrapHistory,
  newKrexWrapId,
  upsertKrexWrapRecord,
  updateKrexWrapStatus,
} from '@/lib/krex/wrap/history';
import type { Krc20BridgeNetwork, KrexWrapRecord } from '@/lib/krex/wrap/types';
import {
  buildHubKasListingPlan,
  payHubKasPlan,
} from '@/lib/payments/hubPayRail';

const BRIDGE_SLUG = 'kcc20-bridge';

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

function networkLabel(network: Krc20BridgeNetwork): string {
  return network === 'testnet-10' ? 'Testnet' : 'Mainnet';
}

export function KrexWrapBridgeWidget() {
  const { state } = useKaspaWallet();
  const tab = useDAppWidgetSection('migrate');
  const { tier, balance: krexBal, refetch } = useKREXBalance();
  const bridgeDApp = placeholderDApps.find((d) => d.slug === BRIDGE_SLUG);
  const [network, setNetwork] = useState<Krc20BridgeNetwork>('mainnet');
  const config = useMemo(() => getKrexWrapPublicConfig(network), [network]);

  const [tickInput, setTickInput] = useState(config.defaultTick);
  const [selectedToken, setSelectedToken] = useState<Krc20TokenInfo | null>(null);
  const [amount, setAmount] = useState('');
  const [tokenBalance, setTokenBalance] = useState(0);
  const [isLoadingBalance, setIsLoadingBalance] = useState(false);
  const [isWorking, setIsWorking] = useState(false);
  const [success, setSuccess] = useState<string | null>(null);
  const [history, setHistory] = useState<KrexWrapRecord[]>([]);

  const tick = (selectedToken?.ticker || tickInput || config.defaultTick).trim().toUpperCase();
  const decimals =
    selectedToken?.decimals != null && Number.isFinite(selectedToken.decimals)
      ? Number(selectedToken.decimals)
      : config.decimals;
  const mintLive = isWrapMintLiveForTick(tick, network);

  const parsedAmount = amount && !Number.isNaN(parseFloat(amount)) ? parseFloat(amount) : null;
  const feeKas = quoteKrexWrapFeeKas(tier);

  const hubQuote = useMemo(() => {
    if (!bridgeDApp || parsedAmount == null || parsedAmount <= 0 || !selectedToken) return null;
    return buildKrexWrapHubQuote({
      dapp: bridgeDApp,
      amount: parsedAmount,
      tick,
      tier,
      krexBalance: krexBal ?? 0,
    });
  }, [bridgeDApp, parsedAmount, tick, tier, krexBal, selectedToken]);

  useSyncDAppWidgetQuote(
    feeKas > 0 && selectedToken && parsedAmount && parsedAmount > 0 ? feeKas : null,
    'migrate',
  );
  useSyncHubQuote(hubQuote, [hubQuote]);

  const refreshHistory = useCallback(() => {
    setHistory(listKrexWrapHistory(state.address));
  }, [state.address]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  useEffect(() => {
    setSelectedToken(null);
    setAmount('');
    setTokenBalance(0);
    setTickInput(config.defaultTick);
  }, [network, config.defaultTick]);

  useEffect(() => {
    let cancelled = false;
    const boot = async () => {
      try {
        const info = await fetchKrc20TokenInfoOnNetwork(config.defaultTick, network);
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
  }, [config.defaultTick, network]);

  useEffect(() => {
    let cancelled = false;
    const run = async () => {
      if (!selectedToken || !state.address) {
        setTokenBalance(0);
        return;
      }
      setIsLoadingBalance(true);
      try {
        const bal = await fetchKrc20BalanceOnNetwork(state.address, selectedToken.ticker, network);
        if (!cancelled) setTokenBalance(bal);
      } catch {
        if (!cancelled) setTokenBalance(0);
      } finally {
        if (!cancelled) setIsLoadingBalance(false);
      }
    };
    void run();
    return () => {
      cancelled = true;
    };
  }, [selectedToken, state.address, network]);

  // Network-aware balance is loaded above; ticker search uses `network` prop.

  const handleMigrate = async () => {
    if (!state.isConnected || !state.provider || !state.address) {
      hubNotify.error('Wallet required', 'Connect a Kaspa wallet first');
      return;
    }
    if (state.provider !== 'kasware' && state.provider !== 'kastle' && state.provider !== 'kaspire') {
      hubNotify.warning('Wallet unsupported', 'Bridge requires KasWare, Kastle, or Kaspire');
      return;
    }
    if (network === 'testnet-10' && !/^kaspatest:/i.test(state.address)) {
      hubNotify.warning('Switch wallet network', 'Use a Testnet-10 (kaspatest:) address for Testnet mode');
      return;
    }
    if (network === 'mainnet' && /^kaspatest:/i.test(state.address)) {
      hubNotify.warning('Switch wallet network', 'Use a mainnet (kaspa:) address for Mainnet mode');
      return;
    }
    if (!config.ready || !config.vaultAddress || !config.treasuryAddress) {
      hubNotify.error('Bridge unavailable', 'This network is not open for deposits yet.');
      return;
    }
    if (!selectedToken) {
      hubNotify.warning('Select a token', 'Look up and select a KRC-20 ticker first');
      return;
    }
    if (!parsedAmount || parsedAmount <= 0) {
      hubNotify.warning('Invalid amount', 'Enter a valid amount');
      return;
    }
    if (parsedAmount < config.minWrapAmount) {
      hubNotify.warning('Below minimum', `Minimum is ${config.minWrapAmount} ${tick}`);
      return;
    }
    if (parsedAmount > tokenBalance) {
      hubNotify.error('Insufficient balance', `Not enough ${tick} for this migration`);
      return;
    }

    setIsWorking(true);
    setSuccess(null);
    const loadingId = hubNotify.loading('Migrating…', 'Confirm fee and deposit in your wallet');

    const wrapId = newKrexWrapId();
    upsertKrexWrapRecord({
      id: wrapId,
      wallet: state.address,
      tick,
      network,
      amount: parsedAmount,
      feeKas,
      status: 'draft',
    });

    try {
      if (feeKas > 0) {
        const plan = buildHubKasListingPlan({
          feeKas,
          treasuryAddress: config.treasuryAddress,
          note: `kcc20-bridge:${network}:${tick}:${wrapId}`,
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
          ? 'Deposit submitted. Waiting for KCC20 mint.'
          : 'Deposit submitted. KCC20 mint follows when this ticker is live.',
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
            network,
          }),
        });
      } catch {
        // soft verify; indexer may lag
      }

      if (bridgeDApp) {
        awardDAppHubPoints({
          walletRaw: state.address,
          dapp: bridgeDApp,
          actionId: 'migrate',
          txHash: hash,
          krexTier: tier,
          krexBalance: krexBal ?? 0,
          baseSpendKas: feeKas,
        });
      }

      const successMsg = mintLive
        ? `Migrated ${parsedAmount} ${tick}. Matching KCC20 should arrive shortly.`
        : `Locked ${parsedAmount} ${tick} in the vault on ${networkLabel(network)}.`;
      setSuccess(successMsg);
      hubNotify.txSuccess({
        id: loadingId,
        title: 'Migration submitted',
        description: successMsg,
        txHash: hash,
      });
      setAmount('');
      refreshHistory();
      void refetch();
      if (state.address && selectedToken) {
        setTokenBalance(await fetchKrc20BalanceOnNetwork(state.address, selectedToken.ticker, network));
      }
    } catch (err) {
      updateKrexWrapStatus(wrapId, 'failed', {
        note: err instanceof Error ? err.message : 'Migration failed',
      });
      let msg = 'Migration failed';
      if (err instanceof Error) {
        msg = err.message || msg;
        if (msg.includes('rejected')) msg = 'Transaction was rejected';
      }
      hubNotify.update(loadingId, {
        title: 'Migration failed',
        description: msg,
        variant: 'error',
      });
      refreshHistory();
    } finally {
      setIsWorking(false);
    }
  };

  const railActions =
    tab === 'migrate' && state.isConnected ? (
      <button
        type="button"
        onClick={() => void handleMigrate()}
        disabled={isWorking || !selectedToken || !parsedAmount || parsedAmount <= 0 || !config.ready}
        className="w-full k-control-btn !border-[color:var(--hub-accent)] !bg-[color:var(--hub-accent)] !text-white hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
      >
        {isWorking
          ? 'Migrating…'
          : selectedToken
            ? `Migrate ${tick} → KCC20`
            : 'Select a token'}
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
    network,
  ]);
  useRegisterHubFlowProgress('hubPay', { busy: isWorking, complete: Boolean(success) }, [
    isWorking,
    success,
  ]);

  const networkToggle = (
    <div className="flex flex-wrap gap-2">
      {(['mainnet', 'testnet-10'] as const).map((net) => (
        <button
          key={net}
          type="button"
          onClick={() => setNetwork(net)}
          className={`${KX_DASHBOARD_TAB_BTN} ${network === net ? KX_DASHBOARD_TAB_BTN_ACTIVE : ''}`}
        >
          {networkLabel(net)}
        </button>
      ))}
    </div>
  );

  if (tab === 'history') {
    return (
      <DAppWidgetShell
        title="History"
        heading="Your migrations"
        description="Local history for this browser. Deposits are on Kaspa L1."
      >
        {history.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No migrations recorded in this browser yet.</p>
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
                  {row.network ? `${networkLabel(row.network)} · ` : ''}
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

  if (tab === 'reverse') {
    return (
      <DAppWidgetShell
        title="Reverse"
        heading="KCC20 → KRC-20"
        description="Moving back to KRC-20 needs a release path. Not available in this release."
      >
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 text-sm text-amber-900 dark:border-amber-800 dark:bg-amber-950/40 dark:text-amber-100">
          Reverse migration is not available yet. Use Migrate for one-way KRC-20 → KCC20.
        </div>
      </DAppWidgetShell>
    );
  }

  return (
    <DAppWidgetShell
      title="Migrate"
      heading="KCC20 Bridge"
      description="Move any KRC-20 into matching KCC20 1:1. One-way for now. Use Testnet to practice with test tokens."
    >
      {networkToggle}

      <div className={KX_INFO_DASHED}>
        One-way migration. Pay a small KAS fee (KREX tiers discount it), then send the token to the vault
        shown below. Exchange deposits still use KRC-20.
      </div>

      {!config.ready ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4 text-sm text-zinc-600 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-400">
          {network === 'testnet-10'
            ? 'Testnet deposits are not open yet. You can still look up TN10 tokens and switch back to Mainnet when ready.'
            : 'Mainnet deposits are not open yet. Check back soon, or try Testnet when it is available.'}
        </div>
      ) : null}

      <HubMetadataStatGrid
        stats={[
          {
            label: 'Network',
            value: networkLabel(network),
            tooltipTitle: 'Network',
            tooltipDescription:
              network === 'testnet-10'
                ? 'Kaspa Testnet-10. Switch your wallet to testnet and use kaspatest: addresses.'
                : 'Kaspa Mainnet. Use a mainnet kaspa: address.',
            copyable: false,
          },
          {
            label: 'Bridge fee',
            value: `${feeKas} KAS`,
            tooltipTitle: 'Bridge fee',
            tooltipDescription: 'KAS fee paid to Hub treasury before the token deposit. Discounted by your KREX tier.',
            copyable: false,
          },
        ]}
      />

      {!state.isConnected ? (
        <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-6 text-center dark:border-zinc-700 dark:bg-zinc-950">
          <p className="text-sm text-zinc-600 dark:text-zinc-400">
            Connect KasWare, Kastle, or Kaspire from the site header to migrate a KRC-20.
          </p>
        </div>
      ) : (
        <>
          <Krc20TickerSearchField
            value={tickInput}
            network={network}
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
              label="Deposit vault"
              value={config.vaultAddress}
              explorerUrl={getKaspaExplorerAddressUrl(config.vaultAddress)}
              truncate
            />
          ) : null}

          <div>
            <KxFormFieldLabel htmlFor="kcc20-bridge-amount">
              Amount
              {selectedToken
                ? ` (${tick}${isLoadingBalance ? '' : ` · bal ${tokenBalance.toLocaleString()}`})`
                : ''}
            </KxFormFieldLabel>
            <div className="mt-1.5 flex gap-2">
              <input
                id="kcc20-bridge-amount"
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
