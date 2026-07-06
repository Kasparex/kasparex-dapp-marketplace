'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
import { normalizeAddr } from '@/lib/covenant/utils';
import {
  CovenantTabs,
  CovenantFieldLabel,
  CovenantError,
  CovenantHowItWorks,
  covenantInputClass,
  covenantPanelClass,
  covenantCardClass,
  covenantSmallInputClass,
  covenantPrimaryBtnClass,
  covenantSecondaryBtnClass,
  shortKaspaAddr,
} from '@/components/dapps/covenant/CovenantWidgetUi';
import { KpxCovenantDisconnected, KpxCovenantShell } from '@/components/dapps/covenant/KpxCovenantShell';

type TabId = 'browse' | 'create' | 'about';

export function CovenantCrowdfundWidget() {
  const { state } = useKaspaWallet();
  const { allCampaigns, loading, error, createCampaign, pledge, claimFunds, refund, refresh, runtimeMode, effectiveMode } =
    useCovenantCrowdfund();
  const [tab, setTab] = useState<TabId>('browse');
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [goalKas, setGoalKas] = useState('5');
  const [deadline, setDeadline] = useState('');
  const [pledgeAmounts, setPledgeAmounts] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  if (!state.isConnected) {
    return <KpxCovenantDisconnected template="crowdfund" />;
  }

  const handleCreate = async () => {
    if (!deadline) return;
    setBusy(true);
    try {
      await createCampaign({
        title,
        memo,
        goalKas: parseFloat(goalKas),
        deadline: new Date(deadline),
      });
      setTab('browse');
    } finally {
      setBusy(false);
    }
  };

  return (
    <KpxCovenantShell template="crowdfund" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>

      <CovenantTabs
        tabs={[
          { id: 'browse' as const, label: 'Campaigns' },
          { id: 'create' as const, label: 'Launch' },
          { id: 'about' as const, label: 'How it works' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {error && <CovenantError message={error} />}

      {tab === 'create' && (
        <div className={covenantPanelClass}>
          <div>
            <CovenantFieldLabel
              label="Campaign title"
              htmlFor="crowdfund-title"
              tooltip="A short name backers will see in the campaign list."
            />
            <input
              id="crowdfund-title"
              className={covenantInputClass}
              placeholder="e.g. Community art drop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>

          <div>
            <CovenantFieldLabel
              label={`Funding goal (KAS, min ${minKas})`}
              htmlFor="crowdfund-goal"
              tooltip="The campaign succeeds only if this amount is pledged before the deadline."
            />
            <input
              id="crowdfund-goal"
              type="number"
              min={minKas}
              step="0.01"
              className={covenantInputClass}
              placeholder="Goal in KAS"
              value={goalKas}
              onChange={(e) => setGoalKas(e.target.value)}
            />
          </div>

          <div>
            <CovenantFieldLabel
              label="Deadline"
              htmlFor="crowdfund-deadline"
              tooltip="After this date, no new pledges are accepted. The goal must be met by then for the creator to claim."
            />
            <input
              id="crowdfund-deadline"
              type="datetime-local"
              className={covenantInputClass}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>

          <div>
            <CovenantFieldLabel
              label="Description (optional)"
              htmlFor="crowdfund-memo"
              tooltip="Tell backers what the raise is for."
            />
            <input
              id="crowdfund-memo"
              className={covenantInputClass}
              placeholder="What are you raising for?"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>

          <button
            type="button"
            disabled={busy || !title || !deadline}
            onClick={() => void handleCreate()}
            className={covenantPrimaryBtnClass}
          >
            {busy ? 'Creating...' : 'Create campaign'}
          </button>
        </div>
      )}

      {tab === 'browse' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center">
            <span className="kx-body">
              {allCampaigns.length} campaign{allCampaigns.length === 1 ? '' : 's'}
            </span>
            <button
              type="button"
              className="text-xs text-[#02abb8] hover:underline"
              onClick={() => void refresh()}
            >
              Refresh
            </button>
          </div>
          {loading && !allCampaigns.length ? (
            <p className="text-center text-zinc-500 py-8">Loading...</p>
          ) : allCampaigns.length === 0 ? (
            <p className="text-center text-zinc-500 py-8">No campaigns yet. Launch the first one.</p>
          ) : (
            allCampaigns.map((c) => {
              const raised = sompiToKasNumber(c.raisedSompi);
              const goal = sompiToKasNumber(c.goalSompi);
              const pct = goal > 0 ? Math.min(100, (raised / goal) * 100) : 0;
              const isCreator =
                state.address && normalizeAddr(state.address) === normalizeAddr(c.creator);
              return (
                <div key={c.id} className={covenantCardClass}>
                  <div className="flex justify-between font-medium text-zinc-900 dark:text-zinc-100">
                    <span>{c.title}</span>
                    <span className="text-xs uppercase tracking-wide text-zinc-500">{c.status}</span>
                  </div>
                  {c.memo ? <p className="text-zinc-600 dark:text-zinc-400">{c.memo}</p> : null}
                  <div className="h-2 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                    <div className="h-full bg-[#02abb8] transition-all" style={{ width: `${pct}%` }} />
                  </div>
                  <p>
                    {raised.toFixed(4)} / {goal} KAS ({pct.toFixed(0)}%)
                  </p>
                  <p className="text-xs text-zinc-500">
                    Creator {shortKaspaAddr(c.creator)} · ends {new Date(c.deadline).toLocaleString()}
                  </p>
                  {c.status === 'funding' && (
                    <div className="flex gap-2 pt-1">
                      <input
                        type="number"
                        min={minKas}
                        step="0.01"
                        className={covenantSmallInputClass}
                        placeholder="Pledge KAS"
                        value={pledgeAmounts[c.id] ?? ''}
                        onChange={(e) =>
                          setPledgeAmounts((p) => ({ ...p, [c.id]: e.target.value }))
                        }
                      />
                      <button
                        type="button"
                        className="px-4 py-2 bg-[#02abb8] text-white rounded-lg text-sm font-medium hover:bg-[#028a94] shrink-0"
                        onClick={() =>
                          void pledge(c.id, parseFloat(pledgeAmounts[c.id] || '0')).then(() =>
                            setPledgeAmounts((p) => ({ ...p, [c.id]: '' }))
                          )
                        }
                      >
                        Pledge
                      </button>
                    </div>
                  )}
                  {isCreator && c.status === 'succeeded' && !c.claimedAt && (
                    <button
                      type="button"
                      className={covenantSecondaryBtnClass}
                      onClick={() => void claimFunds(c.id)}
                    >
                      Claim raised funds
                    </button>
                  )}
                  {c.status === 'failed' &&
                    c.pledges
                      .filter(
                        (p) =>
                          !p.refunded &&
                          state.address &&
                          normalizeAddr(p.backer) === normalizeAddr(state.address)
                      )
                      .map((p) => (
                        <button
                          key={p.id}
                          type="button"
                          className={`${covenantSecondaryBtnClass} mt-2 text-xs`}
                          onClick={() => void refund(c.id, p.id)}
                        >
                          Refund {sompiToKasNumber(p.amountSompi)} KAS
                        </button>
                      ))}
                </div>
              );
            })
          )}
        </div>
      )}

      {tab === 'about' && (
        <CovenantHowItWorks>
          <p>
            Covenant Crowdfund is an all-or-nothing raise: money only moves to the creator if enough people pledge
            before the deadline.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>Set a goal and deadline</strong>: backers know exactly what has to happen for the campaign to
              succeed.
            </li>
            <li>
              <strong>Pledge KAS</strong>: contributions are tracked on-chain style rules (simulated in this
              prototype).
            </li>
            <li>
              <strong>Goal met</strong>: the creator claims the pooled amount.
            </li>
            <li>
              <strong>Goal missed</strong>: backers can request refunds instead of losing funds to a failed project.
            </li>
          </ul>
          <p className="text-xs text-zinc-500">
            Useful for launches, community drops, charity drives, or any raise where trust matters.
          </p>
        </CovenantHowItWorks>
      )}
    </KpxCovenantShell>
  );
}
