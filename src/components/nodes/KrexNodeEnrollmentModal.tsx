'use client';

import { createPortal } from 'react-dom';
import { useMemo, useState } from 'react';
import { apiClient } from '@/lib/api/client';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { signKaspaMessage } from '@/lib/kaspa/wallet';
import { getWalletProvider } from '@/lib/kaspa/wallet';
import { FieldHint } from '@/components/ui/FieldHint';

type ChallengeResponse = { message: string; challengeToken: string; error?: string };
type VerifyResponse = { ok: boolean; enrollmentToken?: string; wallet?: string; error?: string };
type EnrollResponse = {
  ok: boolean;
  node_id?: string;
  node_secret?: string;
  owner_wallet?: string;
  message?: string;
  error?: string;
};

type Step = 'connect' | 'challenge' | 'enroll' | 'verify' | 'done';

type RuntimeConfig = {
  enrollmentEnabled: boolean;
  onchainVerify?: { enabled?: boolean; toAddress?: string | null; minKas?: string };
};

type VerifyOnchainResponse =
  | { ok: true; tx_hash: string; verified_at?: number; alreadyVerified?: boolean }
  | { ok: false; error: string };

const OVERLAY_CLASS = 'fixed inset-0 z-[99999] flex items-center justify-center p-4';
const MODAL_CLASS =
  'relative bg-white dark:bg-zinc-900 rounded-xl shadow-xl max-w-2xl w-full border border-zinc-200 dark:border-zinc-800 overflow-hidden';

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
}) {
  const { state: kaspa, connect } = useKaspaWallet();

  const [step, setStep] = useState<Step>('connect');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [challenge, setChallenge] = useState<ChallengeResponse | null>(null);
  const [enrollmentToken, setEnrollmentToken] = useState<string | null>(null);
  const [enrollResult, setEnrollResult] = useState<EnrollResponse | null>(null);
  const [runtimeConfig, setRuntimeConfig] = useState<RuntimeConfig | null>(null);
  const [verifyTxid, setVerifyTxid] = useState<string | null>(null);

  const [nodeName, setNodeName] = useState(props.existingNode?.node_name || 'My Krex Node');
  const [role, setRole] = useState<'light' | 'mirror' | 'super'>(props.existingNode?.role || 'light');
  const [url, setUrl] = useState(props.existingNode?.url || 'https://example.invalid/krex-node');
  const [region, setRegion] = useState(props.existingNode?.region || 'eu-central');
  const [version, setVersion] = useState(props.existingNode?.version || '1.0.0');

  const canEnroll = useMemo(() => {
    return Boolean(nodeName.trim() && role && url.trim());
  }, [nodeName, role, url]);

  if (!props.isOpen || typeof window === 'undefined') return null;

  const close = () => {
    setBusy(false);
    setError(null);
    setChallenge(null);
    setEnrollmentToken(null);
    setEnrollResult(null);
    setRuntimeConfig(null);
    setVerifyTxid(null);
    setStep('connect');
    props.onClose();
  };

  const ensureWalletConnected = async () => {
    if (kaspa.isConnected && kaspa.address && kaspa.provider) return;
    await connect('kasware', { enableSIWK: false });
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
      setStep('enroll');

      try {
        const rc = await apiClient.get<RuntimeConfig>('/kasparex/node/runtime-config');
        if (rc) setRuntimeConfig(rc);
      } catch {
        // ignore
      }
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
      const onchainEnabled = Boolean(runtimeConfig?.onchainVerify?.enabled && runtimeConfig?.onchainVerify?.toAddress);
      setStep(onchainEnabled ? 'verify' : 'done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
    } finally {
      setBusy(false);
    }
  };

  const runOnchainVerification = async () => {
    setError(null);
    setBusy(true);
    try {
      if (!enrollmentToken) throw new Error('Missing enrollment token');
      if (!enrollResult?.node_id) throw new Error('Missing node_id');
      if (!kaspa.provider) throw new Error('Kaspa wallet provider missing');

      const toAddress = runtimeConfig?.onchainVerify?.toAddress;
      const minKas = Number(runtimeConfig?.onchainVerify?.minKas ?? '1') || 1;
      if (!toAddress) throw new Error('On-chain verification is not configured');

      const adapter = getWalletProvider(kaspa.provider);
      if (!adapter) throw new Error('Wallet adapter not available');

      const sompi = String(Math.floor(minKas * 100_000_000));
      const payload = `krex:${enrollResult.node_id}`;

      // Wallet prompt: send 1 KAS with a payload binding to node_id.
      const txid = await adapter.sendTransaction({
        to: toAddress,
        amount: sompi,
        payload,
      });
      if (!txid) throw new Error('No transaction id returned');

      // Worker verify + persist.
      const vr = await apiClient.post<VerifyOnchainResponse>('/kasparex/node/verify-onchain', {
        enrollmentToken,
        node_id: enrollResult.node_id,
        tx_hash: txid,
      });
      if (!vr || (vr as any).ok !== true) throw new Error((vr as any)?.error || 'On-chain verification failed');

      setVerifyTxid((vr as any).tx_hash || txid);
      setStep('done');
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed');
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
      ? props.existingNode
        ? 'Node updated'
        : 'Node enrolled'
      : step === 'verify'
        ? 'Verify on-chain (1 KAS)'
        : step === 'enroll'
        ? props.existingNode
          ? 'Edit node details'
          : 'Enroll node'
        : 'Bind wallet & verify';

  return createPortal(
    <div className={OVERLAY_CLASS} onClick={close}>
      <div className="absolute inset-0 bg-black/70 backdrop-blur-md" />
      <div className={MODAL_CLASS} onClick={(e) => e.stopPropagation()}>
        <div className="px-5 py-4 border-b border-zinc-200 dark:border-zinc-800 flex items-center justify-between">
          <div>
            <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">{title}</div>
            <div className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              This runs the Worker flow: challenge → wallet signature → verify → enroll (HMAC secret).
            </div>
          </div>
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
        </div>

        <div className="p-5 space-y-4">
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
                <a
                  href="/api/krex-node#how-to-run"
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 transition-colors text-sm font-medium"
                >
                  Setup guide
                </a>
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
                onClick={props.existingNode ? submitUpdate : submitEnroll}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-black text-sm disabled:opacity-60"
              >
                {busy ? 'Working…' : props.existingNode ? 'Save changes' : 'Enroll and generate node secret'}
              </button>
            </div>
          )}

          {step === 'verify' && !props.existingNode && (
            <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-4 space-y-3">
              <div className="text-sm font-bold text-zinc-900 dark:text-zinc-100 inline-flex items-center gap-2">
                On-chain verification
                <FieldHint text="To reduce Sybil abuse, you’ll send a symbolic 1 KAS transaction. The tx payload includes your node_id binding." />
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
                    {runtimeConfig?.onchainVerify?.toAddress || '—'}
                  </span>
                </div>
                <div>
                  Payload:{' '}
                  <span className="font-mono text-xs text-zinc-900 dark:text-zinc-100">
                    {enrollResult?.node_id ? `krex:${enrollResult.node_id}` : 'krex:<node_id>'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                disabled={busy || !enrollResult?.node_id}
                onClick={runOnchainVerification}
                className="w-full mt-2 px-4 py-3 rounded-xl bg-cyan-600 hover:bg-cyan-700 text-white font-black text-sm disabled:opacity-60"
              >
                {busy ? 'Waiting…' : 'Send 1 KAS and verify'}
              </button>
            </div>
          )}

          {step === 'done' && (
            <div className="space-y-3">
              {props.existingNode ? (
                <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                  Node details updated.
                </div>
              ) : (
                <>
                  <div className="rounded-xl border border-emerald-200 dark:border-emerald-900/50 bg-emerald-50 dark:bg-emerald-950/30 p-3 text-sm text-emerald-700 dark:text-emerald-300">
                    Your node is enrolled. Save the secret securely — it’s required for signed pings.
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
                  {!props.existingNode && enrollResult?.node_id && (
                    <li>
                      <span className="font-mono">nodeId</span> → <span className="font-mono">{enrollResult.node_id}</span>
                    </li>
                  )}
                  {!props.existingNode && enrollResult?.node_secret && (
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
                <a
                  href="/api/krex-node#how-to-run"
                  className="px-4 py-2.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-zinc-100 border border-zinc-200 dark:border-zinc-700 transition-colors text-sm font-medium"
                >
                  Full setup guide
                </a>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body
  );
}

