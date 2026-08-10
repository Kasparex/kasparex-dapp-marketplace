'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG, sompiToKasNumber } from '@/lib/covenant';
import { normalizeAddr } from '@/lib/covenant/utils';
import type { CrowdfundCampaign, CrowdfundTier } from '@/lib/covenant/crowdfund-types';
import {
  covenantCampaignBackerCount,
  covenantCampaignGoalKas,
  covenantCampaignIsActive,
  covenantCampaignProgress,
  covenantCampaignRaisedKas,
} from '@/lib/donations/covenantCrowdfund';
import { CampaignEndCountdown } from '@/components/donations/CampaignEndCountdown';
import {
  CrowdKasFieldLabel,
  crowdkasCardClass,
  crowdkasPrimaryBtnClass,
  crowdkasSecondaryBtnClass,
  crowdkasSmallInputClass,
} from '@/components/donations/CrowdKasUi';
import { shortKaspaAddr } from '@/components/dapps/covenant/CovenantWidgetUi';
import { getAddressExplorerUrl } from '@/lib/walletUi';
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { quoteVDonateL1Pledge } from '@/lib/donations/l1PledgePayment';
import { findCrowdfundTier, sortTiersByMinKas } from '@/lib/donations/tiers';
import { useHubWalletGate } from '@/hooks/useHubWalletGate';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { evaluateHubAccess, getHubGateMessage } from '@/lib/hub/access';
import { VDonateRewardTierList } from '@/components/donations/VDonateRewardTierList';
import { Tooltip } from '@/components/ui/Tooltip';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

export function CovenantCrowdfundRightColumn({
  campaign,
  selectedTierId,
  onSelectedTierIdChange,
}: {
  campaign: CrowdfundCampaign;
  selectedTierId?: string | null;
  onSelectedTierIdChange?: (tierId: string | null) => void;
}) {
  const { state } = useKaspaWallet();
  const { pledge, claimFunds, refund, refresh } = useCovenantCrowdfund();
  const [pledgeKas, setPledgeKas] = useState('');
  const [busy, setBusy] = useState(false);
  const [localTierId, setLocalTierId] = useState<string | null>(null);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;
  const { l1Modal, closeL1Modal, promptHubGate } = useHubWalletGate();

  const tierId = selectedTierId !== undefined ? selectedTierId : localTierId;
  const setTierId = (id: string | null) => {
    onSelectedTierIdChange?.(id);
    setLocalTierId(id);
  };

  const access = useMemo(
    () =>
      evaluateHubAccess({
        requirement: { layer: 'L1' },
        isKaspaConnected: Boolean(state.isConnected && state.address),
        isEvmConnected: false,
      }),
    [state.isConnected, state.address],
  );

  const requireWallet = () => {
    if (access.isOpenable) return true;
    promptHubGate(
      { gateReason: access.reason, isOpenable: false },
      {
        title: 'Connect Kaspa wallet',
        name: campaign.title,
        message: getHubGateMessage(access.reason, access.requiredChainNames),
        networkBadge: { layer: 'L1', label: 'Kaspa' },
      },
    );
    return false;
  };

  const raised = covenantCampaignRaisedKas(campaign);
  const goal = covenantCampaignGoalKas(campaign);
  const progress = covenantCampaignProgress(campaign);
  const backers = covenantCampaignBackerCount(campaign);
  const isLive = covenantCampaignIsActive(campaign);
  const deadlineSec = Math.floor(campaign.deadline / 1000);
  const isCreator =
    state.address && normalizeAddr(state.address) === normalizeAddr(campaign.creator);

  const tiers = useMemo(() => sortTiersByMinKas(campaign.tiers ?? []), [campaign.tiers]);
  const selectedTier = findCrowdfundTier(campaign.tiers, tierId);
  const effectiveMin = selectedTier ? Math.max(minKas, selectedTier.minKas) : minKas;

  const pledgeNum = parseFloat(pledgeKas);
  const quote =
    Number.isFinite(pledgeNum) && pledgeNum > 0 ? quoteVDonateL1Pledge(pledgeNum) : null;

  const runPledge = async (amount: number, nextTierId?: string | null) => {
    if (!requireWallet()) return;
    setBusy(true);
    try {
      await pledge(campaign.id, amount, nextTierId ?? undefined);
      setPledgeKas('');
      await refresh();
    } catch {
      /* hook toasts */
    } finally {
      setBusy(false);
    }
  };

  const handlePledge = async () => {
    await runPledge(parseFloat(pledgeKas), tierId);
  };

  const handleTierPledge = async (tier: CrowdfundTier) => {
    setTierId(tier.id);
    setPledgeKas(String(tier.minKas));
    await runPledge(tier.minKas, tier.id);
  };

  const handleClaim = async () => {
    setBusy(true);
    try {
      await claimFunds(campaign.id);
      await refresh();
    } catch {
      /* hook toasts */
    } finally {
      setBusy(false);
    }
  };

  const handleRefund = async (pledgeId: string) => {
    setBusy(true);
    try {
      await refund(campaign.id, pledgeId);
      await refresh();
    } catch {
      /* hook toasts */
    } finally {
      setBusy(false);
    }
  };

  const activePledges = campaign.pledges.filter((p) => !p.refunded);

  return (
    <>
      <HubAsideRail
        adSlotId="HALO_DONATIONS_RIGHT"
        adId="ad-slot-vdonate-covenant-rail"
        className="gap-6"
      >
        <div id="vdonate-donate" className={`${crowdkasCardClass} space-y-4`}>
          <Tooltip content="Each pledge locks KAS in a Kaspa L1 covenant UTXO until claim (goal met) or refund (goal missed).">
            <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100 cursor-help w-fit border-b border-dotted border-zinc-400/60">
              Pledge KAS
            </h3>
          </Tooltip>

          {!state.isConnected ? (
            <div className="space-y-3">
              <p className="kx-body">Connect your Kaspa wallet to pledge or manage this campaign.</p>
              <button type="button" onClick={() => requireWallet()} className={crowdkasPrimaryBtnClass}>
                Connect Kaspa wallet
              </button>
            </div>
          ) : isLive ? (
            <>
              {selectedTier ? (
                <p className="text-xs text-emerald-700 dark:text-emerald-300">
                  Selected reward: <span className="font-semibold">{selectedTier.title}</span> (min{' '}
                  {selectedTier.minKas} KAS)
                </p>
              ) : null}
              <CrowdKasFieldLabel
                label={`Amount (KAS, min ${effectiveMin})`}
                htmlFor="ck-pledge-amount"
                tooltip="Your pledge locks into an L1 covenant. A Hub platform fee is paid on the multi-output KAS rail."
              />
              <div className="flex gap-2">
                <input
                  id="ck-pledge-amount"
                  type="number"
                  min={effectiveMin}
                  step="0.01"
                  className={crowdkasSmallInputClass}
                  placeholder={String(effectiveMin)}
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
              {quote ? (
                <p className="text-xs text-zinc-500 dark:text-zinc-400">
                  You pay ~{quote.totalKas} KAS ({quote.pledgeKas} pledge + {quote.platformFeeKas} fee).
                </p>
              ) : null}
            </>
          ) : (
            <p className="kx-body">This campaign is no longer accepting pledges.</p>
          )}

          {isCreator && campaign.status === 'succeeded' && !campaign.claimedAt ? (
            <button
              type="button"
              disabled={busy}
              onClick={() => void handleClaim()}
              className={crowdkasPrimaryBtnClass}
            >
              Claim raised funds
            </button>
          ) : null}

          {campaign.status === 'failed'
            ? campaign.pledges
                .filter(
                  (p) =>
                    !p.refunded &&
                    state.address &&
                    normalizeAddr(p.backer) === normalizeAddr(state.address),
                )
                .map((p) => (
                  <button
                    key={p.id}
                    type="button"
                    disabled={busy}
                    onClick={() => void handleRefund(p.id)}
                    className={crowdkasSecondaryBtnClass}
                  >
                    Refund {sompiToKasNumber(p.amountSompi)} KAS
                  </button>
                ))
            : null}
        </div>

        {tiers.length > 0 ? (
          <div className={`${crowdkasCardClass} space-y-4`}>
            <DAppSectionHeader title="Rewards" className="mb-0" />
            <p className="kx-body text-xs -mt-2">
              Choose a reward tier to pledge its minimum. Includes platform fee on confirm.
            </p>
            <VDonateRewardTierList
              tiers={tiers}
              selectedTierId={tierId}
              onSelectAndPledge={(tier) => void handleTierPledge(tier)}
              busy={busy}
              compact
              isLive={isLive && Boolean(state.isConnected)}
            />
          </div>
        ) : null}

        <div className={`${crowdkasCardClass} space-y-3`}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Campaign summary</h3>
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

        <div id="vdonate-supporters" className={`${crowdkasCardClass} space-y-3`}>
          <h3 className="text-sm font-semibold text-zinc-900 dark:text-zinc-100">Backers</h3>
          {activePledges.length === 0 ? (
            <p className="kx-body">No pledges yet. Be the first to back this campaign.</p>
          ) : (
            <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
              {activePledges.map((p) => {
                const explorer = getAddressExplorerUrl({ kind: 'kaspa-l1', address: p.backer });
                const tier = findCrowdfundTier(campaign.tiers, p.tierId);
                return (
                  <li
                    key={p.id}
                    className="flex justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2"
                  >
                    <div className="min-w-0">
                      {explorer ? (
                        <a
                          href={explorer}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="font-mono text-xs hover:underline"
                        >
                          {shortKaspaAddr(p.backer)}
                        </a>
                      ) : (
                        <span className="font-mono text-xs">{shortKaspaAddr(p.backer)}</span>
                      )}
                      {tier ? <p className="text-[11px] text-zinc-500 mt-0.5">{tier.title}</p> : null}
                    </div>
                    <span className="font-medium shrink-0">{sompiToKasNumber(p.amountSompi)} KAS</span>
                  </li>
                );
              })}
            </ul>
          )}
        </div>
      </HubAsideRail>
      {l1Modal ? <HubWalletGateModal isOpen onClose={closeL1Modal} {...l1Modal} /> : null}
    </>
  );
}
