'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
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
import { KX_INFO_DASHED, KX_DASHBOARD_TAB_BTN, KX_DASHBOARD_TAB_BTN_ACTIVE, KX_PANEL } from '@/lib/hub/shellTokens';
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
      network,
      treasuryAddress: config.treasuryAddress,
    });
  }, [bridgeDApp, parsedAmount, tick, tier, krexBal, selectedToken, network, config.treasuryAddress]);

  useSyncDAppWidgetQuote(feeKas > 0 ? feeKas : null, 'migrate');
  useSyncHubQuote(hubQuote, [hubQuote]);

  const refreshHistory = useCallback(() => {
    setHistory(listKrexWrapHistory(state.address).filter((row) => !row.network || row.network === network));
  }, [state.address, network]);

  useEffect(() => {
    refreshHistory();
  }, [refreshHistory]);

  /** Keep bridge tab aligned with the connected L1 address HRP. */
  useEffect(() => {
    if (!state.address) return;
    if (/^kaspatest:/i.test(state.address)) {
      setNetwork((prev) => (prev === 'testnet-10' ? prev : 'testnet-10'));
      return;
    }
    if (/^kaspa:/i.test(state.address)) {
      setNetwork((prev) => (prev === 'mainnet' ? prev : 'mainnet'));
    }
  }, [state.address]);

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
      // Refuse cross-network balance reads (mainnet address on TN10 tab, etc.).
      if (network === 'testnet-10' && !/^kaspatest:/i.test(state.address)) {
        setTokenBalance(0);
        return;
      }
      if (network === 'mainnet' && /^kaspatest:/i.test(state.address)) {
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

  const connectedIsVault =
    Boolean(config.vaultAddress) &&
    Boolean(state.address) &&
    state.address!.replace(/:/g, '').toLowerCase() ===
      config.vaultAddress!.replace(/:/g, '').toLowerCase();

  const networkBadge =
    network === 'testnet-10' ? (
      <span className="inline-flex items-center rounded-full border border-amber-400/40 bg-amber-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-amber-800 dark:text-amber-200">
        Testnet
      </span>
    ) : (
      <span className="inline-flex items-center rounded-full border border-emerald-400/40 bg-emerald-500/15 px-2.5 py-1 text-[10px] font-black uppercase tracking-widest text-emerald-800 dark:text-emerald-200">
        Mainnet
      </span>
    );

  const migratePanelClass =
    network === 'testnet-10'
      ? 'border-amber-500/25 bg-gradient-to-br from-amber-500/[0.07] via-transparent to-yellow-500/[0.04] dark:from-amber-950/35 dark:via-zinc-900 dark:to-yellow-950/20'
      : 'border-emerald-500/25 bg-gradient-to-br from-emerald-500/[0.07] via-transparent to-teal-500/[0.04] dark:from-emerald-950/35 dark:via-zinc-900 dark:to-teal-950/20';

  const vaultPanelClass =
    network === 'testnet-10'
      ? 'border-amber-500/30 bg-gradient-to-br from-amber-500/10 via-amber-500/5 to-yellow-500/5 dark:from-amber-950/45 dark:via-amber-950/25 dark:to-yellow-950/20'
      : 'border-emerald-500/30 bg-gradient-to-br from-emerald-500/10 via-teal-500/5 to-cyan-500/5 dark:from-emerald-950/45 dark:via-teal-950/30 dark:to-cyan-950/20';

  const vaultAccentText =
    network === 'testnet-10'
      ? 'text-amber-700 dark:text-amber-300'
      : 'text-emerald-700 dark:text-emerald-300';

  const vaultGlow =
    network === 'testnet-10' ? 'bg-amber-400/10' : 'bg-emerald-400/10';

  const vaultIconWrap =
    network === 'testnet-10'
      ? 'bg-amber-500/15 text-amber-700 dark:text-amber-300'
      : 'bg-emerald-500/15 text-emerald-700 dark:text-emerald-300';

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
          // TN10 must not pay mainnet `kaspa:` treasury/rewards legs.
          ...(network === 'testnet-10' ? { rewardsBps: 0 } : {}),
        });
        const feeHash = await payHubKasPlan({
          provider: state.provider,
          senderAddress: state.address,
          plan,
        });
        updateKrexWrapStatus(wrapId, 'fee_paid', { feeTxHash: feeHash });
      }

      const depositTo = normalizeKaspaAddress(config.vaultAddress);
      const amountInSmallestUnit = Math.floor(parsedAmount * Math.pow(10, decimals));
      const inscribeJson = {
        p: 'KRC-20',
        op: 'transfer',
        tick,
        amt: amountInSmallestUnit.toString(),
        to: depositTo,
      };
      const hash = await signKrc20Transfer(
        state.provider,
        JSON.stringify(inscribeJson),
        4,
        depositTo,
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
                    href={getExplorerTxUrl(row.depositTxHash, row.network === 'testnet-10' ? 'testnet-10' : 'mainnet')}
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
    <div className="space-y-6">
      <DAppWidgetShell
        title="Migrate"
        heading="KCC20 Bridge"
        description="Move any KRC-20 into matching KCC20 1:1. One-way for now. Use Testnet to practice with test tokens."
        headerAside={networkBadge}
        className={migratePanelClass}
      >
        {networkToggle}

        <div className={KX_INFO_DASHED}>
          One-way migration. Pay a KAS bridge fee (KREX tiers discount it), then send the token to the vault
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
            {connectedIsVault ? (
              <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                You are connected as the <span className="font-semibold">deposit vault</span> (bal 0 is expected).
                Switch KasWare to your funded test wallet to migrate TKREX.
              </div>
            ) : null}

            {config.vaultAddress ? (
              <section
                className={`${KX_PANEL} relative overflow-hidden p-4 sm:p-5 ${vaultPanelClass}`}
                aria-label="Deposit vault"
              >
                <div
                  className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${vaultGlow}`}
                  aria-hidden
                />
                <div className="relative">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-xs font-black uppercase tracking-widest ${vaultAccentText}`}>
                        Deposit vault
                      </p>
                      <h3 className="mt-1 text-base font-black text-zinc-900 dark:text-zinc-100">
                        Send {tick || 'KRC-20'} here
                      </h3>
                    </div>
                    <div
                      className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${vaultIconWrap}`}
                      aria-hidden
                    >
                      <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.75}>
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"
                        />
                      </svg>
                    </div>
                  </div>

                  <div className="rounded-xl border border-zinc-200/80 bg-white/70 p-3 dark:border-zinc-700/80 dark:bg-zinc-950/40">
                    <p className="text-sm text-zinc-600 dark:text-zinc-300">
                      Pay the bridge fee first, then transfer only the selected ticker to this address.
                    </p>
                    <CopyableAddress
                      value={config.vaultAddress}
                      explorerUrl={getKaspaExplorerAddressUrl(config.vaultAddress)}
                      explorerLabel={network === 'testnet-10' ? 'View on TN10 explorer' : 'View in Explorer'}
                      truncate
                      plainActions
                      className="mt-3"
                    />
                  </div>
                </div>
              </section>
            ) : null}

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

      <DAppWidgetShell
        title="Risks"
        heading="Migration risks"
        description="Read before you migrate. This is not a fully trustless consensus bridge."
        headerAside={networkBadge}
        className={migratePanelClass}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm leading-snug text-zinc-700 dark:text-zinc-300">
          <li>This path is one-way for now. You cannot reverse back to KRC-20 from this dApp yet.</li>
          <li>
            Minting depends on Kasparex automation and KRC-20 indexers. It is not a fully trustless consensus
            bridge.
          </li>
          <li>
            Only send the selected ticker to the vault address shown above. Tokens sent elsewhere may be lost.
          </li>
          <li>
            Centralized exchanges still expect KRC-20. Keep exchange inventory unmigrated if you deposit there.
          </li>
          <li>Practice on Testnet before moving mainnet funds.</li>
        </ul>
      </DAppWidgetShell>
    </div>
  );
}
