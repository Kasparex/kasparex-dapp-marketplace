'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
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
import { useDAppWidgetSection, useNavigateDAppWidgetTab } from '@/lib/dapps/DAppWidgetTabContext';
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
  attestationHasTicket,
  buildMigrateClaimPlan,
  type MigrateAttestation,
} from '@/lib/krex/wrap/migrateV2';
import { claimButtonLabel, evaluateMigrateClaimReady } from '@/lib/krex/wrap/claimPlan';
import { submitMigrateClaim } from '@/lib/krex/wrap/claimSubmit';
import type { MigrateClaimTip } from '@/lib/krex/wrap/claimAssemble';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { getWalletProvider } from '@/lib/kaspa/wallet';
import {
  buildHubKasListingPlan,
  payHubKasPlan,
} from '@/lib/payments/hubPayRail';
import { KxBadge, type KxBadgeVariant } from '@/components/ui/KxBadge';
import { Tooltip } from '@/components/ui/Tooltip';
import { KrexWrapMigrateProgress } from '@/components/dapps/KrexWrapMigrateProgress';

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
      return 'Confirming';
    case 'pending_mint':
      return 'Pending mint';
    case 'minted':
      return 'Complete';
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
      return 'Bridge fee confirmed. Next: burn your KRC-20 to the sink.';
    case 'deposited':
      return 'Token is in the vault. Matching KCC20 mint is not live for this ticker yet.';
    case 'burned':
      return 'Burn submitted. Confirming on Kasplex, then a claim ticket is issued (usually under 2 minutes).';
    case 'awaiting_attest':
      return 'Confirming burn / waiting for claim ticket. Claim appears as soon as the ticket is ready.';
    case 'pending_mint':
      return 'Deposit is on Kaspa L1. Matching KCC20 mint is still pending.';
    case 'minted':
      return 'Done. Matching KCC20 is on Kaspa L1 as a covenant coin. Open Claim tx or kascov. KasWare will not list it like KRC-20.';
    case 'failed':
      return 'This migration did not complete. Check the note or start a new one.';
    default:
      return 'Status for this browser history row.';
  }
}

async function reportClaimToHub(burnTxHash: string, mintTxHash: string): Promise<void> {
  try {
    await fetch('/api/krex-wrap/mint-receipts?mode=claim-report', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({ burnTxHash, mintTxHash }),
    });
  } catch {
    /* Hub report is best-effort; local history still updates */
  }
}

async function observeBurnOnHub(input: {
  burnTxHash: string;
  network: Krc20BridgeNetwork;
  tick: string;
  wallet?: string | null;
  amount?: number;
}): Promise<MigrateAttestation | null> {
  try {
    const res = await fetch('/api/krex-wrap/mint-receipts?mode=observe-burn', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
      body: JSON.stringify({
        burnTxHash: input.burnTxHash,
        network: input.network,
        tick: input.tick,
        wallet: input.wallet || undefined,
        amount: input.amount,
      }),
    });
    if (!res.ok) return null;
    const json = (await res.json()) as { attestation?: MigrateAttestation };
    return json.attestation || null;
  } catch {
    return null;
  }
}

function shortTxId(txHash: string | undefined | null): string {
  const id = extractTxId(txHash || '') || String(txHash || '').trim();
  if (!id) return 'tx';
  if (id.length <= 16) return id;
  return `${id.slice(0, 8)}…${id.slice(-6)}`;
}

function ExternalTabIcon({ className = 'h-3 w-3' }: { className?: string }) {
  return (
    <svg className={className} fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden>
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        strokeWidth={2}
        d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"
      />
    </svg>
  );
}

const TX_CHIP_CLASS =
  'inline-flex items-center gap-1.5 rounded-md bg-zinc-100 px-2.5 py-1 text-[11px] font-medium text-zinc-800 ring-1 ring-zinc-200 hover:bg-zinc-200 dark:bg-zinc-800 dark:text-zinc-100 dark:ring-zinc-600 dark:hover:bg-zinc-700';

function historyBadgeLabel(row: KrexWrapRecord, attestation?: MigrateAttestation): string {
  if (row.status === 'minted' || row.mintTxHash) return 'Complete';
  const ready = evaluateMigrateClaimReady(attestation);
  if (ready.ready) return 'Ready to claim';
  if (row.status === 'burned' || row.status === 'awaiting_attest') return 'Confirming';
  return statusLabel(row.status);
}

function ClaimTicketButton({
  attestation,
  provider,
  fundingAddress,
  onClaimed,
  forceShowWaiting,
}: {
  attestation?: MigrateAttestation;
  provider?: KaspaWalletProvider | null;
  fundingAddress?: string | null;
  onClaimed?: (mintTxHash: string) => void;
  forceShowWaiting?: boolean;
}) {
  const ready = evaluateMigrateClaimReady(attestation);
  const [busy, setBusy] = useState(false);
  if (!ready.ready && !forceShowWaiting && !attestation) return null;
  const enabled = ready.ready && !busy && Boolean(provider) && Boolean(fundingAddress);
  return (
    <Tooltip content={ready.ready ? 'Sign the claim in KasWare' : ready.reason || 'Waiting…'}>
      <span className="inline-flex w-full sm:w-auto">
        <button
          type="button"
          className={`mt-0 inline-flex w-full items-center justify-center rounded-lg px-3 py-2 text-xs font-semibold transition sm:w-auto ${
            enabled
              ? 'bg-[color:var(--hub-accent)] text-white shadow-sm hover:opacity-90'
              : 'cursor-not-allowed bg-zinc-700/80 text-zinc-300 ring-1 ring-zinc-600/80'
          }`}
          disabled={!enabled}
          onClick={() => {
            void (async () => {
              const plan = ready.plan || (attestation ? buildMigrateClaimPlan(attestation) : null);
              if (!plan || !attestation || !provider || !fundingAddress) {
                hubNotify.info('Claim not ready', ready.reason || 'Waiting for ticket');
                return;
              }
              setBusy(true);
              const loadingId = hubNotify.loading(
                'Building claim…',
                'Waiting for inputs to settle, then confirm in KasWare',
              );
              try {
                const tipRes = await fetch('/api/krex-wrap/mint-receipts?mode=mint-tip', {
                  headers: { Accept: 'application/json' },
                  cache: 'no-store',
                });
                const tipJson = (await tipRes.json()) as { ok?: boolean; tip?: MigrateClaimTip };
                const tip = tipJson.tip;
                if (!tip) {
                  hubNotify.update(loadingId, {
                    variant: 'error',
                    title: 'Claim unavailable',
                    description: 'Migrate tip not loaded',
                  });
                  return;
                }
                const wallet = getWalletProvider(provider);
                const publicKeyHex =
                  typeof wallet?.getPublicKey === 'function' ? await wallet.getPublicKey() : null;
                const result = await submitMigrateClaim({
                  provider,
                  attestation,
                  tip,
                  fundingAddress,
                  publicKeyHex,
                });
                if (!result.ok || !result.txHash) {
                  const err = result.error || 'Unknown error';
                  // Stale Hub tip after a prior Claim (tip persist often needs GITHUB_TOKEN).
                  if (/Minter UTXO not found/i.test(err) || /Controller UTXO not found/i.test(err)) {
                    hubNotify.update(loadingId, {
                      variant: 'warning',
                      title: 'Migrate tip updating',
                      description:
                        'A previous Claim moved the tip. Wait a few seconds, refresh History, then Claim again.',
                    });
                    onClaimed?.('');
                    return;
                  }
                  // Only the ticket outpoint missing means this migrate was already claimed.
                  if (/Ticket UTXO .* not found/i.test(err)) {
                    hubNotify.update(loadingId, {
                      variant: 'info',
                      title: 'Already claimed?',
                      description:
                        'This ticket looks spent. Refreshing History. If Complete does not appear, open your earlier Claim toast.',
                    });
                    onClaimed?.('');
                    return;
                  }
                  hubNotify.update(loadingId, {
                    variant: 'error',
                    title: 'Claim failed',
                    description: err,
                  });
                  return;
                }
                applyMintReceiptToHistory({
                  depositTxHash: attestation.burnTxHash,
                  mintTxHash: result.txHash,
                  note: 'KCC20 claimed on Kaspa L1. Open Claim tx or kascov to see the covenant coin.',
                });
                void reportClaimToHub(attestation.burnTxHash, result.txHash);
                onClaimed?.(result.txHash);
                hubNotify.txSuccess({
                  id: loadingId,
                  title: 'KCC20 claimed',
                  txHash: result.txHash,
                  network: 'testnet-10',
                });
              } catch (err) {
                hubNotify.update(loadingId, {
                  variant: 'error',
                  title: 'Claim failed',
                  description: err instanceof Error ? err.message : String(err),
                });
              } finally {
                setBusy(false);
              }
            })();
          }}
        >
          {busy ? 'Claiming…' : claimButtonLabel(ready)}
        </button>
      </span>
    </Tooltip>
  );
}

function networkLabel(network: Krc20BridgeNetwork): string {
  return network === 'testnet-10' ? 'Testnet' : 'Mainnet';
}

/** Hash route is what kascov SPA deep-links use today. */
function kascovCovenantUrl(network: Krc20BridgeNetwork, covenantId: string): string {
  const net = network === 'testnet-10' ? 'testnet-10' : 'mainnet';
  return `https://kascov.io/#/${net}/c/${covenantId.toLowerCase()}`;
}

function kascovTxUrl(network: Krc20BridgeNetwork, txId: string): string {
  const net = network === 'testnet-10' ? 'testnet-10' : 'mainnet';
  const id = extractTxId(txId) || txId;
  return `https://kascov.io/#/${net}/tx/${id.toLowerCase()}`;
}

function WrapStatusBadge({
  status,
  label,
}: {
  status: KrexWrapStatus;
  label?: string;
}) {
  return (
    <Tooltip content={statusTooltip(status)}>
      <span className="inline-flex cursor-help">
        <KxBadge variant={statusBadgeVariant(status)} size="sm">
          {label || statusLabel(status)}
        </KxBadge>
      </span>
    </Tooltip>
  );
}

export function KrexWrapBridgeWidget() {
  const { state } = useKaspaWallet();
  const tab = useDAppWidgetSection('migrate');
  const navigateTab = useNavigateDAppWidgetTab();
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
  const [attestByBurn, setAttestByBurn] = useState<Record<string, MigrateAttestation>>({});
  const [syncNonce, setSyncNonce] = useState(0);
  const [syncing, setSyncing] = useState(false);
  const notifiedTicketReadyRef = useRef<Set<string>>(new Set());

  const mergeAttestation = useCallback((a: MigrateAttestation) => {
    const key = a.burnTxHash?.toLowerCase();
    if (!key) return;
    setAttestByBurn((prev) => {
      const existing = prev[key];
      // Never let a ticket-less poll overwrite a ticket that already landed.
      if (
        existing &&
        attestationHasTicket(existing) &&
        !attestationHasTicket(a) &&
        existing.status !== 'claimed'
      ) {
        return prev;
      }
      // Prefer claimed / ticketed rows when merging.
      if (
        existing?.status === 'claimed' &&
        existing.mintTxHash &&
        a.status !== 'claimed'
      ) {
        return prev;
      }
      return { ...prev, [key]: a };
    });
  }, []);

  const maybeNotifyTicketReady = useCallback((a: MigrateAttestation) => {
    const key = a.burnTxHash?.toLowerCase();
    if (!key || notifiedTicketReadyRef.current.has(key)) return;
    if (!evaluateMigrateClaimReady(a).ready) return;
    notifiedTicketReadyRef.current.add(key);
    hubNotify.success('Ticket ready', 'Claim KCC20 below.');
  }, []);

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

  /** Fast poll: observe burns on Kasplex + pull Hub attestations (Claim within seconds of ticket). */
  useEffect(() => {
    let cancelled = false;
    const syncReceipts = async () => {
      const pending = listKrexWrapHistory(state.address).filter(
        (row) =>
          (!row.network || row.network === network) &&
          row.depositTxHash &&
          (row.status === 'pending_mint' ||
            row.status === 'burned' ||
            row.status === 'awaiting_attest'),
      );
      if (pending.length === 0 && tab !== 'history') return;
      setSyncing(true);
      try {
        await Promise.all(
          pending.slice(0, 6).map(async (row) => {
            const burn = extractTxId(row.depositTxHash || '');
            if (!burn) return;
            const a = await observeBurnOnHub({
              burnTxHash: burn,
              network,
              tick: row.tick,
              wallet: state.address,
              amount: row.amount,
            });
            if (!a || cancelled) return;
            mergeAttestation(a);
            maybeNotifyTicketReady(a);
            if (a.status === 'attested' || a.status === 'pending') {
              updateKrexWrapStatusByBurn(a.burnTxHash, 'awaiting_attest', {
                note: evaluateMigrateClaimReady(a).ready
                  ? 'Ticket ready. Claim KCC20 below.'
                  : a.note || 'Burn seen. Waiting for claim ticket…',
              });
            }
            if (a.mintTxHash) {
              applyMintReceiptToHistory({
                depositTxHash: a.burnTxHash,
                mintTxHash: a.mintTxHash,
                note: 'KCC20 claimed on Kaspa L1.',
              });
            }
          }),
        );

        const [attestRes, mintRes] = await Promise.all([
          fetch(`/api/krex-wrap/mint-receipts?mode=attest&t=${Date.now()}`, {
            headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
            cache: 'no-store',
          }),
          fetch(`/api/krex-wrap/mint-receipts?t=${Date.now()}`, {
            headers: { Accept: 'application/json', 'Cache-Control': 'no-cache' },
            cache: 'no-store',
          }),
        ]);
        if (attestRes.ok && !cancelled) {
          const json = (await attestRes.json()) as {
            ok?: boolean;
            attestations?: MigrateAttestation[];
          };
          if (json.ok && Array.isArray(json.attestations)) {
            for (const a of json.attestations) {
              if (!a.burnTxHash) continue;
              mergeAttestation(a);
              const isPendingRow = pending.some(
                (r) =>
                  extractTxId(r.depositTxHash || '')?.toLowerCase() === a.burnTxHash.toLowerCase(),
              );
              if (!isPendingRow) continue;
              maybeNotifyTicketReady(a);
              if (a.status === 'attested' || a.status === 'pending') {
                const ready = evaluateMigrateClaimReady(a);
                updateKrexWrapStatusByBurn(a.burnTxHash, 'awaiting_attest', {
                  note: ready.ready
                    ? 'Ticket ready. Claim KCC20 below (you sign in KasWare).'
                    : a.note || 'Burn confirmed. Waiting for claim ticket…',
                });
              }
              if (a.mintTxHash) {
                applyMintReceiptToHistory({
                  depositTxHash: a.burnTxHash,
                  mintTxHash: a.mintTxHash,
                  note: 'KCC20 claimed on Kaspa L1.',
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
              applyMintReceiptToHistory({
                depositTxHash: receipt.depositTxHash,
                mintTxHash: receipt.mintTxHash,
                note: 'KCC20 minted on Kaspa L1.',
              });
            }
          }
        }
        if (!cancelled) refreshHistory();
      } catch {
        // ignore transient receipt fetch errors
      } finally {
        if (!cancelled) setSyncing(false);
      }
    };
    void syncReceipts();
    // Always poll fast while History is open or any row is waiting on Confirm/Claim.
    // Recompute pending each tick so we do not stall on a stale 15s interval.
    const id = window.setInterval(() => {
      void syncReceipts();
    }, 2_000);
    return () => {
      cancelled = true;
      window.clearInterval(id);
    };
  }, [state.address, network, refreshHistory, tab, syncNonce, maybeNotifyTicketReady, mergeAttestation]);

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
          ? `Burned ${parsedAmount} ${tick}. Opening History. Claim appears after confirmation (usually under 2 min).`
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
      if (migrateV2 && hash) {
        void observeBurnOnHub({
          burnTxHash: hash,
          network,
          tick,
          wallet: state.address,
          amount: parsedAmount,
        }).then(() => setSyncNonce((n) => n + 1));
        navigateTab('history');
        setSyncNonce((n) => n + 1);
      }
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
            ? 'Saved in this browser. After burn we confirm on Kasplex, issue a claim ticket, then you Claim. Status updates every few seconds.'
            : 'Saved in this browser. Deposits are on Kaspa L1. Mint status comes from Kasparex watcher receipts.'
        }
      >
        <div className="flex flex-wrap items-center gap-2">
          <button
            type="button"
            className="k-control-btn text-xs"
            disabled={syncing}
            onClick={() => setSyncNonce((n) => n + 1)}
          >
            {syncing ? 'Checking…' : 'Refresh status'}
          </button>
          {syncing ? (
            <span className="text-[11px] text-zinc-500">Updating from Kasplex / Hub…</span>
          ) : null}
        </div>
        <div className={KX_INFO_DASHED}>
          <p className="font-semibold text-zinc-900 dark:text-zinc-100">
            {migrateV2 ? 'Simple path' : 'How minting works'}
          </p>
          <ol className="mt-2 list-decimal space-y-1.5 pl-5 text-sm leading-snug text-zinc-700 dark:text-zinc-300">
            {migrateV2 ? (
              <>
                <li>
                  <Tooltip content="Unspendable address. Nobody can pull the tokens back.">
                    <span className="cursor-help underline decoration-dotted underline-offset-2">
                      Burn
                    </span>
                  </Tooltip>{' '}
                  KRC-20 to the sink (permanent).
                </li>
                <li>
                  Attestors confirm the burn and open a one-time{' '}
                  <Tooltip content="A one-time on-chain ticket. Spending it mints KCC20 and prevents double-claim.">
                    <span className="cursor-help underline decoration-dotted underline-offset-2">
                      claim ticket
                    </span>
                  </Tooltip>
                  .
                </li>
                <li>
                  You{' '}
                  <Tooltip content="You sign in KasWare. Kasparex does not hold a key that claims for you.">
                    <span className="cursor-help underline decoration-dotted underline-offset-2">
                      Claim KCC20
                    </span>
                  </Tooltip>{' '}
                  1:1. History flips to Complete when the claim tx lands.
                </li>
                <li>
                  Find the coin on{' '}
                  <Tooltip content="kascov is the covenant explorer. It shows smart-coin moves, not a KasWare-style balance list.">
                    <span className="cursor-help underline decoration-dotted underline-offset-2">
                      kascov
                    </span>
                  </Tooltip>
                  {' '}
                  (not in KasWare&apos;s KRC-20 list).
                </li>
              </>
            ) : (
              <>
                <li>Pay the fee and send KRC-20 to the vault.</li>
                <li>The deposit is on Kaspa L1 immediately.</li>
                <li>Kasparex mints matching KCC20 1:1 against that deposit.</li>
                <li>This list flips to Complete when the mint receipt syncs. Hover a badge for details.</li>
              </>
            )}
          </ol>
        </div>
        {history.length === 0 ? (
          <p className="text-sm text-zinc-600 dark:text-zinc-400">No migrations recorded in this browser yet.</p>
        ) : (
          <ul className="space-y-3">
            {history.map((row) => {
              const burnKey = extractTxId(row.depositTxHash || '')?.toLowerCase() || '';
              const attestation = burnKey ? attestByBurn[burnKey] : undefined;
              const claimReady = evaluateMigrateClaimReady(attestation);
              const covenantId =
                getWrapCovenantIdForTick(row.tick) || attestation?.assetCovenantId || null;
              const net = row.network === 'testnet-10' ? 'testnet-10' : 'mainnet';
              return (
                <li
                  key={row.id}
                  className="rounded-xl border border-zinc-200 p-4 space-y-3 text-sm dark:border-zinc-700"
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 space-y-1">
                      <p className="font-semibold text-zinc-900 dark:text-zinc-100">
                        {row.amount} {row.tick}
                      </p>
                      <p className="text-xs text-zinc-500 dark:text-zinc-400">
                        {row.network ? `${networkLabel(row.network)} · ` : ''}
                        Fee {row.feeKas} KAS · {new Date(row.createdAt).toLocaleString()}
                      </p>
                    </div>
                    <WrapStatusBadge status={row.status} label={historyBadgeLabel(row, attestation)} />
                  </div>

                  <div className="flex flex-wrap gap-2">
                    {row.depositTxHash ? (
                      <a
                        className={TX_CHIP_CLASS}
                        href={getExplorerTxUrl(row.depositTxHash, net)}
                        target="_blank"
                        rel="noreferrer"
                        title={extractTxId(row.depositTxHash) || undefined}
                      >
                        {row.migrateVersion === 2 ||
                        row.status === 'burned' ||
                        row.status === 'awaiting_attest' ||
                        row.status === 'minted'
                          ? 'Burn'
                          : 'Deposit'}{' '}
                        {shortTxId(row.depositTxHash)}
                        <ExternalTabIcon />
                      </a>
                    ) : null}
                    {row.mintTxHash ? (
                      <>
                        <a
                          className={TX_CHIP_CLASS}
                          href={getExplorerTxUrl(row.mintTxHash, net)}
                          target="_blank"
                          rel="noreferrer"
                          title={extractTxId(row.mintTxHash) || undefined}
                        >
                          Claim {shortTxId(row.mintTxHash)}
                          <ExternalTabIcon />
                        </a>
                        <a
                          className={TX_CHIP_CLASS}
                          href={kascovTxUrl(net, row.mintTxHash)}
                          target="_blank"
                          rel="noreferrer"
                        >
                          View on kascov
                          <ExternalTabIcon />
                        </a>
                        {covenantId ? (
                          <a
                            className={TX_CHIP_CLASS}
                            href={kascovCovenantUrl(net, covenantId)}
                            target="_blank"
                            rel="noreferrer"
                          >
                            TKREX covenant
                            <ExternalTabIcon />
                          </a>
                        ) : null}
                      </>
                    ) : null}
                  </div>

                  <KrexWrapMigrateProgress
                    row={row}
                    migrateV2={migrateV2}
                    ticketReady={claimReady.ready}
                  />

                  {migrateV2 &&
                  row.depositTxHash &&
                  !row.mintTxHash &&
                  (row.status === 'burned' || row.status === 'awaiting_attest') ? (
                    <ClaimTicketButton
                      attestation={attestation}
                      provider={state.provider}
                      fundingAddress={state.address}
                      forceShowWaiting
                      onClaimed={() => {
                        refreshHistory();
                        setSyncNonce((n) => n + 1);
                      }}
                    />
                  ) : null}

                  {row.status === 'minted' ? (
                    <p className="text-[11px] leading-snug text-zinc-500 dark:text-zinc-400">
                      KCC20 is a covenant coin (kascov). KasWare lists KAS / KRC-20 only.
                    </p>
                  ) : null}
                </li>
              );
            })}
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
            ? 'Burn KRC-20 once, then Claim matching KCC20 1:1 on Kaspa L1. One-way. KCC20 shows on kascov, not as KasWare KRC-20.'
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
                    tooltipTitle: 'TKREX on kascov',
                    tooltipDescription:
                      'Opens the TKREX asset covenant on kascov. Your balance is a covenant coin from the Claim tx, not a KasWare KRC-20 row. Look for moves on that covenant id.',
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
                Burn is permanent (sink has no key). You only get KCC20 after a confirmed burn and a spent claim ticket.
              </li>
              <li>One-way for now. No reverse path back to KRC-20.</li>
              <li>
                Burn confirmation uses indexers + a 2-of-3 attestor quorum. After handover, deploy keys cannot mint. You
                sign Claim yourself.
              </li>
              <li>
                KasWare will not show KCC20 like KRC-20. Use History Claim links and kascov to see your covenant coin.
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
