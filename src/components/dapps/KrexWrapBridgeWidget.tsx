'use client';

import { useCallback, useEffect, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { signKrc20Transfer } from '@/lib/kaspa/l1WalletActions';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { getExplorerTxUrl, getKaspaExplorerAddressUrl, extractTxId } from '@/lib/store/utils';
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
import { KX_INFO_DASHED, KX_DASHBOARD_TAB_BTN, KX_DASHBOARD_TAB_BTN_ACTIVE, KX_PANEL, KX_METADATA_STAT_VALUE_LINK } from '@/lib/hub/shellTokens';
import {
  getKrexWrapPublicConfig,
  getWrapCovenantIdForTick,
  isWrapMintLiveForTick,
} from '@/lib/krex/wrap/config';
import { fetchKrc20BalanceOnNetwork, fetchKrc20TokenInfoOnNetwork } from '@/lib/krex/wrap/networkFetch';
import { buildKrexWrapHubQuote, quoteKrexWrapFeeKas } from '@/lib/krex/wrap/fees';
import {
  listKrexWrapHistory,
  newKrexWrapId,
  upsertKrexWrapRecord,
  updateKrexWrapStatus,
  applyMintReceiptToHistory,
  updateKrexWrapStatusByBurn,
} from '@/lib/krex/wrap/history';
import type { Krc20BridgeNetwork, KrexWrapRecord, KrexWrapStatus } from '@/lib/krex/wrap/types';
import {
  buildHubKasListingPlan,
  payHubKasPlan,
} from '@/lib/payments/hubPayRail';
import { KxBadge, type KxBadgeVariant } from '@/components/ui/KxBadge';
import { Tooltip } from '@/components/ui/Tooltip';

const BRIDGE_SLUG = 'kcc20-bridge';

function statusLabel(status: KrexWrapStatus): string {
  switch (status) {
    case 'fee_paid':
      return 'Fee paid';
    case 'deposited':
      return 'Deposited';
    case 'burned':
      return 'Burned';
    case 'awaiting_attest':
      return 'Awaiting attest';
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

function statusBadgeVariant(status: KrexWrapStatus): KxBadgeVariant {
  switch (status) {
    case 'minted':
      return 'emerald';
    case 'pending_mint':
    case 'awaiting_attest':
    case 'burned':
      return 'amber';
    case 'failed':
      return 'rose';
    case 'fee_paid':
      return 'sky';
    case 'deposited':
      return 'zinc';
    default:
      return 'zinc';
  }
}

function statusTooltip(status: KrexWrapStatus): string {
  switch (status) {
    case 'fee_paid':
      return 'Bridge fee landed. Token burn to the keyless sink comes next.';
    case 'deposited':
      return 'KRC-20 is in the vault (v1). KCC20 mint is not live for this ticker yet.';
    case 'burned':
      return 'KRC-20 burned to the keyless sink. Waiting for attestor observation (opAccept).';
    case 'awaiting_attest':
      return 'Burn attested. Matching KCC20 mint/claim is in progress.';
    case 'pending_mint':
      return 'Your deposit is on Kaspa L1. Matching KCC20 mint is still pending.';
    case 'minted':
      return 'Matching KCC20 was minted on Kaspa L1. Open the Mint link for the covenant tx.';
    case 'failed':
      return 'This migration did not complete. Check the note or try again.';
    default:
      return 'Migration status for this browser history row.';
  }
}

function networkLabel(network: Krc20BridgeNetwork): string {
  return network === 'testnet-10' ? 'Testnet' : 'Mainnet';
}

/** Path form is what kascov documents; hash routes sometimes fail to load the coin page. */
function kascovCovenantUrl(network: Krc20BridgeNetwork, covenantId: string): string {
  const net = network === 'testnet-10' ? 'testnet-10' : 'mainnet';
  return `https://kascov.io/${net}/c/${covenantId.toLowerCase()}`;
}

function WrapStatusBadge({ status }: { status: KrexWrapStatus }) {
  return (
    <Tooltip content={statusTooltip(status)}>
      <span className="inline-flex cursor-help">
        <KxBadge variant={statusBadgeVariant(status)} size="sm">
          {statusLabel(status)}
        </KxBadge>
      </span>
    </Tooltip>
  );
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

  /** Poll v2 attestations + v1 mint receipts so History flips to Minted. */
  useEffect(() => {
    let cancelled = false;
    const syncReceipts = async () => {
      const rows = listKrexWrapHistory(state.address).filter(
        (row) =>
          (!row.network || row.network === network) &&
          row.depositTxHash &&
          (row.status === 'pending_mint' ||
            row.status === 'burned' ||
            row.status === 'awaiting_attest'),
      );
      if (rows.length === 0) return;
      try {
        const [attestRes, mintRes] = await Promise.all([
          fetch('/api/krex-wrap/attestations', {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          }),
          fetch('/api/krex-wrap/mint-receipts', {
            headers: { Accept: 'application/json' },
            cache: 'no-store',
          }),
        ]);
        let changed = 0;
        if (attestRes.ok && !cancelled) {
          const json = (await attestRes.json()) as {
            ok?: boolean;
            attestations?: Array<{
              burnTxHash?: string;
              mintTxHash?: string;
              status?: string;
            }>;
          };
          if (json.ok && Array.isArray(json.attestations)) {
            for (const a of json.attestations) {
              if (!a.burnTxHash) continue;
              if (a.status === 'attested' || a.status === 'pending') {
                changed += updateKrexWrapStatusByBurn(a.burnTxHash, 'awaiting_attest', {
                  note: 'Burn attested. Mint/claim in progress.',
                });
              }
              if (a.mintTxHash && (a.status === 'claimed' || a.mintTxHash)) {
                changed += applyMintReceiptToHistory({
                  depositTxHash: a.burnTxHash,
                  mintTxHash: a.mintTxHash,
                  note: 'KCC20 minted against attested burn.',
                });
              }
            }
          }
        }
        if (mintRes.ok && !cancelled) {
          const json = (await mintRes.json()) as {
            ok?: boolean;
            receipts?: Array<{ depositTxHash?: string; mintTxHash?: string }>;
          };
          if (json.ok && Array.isArray(json.receipts)) {
            for (const receipt of json.receipts) {
              if (!receipt.depositTxHash || !receipt.mintTxHash) continue;
              changed += applyMintReceiptToHistory({
                depositTxHash: receipt.depositTxHash,
                mintTxHash: receipt.mintTxHash,
                note: 'KCC20 minted on Kaspa L1.',
              });
            }
          }
        }
        if (changed > 0 && !cancelled) refreshHistory();
      } catch {
        // ignore transient receipt fetch errors
      }
    };
    void syncReceipts();
    const id = window.setInterval(() => {
      void syncReceipts();
    }, 20_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [state.address, network, refreshHistory, tab]);

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

  const migrateV2 = config.migrateV2Enabled;
  const depositTarget = migrateV2 ? config.sinkAddress : config.vaultAddress;

  const connectedIsDepositTarget =
    Boolean(depositTarget) &&
    Boolean(state.address) &&
    state.address!.replace(/:/g, '').toLowerCase() ===
      depositTarget!.replace(/:/g, '').toLowerCase();

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
    if (!config.ready || !depositTarget || !config.treasuryAddress) {
      hubNotify.error('Bridge unavailable', 'This network is not open for migrations yet.');
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
    const loadingId = hubNotify.loading(
      migrateV2 ? 'Burning to sink…' : 'Migrating…',
      migrateV2 ? 'Confirm fee and burn in your wallet' : 'Confirm fee and deposit in your wallet',
    );

    const wrapId = newKrexWrapId();
    upsertKrexWrapRecord({
      id: wrapId,
      wallet: state.address,
      tick,
      network,
      amount: parsedAmount,
      feeKas,
      status: 'draft',
      migrateVersion: migrateV2 ? 2 : 1,
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

      const depositTo = normalizeKaspaAddress(depositTarget);
      const amountInSmallestUnit = Math.floor(parsedAmount * Math.pow(10, decimals));
      const inscribeJson = {
        p: 'KRC-20',
        op: 'transfer',
        tick,
        amt: amountInSmallestUnit.toString(),
        to: depositTo,
      };
      const rawHash = await signKrc20Transfer(
        state.provider,
        JSON.stringify(inscribeJson),
        4,
        depositTo,
        0.001,
      );
      const hash = extractTxId(rawHash) || (typeof rawHash === 'string' ? rawHash : '');
      const nextStatus = migrateV2
        ? mintLive
          ? 'burned'
          : 'burned'
        : mintLive
          ? 'pending_mint'
          : 'deposited';
      updateKrexWrapStatus(wrapId, nextStatus, {
        depositTxHash: hash,
        migrateVersion: migrateV2 ? 2 : 1,
        note: migrateV2
          ? mintLive
            ? 'Burned to keyless sink. Waiting for attestor (opAccept), then covenant mint.'
            : 'Burned to keyless sink. KCC20 mint follows when this ticker covenant is live.'
          : mintLive
            ? 'Deposit on-chain. Waiting for Kasparex to mint matching KCC20 1:1.'
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
            mode: migrateV2 ? 'sink' : 'vault',
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

      const successMsg = migrateV2
        ? mintLive
          ? `Burned ${parsedAmount} ${tick} to the keyless sink. Attestor + mint come next; History flips when claimed.`
          : `Burned ${parsedAmount} ${tick} to the keyless sink on ${networkLabel(network)}.`
        : mintLive
          ? `Deposited ${parsedAmount} ${tick}. Kasparex mints matching KCC20 next; History flips when the receipt lands.`
          : `Locked ${parsedAmount} ${tick} in the vault on ${networkLabel(network)}.`;
      setSuccess(successMsg);
      hubNotify.txSuccess({
        id: loadingId,
        title: migrateV2 ? 'Burn submitted' : 'Deposit submitted',
        description: successMsg,
        txHash: hash,
        network,
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
          ? migrateV2
            ? 'Burning…'
            : 'Migrating…'
          : selectedToken
            ? migrateV2
              ? `Burn ${tick} → claim KCC20`
              : `Migrate ${tick} → KCC20`
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
    migrateV2,
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
        description={
          migrateV2
            ? 'Saved in this browser. Burns are on Kaspa L1. Status comes from attestor tickets and mint receipts.'
            : 'Saved in this browser. Deposits are on Kaspa L1. Mint status comes from Kasparex watcher receipts.'
        }
      >
        <div className={KX_INFO_DASHED}>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {migrateV2 ? 'How keyless migrate works' : 'How minting works'}
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-snug text-zinc-700 dark:text-zinc-300">
            {migrateV2 ? (
              <>
                <li>Pay the fee and burn KRC-20 to the keyless sink (no spend key).</li>
                <li>Attestors observe an accepted burn (opAccept), not a prediction.</li>
                <li>Matching KCC20 is minted 1:1 against that burn ticket.</li>
                <li>This list flips to Minted when the claim lands. Hover a badge for details.</li>
              </>
            ) : (
              <>
                <li>Pay the fee and send KRC-20 to the vault.</li>
                <li>The deposit is on Kaspa L1 immediately.</li>
                <li>Kasparex mints matching KCC20 1:1 against that deposit.</li>
                <li>This list flips to Minted when the mint receipt syncs. Hover a badge for details.</li>
              </>
            )}
          </ol>
        </div>
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
                  <WrapStatusBadge status={row.status} />
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
                    {row.migrateVersion === 2 || row.status === 'burned' || row.status === 'awaiting_attest'
                      ? 'Burn'
                      : 'Deposit'}{' '}
                    {extractTxId(row.depositTxHash) || 'tx'}
                  </a>
                ) : null}
                {row.mintTxHash ? (
                  <a
                    className="block break-all text-xs text-[color:var(--hub-accent)] underline"
                    href={getExplorerTxUrl(row.mintTxHash, row.network === 'testnet-10' ? 'testnet-10' : 'mainnet')}
                    target="_blank"
                    rel="noreferrer"
                  >
                    Mint {extractTxId(row.mintTxHash) || 'tx'}
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
        description={
          migrateV2
            ? 'Burn KRC-20 to a keyless sink, then receive matching KCC20 1:1 against that burn. One-way by construction.'
            : 'Lock KRC-20 in the vault, then receive matching KCC20 1:1. Deposit is on-chain right away; Kasparex completes the mint.'
        }
        headerAside={networkBadge}
        className={migratePanelClass}
      >
        {networkToggle}

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
            ...(mintLive && getWrapCovenantIdForTick(tick)
              ? [
                  {
                    label: 'KCC20 on kascov',
                    value: getWrapCovenantIdForTick(tick)!,
                    valueNode: (
                      <a
                        href={kascovCovenantUrl(network, getWrapCovenantIdForTick(tick)!)}
                        target="_blank"
                        rel="noreferrer"
                        className={KX_METADATA_STAT_VALUE_LINK}
                      >
                        Open {tick} covenant
                      </a>
                    ),
                    tooltipTitle: 'Covenant explorer',
                    tooltipDescription:
                      'TN10 TKREX asset covenant on kascov (rapid-indigo-yak). Use this path URL. Ticker/logo need genesis payload JSON; this birth did not include that.',
                    copyable: true,
                    mono: true,
                  },
                ]
              : []),
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
            {connectedIsDepositTarget ? (
              <div className="rounded-xl border border-amber-300/50 bg-amber-50 p-3 text-sm text-amber-950 dark:border-amber-700 dark:bg-amber-950/40 dark:text-amber-100">
                You are connected as the{' '}
                <span className="font-semibold">{migrateV2 ? 'burn sink' : 'deposit vault'}</span>
                {migrateV2 ? ' (unspendable; wrong wallet).' : ' (bal 0 is expected).'} Switch KasWare to
                your funded test wallet to migrate {tick || 'tokens'}.
              </div>
            ) : null}

            {depositTarget ? (
              <section
                className={`${KX_PANEL} relative overflow-hidden p-4 sm:p-5 ${vaultPanelClass}`}
                aria-label={migrateV2 ? 'Keyless burn sink' : 'Deposit vault'}
              >
                <div
                  className={`pointer-events-none absolute -right-6 -top-6 h-24 w-24 rounded-full blur-2xl ${vaultGlow}`}
                  aria-hidden
                />
                <div className="relative">
                  <div className="mb-4 flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className={`text-xs font-black uppercase tracking-widest ${vaultAccentText}`}>
                        {migrateV2 ? 'Keyless burn sink' : 'Deposit vault'}
                      </p>
                      <h3 className="mt-1 text-base font-black text-zinc-900 dark:text-zinc-100">
                        {migrateV2
                          ? `Burn ${tick || 'KRC-20'} here`
                          : `Send ${tick || 'KRC-20'} here`}
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
                      {migrateV2
                        ? 'Pay the bridge fee first, then transfer only the selected ticker to this unspendable sink. No key can recover it.'
                        : 'Pay the bridge fee first, then transfer only the selected ticker to this address.'}
                    </p>
                    <CopyableAddress
                      value={depositTarget}
                      explorerUrl={getKaspaExplorerAddressUrl(depositTarget)}
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
        description="Read before you migrate. Short version of how this bridge actually works."
        headerAside={networkBadge}
        className={migratePanelClass}
      >
        <ul className="list-disc space-y-2 pl-5 text-sm leading-snug text-zinc-700 dark:text-zinc-300">
          {migrateV2 ? (
            <>
              <li>
                Burn is permanent: the sink has no private key. Matching KCC20 is minted 1:1 only against an accepted
                burn observation.
              </li>
              <li>
                One-way by construction. No reverse path. Circulating KCC20 cannot exceed burned KRC-20 for that tick.
              </li>
              <li>
                KRC-20 burns still need indexers + attestors (opAccept). After covenant handover, deploy keys cannot
                mint. TN10 may still use a 1-of-1 attestor while the mechanism soaks.
              </li>
              <li>Only send the selected ticker to the sink address shown above. Tokens sent elsewhere may be lost.</li>
              <li>Centralized exchanges still expect KRC-20. Keep exchange inventory unmigrated if you deposit there.</li>
              <li>Practice on Testnet before moving mainnet funds.</li>
            </>
          ) : (
            <>
              <li>
                Deposit is on Kaspa L1 immediately. Matching KCC20 is minted 1:1 by Kasparex after the vault receives the
                token. Hub shows status from those mint receipts.
              </li>
              <li>No extra free supply: minted KCC20 is backed by vault-held KRC-20. One-way for now (no reverse yet).</li>
              <li>
                This is an operator mint path, not a fully trustless consensus bridge. Minting depends on Kasparex and
                KRC-20 indexers.
              </li>
              <li>Only send the selected ticker to the vault address shown above. Tokens sent elsewhere may be lost.</li>
              <li>Centralized exchanges still expect KRC-20. Keep exchange inventory unmigrated if you deposit there.</li>
              <li>Practice on Testnet before moving mainnet funds.</li>
            </>
          )}
        </ul>
      </DAppWidgetShell>
    </div>
  );
}
