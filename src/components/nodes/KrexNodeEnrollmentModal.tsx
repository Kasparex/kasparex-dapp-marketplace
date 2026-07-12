'use client';

import { createPortal } from 'react-dom';
import { useEffect, useMemo, useState } from 'react';
import { ApiClientError, apiClient } from '@/lib/api/client';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { signKaspaMessage } from '@/lib/kaspa/wallet';
import { getWalletProvider } from '@/lib/kaspa/wallet';
import { FieldHint } from '@/components/ui/FieldHint';
import { appendHubActivityEarn } from '@/lib/rewards/appendHubActivityEarn';
import { HUB_EARN_POINTS } from '@/lib/rewards/hub-earn-policy';
import { NODES_DASH_CARD } from './nodesTabLayout';

type ChallengeResponse = { message: string; challengeToken: string; error?: string };
type VerifyResponse = { ok: boolean; enrollmentToken?: string; wallet?: string; verifyPayload?: string; error?: string };
type EnrollResponse = {
  ok: boolean;
  node_id?: string;
  node_secret?: string;
  owner_wallet?: string;
  verification_txid?: string;
  message?: string;
  error?: string;
};

type Step = 'connect' | 'challenge' | 'verify' | 'enroll' | 'done';

type RuntimeConfig = {
  enrollmentEnabled: boolean;
  onchainVerify?: { enabled?: boolean; toAddress?: string | null; minKas?: string };
};

type VerifyOnchainResponse =
  | { ok: true; tx_hash: string; verified_at?: number; alreadyVerified?: boolean; node_secret?: string | null }
  | { ok: false; error: string; pending?: boolean };

const OVERLAY_CLASS = 'fixed inset-0 z-[99999] flex items-center justify-center p-4';
const MODAL_CLASS =
  'relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden max-h-[90vh] flex flex-col';

/** Inline panel on `/nodes?tab=enroll` (no portal / dimmer). */
const EMBEDDED_PANEL_CLASS = `${NODES_DASH_CARD} space-y-4 w-full min-w-0`;

function sanitizeKaspaTxId(raw: unknown): string {
  const base = normalizeTxId(raw);
  const hex = base.replace(/^0x/i, '').trim().toLowerCase();
  const match = hex.match(/[0-9a-f]{64}/);
  return match ? match[0] : hex;
}

function explorerTxUrl(txid: string): string {
  const id = sanitizeKaspaTxId(txid);
  return id ? `https://explorer.kaspa.org/transactions/${id}` : 'https://explorer.kaspa.org';
}

function normalizeTxId(raw: unknown): string {
  if (!raw) return '';
  if (typeof raw === 'string') {
    const s = raw.trim();
    if (!s) return '';
    if (s.startsWith('{') && s.endsWith('}')) {
      try {
        const o = JSON.parse(s) as Record<string, unknown>;
        const id = (o.transactionId ?? o.transaction_id ?? o.id ?? o.txid ?? o.txId) as unknown;
        if (typeof id === 'string' && id.trim()) return id.trim();
      } catch {
        // ignore
      }
    }
    return s;
  }
  if (typeof raw === 'object') {
    const o = raw as Record<string, unknown>;
    const id = (o.transactionId ?? o.transaction_id ?? o.id ?? o.txid ?? o.txId) as unknown;
    if (typeof id === 'string' && id.trim()) return id.trim();
  }
  return '';
}

function CopyRow(props: { label: string; value: string }) {
  const [copied, setCopied] = useState(false);
  return (
    <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-3">
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
            {props.label}
          </div>
          <div className="mt-1 font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all">{props.value}</div>
        </div>
        <button
          type="button"
          onClick={async () => {
            await navigator.clipboard.writeText(props.value);
            setCopied(true);
            setTimeout(() => setCopied(false), 1200);
          }}
          className="shrink-0 px-3 py-2 rounded-lg text-xs font-bold bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 hover:opacity-90 transition"
        >
          {copied ? 'Copied' : 'Copy'}
        </button>
      </div>
    </div>
  );
}

type ExistingNode = {
  node_id: string;
  node_name: string;
  role: 'light' | 'mirror' | 'super';
  url: string;
  region: string;
  version: string;
};

export function KrexNodeEnrollmentModal(props: {
  isOpen: boolean;
  onClose: () => void;
  existingNode?: ExistingNode | null;
  /** When true, render as a normal in-page panel (e.g. Enroll tab) instead of a modal portal. */
  embedded?: boolean;
}) {
  const { state: kaspa, connect } = useKaspaWallet();
  const { balance: krexBalance } = useKREXBalance();
  const isClient = typeof window !== 'undefined';

  const [step, setStep] = useState<Step>('connect');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [enrollmentToken, setEnrollmentToken] = useState<string | null>(null);
  const [verifyPayload, setVerifyPayload] = useState<string | null>(null);
  const [enrollResult, setEnrollResult] = useState<EnrollResponse | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);
  const [verifyTxid, setVerifyTxid] = useState<string | null>(null);
  const verifyTxStorageKey = useMemo(() => {
    const a = (kaspa.address || '').toLowerCase();
    return a ? `krex:verifyTx:${a}` : null;
  }, [kaspa.address]);

  // If the user already broadcast a tx, persist it so refresh cannot cause double spend.
  useEffect(() => {
    if (!isClient) return;
    if (!verifyTxStorageKey) return;
    if (verifyTxid) {
      try {
        window.localStorage.setItem(verifyTxStorageKey, verifyTxid);
      } catch {
        // ignore
      }
    }
  }, [isClient, verifyTxStorageKey, verifyTxid]);

  // Restore pending txid on open (prevents re-sending payment).
  useEffect(() => {
    if (!props.isOpen || !isClient) return;
    if (!verifyTxStorageKey) return;
    try {
      const raw = window.localStorage.getItem(verifyTxStorageKey);
      if (raw && !verifyTxid) {
        const saved = sanitizeKaspaTxId(raw);
        setVerifyTxid(saved);
        setVerifyTxidDraft(saved);
      }
    } catch {
      // ignore
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isOpen, isClient, verifyTxStorageKey]);

  // Freeze modal mode for the entire open session to avoid flipping to "edit"
  // mid-enrollment when the dashboard data refreshes.
  const [sessionMode, setSessionMode] = useState<'enroll' | 'edit' | null>(null);

  const [verifyPending, setVerifyPending] = useState(false);
  const [verifyAttempts, setVerifyAttempts] = useState(0);
  const [verifyLastCheckAt, setVerifyLastCheckAt] = useState<number | null>(null);
  const [verifyStatusMessage, setVerifyStatusMessage] = useState<string | null>(null);
  const [verifyTxidDraft, setVerifyTxidDraft] = useState('');

  const [nodeName, setNodeName] = useState(props.existingNode?.node_name || 'My Krex Node');
  const [role, setRole] = useState<'light' | 'mirror' | 'super'>(props.existingNode?.role || 'light');
  const [url, setUrl] = useState(props.existingNode?.url || 'https://example.invalid/krex-node');
  const [region, setRegion] = useState(props.existingNode?.region || 'eu-central');
  const [version, setVersion] = useState(props.existingNode?.version || '1.0.0');
  const [transferToWallet, setTransferToWallet] = useState('');

  const canEnroll = useMemo(() => {
    return Boolean(nodeName.trim() && role && url.trim());
  }, [nodeName, role, url]);

  const loadRuntimeConfig = async () => {
    try {
      const rc = await apiClient.get<RuntimeConfig>('/kasparex/node/runtime-config');
      if (rc) setRuntimeConfig(rc);
      return rc;
    } catch {
      return null;
    }
  };

  useEffect(() => {
    if (!props.isOpen || !isClient) return;
    setSessionMode(props.existingNode ? 'edit' : 'enroll');
    void loadRuntimeConfig();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [props.isOpen]);

  if (!props.isOpen || !isClient) return null;

  const close = () => {
    setBusy(false);
    setError(null);
    setChallenge(null);
    setEnrollmentToken(null);
    setVerifyPayload(null);
    setEnrollResult(null);
    setRuntimeConfig(null);
    setVerifyTxid(null);
    setVerifyPending(false);
    setVerifyAttempts(0);
    setVerifyLastCheckAt(null);
    setVerifyStatusMessage(null);
    setSessionMode(null);
    setStep('connect');
    props.onClose();
  };

  const ensureWalletConnected = async () => {
    if (kaspa.isConnected && kaspa.address && kaspa.provider) return;
    await connect('kasware', { enableSIWK: false });
  };

  const refreshEnrollmentToken = async (): Promise<string> => {
    await ensureWalletConnected();
    if (!kaspa.provider || !kaspa.address) throw new Error('Kaspa wallet not connected');
    const c = await apiClient.post<ChallengeResponse>('/kasparex/node/challenge', {});
    if (!c?.message || !c?.challengeToken) throw new Error('Challenge failed');
    const signature = await signKaspaMessage(kaspa.provider, c.message);
    const v = await apiClient.post<VerifyResponse>('/kasparex/node/verify-wallet', {
      challengeToken: c.challengeToken,
      address: kaspa.address,
      signature,
    });
    if (!v?.ok || !v.enrollmentToken) throw new Error(v?.error || 'Verification failed');
    setEnrollmentToken(v.enrollmentToken);
    setVerifyPayload(v.verifyPayload || 'krex:verify');
    return v.enrollmentToken;
  };

  const startChallenge = async () => {
    setError(null);
    setBusy(true);
    try {
      await ensureWalletConnected();
      if (!kaspa.provider || !kaspa.address) throw new Error('Kaspa wallet not connected');

      const c = await apiClient.post<ChallengeResponse>('/kasparex/node/challenge', {});
      if (!c?.message || !c?.challengeToken) throw new Error('Challenge failed');
      setChallenge(c);
      setStep('challenge');

      const signature = await signKaspaMessage(kaspa.provider, c.message);
      const v = await apiClient.post<VerifyResponse>('/kasparex/node/verify-wallet', {
        challengeToken: c.challengeToken,
        address: kaspa.address,
        signature,
      });
      if (!v?.ok || !v.enrollmentToken) throw new Error(v?.error || 'Verification failed');
      setEnrollmentToken(v.enrollmentToken);
      setVerifyPayload(v.verifyPayload || 'krex:verify');
      const rc = await loadRuntimeConfig();
      const onchainRequired = Boolean(rc?.onchainVerify?.enabled && rc?.onchainVerify?.toAddress);
      // Manage existing node: wallet signature is enough. New enroll: verify only when Worker enables it.
      setStep(props.existingNode ? 'enroll' : onchainRequired ? 'verify' : 'enroll');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const runOnchainVerification = async () => {
    setError(null);
    setBusy(true);
    setVerifyPending(true);
    setVerifyAttempts(0);
    setVerifyStatusMessage(null);
    try {
      let activeEnrollmentToken = enrollmentToken;
      if (!activeEnrollmentToken) throw new Error('Missing enrollment token');
      if (!kaspa.provider) throw new Error('Kaspa wallet provider missing');

      const toAddress = runtimeConfig?.onchainVerify?.toAddress;
      const minKas = Number(runtimeConfig?.onchainVerify?.minKas ?? '1') || 1;
      if (!toAddress) throw new Error('On-chain verification is not configured');
      const payload = (verifyPayload || 'krex:verify').trim();

      const adapter = getWalletProvider(kaspa.provider);
      if (!adapter) throw new Error('Wallet adapter not available');

      const sompi = String(Math.floor(minKas * 100_000_000));

      // If we already have a txid, do NOT re-send funds. Just re-verify.
      let txid = sanitizeKaspaTxId(verifyTxid || verifyTxidDraft);
      if (!txid) {
        const sent = await adapter.sendTransaction({
          to: toAddress,
          amount: sompi,
          payload,
        });
        txid = sanitizeKaspaTxId(sent);
        if (!txid || !/^[0-9a-f]{64}$/.test(txid)) throw new Error('No valid transaction id returned');
        setVerifyTxid(txid);
        setVerifyTxidDraft(txid);
      }

      const wait = (ms: number) => new Promise((r) => setTimeout(r, ms));
      const withTimeout = async <T,>(p: Promise<T>, ms: number): Promise<T> => {
        const c = new AbortController();
        const t = setTimeout(() => c.abort(), ms);
        try {
          return await Promise.race([
            p,
            new Promise<T>((_, rej) => {
              c.signal.addEventListener('abort', () => rej(new Error('Verification request timed out.')));
            }),
          ]);
        } finally {
          clearTimeout(t);
        }
      };

      if (txid && !/^[0-9a-f]{64}$/.test(txid)) {
        throw new Error('Saved transaction id is invalid. Paste the 64-character txid from Kaspa Explorer.');
      }

      const recipientQuery = toAddress ? `?recipient=${encodeURIComponent(toAddress)}` : '';

      const started = Date.now();
      const maxMs = 10 * 60_000;
      let sleepMs = 2500;
      let attemptNo = 0;
      while (Date.now() - started < maxMs) {
        attemptNo += 1;
        setVerifyAttempts(attemptNo);
        setVerifyLastCheckAt(Date.now());

        // Hub-side indexer check (same-origin) for clearer UX while Worker polls REST.
        if (txid) {
          try {
            const hubRes = await fetch(`/api/kaspa/transaction/${txid}${recipientQuery}`, { cache: 'no-store' });
            if (hubRes.ok) {
              setVerifyStatusMessage('Transaction visible to Hub. Confirming with Worker…');
            } else if (hubRes.status === 404 && attemptNo >= 3) {
              setVerifyStatusMessage(
                'This txid is not visible to the indexer yet. Confirm it on Kaspa Explorer, or paste the correct txid below.'
              );
            } else if (hubRes.status === 404) {
              setVerifyStatusMessage('Waiting for Kaspa indexer to see your transaction…');
            }
          } catch {
            // non-fatal
          }
        }

        try {
          const vr = await withTimeout(
            apiClient.post<VerifyOnchainResponse>('/kasparex/node/verify-onchain', {
              enrollmentToken: activeEnrollmentToken,
              tx_hash: txid,
            }),
            25_000
          );
          if (vr && (vr as any).ok === true) {
            setVerifyTxid(normalizeTxId((vr as any).tx_hash || txid));
            setVerifyStatusMessage(null);
            setStep('enroll');
            return;
          }
          if ((vr as any)?.pending) {
            setVerifyStatusMessage((vr as any)?.error || 'Waiting for Kaspa indexer…');
          } else {
            throw new Error((vr as any)?.error || 'On-chain verification failed');
          }
        } catch (e) {
          if (e instanceof ApiClientError && e.status === 202) {
            setVerifyStatusMessage('Waiting for Kaspa indexer…');
          } else if (e instanceof ApiClientError && e.status === 401) {
            setVerifyStatusMessage('Session expired. Refreshing wallet binding…');
            activeEnrollmentToken = await refreshEnrollmentToken();
          } else {
            const msg = e instanceof Error ? e.message : 'Verification failed';
            if (/not found yet/i.test(msg) || /transaction not found/i.test(msg) || /HTTP 404/i.test(msg)) {
              setVerifyStatusMessage('Waiting for Kaspa indexer…');
            } else {
              throw e;
            }
          }
        }
        await wait(sleepMs);
        sleepMs = Math.min(12_000, Math.floor(sleepMs * 1.25));
      }
      throw new Error(
        'Your transaction is broadcast, but Kaspa REST is still slow. Close this modal and click Verify tx again in a minute. It will not send another payment.'
      );

    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
      setVerifyPending(false);
    }
  };

  const retryVerifyOnly = async () => {
    const next = sanitizeKaspaTxId(verifyTxidDraft || verifyTxid);
    if (!next) return;
    if (!/^[0-9a-f]{64}$/.test(next)) {
      setError('Enter a valid 64-character transaction id.');
      return;
    }
    setVerifyTxid(next);
    setVerifyTxidDraft(next);
    await runOnchainVerification();
  };

  const submitDeactivate = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!props.existingNode?.node_id) throw new Error('Missing node_id');
      if (!enrollmentToken) throw new Error('Missing enrollment token');
      const r = await apiClient.post<{ ok?: boolean; error?: string }>('/kasparex/node/deactivate', {
        enrollmentToken,
        node_id: props.existingNode.node_id,
      });
      if (!(r as any)?.ok) throw new Error((r as any)?.error || 'Deactivate failed');
      setEnrollResult({
        ok: true,
        node_id: props.existingNode.node_id,
        owner_wallet: kaspa.address || undefined,
        message: 'Deactivated',
      });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const submitTransferOwnership = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!props.existingNode?.node_id) throw new Error('Missing node_id');
      if (!enrollmentToken) throw new Error('Missing enrollment token');
      const to = transferToWallet.trim();
      if (!to) throw new Error('Enter the new owner wallet');
      const r = await apiClient.post<{ ok?: boolean; error?: string }>('/kasparex/node/transfer-ownership', {
        enrollmentToken,
        node_id: props.existingNode.node_id,
        new_wallet: to,
      });
      if (!(r as any)?.ok) throw new Error((r as any)?.error || 'Transfer failed');
      setEnrollResult({
        ok: true,
        node_id: props.existingNode.node_id,
        owner_wallet: to,
        message: 'Transferred',
      });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const submitIssueSecret = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!props.existingNode?.node_id) throw new Error('Missing node_id');
      if (!enrollmentToken) throw new Error('Missing enrollment token');
      const r = await apiClient.post<{ ok?: boolean; node_secret?: string; error?: string }>(
        '/kasparex/node/issue-secret',
        {
          enrollmentToken,
          node_id: props.existingNode.node_id,
        }
      );
      const ns = (r as any)?.node_secret;
      if (!(r as any)?.ok || typeof ns !== 'string' || !ns.trim()) {
        throw new Error((r as any)?.error || 'Issue secret failed');
      }
      setEnrollResult({
        ok: true,
        node_id: props.existingNode.node_id,
        owner_wallet: kaspa.address || undefined,
        node_secret: ns,
        message: 'IssuedSecret',
      });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const submitEnroll = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!enrollmentToken) throw new Error('Missing enrollment token');
      const r = await apiClient.post<EnrollResponse>('/kasparex/node/enroll', {
        enrollmentToken,
        node_name: nodeName.trim(),
        role,
        url: url.trim(),
        region: region.trim() || 'unknown',
        version: version.trim() || '1.0.0',
      });
      if (!r?.ok || !r.node_id || !r.node_secret) throw new Error(r?.error || 'Enrollment failed');
      setEnrollResult(r);
      appendHubActivityEarn({
        walletRaw: kaspa.address,
        source: 'krex_node_operator',
        redeemableDelta: HUB_EARN_POINTS.krexNodeEnrollmentOnce,
        krexBalance,
        idempotencyKey: `krex_node:enroll:${r.node_id}`,
        meta: { node_id: r.node_id },
      });
      setStep('done');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Failed';
      if (/on-chain verification/i.test(msg)) {
        const rc = await loadRuntimeConfig();
        if (rc?.onchainVerify?.enabled) {
          setStep('verify');
          setError('Complete the 1 KAS verification step below, then enroll again.');
          return;
        }
      }
      setError(msg);
    } finally {
      setBusy(false);
    }
  };

  const submitUpdate = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!props.existingNode?.node_id) throw new Error('Missing node_id');
      if (!enrollmentToken) throw new Error('Missing enrollment token');
      const r = await apiClient.post<{ ok: boolean; error?: string }>('/kasparex/node/update-details', {
        enrollmentToken,
        node_id: props.existingNode.node_id,
        node_name: nodeName.trim(),
        role,
        url: url.trim(),
        region: region.trim() || 'unknown',
        version: version.trim() || '1.0.0',
      });
      if (!r?.ok) throw new Error(r?.error || 'Update failed');
      setEnrollResult({
        ok: true,
        node_id: props.existingNode.node_id,
        node_secret: 'updated',
        owner_wallet: kaspa.address || undefined,
        message: 'Updated',
      });
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const title =
    step === 'done'
      ? sessionMode === 'edit'
        ? 'Node updated'
        : 'Node enrolled'
      : step === 'verify'
        ? 'Verify on-chain (1 KAS)'
        : step === 'enroll'
        ? sessionMode === 'edit'
          ? 'Edit node details'
          : 'Enroll node'
        : 'Bind wallet & verify';

  const enrollmentPanel = (
      <div
        className={props.embedded ? EMBEDDED_PANEL_CLASS : MODAL_CLASS}
        onClick={props.embedded ? undefined : (e) => e.stopPropagation()}
      >
        <div
          className={
            props.embedded
              ? 'space-y-1'
              : 'px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between'
          }
        >
          <div>
            <div
              className={
                props.embedded
                  ? 'text-lg font-bold text-zinc-900 dark:text-zinc-100'
                  : 'text-base font-semibold text-zinc-900 dark:text-zinc-100'
              }
            >
              {title}
            </div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              This runs the Worker flow: challenge → wallet signature → verify → enroll (HMAC secret).
            </div>
          </div>
          {!props.embedded ? (
            <button
              type="button"
              onClick={close}
              className="p-2 text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              aria-label="Close"
            >
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          ) : null}
        </div>

        <div className={props.embedded ? 'space-y-4' : 'p-5 space-y-4 overflow-y-auto'}>
          {error && (
            <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3 text-sm text-red-700 dark:text-red-300">
              {error}
            </div>
          )}

          {step !== 'done' && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-2">
                Wallet
                <FieldHint text="You must sign a one-time message to bind your wallet to node enrollment." />
              </div>
              <div className="text-sm text-zinc-600 dark:text-zinc-400">
                Status:{' '}
                <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                  {kaspa.isConnected && kaspa.address ? `Connected (${kaspa.address})` : 'Not connected'}
                </span>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={startChallenge}
                  disabled={busy}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 disabled:opacity-60 text-white font-bold text-sm transition-colors"
                >
                  {busy ? 'Working…' : 'Bind wallet & continue'}
                </button>
              </div>
            </div>
          )}

          {step === 'enroll' && sessionMode !== 'edit' && runtimeConfig?.onchainVerify?.enabled && (
            <div className="rounded-xl border border-amber-200 dark:border-amber-900/50 bg-amber-50 dark:bg-amber-950/20 p-3 text-sm text-amber-900 dark:text-amber-200">
              On-chain verification is required before enrollment. Click{' '}
              <span className="font-semibold">Bind wallet & continue</span> to open the verify step, or use the
              button below if you already see it.
            </div>
          )}

          {step === 'verify' && sessionMode !== 'edit' && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-2">
                On-chain verification
                <FieldHint text="First step. You’ll send a symbolic 1 KAS transaction. Only after confirmation we unlock enrollment + secrets." />
              </div>

              {verifyTxid ? (
                <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-3 space-y-2">
                  <div className="text-[10px] font-black uppercase tracking-widest text-zinc-500 dark:text-zinc-400">
                    verification_txid (broadcast)
                  </div>
                  <div className="mt-1 font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all">{verifyTxid}</div>
                  <a
                    href={explorerTxUrl(verifyTxid)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block text-xs font-semibold text-cyan-700 dark:text-cyan-300 hover:underline"
                  >
                    View on Kaspa Explorer
                  </a>
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    This txid is already created. Clicking verify will <span className="font-semibold">not</span> send another payment.
                  </div>
                </div>
              ) : null}

              <label className="block space-y-1">
                <span className="text-xs font-semibold text-zinc-600 dark:text-zinc-400">
                  Transaction id (paste from explorer if needed)
                </span>
                <input
                  type="text"
                  value={verifyTxidDraft || verifyTxid || ''}
                  onChange={(e) => setVerifyTxidDraft(e.target.value.trim())}
                  placeholder="64-character txid"
                  className="w-full rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-950 px-3 py-2 font-mono text-xs"
                />
              </label>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    const next = sanitizeKaspaTxId(verifyTxidDraft || verifyTxid);
                    if (!/^[0-9a-f]{64}$/.test(next)) {
                      setError('Enter a valid 64-character transaction id.');
                      return;
                    }
                    setError(null);
                    setVerifyTxid(next);
                    setVerifyTxidDraft(next);
                  }}
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60"
                >
                  Use this txid
                </button>
                <button
                  type="button"
                  disabled={busy}
                  onClick={() => {
                    setVerifyTxid(null);
                    setVerifyTxidDraft('');
                    if (verifyTxStorageKey) {
                      try {
                        window.localStorage.removeItem(verifyTxStorageKey);
                      } catch {
                        // ignore
                      }
                    }
                  }}
                  className="px-3 py-2 rounded-lg border border-zinc-200 dark:border-zinc-700 text-xs font-bold text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60"
                >
                  Clear saved txid
                </button>
              </div>

              <div className="text-sm text-zinc-600 dark:text-zinc-400 space-y-1">
                <div>
                  Amount:{' '}
                  <span className="font-semibold text-zinc-900 dark:text-zinc-100">
                    {runtimeConfig?.onchainVerify?.minKas || '1'} KAS
                  </span>
                </div>
                <div>
                  To:{' '}
                  <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100 break-all">
                    {runtimeConfig?.onchainVerify?.toAddress || '-'}
                  </span>
                </div>
                <div>
                  Payload:{' '}
                  <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">{verifyPayload || ' - '}</span>
                </div>
                {verifyPending ? (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1 space-y-1">
                    <div>
                      Checking confirmation… attempt {Math.max(1, verifyAttempts)}
                    </div>
                    {verifyStatusMessage ? <div>{verifyStatusMessage}</div> : null}
                  </div>
                ) : null}
                {!verifyPending ? (
                  <div className="text-[11px] text-zinc-500 dark:text-zinc-400 pt-1">
                    Verification can take ~30–120s depending on indexer propagation.
                    {verifyLastCheckAt ? ` Last check: ${new Date(verifyLastCheckAt).toLocaleTimeString()}` : ''}
                  </div>
                ) : null}
              </div>

              <div className="flex gap-2">
                <button
                  type="button"
                  disabled={busy || !verifyPayload}
                  onClick={runOnchainVerification}
                  className="flex-1 mt-2 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-sm disabled:opacity-60"
                >
                  {busy
                    ? verifyTxid
                      ? 'Verifying…'
                      : 'Waiting…'
                    : verifyTxid
                      ? 'Verify tx (no new payment)'
                      : 'Send 1 KAS and verify'}
                </button>
                {verifyTxid ? (
                  <button
                    type="button"
                    onClick={retryVerifyOnly}
                    disabled={busy}
                    className="mt-2 px-4 py-3 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 disabled:opacity-60"
                    aria-label="Retry verification"
                    title="Retry verification (no new payment)"
                  >
                    ↻
                  </button>
                ) : null}
              </div>
            </div>
          )}

          {step === 'enroll' && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Node details</div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <label className="space-y-1">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Node name</div>
                  <input
                    value={nodeName}
                    onChange={(e) => setNodeName(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Role</div>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                  >
                    <option value="light">light</option>
                    <option value="mirror">mirror</option>
                    <option value="super">super</option>
                  </select>
                </label>
                <label className="space-y-1 md:col-span-2">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1.5">
                    Node URL
                    <FieldHint text="For now this can be a placeholder. When you run a mirror node with a public endpoint, put its public base URL here." />
                  </div>
                  <input
                    value={url}
                    onChange={(e) => setUrl(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Region</div>
                  <input
                    value={region}
                    onChange={(e) => setRegion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                  />
                </label>
                <label className="space-y-1">
                  <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300">Version</div>
                  <input
                    value={version}
                    onChange={(e) => setVersion(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                  />
                </label>
              </div>

              <button
                type="button"
                disabled={busy || !canEnroll}
                onClick={sessionMode === 'edit' ? submitUpdate : submitEnroll}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-black text-sm disabled:opacity-60"
              >
                {busy ? 'Working…' : sessionMode === 'edit' ? 'Save changes' : 'Enroll (unlock secret)'}
              </button>

              {sessionMode === 'edit' ? (
                <div className="pt-3 mt-3 border-t border-zinc-200 dark:border-zinc-800 space-y-3">
                  <div className="text-sm font-black text-zinc-900 dark:text-zinc-100">Operator actions</div>

                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/80 dark:bg-zinc-900/40 p-3 space-y-2">
                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1.5">
                      Transfer ownership
                      <FieldHint text="Moves the node to a new wallet. The new wallet must have completed the 1 KAS verification. This clears the node secret, so the new owner must issue a new one before the node can ping again." />
                    </div>
                    <input
                      value={transferToWallet}
                      onChange={(e) => setTransferToWallet(e.target.value)}
                      placeholder="kaspa:..."
                      className="w-full px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 text-sm"
                    />
                    <button
                      type="button"
                      disabled={busy || !transferToWallet.trim()}
                      onClick={submitTransferOwnership}
                      className="w-full px-4 py-2.5 rounded-xl border border-zinc-200 dark:border-zinc-700 text-zinc-800 dark:text-zinc-100 hover:bg-zinc-100 dark:hover:bg-zinc-800 font-bold text-sm disabled:opacity-60"
                    >
                      Transfer to this wallet
                    </button>
                  </div>

                  <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-3 space-y-2">
                    <div className="text-xs font-bold text-zinc-700 dark:text-zinc-300 inline-flex items-center gap-1.5">
                      Issue new secret
                      <FieldHint text="Generates a fresh node_secret for the current owner. Use this after transfer ownership (the secret is cleared) or to invalidate the current runtime config." />
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={submitIssueSecret}
                      className="w-full px-4 py-2.5 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-black text-sm disabled:opacity-60"
                    >
                      Issue new secret
                    </button>
                  </div>

                  <div className="rounded-xl border border-red-200 dark:border-red-900/50 bg-red-50 dark:bg-red-950/30 p-3 space-y-2">
                    <div className="text-xs font-bold text-red-700 dark:text-red-300 inline-flex items-center gap-1.5">
                      Deactivate node
                      <FieldHint text="Disables the node: pings are rejected and the node is excluded from rewards." />
                    </div>
                    <button
                      type="button"
                      disabled={busy}
                      onClick={submitDeactivate}
                      className="w-full px-4 py-2.5 rounded-xl bg-red-600 hover:bg-red-700 text-white font-black text-sm disabled:opacity-60"
                    >
                      Deactivate node
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-3">
              {sessionMode === 'edit' ? (
                <div className="space-y-3">
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                    {enrollResult?.message === 'Deactivated'
                      ? 'Node deactivated.'
                      : enrollResult?.message === 'Transferred'
                        ? 'Ownership transferred.'
                        : enrollResult?.message === 'IssuedSecret'
                          ? 'New secret issued.'
                          : 'Node details updated.'}
                  </div>
                  {enrollResult?.message === 'IssuedSecret' && enrollResult?.node_secret ? (
                    <CopyRow label="node_secret (HMAC)" value={enrollResult.node_secret} />
                  ) : null}
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                    Your node is enrolled. Save the secret securely - it’s required for signed pings.
                  </div>
                  {enrollResult?.node_id && <CopyRow label="node_id" value={enrollResult.node_id} />}
                  {enrollResult?.node_secret && <CopyRow label="node_secret (HMAC)" value={enrollResult.node_secret} />}
                  {verifyTxid && <CopyRow label="verification_txid" value={verifyTxid} />}
                  <CopyRow label="owner_wallet" value={enrollResult?.owner_wallet || kaspa.address || ''} />
                </>
              )}

              <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 text-sm text-zinc-700 dark:text-zinc-300 space-y-2">
                <div className="font-bold text-zinc-900 dark:text-zinc-100">Next</div>
                <div>
                  Use <span className="font-mono">packages/krex-node</span> (or the standalone repo) and set:
                </div>
                <ul className="list-disc pl-5 space-y-1">
                  <li>
                    <span className="font-mono">apiBaseUrl</span> → your production Worker URL
                  </li>
                  {sessionMode !== 'edit' && enrollResult?.node_id && (
                    <li>
                      <span className="font-mono">nodeId</span> → <span className="font-mono">{enrollResult.node_id}</span>
                    </li>
                  )}
                  {sessionMode !== 'edit' && enrollResult?.node_secret && (
                    <li>
                      <span className="font-mono">hmacSecret</span> → <span className="font-mono">{enrollResult.node_secret}</span>
                    </li>
                  )}
                </ul>
              </div>

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={close}
                  className="px-4 py-2.5 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-bold text-sm transition-colors"
                >
                  Done
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
  );

  if (props.embedded) {
    return enrollmentPanel;
  }

  return createPortal(
    <div className={OVERLAY_CLASS} onClick={close}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      {enrollmentPanel}
    </div>,
    document.body
  );
}

