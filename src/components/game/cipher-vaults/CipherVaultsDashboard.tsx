'use client';

import { useEffect, useMemo, useState } from 'react';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCipherVaults } from '@/hooks/useCipherVaults';
import { CIPHER_TICKET_REDEEM_RATE_POINTS, CIPHER_VAULTS_TREASURY_ADDRESS, CIPHER_VAULT_TIERS, type CipherVaultTierId } from '@/lib/game/cipher-vaults-config';
import { CipherGridPuzzle } from './CipherGridPuzzle';

const TABS = [
  { id: 'overview', label: 'Overview' },
  { id: 'vaults', label: 'Vaults' },
  { id: 'redeem', label: 'Redeem' },
  { id: 'rewards', label: 'Rewards' },
] as const;

type TabId = (typeof TABS)[number]['id'];

export function CipherVaultsDashboard({ featuredImage = '', loreStory = '', gameDescription = '' }: { featuredImage?: string; loreStory?: string; gameDescription?: string }) {
  const { state: walletState } = useKaspaWallet();
  const { state, tickets, canPayWithL1, startRun, submitRun, redeemRefinement, fetchDiamondVeinsRefinementPoints } = useCipherVaults();

  const [tab, setTab] = useState<TabId>('vaults');
  const [tierId, setTierId] = useState<CipherVaultTierId>('t1');
  const [payWith, setPayWith] = useState<'KAS' | 'TICKET'>('KAS');
  const [starting, setStarting] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [puzzle, setPuzzle] = useState<{ size: number; initial: number[]; target: number[]; moveLimit: number } | null>(null);
  const [activeRunId, setActiveRunId] = useState<string | null>(null);
  const [redeemablePoints, setRedeemablePoints] = useState(0);
  const [redeemAmount, setRedeemAmount] = useState(CIPHER_TICKET_REDEEM_RATE_POINTS);
  const [toast, setToast] = useState<string | null>(null);
  const [loreExpanded, setLoreExpanded] = useState(false);
  const [faqOpen, setFaqOpen] = useState(false);

  useEffect(() => {
    if (!walletState.isConnected) return;
    void fetchDiamondVeinsRefinementPoints().then((pts) => setRedeemablePoints(pts));
  }, [walletState.isConnected, fetchDiamondVeinsRefinementPoints, state.version]);

  const tier = useMemo(() => CIPHER_VAULT_TIERS.find((t) => t.id === tierId)!, [tierId]);

  return (
    <div className="grid h-full grid-cols-1 gap-8 lg:grid-cols-12">
      <div className="flex flex-col space-y-6 lg:col-span-8">
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-2xl border border-zinc-200 bg-zinc-100 p-4 text-base dark:border-zinc-800 dark:bg-zinc-900/60">
          <div className="flex flex-wrap items-center gap-6">
            <span className="font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">Cipher Tickets</span>
            <span className="font-bold tabular-nums text-emerald-600 dark:text-emerald-400">
              {tickets.available.toLocaleString()} <span className="text-zinc-500 dark:text-zinc-400 font-semibold">avail</span>
            </span>
            <span className="font-semibold tracking-wide text-zinc-500 dark:text-zinc-400">Treasury</span>
            <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400">{CIPHER_VAULTS_TREASURY_ADDRESS}</span>
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Pay entry on L1 · later claim GRID on L2 via{' '}
            <Link href="/rewards-and-points" className="font-semibold text-emerald-600 underline dark:text-emerald-400">
              Rewards &amp; Points
            </Link>
          </p>
        </div>

        {toast && (
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-500/10 p-4 text-sm font-semibold text-emerald-800 dark:text-emerald-200">
            {toast}
          </div>
        )}

        <div className="flex flex-wrap gap-2 border-b border-zinc-200 pb-2 dark:border-zinc-800">
          {TABS.map((t) => (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className={`rounded-xl px-4 py-2 text-sm font-semibold transition-colors ${
                tab === t.id
                  ? 'bg-emerald-500/20 text-emerald-800 dark:text-emerald-300'
                  : 'text-zinc-600 hover:bg-zinc-100 dark:text-zinc-400 dark:hover:bg-zinc-800/60'
              }`}
            >
              {t.label}
            </button>
          ))}
        </div>

        {tab === 'overview' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">How it works</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
                Krex left encrypted vaults across Kaspaland. Start a run (pay with KAS or a Cipher Ticket). Solve the Cipher Grid within the move limit to record a checkpoint for future GRID distribution.
              </p>
            </div>
            <div className="rounded-2xl border border-zinc-200 bg-zinc-100 p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="text-sm font-semibold text-zinc-800 dark:text-zinc-200 mb-2">Diamond Veins bridge</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Redeem Diamond Veins <strong>refinement points</strong> into Cipher Tickets: <strong>{CIPHER_TICKET_REDEEM_RATE_POINTS} pts</strong> = <strong>1 ticket</strong>.
              </p>
            </div>
          </div>
        )}

        {tab === 'vaults' && (
          <div className="space-y-6">
            <div className="grid gap-3 sm:grid-cols-3">
              {CIPHER_VAULT_TIERS.map((t) => (
                <button
                  key={t.id}
                  type="button"
                  onClick={() => setTierId(t.id)}
                  className={`rounded-2xl border p-4 text-left transition-colors ${
                    tierId === t.id
                      ? 'border-emerald-500/50 bg-emerald-500/10'
                      : 'border-zinc-200 bg-white hover:bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/60 dark:hover:bg-zinc-800/50'
                  }`}
                >
                  <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">{t.label}</p>
                  <p className="mt-1 text-xs text-zinc-500 dark:text-zinc-500">Move limit: {t.moveLimit}</p>
                  <p className="mt-2 text-sm text-zinc-700 dark:text-zinc-300">
                    Entry: <strong>{t.entryKAS}</strong> KAS
                  </p>
                  <p className="text-xs text-emerald-600 dark:text-emerald-400">Preview: {t.gridPreview} GRID · {10 * (t.gridPreview ?? 1)} XP</p>
                </button>
              ))}
            </div>

            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 space-y-4">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm font-semibold text-zinc-800 dark:text-zinc-200">Start a run</p>
                  <p className="text-xs text-zinc-500 dark:text-zinc-500">Pay with KAS or spend 1 ticket.</p>
                </div>
                <div className="flex flex-wrap items-center gap-2">
                  <select
                    value={payWith}
                    onChange={(e) => setPayWith(e.target.value === 'TICKET' ? 'TICKET' : 'KAS')}
                    className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                  >
                    <option value="KAS">Pay with KAS</option>
                    <option value="TICKET">Use 1 ticket ({tickets.available} avail)</option>
                  </select>
                  <button
                    type="button"
                    disabled={starting || (payWith === 'KAS' && !canPayWithL1)}
                    onClick={async () => {
                      setToast(null);
                      setStarting(true);
                      try {
                        const res = await startRun(tierId, payWith);
                        setPuzzle(res.puzzle);
                        setActiveRunId(res.run.runId);
                        setToast('Vault run started. Solve the cipher to submit.');
                      } catch (e: any) {
                        setToast(e?.message || 'Failed to start run');
                      } finally {
                        setStarting(false);
                      }
                    }}
                    className="k-cta-primary h-12 px-5 text-sm disabled:opacity-50 disabled:grayscale"
                  >
                    {starting ? 'Starting…' : 'Start run'}
                  </button>
                </div>
              </div>

              {payWith === 'KAS' && !canPayWithL1 && (
                <p className="text-xs text-amber-600 dark:text-amber-300">
                  Connect with KasWare or Kastle to send L1 KAS entry payments.
                </p>
              )}
            </div>

            {puzzle && activeRunId && (
              <div className="rounded-2xl border border-zinc-200 bg-zinc-50 p-6 dark:border-zinc-800 dark:bg-zinc-900/40">
                <CipherGridPuzzle
                  size={puzzle.size}
                  initial={puzzle.initial}
                  target={puzzle.target}
                  moveLimit={puzzle.moveLimit}
                  onSolved={async (moves) => {
                    setToast(null);
                    setSubmitting(true);
                    try {
                      const res = await submitRun(activeRunId, moves);
                      if (res?.solved) {
                        setToast('Solution verified. Checkpoint recorded.');
                        setPuzzle(null);
                        setActiveRunId(null);
                        setTab('rewards');
                      } else {
                        setToast('Not solved yet (server verification failed).');
                      }
                    } catch (e: any) {
                      setToast(e?.message || 'Submit failed');
                    } finally {
                      setSubmitting(false);
                    }
                  }}
                />
                {submitting && <p className="mt-3 text-xs text-zinc-500 dark:text-zinc-500">Verifying…</p>}
              </div>
            )}
          </div>
        )}

        {tab === 'redeem' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60 space-y-3">
              <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">Redeem Diamond Veins refinement</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Available refinement points (Diamond Veins server state): <strong>{redeemablePoints.toLocaleString()}</strong>
              </p>
              <p className="text-xs text-zinc-500 dark:text-zinc-500">
                Tickets earned are tracked inside Cipher Vaults. This V1 redemption does not burn points in Diamond Veins yet.
              </p>
              <div className="flex flex-wrap items-center gap-2">
                <input
                  type="number"
                  min={CIPHER_TICKET_REDEEM_RATE_POINTS}
                  step={CIPHER_TICKET_REDEEM_RATE_POINTS}
                  value={redeemAmount}
                  onChange={(e) => setRedeemAmount(Math.max(CIPHER_TICKET_REDEEM_RATE_POINTS, Math.floor(Number(e.target.value) || 0)))}
                  className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm dark:border-zinc-800 dark:bg-zinc-950"
                />
                <button
                  type="button"
                  className="k-cta-primary h-11 px-5 text-sm"
                  onClick={async () => {
                    setToast(null);
                    try {
                      const rounded = Math.floor(redeemAmount / CIPHER_TICKET_REDEEM_RATE_POINTS) * CIPHER_TICKET_REDEEM_RATE_POINTS;
                      if (rounded <= 0) throw new Error('Enter a valid amount');
                      await redeemRefinement(rounded);
                      setToast(`Redeemed ${rounded} points into tickets.`);
                    } catch (e: any) {
                      setToast(e?.message || 'Redeem failed');
                    }
                  }}
                >
                  Redeem to tickets
                </button>
              </div>
            </div>
            <div className="rounded-2xl border border-emerald-500/20 bg-emerald-500/10 p-6">
              <p className="text-sm text-zinc-700 dark:text-zinc-200">
                Tickets available: <strong className="text-emerald-700 dark:text-emerald-300">{tickets.available}</strong> (total earned: {tickets.total})
              </p>
            </div>
          </div>
        )}

        {tab === 'rewards' && (
          <div className="space-y-6">
            <div className="rounded-2xl border border-zinc-200 bg-white p-6 dark:border-zinc-800 dark:bg-zinc-900/60">
              <h3 className="mb-2 flex items-center gap-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">Cipher checkpoints</h3>
              <p className="text-sm text-zinc-600 dark:text-zinc-400">
                Your verified clears are recorded as a local+server ledger. Future GRID distribution can use these checkpoints.
              </p>
            </div>
            <div className="overflow-hidden rounded-2xl border border-zinc-200 dark:border-zinc-800">
              <table className="w-full text-left text-sm">
                <thead className="border-b border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/80">
                  <tr>
                    <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">When</th>
                    <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Tier</th>
                    <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Moves</th>
                    <th className="p-3 font-semibold text-zinc-700 dark:text-zinc-300">Entry tx</th>
                  </tr>
                </thead>
                <tbody>
                  {(state.ledger?.length ?? 0) === 0 ? (
                    <tr>
                      <td colSpan={4} className="p-6 text-center text-zinc-500 dark:text-zinc-400">
                        No clears yet. Start a vault run in the Vaults tab.
                      </td>
                    </tr>
                  ) : (
                    [...(state.ledger ?? [])].reverse().map((e) => (
                      <tr key={e.id} className="border-b border-zinc-100 dark:border-zinc-800">
                        <td className="p-3 text-zinc-600 dark:text-zinc-400">{new Date(e.solvedAt).toLocaleString()}</td>
                        <td className="p-3 text-zinc-800 dark:text-zinc-200">{e.tierId}</td>
                        <td className="p-3 tabular-nums text-zinc-600 dark:text-zinc-400">
                          {e.moves}/{e.moveLimit}
                        </td>
                        <td className="p-3 font-mono text-xs text-zinc-500 dark:text-zinc-500">{e.entryTxHash ? e.entryTxHash.slice(0, 10) + '…' : 'ticket'}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>

      <div className="flex flex-col space-y-6 lg:col-span-4">
        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-100 dark:border-zinc-800 dark:bg-zinc-900/50">
          {featuredImage && (
            <div className="relative aspect-video w-full bg-zinc-200 dark:bg-zinc-800">
              <img src={featuredImage} alt="Krex’s Cipher Vaults" className="h-full w-full object-cover" />
            </div>
          )}
          <div className="p-5">
            <h2 className="mb-2 text-lg font-bold text-zinc-900 dark:text-zinc-100">Krex’s Cipher Vaults</h2>
            {gameDescription && (
              <p className="mb-4 border-l-2 border-emerald-500/40 bg-emerald-500/5 py-2 pl-3 pr-2 text-sm leading-relaxed text-zinc-600 dark:bg-emerald-500/10 dark:text-zinc-400">
                {gameDescription}
              </p>
            )}
            {loreStory && (
              <div className="text-sm leading-relaxed text-zinc-600 dark:text-zinc-400">
                {loreExpanded ? (
                  <div className="space-y-2">
                    {loreStory.split(/\n\n+/).map((block, i) => (
                      <p key={i}>{block.trim()}</p>
                    ))}
                  </div>
                ) : (
                  <p>{loreStory.slice(0, 320)}…</p>
                )}
                <button
                  type="button"
                  onClick={() => setLoreExpanded((e) => !e)}
                  className="mt-2 font-semibold text-emerald-600 hover:underline dark:text-emerald-400"
                >
                  {loreExpanded ? 'Show less' : 'Read full story'}
                </button>
              </div>
            )}
          </div>
        </div>

        <div className="overflow-hidden rounded-2xl border border-zinc-200 bg-zinc-50 dark:border-zinc-800 dark:bg-zinc-900/50">
          <button
            type="button"
            onClick={() => setFaqOpen((o) => !o)}
            className="flex w-full items-center justify-between p-4 text-left text-base font-semibold text-zinc-900 transition-colors hover:bg-zinc-100 dark:text-zinc-100 dark:hover:bg-zinc-800/50"
          >
            FAQ &amp; payouts
            <svg className={`h-5 w-5 transition-transform ${faqOpen ? 'rotate-180' : ''}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {faqOpen && (
            <div className="space-y-3 border-t border-zinc-200 px-4 pb-4 pt-2 text-sm text-zinc-600 dark:border-zinc-800 dark:text-zinc-400">
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">What am I earning?</p>
                <p className="mt-1">
                  This demo records checkpoints (runs + clears). GRID distribution is handled elsewhere on Kasplex L2. The ledger here is your audit trail.
                </p>
              </div>
              <div>
                <p className="font-semibold text-zinc-800 dark:text-zinc-300">Tickets</p>
                <p className="mt-1">
                  Redeem Diamond Veins refinement points into Cipher Tickets. Tickets let you enter a run without sending KAS.
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

