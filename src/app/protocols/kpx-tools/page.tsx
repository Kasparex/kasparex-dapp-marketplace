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
import { FieldHint } from '@/components/ui/FieldHint';
import { Tooltip } from '@/components/ui/Tooltip';
import { gameTooltipRich } from '@/components/games/gameTooltipRich';

type KpxKind = 'pf' | 'ver' | 'lnk' | 'cm';

const MIN_SELF_KAS = 0.0001;
const KPX_HIGH_MASS_MODE_KEY = 'kpx-tools-high-mass-mode-v1';

const CM_CONTENT_TYPE_LABELS: Record<KpxResourceTypeCodeV1, string> = {
  vb: 'Blog / article',
  ck: 'Checksum / proof',
  st: 'Structured record',
  dp: 'dApp',
  mg: 'Magazine',
  ad: 'Listing / ad',
  gm: 'Game / module',
};

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
      setParseOk(`Looks good - ready to send (${body.byteLength ?? '?'} bytes).`);
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

  return (
    <div className="flex min-h-screen flex-col">
      <Header />
      <main className="flex-1">
        <div className="mx-auto w-full max-w-3xl p-4 sm:p-6 lg:p-10">
          <div className="mb-6">
            <nav className="text-sm text-zinc-500 dark:text-zinc-400">
              <Link href="/protocols" className="font-bold text-[#02abb8] hover:underline">
                Protocols
              </Link>
              <span className="mx-2 text-zinc-400">/</span>
              <Link href="/protocols/kpx" className="font-bold text-[#02abb8] hover:underline">
                KPX protocol
              </Link>
              <span className="mx-2 text-zinc-400">/</span>
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">Tools</span>
            </nav>
            <h1 className="mt-3 text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100">Post identity updates on Kaspa</h1>
            <p className="mt-2 text-sm text-zinc-600 dark:text-zinc-400">
              Fill in the form, review the preview, then confirm in your wallet. Most people send a small amount <strong>to their own address</strong> so the
              network can attach your update to that payment.
            </p>
          </div>

          <div className="space-y-6 rounded-2xl border border-zinc-200 bg-white p-5 dark:border-zinc-800 dark:bg-zinc-900">
            <div className="flex flex-wrap items-baseline gap-2 text-sm text-zinc-600 dark:text-zinc-400">
              <span className="font-bold text-zinc-800 dark:text-zinc-200">Your wallet</span>
              <FieldHint text="This address is used as the owner of the update. Connect KasWare or Kastle from the header first." />
              <span className="min-w-0">
                {kaspa.isConnected && owner ? (
                  <span className="font-mono text-zinc-900 dark:text-zinc-100">{owner}</span>
                ) : (
                  <span className="font-semibold text-amber-700 dark:text-amber-300">Not connected - use the header wallet menu.</span>
                )}
              </span>
            </div>

            <div className="grid min-w-0 gap-4 sm:grid-cols-2">
              <label className="no-k-style block min-w-0">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">What are you posting?</span>
                  <FieldHint text="Pick the kind of update. Profile is the most common. Advanced users use fingerprints or wallet links." />
                </div>
                <select
                  className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={kind}
                  onChange={(e) => setKind(e.target.value as KpxKind)}
                >
                  <option value="pf">Public profile (name, bio, tags)</option>
                  <option value="ver">Verified badge</option>
                  <option value="lnk">Link to Ethereum address</option>
                  <option value="cm">Content fingerprint (commit)</option>
                </select>
              </label>
              <label className="no-k-style block min-w-0">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Kaspa network</span>
                  <FieldHint text="Mainnet is real money. Testnet is for trying things out without real KAS." />
                </div>
                <select
                  className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={net}
                  onChange={(e) => setNet(e.target.value as KpxNet)}
                >
                  <option value="mainnet">Mainnet (live)</option>
                  <option value="testnet">Testnet (practice)</option>
                </select>
              </label>
            </div>

            <label className="no-k-style block min-w-0">
              <div className="mb-1 flex items-center gap-1.5">
                <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Update number</span>
                <FieldHint text="A counter for your updates. Start at 1 and increase by 1 each time you publish a new version for the same kind of record." />
              </div>
              <input
                className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                value={seq}
                onChange={(e) => setSeq(e.target.value)}
                inputMode="numeric"
              />
            </label>

            <div className="rounded-xl border border-zinc-100 bg-zinc-50 p-4 dark:border-zinc-800 dark:bg-zinc-950/50">
              <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-zinc-500">
                <span>Payment that carries your update</span>
                <FieldHint text="This is a normal KAS transfer from your wallet. The app attaches your update to it. Sending to yourself is the usual way to publish without paying someone else." />
              </div>
              <div className="mt-3 grid min-w-0 gap-3 sm:grid-cols-2">
                <label className="no-k-style block min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Send to (Kaspa address)</span>
                    <FieldHint text="Where the KAS goes. Use your own address for a self-send so the payment and update line up with your wallet." />
                  </div>
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={toAddress}
                    onChange={(e) => setToAddress(e.target.value)}
                    placeholder="kaspa:…"
                  />
                </label>
                <label className="no-k-style block min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Amount (KAS)</span>
                    <FieldHint text="Real KAS leaves your wallet. On a self-send you get it back minus network fees. Minimum 0.0001 KAS so wallets accept the transaction with an attached update." />
                  </div>
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={amountKas}
                    onChange={(e) => setAmountKas(e.target.value)}
                  />
                </label>
                <label className="no-k-style block min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Priority fee (optional)</span>
                    <FieldHint text="Extra fee in KAS for faster relay, if your wallet supports it (KasWare / Kastle). Leave blank to let the wallet choose. Helps some wallets when the network is busy." />
                  </div>
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={priorityFeeKas}
                    onChange={(e) => setPriorityFeeKas(e.target.value)}
                    placeholder="0.001"
                  />
                </label>
                <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 text-sm dark:border-zinc-700 dark:bg-zinc-950">
                  <div className="flex items-center justify-between gap-3">
                    <div className="flex items-center gap-1.5 font-bold text-zinc-800 dark:text-zinc-200">
                      <span>High‑mass mode</span>
                      <FieldHint text="If your wallet says storage mass is too high, you may have many small coins (UTXOs). Turning this on retries a self-send with larger amounts so the wallet can use fewer inputs. You can also compound UTXOs in KasWare." />
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
                <label className="no-k-style block min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Profile action</span>
                    <FieldHint text="Update saves your fields. Clear removes optional fields from your public profile record (wallet still signs the update)." />
                  </div>
                  <select
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={pfOp}
                    onChange={(e) => setPfOp(e.target.value as 'set' | 'clear')}
                  >
                    <option value="set">Update my public profile</option>
                    <option value="clear">Clear my public profile</option>
                  </select>
                </label>
                {pfOp === 'set' && (
                  <>
                    <label className="no-k-style block min-w-0">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Display name (optional)</span>
                        <FieldHint text="Short public name shown with your profile. Leave blank to keep it unchanged on later updates." />
                      </div>
                      <input
                        className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        value={display}
                        onChange={(e) => setDisplay(e.target.value)}
                      />
                    </label>
                    <label className="no-k-style block min-w-0">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Bio (optional)</span>
                        <FieldHint text="A few lines about you or your project. Keep it short; very long text may hit size limits." />
                      </div>
                      <textarea
                        className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                        rows={2}
                        value={bio}
                        onChange={(e) => setBio(e.target.value)}
                      />
                    </label>
                    <label className="no-k-style block min-w-0">
                      <div className="mb-1 flex items-center gap-1.5">
                        <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Topics (optional)</span>
                        <FieldHint text="Comma-separated keywords (for example: kaspa, builder). Spaces around commas are fine." />
                      </div>
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
              <label className="no-k-style block min-w-0">
                <div className="mb-1 flex items-center gap-1.5">
                  <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Verified badge</span>
                  <FieldHint text="Writes an on-chain verified flag for your address. Kasparex and other apps may still apply their own rules before showing a badge in the UI." />
                </div>
                <select
                  className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                  value={verOp}
                  onChange={(e) => setVerOp(e.target.value as 'set' | 'clear')}
                >
                  <option value="set">Turn verified on</option>
                  <option value="clear">Turn verified off</option>
                </select>
              </label>
            )}

            {kind === 'lnk' && (
              <div className="space-y-3">
                <label className="no-k-style block min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Link action</span>
                    <FieldHint text="Link stores an Ethereum address next to your Kaspa address. Unlink removes it from the on-chain record." />
                  </div>
                  <select
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={lnkOp}
                    onChange={(e) => setLnkOp(e.target.value as 'set' | 'clear')}
                  >
                    <option value="set">Link an Ethereum address</option>
                    <option value="clear">Remove linked Ethereum address</option>
                  </select>
                </label>
                {lnkOp === 'set' && (
                  <label className="no-k-style block min-w-0">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Ethereum address</span>
                      <FieldHint text="Standard 0x… address on Ethereum-compatible networks. Double-check - mistakes are permanent on-chain." />
                    </div>
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
                  <label className="no-k-style block min-w-0">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">First publish or update?</span>
                      <FieldHint text="Create is the first time you anchor this item. Edit is a newer version of the same item id and fingerprint line." />
                    </div>
                    <select
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      value={cmOp}
                      onChange={(e) => setCmOp(e.target.value as 'create' | 'edit')}
                    >
                      <option value="create">First time (create)</option>
                      <option value="edit">New version (edit)</option>
                    </select>
                  </label>
                  <label className="no-k-style block min-w-0">
                    <div className="mb-1 flex items-center gap-1.5">
                      <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Content type</span>
                      <FieldHint text="Tells apps what kind of content this fingerprint refers to. The short code is stored on-chain; the label is only for you here." />
                    </div>
                    <select
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      value={cmRt}
                      onChange={(e) => setCmRt(e.target.value as KpxResourceTypeCodeV1)}
                    >
                      {KPX_CM_RT_CODES_V1.map((c) => (
                        <option key={c} value={c}>
                          {CM_CONTENT_TYPE_LABELS[c]} ({c})
                        </option>
                      ))}
                    </select>
                  </label>
                </div>
                <label className="no-k-style block min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Item id</span>
                    <FieldHint text="Your stable name for this piece of content (for example article slug or product id). Use the same id when publishing updates." />
                  </div>
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-sm text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={cmRid}
                    onChange={(e) => setCmRid(e.target.value)}
                    placeholder="my-article-v1"
                  />
                </label>
                <label className="no-k-style block min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Fingerprint (64 hex characters)</span>
                    <FieldHint text="A content hash you already computed - exactly 64 lowercase hex characters (256 bits). This is the tamper-evident fingerprint apps will compare against." />
                  </div>
                  <input
                    className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                    value={cmCh}
                    onChange={(e) => setCmCh(e.target.value)}
                    placeholder="0123…abcd"
                  />
                </label>
                <label className="no-k-style block min-w-0">
                  <div className="mb-1 flex items-center gap-1.5">
                    <span className="text-sm font-bold text-zinc-800 dark:text-zinc-200">Fingerprint version</span>
                    <FieldHint text="Whole number starting at 1. Increase when you publish a new version of the same item and fingerprint line." />
                  </div>
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
                <div className="flex items-center gap-1.5">
                  <div className="text-xs font-black uppercase tracking-widest text-zinc-500">Technical preview</div>
                  <FieldHint text="Exact payload your wallet will attach to the payment. You do not need to edit this by hand." />
                </div>
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
              <Tooltip
                side="top"
                content={gameTooltipRich(
                  'Validate only',
                  'Checks your inputs and server rules. No KAS is sent.',
                )}
              >
                <button type="button" className="k-control-btn" onClick={handleValidate} disabled={busy}>
                  Check before sending
                </button>
              </Tooltip>
              <Tooltip
                side="top"
                content={gameTooltipRich(
                  'Sign & broadcast',
                  'Builds the update, validates it, then opens your wallet to sign a real KAS transfer with the update attached.',
                )}
              >
                <button
                  type="button"
                  className="k-control-btn border-[#02abb8]/50 bg-[#02abb8]/10 font-black hover:bg-[#02abb8]/20"
                  onClick={handleBroadcast}
                  disabled={busy}
                >
                  {busy ? 'Waiting for wallet…' : 'Sign & send in wallet'}
                </button>
              </Tooltip>
            </div>

            <div className="rounded-xl border border-dashed border-[#02abb8]/30 bg-[#02abb8]/5 p-4 dark:border-[#02abb8]/25 dark:bg-[#02abb8]/10">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <div className="flex items-center gap-1.5 text-xs font-black uppercase tracking-widest text-[#02abb8]">
                  <span>Live readout (advanced)</span>
                  <FieldHint text="Shows what the Kasparex indexer last saw for your address on the network you selected. Useful after you send an update." />
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  {kpxIndex.loading ? (
                    <span className="text-xs font-semibold text-zinc-500">Loading…</span>
                  ) : owner ? (
                    <span className="text-xs text-zinc-500">Network: {net}</span>
                  ) : null}
                  <Tooltip
                    side="left"
                    content={gameTooltipRich('Refresh indexer readout', 'Fetch the latest Kasparex indexer snapshot again for your address.')}
                  >
                    <button
                      type="button"
                      className="k-control-btn h-8 px-3 text-xs"
                      disabled={!owner || kpxIndex.loading}
                      onClick={() => kpxIndex.refetch()}
                    >
                      Refresh
                    </button>
                  </Tooltip>
                </div>
              </div>
              {owner ? (
                <div className="mt-3 grid min-w-0 gap-2 sm:grid-cols-3">
                  <label className="no-k-style block min-w-0">
                    <div className="mb-1 flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                      <span>How many rows</span>
                      <FieldHint text="Indexer page size (20–500). Higher values load more data at once." side="top" />
                    </div>
                    <input
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      value={idxLimit}
                      onChange={(e) => setIdxLimit(e.target.value)}
                      inputMode="numeric"
                    />
                  </label>
                  <label className="no-k-style block min-w-0">
                    <div className="mb-1 flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                      <span>Skip first rows</span>
                      <FieldHint text="Pagination offset (0–50000). Use with “How many rows” to page through older items." side="top" />
                    </div>
                    <input
                      className="mt-1 w-full min-w-0 rounded-lg border border-zinc-200 bg-white px-2 py-1.5 font-mono text-xs text-zinc-900 dark:border-zinc-700 dark:bg-zinc-950 dark:text-zinc-100"
                      value={idxOffset}
                      onChange={(e) => setIdxOffset(e.target.value)}
                      inputMode="numeric"
                    />
                  </label>
                  <label className="no-k-style block min-w-0">
                    <div className="mb-1 flex items-center gap-1 text-[11px] font-bold text-zinc-600 dark:text-zinc-300">
                      <span>Max fingerprints</span>
                      <FieldHint text="Caps how many content fingerprints (commits) are returned in one response (1–500)." side="top" />
                    </div>
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
                  Connect your wallet to load the latest indexed data for the network you selected.
                </p>
              ) : kpxIndex.error ? (
                <p className="mt-2 text-sm font-semibold text-red-700 dark:text-red-300">{kpxIndex.error}</p>
              ) : (
                <div className="mt-3 min-w-0 space-y-3">
                  <div className="grid min-w-0 gap-3 sm:grid-cols-2">
                    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950">
                      <div className="flex items-center gap-1.5 font-black text-zinc-700 dark:text-zinc-300">
                        <span>Profile</span>
                        <FieldHint text="Indexed public profile fields for your address." />
                      </div>
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
                          : '-'}
                      </pre>
                    </div>
                    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950">
                      <div className="flex items-center gap-1.5 font-black text-zinc-700 dark:text-zinc-300">
                        <span>Verified</span>
                        <FieldHint text="Indexed verified flag for your address." />
                      </div>
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
                          : '-'}
                      </pre>
                    </div>
                    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950 sm:col-span-2">
                      <div className="flex items-center gap-1.5 font-black text-zinc-700 dark:text-zinc-300">
                        <span>Ethereum link</span>
                        <FieldHint text="Indexed link between your Kaspa address and an Ethereum-style address." />
                      </div>
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
                          : '-'}
                      </pre>
                    </div>
                    <div className="min-w-0 rounded-lg border border-zinc-200 bg-white p-3 text-xs dark:border-zinc-700 dark:bg-zinc-950 sm:col-span-2">
                      <div className="flex items-center gap-1.5 font-black text-zinc-700 dark:text-zinc-300">
                        <span>Content fingerprints</span>
                        <FieldHint text="Summary of anchored content hashes (commits) seen for your address." />
                      </div>
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
                          : '-'}
                      </pre>
                    </div>
                  </div>
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Tip: after you send, wait a moment and press Refresh. Change the network at the top if you posted on testnet instead of mainnet.
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
