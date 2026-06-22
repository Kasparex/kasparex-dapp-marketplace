'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
import { normalizeAddr } from '@/lib/covenant/utils';
import type { CrowdfundCampaign } from '@/lib/covenant/crowdfund-types';
import {
  covenantCampaignBackerCount,
  covenantCampaignGoalKas,
  covenantCampaignIsActive,
  covenantCampaignProgress,
  covenantCampaignRaisedKas,
} from '@/lib/donations/covenantCrowdfund';
import { CampaignEndCountdown } from '@/components/donations/CampaignEndCountdown';
import {
  CrowdKasError,
  CrowdKasFieldLabel,
  crowdkasCardClass,
  crowdkasInputClass,
  crowdkasPrimaryBtnClass,
  crowdkasSecondaryBtnClass,
  crowdkasSmallInputClass,
} from '@/components/donations/CrowdKasUi';
import { shortKaspaAddr } from '@/components/dapps/covenant/CovenantWidgetUi';
import { getAddressExplorerUrl } from '@/lib/walletUi';

export function CovenantCrowdfundRightColumn({ campaign }: { campaign: CrowdfundCampaign }) {
  const { state } = useKaspaWallet();
  const { pledge, claimFunds, refund, error, refresh } = useCovenantCrowdfund();
  const [pledgeKas, setPledgeKas] = useState('');
  const [busy, setBusy] = useState(false);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  const raised = covenantCampaignRaisedKas(campaign);
  const goal = covenantCampaignGoalKas(campaign);
  const progress = covenantCampaignProgress(campaign);
  const backers = covenantCampaignBackerCount(campaign);
  const isLive = covenantCampaignIsActive(campaign);
  const deadlineSec = Math.floor(campaign.deadline / 1000);
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

  const activePledges = campaign.pledges.filter((p) => !p.refunded);

  return (
    <div className="flex flex-col gap-6">
      <div id="crowdkas-donate" className={`${crowdkasCardClass} scroll-mt-28 space-y-4`}>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Pledge KAS</h3>
        {!state.isConnected ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">
            Connect your Kaspa wallet to pledge or manage this campaign.
          </p>
        ) : isLive ? (
          <>
            {error ? <CrowdKasError message={error} /> : null}
            <CrowdKasFieldLabel
              label={`Amount (KAS, min ${minKas})`}
              htmlFor="ck-pledge-amount"
              tooltip="Your pledge counts toward the funding goal. If the goal is not met by the deadline, you can refund."
            />
            <div className="flex gap-2">
              <input
                id="ck-pledge-amount"
                type="number"
                min={minKas}
                step="0.01"
                className={crowdkasSmallInputClass}
                placeholder="0.1"
                value={pledgeKas}
                onChange={(e) => setPledgeKas(e.target.value)}
              />
              <button
                type="button"
                disabled={busy || !pledgeKas}
                onClick={() => void handlePledge()}
                className="px-5 py-2 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50 shrink-0"
              >
                {busy ? '...' : 'Pledge'}
              </button>
            </div>
          </>
        ) : (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">This campaign is no longer accepting pledges.</p>
        )}

        {isCreator && campaign.status === 'succeeded' && !campaign.claimedAt && (
          <button
            type="button"
            disabled={busy}
            onClick={() => void claimFunds(campaign.id)}
            className={crowdkasPrimaryBtnClass}
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
                className={crowdkasSecondaryBtnClass}
              >
                Refund {sompiToKasNumber(p.amountSompi)} KAS
              </button>
            ))}
      </div>

      <div className={crowdkasCardClass}>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Campaign summary</h3>
        <dl className="space-y-2 text-sm">
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Raised</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{raised.toFixed(4)} KAS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Target</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{goal.toFixed(4)} KAS</span>
          </div>
          <div className="flex justify-between">
            <span className="text-zinc-500 dark:text-zinc-400">Backers</span>
            <span className="font-medium text-zinc-900 dark:text-zinc-100">{backers}</span>
          </div>
        </dl>
        <div className="mt-3 w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
          <div
            className="h-full bg-emerald-500 rounded-full transition-all"
            style={{ width: `${Math.min(progress, 100)}%` }}
          />
        </div>
        <div className="mt-4 pt-3 border-t border-zinc-200 dark:border-zinc-700">
          <CampaignEndCountdown
            deadlineSec={deadlineSec}
            compact
            showTimeProgressBar
            timeProgressFillClassName="bg-sky-500 dark:bg-sky-400"
          />
        </div>
      </div>

      <div id="crowdkas-supporters" className={`${crowdkasCardClass} scroll-mt-28`}>
        <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 mb-3">Backers</h3>
        {activePledges.length === 0 ? (
          <p className="text-sm text-zinc-500 dark:text-zinc-400">No pledges yet. Be the first to back this campaign.</p>
        ) : (
          <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
            {activePledges.map((p) => {
              const explorer = getAddressExplorerUrl({ kind: 'kaspa-l1', address: p.backer });
              return (
                <li key={p.id} className="flex justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2">
                  {explorer ? (
                    <a
                      href={explorer}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="font-mono text-xs text-emerald-700 dark:text-emerald-300 hover:underline truncate"
                    >
                      {shortKaspaAddr(p.backer)}
                    </a>
                  ) : (
                    <span className="font-mono text-xs text-zinc-600 dark:text-zinc-400 truncate">
                      {shortKaspaAddr(p.backer)}
                    </span>
                  )}
                  <span className="font-medium text-zinc-900 dark:text-zinc-100 shrink-0">
                    {sompiToKasNumber(p.amountSompi)} KAS
                  </span>
                </li>
              );
            })}
          </ul>
        )}
      </div>
    </div>
  );
}
