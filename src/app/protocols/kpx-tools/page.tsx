'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { KPX_CM_RT_CODES_V1 } from '@/lib/kpx/constants';
import {
  buildKpxCmV1,
  buildKpxLnkV1,
  buildKpxPfV1,
  buildKpxVerV1,
  encodeKpxJson,
} from '@/lib/kpx/encode';
import { kpxUtf8JsonToPayloadHex } from '@/lib/kpx/payloadHex';
import type { KpxNet, KpxResourceTypeCodeV1 } from '@/lib/kpx/types';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { kasToSompi } from '@/lib/ads/config';
import { normalizeKaspaAddress } from '@/lib/kaspa/sdk';
import { sendKaspaTransaction } from '@/lib/kaspa/wallet';
import type { KaspaWalletProvider } from '@/lib/kaspa/types';
import { useKpxIndexer } from '@/hooks/useKpxIndexer';
import { isStorageMassErrorMessage } from '@/lib/chronicles/leaderboard/massMode';

type KpxKind = 'pf' | 'ver' | 'lnk' | 'cm';

const MIN_SELF_KAS = 0.0001;
const KPX_HIGH_MASS_MODE_KEY = 'kpx-tools-high-mass-mode-v1';

export default function KpxToolsPage() {
  const { state: kaspa } = useKaspaWallet();
  const [kind, setKind] = useState<KpxKind>('pf');
  const [net, setNet] = useState<KpxNet>('mainnet');
  const [seq, setSeq] = useState('1');
  const [amountKas, setAmountKas] = useState('0.001');
  const [priorityFeeKas, setPriorityFeeKas] = useState('');
  const [toAddress, setToAddress] = useState('');
  const [highMassMode, setHighMassMode] = useState(false);

  const [pfOp, setPfOp] = useState<'set' | 'clear'>('set');
  const [display, setDisplay] = useState('');
  const [bio, setBio] = useState('');
  const [tagsCsv, setTagsCsv] = useState('');

  const [verOp, setVerOp] = useState<'set' | 'clear'>('set');

  const [lnkOp, setLnkOp] = useState<'set' | 'clear'>('set');
  const [evm, setEvm] = useState('');

  const [cmOp, setCmOp] = useState<'create' | 'edit'>('create');
  const [cmRt, setCmRt] = useState<KpxResourceTypeCodeV1>('vb');
  const [cmRid, setCmRid] = useState('');
  const [cmCh, setCmCh] = useState('');
  const [cmSv, setCmSv] = useState('1');

  const [previewJson, setPreviewJson] = useState('');
  const [parseOk, setParseOk] = useState<string | null>(null);
  const [parseErr, setParseErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [sendErr, setSendErr] = useState<string | null>(null);
  const [txHash, setTxHash] = useState<string | null>(null);

  const [idxLimit, setIdxLimit] = useState('200');
  const [idxOffset, setIdxOffset] = useState('0');
  const [idxMaxCm, setIdxMaxCm] = useState('40');
  const [idxNonce, setIdxNonce] = useState(0);

  const indexLimit = Number.parseInt(idxLimit, 10);
  const indexOffset = Number.parseInt(idxOffset, 10);
  const indexMaxCm = Number.parseInt(idxMaxCm, 10);

  const kpxIndex = useKpxIndexer({
    kaspaAddress: kaspa.address,
    net,
    limit: Number.isFinite(indexLimit) ? indexLimit : 200,
    offset: Number.isFinite(indexOffset) ? indexOffset : 0,
    maxCmResources: Number.isFinite(indexMaxCm) ? indexMaxCm : 40,
    refreshNonce: idxNonce,
  });

  useEffect(() => {
    if (!kaspa.address) return;
    try {
      setToAddress((prev) => (prev.trim() ? prev : normalizeKaspaAddress(kaspa.address!)));
    } catch {
      // ignore
    }
  }, [kaspa.address]);

  useEffect(() => {
    try {
      setHighMassMode(localStorage.getItem(KPX_HIGH_MASS_MODE_KEY) === '1');
    } catch {
      // ignore
    }
  }, []);

  const owner = kaspa.address?.trim() ?? '';

  function parseSeq(): number | null {
    const n = Number.parseInt(seq, 10);
    if (!Number.isFinite(n) || n < 1) return null;
    return n;
  }

  function parsePriorityFeeKas(): number | null {
    const s = priorityFeeKas.trim();
    if (!s) return null;
    const n = Number.parseFloat(s);
    if (!Number.isFinite(n) || n < 0) return null;
    return n;
  }

  function retryKasCandidates(baseKas: number, enabled: boolean): number[] {
    const ladder = enabled ? [1, 2, 5, 10, 20, 30] : [baseKas, 0.2, 0.5, 1, 2, 5, 10];
    const unique: number[] = [];
    for (const x of ladder) {
      const v = Number.isFinite(x) ? Number(x.toFixed(8)) : 0;
      if (v <= 0) continue;
      if (!unique.some((u) => Math.abs(u - v) < 1e-9)) unique.push(v);
    }
    return unique;
  }

  function buildRecord(): unknown {
    if (!owner) throw new Error('Connect a Kaspa wallet from the header so this tool knows your payer address.');
    const s = parseSeq();
    if (s == null) throw new Error('Enter seq as an integer ≥ 1.');
    const addr = normalizeKaspaAddress(owner);
    switch (kind) {
      case 'pf':
        return buildKpxPfV1({
          net,
          op: pfOp,
          addr,
          seq: s,
          data:
            pfOp === 'set'
              ? {
                  ...(display.trim() ? { display: display.trim() } : {}),
                  ...(bio.trim() ? { bio: bio.trim() } : {}),
                  ...(tagsCsv.trim()
                    ? { tags: tagsCsv.split(',').map((t) => t.trim()).filter(Boolean) }
                    : {}),
                }
              : undefined,
        });
      case 'ver':
        return buildKpxVerV1({ net, op: verOp, addr, seq: s });
      case 'lnk':
        return buildKpxLnkV1({
          net,
          op: lnkOp,
          addr,
          seq: s,
          evm: lnkOp === 'set' ? evm.trim() : undefined,
        });
      case 'cm': {
        const ch = cmCh.trim().toLowerCase();
        if (!/^[0-9a-f]{64}$/.test(ch)) throw new Error('Commit hash must be 64 lowercase hex characters.');
        const sv = Number.parseInt(cmSv, 10);
        if (!Number.isFinite(sv) || sv < 1) throw new Error('sv must be an integer ≥ 1.');
        return buildKpxCmV1({
          net,
          op: cmOp,
          addr,
          seq: s,
          rt: cmRt,
          rid: cmRid.trim(),
          ch,
          sv,
        });
      }
      default:
        throw new Error('Unknown type');
    }
  }

  async function handleValidate() {
    setParseOk(null);
    setParseErr(null);
    setSendErr(null);
    setTxHash(null);
    try {
      const rec = buildRecord();
      const { json } = encodeKpxJson(rec);
      setPreviewJson(json);
      const res = await fetch('/api/kpx/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json }),
      });
      const body = (await res.json()) as { ok?: boolean; error?: string; byteLength?: number };
      if (!res.ok || !body.ok) {
        setParseErr(body.error ?? 'Validation failed');
        return;
      }
      setParseOk(`Valid kpx record (${body.byteLength ?? '?'} bytes).`);
    } catch (e) {
      setParseErr(e instanceof Error ? e.message : 'Build failed');
      setPreviewJson('');
    }
  }

  async function handleBroadcast() {
    setSendErr(null);
    setTxHash(null);
    if (!kaspa.isConnected || !kaspa.provider || !owner) {
      setSendErr('Connect a Kaspa wallet (KasWare or Kastle) from the header first.');
      return;
    }
    const kas = Number.parseFloat(amountKas.trim());
    if (!Number.isFinite(kas)) {
      setSendErr('Enter a valid amount in KAS (for example 0.001).');
      return;
    }
    if (kas < MIN_SELF_KAS) {
      setSendErr(`Amount must be at least ${MIN_SELF_KAS} KAS (self-transfer + payload).`);
      return;
    }
    const feeKas = parsePriorityFeeKas();
    if (priorityFeeKas.trim() && feeKas == null) {
      setSendErr('Priority fee must be a valid non-negative number (in KAS).');
      return;
    }
    let to: string;
    try {
      to = normalizeKaspaAddress(toAddress.trim());
    } catch {
      setSendErr('Invalid recipient Kaspa address.');
      return;
    }
    let payer: string;
    try {
      payer = normalizeKaspaAddress(owner);
    } catch {
      setSendErr('Wallet address is not a valid Kaspa address.');
      return;
    }
    const isSelfTransfer = to === payer;

    setBusy(true);
    try {
      const rec = buildRecord();
      const { json } = encodeKpxJson(rec);
      setPreviewJson(json);
      const parseRes = await fetch('/api/kpx/parse', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ json }),
      });
      const parsed = (await parseRes.json()) as { ok?: boolean; error?: string };
      if (!parseRes.ok || !parsed.ok) {
        throw new Error(parsed.error ?? 'Record failed /api/kpx/parse validation');
      }
      const payloadHex = kpxUtf8JsonToPayloadHex(json);
      if (!payloadHex) throw new Error('Empty payload');

      const candidates = highMassMode && isSelfTransfer ? retryKasCandidates(kas, true) : [kas];
      let lastErr: string | null = null;
      for (const candidateKas of candidates) {
        const sompi = kasToSompi(candidateKas);
        const out = await sendKaspaTransaction(kaspa.provider as KaspaWalletProvider, {
          to,
          amount: String(sompi),
          ...(feeKas != null ? { fee: String(feeKas) } : {}),
          payload: payloadHex,
        });
        if (out.status !== 'failed' && out.txHash) {
          setTxHash(out.txHash.replace(/^0x/i, '').toLowerCase());
          setParseOk('Transaction submitted.');
          lastErr = null;
          break;
        }
        lastErr = out.error ?? 'Wallet rejected the transaction';
        if (!isStorageMassErrorMessage(lastErr)) break;
      }
      if (lastErr) {
        if (isStorageMassErrorMessage(lastErr) && isSelfTransfer && !highMassMode) {
          throw new Error(
            "Wallet hit Kaspa mass limits (often too many UTXOs). Try: enable “High‑mass mode”, increase amount (self-send only), or compound UTXOs in your wallet."
          );
        }
        throw new Error(lastErr);
      }
      setIdxNonce((n) => n + 1);
    } catch (e) {
      setSendErr(e instanceof Error ? e.message : 'Send failed');
    } finally {
      setBusy(false);
    }
  }

  const explorerTx = txHash ? `https://explorer.kaspa.org/transactions/${txHash}` : null;

  const HelpTip = ({ text }: { text: string }) => (
    <span className="group relative inline-flex align-middle">
      <span className="ml-2 inline-flex h-4 w-4 items-center justify-center rounded-full border border-zinc-300 text-[10px] font-black text-zinc-500 dark:border-zinc-700 dark:text-zinc-400">
        ?
      </span>
      <span className="pointer-events-none absolute left-0 top-full z-50 mt-2 w-[260px] rounded-lg border border-zinc-200 bg-white px-2 py-1.5 text-xs text-zinc-700 opacity-0 shadow-lg transition-opacity group-hover:opacity-100 dark:border-zinc-800 dark:bg-zinc-950 dark:text-zinc-200">
        {text}
      </span>
    </span>
  );

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-10">
          <div className="mb-6">
            <Link href="/protocols" className="text-sm font-bold text-[#02abb8] hover:underline">
              ← Protocols
            </Link>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">kpx broadcast tool</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Build a v1 <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">kpx</code> JSON payload, validate it against{' '}
              <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">/api/kpx/parse</code>, then send a small KAS transfer to any address (often{' '}
              <strong>your own</strong>) with the payload attached so indexers see <code className="rounded bg-zinc-100 px-1 dark:bg-zinc-800">payer == addr</code>.
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="text-sm text-zinc-600 dark:text-zinc-400">
              Wallet:{' '}
              {kaspa.isConnected && owner ? (
                <span className="font-mono text-zinc-900 dark:text-zinc-100">{owner}</span>
              ) : (
                <span className="font-semibold text-amber-700 dark:text-amber-300">Not connected — use the header wallet menu.</span>
              )}
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                Record type
                <select
                  className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as KpxKind)}
                >
                  <option value="pf">kpx/pf — profile</option>
                  <option value="ver">kpx/ver — verified badge</option>
                  <option value="lnk">kpx/lnk — EVM link</option>
                  <option value="cm">kpx/cm — commit</option>
                </select>
              </label>
              <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                net
                <select
                  className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={net}
                  onChange={(e) => setNet(e.target.value as KpxNet)}
                >
                  <option value="mainnet">mainnet</option>
                  <option value="testnet">testnet</option>
                </select>
              </label>
            </div>

            <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
              seq
              <input
                className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={seq}
                onChange={(e) => setSeq(e.target.value)}
                inputMode="numeric"
              />
            </label>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Transfer (carries payload)</div>
              <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  To (Kaspa address)
                  <HelpTip text="Where the KAS is sent. For posting kpx records, sending to yourself is recommended so payer == your addr." />
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="kaspa:…"
                  />
                </label>
                <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Amount (KAS)
                  <HelpTip text="This is a real on-chain transfer. If you send to yourself, you get it back (minus fee). Minimum is 0.0001 KAS so wallets accept payload txs." />
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={amountKas}
                    onChange={(e) => setAmountKas(e.target.value)}
                  />
                </label>
                <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  Priority fee (optional, KAS)
                  <HelpTip text="Some wallets call this “priority fee”. Increasing it can help transactions relay faster and sometimes helps with wallet mass/UTXO edge cases. Leave blank to let the wallet decide." />
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={priorityFeeKas}
                    onChange={(e) => setPriorityFeeKas(e.target.value)}
                    placeholder="0.001"
                  />
                </label>
                <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">
                  <div className="flex items-center justify-between gap-3">
                    <div className="font-bold text-zinc-800 dark:text-zinc-200">
                      High‑mass mode
                      <HelpTip text="If your wallet shows “Storage mass exceeds maximum”, it usually means you have too many small UTXOs. This mode retries (self-send only) with higher amounts so the wallet can pick fewer inputs." />
                    </div>
                    <button
                      type="button"
                      className={`k-control-btn h-8 px-3 text-xs ${highMassMode ? 'border-[#02abb8]/50 bg-[#02abb8]/10 font-black' : ''}`}
                      onClick={() => {
                        setHighMassMode((v) => {
                          const next = !v;
                          try {
                            localStorage.setItem(KPX_HIGH_MASS_MODE_KEY, next ? '1' : '0');
                          } catch {
                            // ignore
                          }
                          return next;
                        });
                      }}
                    >
                      {highMassMode ? 'Enabled' : 'Disabled'}
                    </button>
                  </div>
                  <p className="mt-2 text-xs text-zinc-600 dark:text-zinc-400">
                    Tip: In KasWare, you can also reduce UTXO count via wallet maintenance / compound.
                  </p>
                </div>
              </div>
            </div>

            {kind === 'pf' && (
              <div className="space-y-3">
                <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  op
                  <select
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={pfOp}
                    onChange={(e) => setPfOp(e.target.value as 'set' | 'clear')}
                  >
                    <option value="set">set</option>
                    <option value="clear">clear</option>
                  </select>
                </label>
                {pfOp === 'set' && (
                  <>
                    <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      display (optional)
                      <input
                        className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        value={display}
                        onChange={(e) => setDisplay(e.target.value)}
                      />
                    </label>
                    <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      bio (optional)
                      <textarea
                        className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        rows={2}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </label>
                    <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                      tags (optional, comma-separated)
                      <input
                        className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        value={tagsCsv}
                        onChange={(e) => setTagsCsv(e.target.value)}
                        placeholder="kaspa, builder"
                      />
                    </label>
                  </>
                )}
              </div>
            )}

            {kind === 'ver' && (
              <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                op
                <select
                  className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={verOp}
                  onChange={(e) => setVerOp(e.target.value as 'set' | 'clear')}
                >
                  <option value="set">set</option>
                  <option value="clear">clear</option>
                </select>
              </label>
            )}

            {kind === 'lnk' && (
              <div className="space-y-3">
                <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  op
                  <select
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={lnkOp}
                    onChange={(e) => setLnkOp(e.target.value as 'set' | 'clear')}
                  >
                    <option value="set">set</option>
                    <option value="clear">clear</option>
                  </select>
                </label>
                {lnkOp === 'set' && (
                  <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    EVM address (0x…)
                    <input
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      value={evm}
                      onChange={(e) => setEvm(e.target.value)}
                      placeholder="0x…"
                    />
                  </label>
                )}
              </div>
            )}

            {kind === 'cm' && (
              <div className="space-y-3">
                <div className="grid gap-3 sm:grid-cols-2">
                  <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    op
                    <select
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      value={cmOp}
                      onChange={(e) => setCmOp(e.target.value as 'create' | 'edit')}
                    >
                      <option value="create">create</option>
                      <option value="edit">edit</option>
                    </select>
                  </label>
                  <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                    rt
                    <select
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      value={cmRt}
                      onChange={(e) => setCmRt(e.target.value as KpxResourceTypeCodeV1)}
                    >
                      {KPX_CM_RT_CODES_V1.map((c) => (
                        <option key={c} value={c}>
                          {c}
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  rid
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={cmRid}
                    onChange={(e) => setCmRid(e.target.value)}
                    placeholder="resource id"
                  />
                </label>
                <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  ch (64 hex)
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={cmCh}
                    onChange={(e) => setCmCh(e.target.value)}
                    placeholder="0123…abcd"
                  />
                </label>
                <label className="no-k-style block min-w-0 text-sm font-bold text-zinc-800 dark:text-zinc-200">
                  sv
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={cmSv}
                    onChange={(e) => setCmSv(e.target.value)}
                    inputMode="numeric"
                  />
                </label>
              </div>
            )}

            {previewJson ? (
              <div>
                <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Preview JSON</div>
                <pre className="mt-2 max-h-48 overflow-auto rounded-lg border border-zinc-200 bg-zinc-950 p-3 text-xs text-zinc-100 dark:border-zinc-700">
                  {previewJson}
                </pre>
              </div>
            ) : null}

            {parseOk ? <p className="text-sm font-semibold text-emerald-700 dark:text-emerald-300">{parseOk}</p> : null}
            {parseErr ? <p className="text-sm font-semibold text-red-700 dark:text-red-300">{parseErr}</p> : null}
            {sendErr ? <p className="text-sm font-semibold text-red-700 dark:text-red-300">{sendErr}</p> : null}
            {explorerTx ? (
              <p className="text-sm">
                <a href={explorerTx} className="font-bold text-[#02abb8] hover:underline" target="_blank" rel="noreferrer">
                  View transaction on Kaspa explorer
                </a>
              </p>
            ) : null}

            <div className="flex flex-wrap gap-2">
              <button type="button" className="k-control-btn" onClick={handleValidate} disabled={busy}>
                Validate JSON
              </button>
              <button
                type="button"
                className="k-control-btn border-[#02abb8]/50 bg-[#02abb8]/10 font-black hover:bg-[#02abb8]/20"
                onClick={handleBroadcast}
                disabled={busy}
              >
                {busy ? 'Sending…' : 'Validate & broadcast'}
              </button>
            </div>

            <div className="rounded-xl border border-dashed border-[#02abb8]/30 bg-[#02abb8]/5 p-4 dark:border-[#02abb8]/25 dark:bg-[#02abb8]/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="text-xs font-black uppercase tracking-widest text-[#02abb8]">Reference indexer</div>
                <div className="flex flex-wrap items-center gap-2">
                  {kpxIndex.loading ? (
                    <span className="text-xs font-semibold text-zinc-500">Loading…</span>
                  ) : owner ? (
                    <span className="text-xs text-zinc-500">net={net}</span>
                  ) : null}
                  <button
                    type="button"
                    className="k-control-btn h-8 px-3 text-xs"
                    disabled={!owner || kpxIndex.loading}
                    onClick={() => kpxIndex.refetch()}
                  >
                    Refresh
                  </button>
                </div>
              </div>
              {owner ? (
                <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-3">
                  <label className="no-k-style block min-w-0 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    limit (20–500)
                    <input
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      value={idxLimit}
                      onChange={(e) => setIdxLimit(e.target.value)}
                      inputMode="numeric"
                    />
                  </label>
                  <label className="no-k-style block min-w-0 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    offset (0–50k)
                    <input
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      value={idxOffset}
                      onChange={(e) => setIdxOffset(e.target.value)}
                      inputMode="numeric"
                    />
                  </label>
                  <label className="no-k-style block min-w-0 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                    cm max_resources (1–500)
                    <input
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      value={idxMaxCm}
                      onChange={(e) => setIdxMaxCm(e.target.value)}
                      inputMode="numeric"
                    />
                  </label>
                </div>
              ) : null}
              {!owner ? (
                <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
                  Connect your wallet to load <code className="rounded bg-white/60 px-1 dark:bg-zinc-900/60">/api/kpx/*</code> for the
                  selected net.
                </p>
              ) : kpxIndex.error ? (
                <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300">{kpxIndex.error}</p>
              ) : (
                <div className="mt-3 min-w-0 space-y-3">
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950">
                      <div className="font-black text-zinc-700 dark:text-zinc-300">kpx/pf</div>
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-200 [scrollbar-width:thin]">
                        {kpxIndex.pf
                          ? JSON.stringify(
                              {
                                state: kpxIndex.pf.state,
                                provenance: kpxIndex.pf.provenance,
                                indexed: kpxIndex.pf.indexed,
                                note: kpxIndex.pf.note,
                              },
                              null,
                              2
                            )
                          : '—'}
                      </pre>
                    </div>
                    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950">
                      <div className="font-black text-zinc-700 dark:text-zinc-300">kpx/ver</div>
                      <pre className="mt-2 max-h-40 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-200 [scrollbar-width:thin]">
                        {kpxIndex.ver
                          ? JSON.stringify(
                              {
                                verified: kpxIndex.ver.verified,
                                provenance: kpxIndex.ver.provenance,
                                indexed: kpxIndex.ver.indexed,
                                note: kpxIndex.ver.note,
                              },
                              null,
                              2
                            )
                          : '—'}
                      </pre>
                    </div>
                    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950 sm:col-span-2">
                      <div className="font-black text-zinc-700 dark:text-zinc-300">kpx/lnk</div>
                      <pre className="mt-2 max-h-32 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-200 [scrollbar-width:thin]">
                        {kpxIndex.lnk
                          ? JSON.stringify(
                              {
                                evm: kpxIndex.lnk.evm,
                                provenance: kpxIndex.lnk.provenance,
                                indexed: kpxIndex.lnk.indexed,
                                note: kpxIndex.lnk.note,
                              },
                              null,
                              2
                            )
                          : '—'}
                      </pre>
                    </div>
                    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950 sm:col-span-2">
                      <div className="font-black text-zinc-700 dark:text-zinc-300">kpx/cm summary</div>
                      <pre className="mt-2 max-h-48 overflow-auto whitespace-pre-wrap break-all text-[11px] leading-relaxed text-zinc-800 dark:text-zinc-200 [scrollbar-width:thin]">
                        {kpxIndex.cm
                          ? JSON.stringify(
                              {
                                count: kpxIndex.cm.resources?.length ?? 0,
                                resources: (kpxIndex.cm.resources ?? []).slice(0, 12),
                                indexed: kpxIndex.cm.indexed,
                                note: kpxIndex.cm.note,
                              },
                              null,
                              2
                            )
                          : '—'}
                      </pre>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Fetches use <code className="rounded bg-white/60 px-0.5 dark:bg-zinc-900/60">useKpxIndexer</code> (see{' '}
                    <code className="rounded bg-white/60 px-0.5 dark:bg-zinc-900/60">src/hooks/useKpxIndexer.ts</code>). Adjust limit/offset here, change{' '}
                    <strong>net</strong> at the top of the form, broadcast — then refresh.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
