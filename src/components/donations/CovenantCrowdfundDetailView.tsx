'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
import { normalizeAddr } from '@/lib/covenant/utils';
import type { CrowdfundCampaign } from '@/lib/covenant/crowdfund-types';
import {
  covenantCampaignGoalKas,
  covenantCampaignProgress,
  covenantCampaignRaisedKas,
  covenantCampaignBackerCount,
  covenantCampaignIsActive,
} from '@/lib/donations/covenantCrowdfund';
import {
  CovenantError,
  covenantInputClass,
  covenantPanelClass,
  covenantSmallInputClass,
  covenantSecondaryBtnClass,
  shortKaspaAddr,
} from '@/components/dapps/covenant/CovenantWidgetUi';

export function CovenantCrowdfundDetailView({ campaign }: { campaign: CrowdfundCampaign }) {
  const { state } = useKaspaWallet();
  const { pledge, claimFunds, refund, error, refresh } = useCovenantCrowdfund();
  const [pledgeKas, setPledgeKas] = useState('');
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  const raised = covenantCampaignRaisedKas(campaign);
  const goal = covenantCampaignGoalKas(campaign);
  const pct = covenantCampaignProgress(campaign);
  const backers = covenantCampaignBackerCount(campaign);
  const isLive = covenantCampaignIsActive(campaign);
  const isCreator =
    state.address && normalizeAddr(state.address) === normalizeAddr(campaign.creator);

  const handlePledge = async () => {
    setBusy(true);
    try {
      await pledge(campaign.id, parseFloat(pledgeKas));
      setPledgeKas('');
      await refresh();
    } finally {
      setBusy(false);
    }
  };

  if (!state.isConnected) {
    return (
      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-8 text-center text-zinc-500 dark:text-zinc-400">
        Connect your Kaspa wallet to pledge or manage this campaign.
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {error ? <CovenantError message={error} /> : null}

      <div className="rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-4">
        <div className="flex flex-wrap items-start justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400 mb-1">
              L1 Covenant · Simulator
            </p>
            <h1 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100">{campaign.title}</h1>
          </div>
          <span className="text-xs uppercase tracking-wide px-2 py-1 rounded bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400">
            {campaign.status}
          </span>
        </div>

        {campaign.memo ? (
          <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed">{campaign.memo}</p>
        ) : null}

        <div className="h-3 bg-zinc-200 dark:bg-zinc-800 rounded-full overflow-hidden">
          <div className="h-full bg-emerald-600 transition-all" style={{ width: `${pct}%` }} />
        </div>
        <div className="flex flex-wrap justify-between gap-2 text-sm">
          <span className="font-semibold text-zinc-900 dark:text-zinc-100">
            {raised.toFixed(4)} / {goal.toFixed(4)} KAS ({pct.toFixed(0)}%)
          </span>
          <span className="text-zinc-500">
            {backers} backer{backers === 1 ? '' : 's'}
          </span>
        </div>
        <p className="text-xs text-zinc-500">
          Creator {shortKaspaAddr(campaign.creator)} · deadline {new Date(campaign.deadline).toLocaleString()}
        </p>
        <p className="text-xs text-amber-700 dark:text-amber-300 bg-amber-500/10 border border-amber-500/30 rounded-lg px-3 py-2">
          Prototype: campaign state is stored in this browser until Kaspa covenant wallets go live. Other visitors will
          not see it unless they use the same device.
        </p>
      </div>

      {isLive && (
        <div className={covenantPanelClass}>
          <label className="block text-sm font-medium text-zinc-700 dark:text-zinc-300 mb-2">
            Pledge KAS (min {minKas})
          </label>
          <div className="flex gap-2">
            <input
              type="number"
              min={minKas}
              step="0.01"
              className={covenantSmallInputClass}
              placeholder="Amount"
              value={pledgeKas}
              onChange={(e) => setPledgeKas(e.target.value)}
            />
            <button
              type="button"
              disabled={busy || !pledgeKas}
              onClick={() => void handlePledge()}
              className="px-5 py-2 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50 shrink-0"
            >
              {busy ? '...' : 'Pledge'}
            </button>
          </div>
        </div>
      )}

      {isCreator && campaign.status === 'succeeded' && !campaign.claimedAt && (
        <button
          type="button"
          disabled={busy}
          onClick={() => void claimFunds(campaign.id)}
          className="w-full py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 disabled:opacity-50"
        >
          Claim raised funds
        </button>
      )}

      {campaign.status === 'failed' &&
        campaign.pledges
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
              disabled={busy}
              onClick={() => void refund(campaign.id, p.id)}
              className={covenantSecondaryBtnClass}
            >
              Refund {sompiToKasNumber(p.amountSompi)} KAS
            </button>
          ))}

      <p className="text-center text-sm">
        <Link href="/donations" className="text-emerald-600 dark:text-emerald-400 hover:underline">
          ← All CrowdKAS campaigns
        </Link>
      </p>
    </div>
  );
}
