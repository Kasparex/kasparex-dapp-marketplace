'use client';

import { useMemo, useState, type ReactNode } from 'react';
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
  crowdkasCardClass,
  crowdkasPrimaryBtnClass,
  crowdkasSecondaryBtnClass,
} from '@/components/donations/CrowdKasUi';
import { shortKaspaAddr } from '@/components/dapps/covenant/CovenantWidgetUi';
import { getAddressExplorerUrl } from '@/lib/walletUi';
import { HubAsideRail } from '@/components/hub/HubAsideRail';
import { quoteVDonateL1Pledge } from '@/lib/donations/l1PledgePayment';
import {
  findCrowdfundTier,
  getViewerUnlockedTierIds,
  sortTiersByMinKas,
} from '@/lib/donations/tiers';
import { useHubWalletGate } from '@/hooks/useHubWalletGate';
import { HubWalletGateModal } from '@/components/hub/HubWalletGateModal';
import { evaluateHubAccess, getHubGateMessage } from '@/lib/hub/access';
import { VDonateRewardTierList } from '@/components/donations/VDonateRewardTierList';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { HubPaymentPanel } from '@/components/payments/HubPaymentPanel';
import { CrowdKasDashboardBenefitsPanel } from '@/components/donations/CrowdKasDashboardBenefitsPanel';
import { CROWDKAS_CALCULATION_ASIDE } from '@/components/donations/crowdkasFormTheme';
import { useHubPayWithCatalog, hubCatalogSelectionToStoreCurrency } from '@/hooks/useHubPayWithCatalog';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { buildKasKrexCurrencyOptions, formatHubPaymentAmount } from '@/lib/payments/hubPaymentTypes';
import type { HubPaymentQuoteLine } from '@/lib/payments/hubPaymentTypes';
import { resolveCatalogPaymentOption } from '@/lib/payments/currencyCatalog';
import type { StorePaymentCurrency } from '@/lib/store/currencies';
import { getHubPointsBaseForAction } from '@/lib/payments/hubQuote';
import { computeEarnedHubPoints, formatHubPointsTierLabel } from '@/lib/rewards/hub-points';
import { KREX_TIERS } from '@/lib/rewards/types';
import { placeholderDApps } from '@/lib/dapps';
import { KX_SURFACE_NESTED } from '@/lib/hub/shellTokens';
import { KREXBuyWizard } from '@/components/rewards/KREXBuyWizard';

const CROWDFUND_DAPP = placeholderDApps.find((d) => d.slug === 'covenant-crowdfund')!;
const PLEDGE_HUB_POINTS_BASE = getHubPointsBaseForAction(CROWDFUND_DAPP, 'pledge');

const pledgeAmountInputClass =
  'w-full h-10 px-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm text-zinc-900 dark:text-zinc-100 placeholder:text-zinc-500 focus:outline-none focus:ring-2 focus:ring-emerald-500/40 focus:border-emerald-500/60';

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
  const { tier: krexTier, balance: krexBalance } = useKREXBalance();
  const [pledgeKas, setPledgeKas] = useState('');
  const [busy, setBusy] = useState(false);
  const [localTierId, setLocalTierId] = useState<string | null>(null);
  const [paymentCurrency, setPaymentCurrency] = useState<StorePaymentCurrency>('KAS');
  const [isKrexWizardOpen, setIsKrexWizardOpen] = useState(false);
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
  const isCreator =
    state.address && normalizeAddr(state.address) === normalizeAddr(campaign.creator);

  const tiers = useMemo(() => sortTiersByMinKas(campaign.tiers ?? []), [campaign.tiers]);
  const selectedTier = findCrowdfundTier(campaign.tiers, tierId);
  const effectiveMin = selectedTier ? Math.max(minKas, selectedTier.minKas) : minKas;
  const unlockedTierIds = useMemo(
    () => getViewerUnlockedTierIds(campaign, state.address),
    [campaign, state.address],
  );

  const pledgeNum = parseFloat(pledgeKas);
  const quote =
    Number.isFinite(pledgeNum) && pledgeNum > 0 ? quoteVDonateL1Pledge(pledgeNum, krexTier) : null;
  const amountKas = quote?.totalKas ?? 0;
  const discountPercent = KREX_TIERS[krexTier].feeDiscountPercent;
  const hasKrexDiscount = discountPercent > 0;

  const { catalogEntries, pricingSnapshot } = useHubPayWithCatalog({
    amountKas: amountKas > 0 ? amountKas : undefined,
  });
  const paymentOption = resolveCatalogPaymentOption(catalogEntries, paymentCurrency);

  const breakdownLines: HubPaymentQuoteLine[] = useMemo(() => {
    if (!quote) {
      return [
        { label: 'Pledge', value: '—' },
        { label: 'Platform fee (1%)', value: '—' },
      ];
    }
    const lines: HubPaymentQuoteLine[] = [
      {
        label: 'Pledge',
        value: formatHubPaymentAmount(paymentOption, quote.pledgeKas, { snapshot: pricingSnapshot }),
      },
      {
        label: 'Platform fee (1%)',
        value: formatHubPaymentAmount(paymentOption, quote.platformFeeBaseKas, {
          snapshot: pricingSnapshot,
        }),
      },
    ];
    if (quote.discountKas > 0) {
      lines.push({
        label: `KREX discount (${quote.discountPercent}%)`,
        value: `−${formatHubPaymentAmount(paymentOption, quote.discountKas, {
          snapshot: pricingSnapshot,
        })}`,
      });
      lines.push({
        label: 'Fee after discount',
        value: formatHubPaymentAmount(paymentOption, quote.platformFeeKas, {
          snapshot: pricingSnapshot,
        }),
        dividerBefore: true,
      });
    }
    return lines;
  }, [paymentOption, pricingSnapshot, quote]);

  const totalDisplay = quote
    ? formatHubPaymentAmount(paymentOption, quote.totalKas, { snapshot: pricingSnapshot })
    : formatHubPaymentAmount(paymentOption, 0, { snapshot: pricingSnapshot });

  const hubPoints =
    PLEDGE_HUB_POINTS_BASE > 0
      ? computeEarnedHubPoints(PLEDGE_HUB_POINTS_BASE, krexTier)
      : 0;

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

  const activePledges = useMemo(
    () =>
      [...campaign.pledges.filter((p) => !p.refunded)].sort((a, b) => {
        const ba = BigInt(a.amountSompi || '0');
        const bb = BigInt(b.amountSompi || '0');
        if (bb === ba) return 0;
        return bb > ba ? 1 : -1;
      }),
    [campaign.pledges],
  );

  const campaignStatsAlert: ReactNode = (
    <div className={`${KX_SURFACE_NESTED} p-3 space-y-3`}>
      <dl className="space-y-2 text-sm">
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Raised</span>
          <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
            {raised.toFixed(4)} KAS
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Target</span>
          <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">
            {goal.toFixed(4)} KAS
          </span>
        </div>
        <div className="flex justify-between gap-2">
          <span className="text-zinc-500 dark:text-zinc-400">Backers</span>
          <span className="font-medium tabular-nums text-zinc-900 dark:text-zinc-100">{backers}</span>
        </div>
      </dl>
      <div className="w-full h-2 rounded-full bg-zinc-200 dark:bg-zinc-700 overflow-hidden">
        <div
          className="h-full bg-emerald-500 rounded-full transition-all"
          style={{ width: `${Math.min(progress, 100)}%` }}
        />
      </div>
      <CampaignEndCountdown
        deadlineSec={Math.floor(campaign.deadline / 1000)}
        createdAtMs={campaign.createdAt}
        compact
        showTimeProgressBar
        timeProgressFillClassName="bg-sky-500 dark:bg-sky-400"
      />
    </div>
  );

  return (
    <>
      <HubAsideRail
        adSlotId="HALO_DONATIONS_RIGHT"
        adId="ad-slot-vdonate-covenant-rail"
        className="gap-6"
      >
        <div id="vdonate-donate" className="space-y-4">
          <HubPaymentPanel
            title="Pledge calculation"
            asideClassName={CROWDKAS_CALCULATION_ASIDE}
            alerts={
              <div className="space-y-4">
                {campaignStatsAlert}
                {!state.isConnected ? (
                  <div className="space-y-3">
                    <p className="kx-body text-sm">
                      Connect your Kaspa wallet to pledge or manage this campaign.
                    </p>
                    <button
                      type="button"
                      onClick={() => requireWallet()}
                      className={crowdkasPrimaryBtnClass}
                    >
                      Connect Kaspa wallet
                    </button>
                  </div>
                ) : isLive ? (
                  <div className="space-y-3">
                    {selectedTier ? (
                      <p className="text-xs text-emerald-700 dark:text-emerald-300">
                        Selected reward:{' '}
                        <span className="font-semibold">{selectedTier.title}</span> (min{' '}
                        {selectedTier.minKas} KAS)
                      </p>
                    ) : null}
                    <label
                      htmlFor="ck-pledge-amount"
                      className="block text-sm font-medium text-zinc-700 dark:text-zinc-300"
                    >
                      {`Amount (KAS, min ${effectiveMin})`}
                    </label>
                    <input
                      id="ck-pledge-amount"
                      type="number"
                      min={effectiveMin}
                      step="0.01"
                      className={pledgeAmountInputClass}
                      placeholder={String(effectiveMin)}
                      value={pledgeKas}
                      onChange={(e) => setPledgeKas(e.target.value)}
                    />
                  </div>
                ) : (
                  <p className="kx-body text-sm">This campaign is no longer accepting pledges.</p>
                )}
              </div>
            }
            lines={breakdownLines}
            totalLabel="Total to pay"
            totalDisplay={totalDisplay}
            totalSubtitle="+ network gas on Kaspa L1"
            amountKas={amountKas > 0 ? amountKas : null}
            currencies={buildKasKrexCurrencyOptions()}
            catalogEntries={catalogEntries}
            selectedCurrencyId={paymentCurrency}
            onCurrencyChange={(id) => setPaymentCurrency(id as StorePaymentCurrency)}
            onCatalogSelect={(opt) => {
              setPaymentCurrency(hubCatalogSelectionToStoreCurrency(opt));
            }}
            pricingSnapshot={pricingSnapshot}
            tier={krexTier}
            krexBalance={krexBalance}
            discountNote={
              quote && quote.discountKas > 0
                ? `KREX discount: −${formatHubPaymentAmount(paymentOption, quote.discountKas, {
                    snapshot: pricingSnapshot,
                  })} (${quote.discountPercent}% off the 1% platform fee).`
                : hasKrexDiscount
                  ? `KREX discount: ${discountPercent}% off the 1% pledge platform fee (${KREX_TIERS[krexTier].label}).`
                  : undefined
            }
            infoText="Pledge locks in the L1 covenant. Platform fee (1%) is an extra output on the same tx."
            infoAccent="emerald"
            hubPoints={hubPoints}
            hubPointsDetail={hubPoints > 0 ? formatHubPointsTierLabel(krexTier) : undefined}
            hubPointsBaseSpendKas={quote?.totalKas}
            flowBusy={busy}
            flowPreset="hubPublish"
            footer={
              <>
                {!hasKrexDiscount ? (
                  <button
                    type="button"
                    onClick={() => setIsKrexWizardOpen(true)}
                    className="w-full k-control-btn !border-emerald-500/30 !text-emerald-700 dark:!text-emerald-300"
                  >
                    Buy KREX to unlock discount
                  </button>
                ) : null}
                {state.isConnected && isLive ? (
                  <button
                    type="button"
                    disabled={busy || !quote || pledgeNum < effectiveMin}
                    onClick={() => void handlePledge()}
                    className="w-full k-control-btn !bg-emerald-600 !text-white !border-emerald-600 hover:!bg-emerald-700 dark:!bg-emerald-600 dark:hover:!bg-emerald-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {busy ? 'Pledging…' : `Pledge (${totalDisplay})`}
                  </button>
                ) : null}
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
              </>
            }
          />
          <CrowdKasDashboardBenefitsPanel audience="donor" />
          <KREXBuyWizard isOpen={isKrexWizardOpen} onClose={() => setIsKrexWizardOpen(false)} />
        </div>

        {tiers.length > 0 ? (
          <div className={`${crowdkasCardClass} space-y-4`}>
            <DAppSectionHeader title="Rewards" className="mb-0" />
            <p className="kx-body text-xs -mt-2">
              Choose a reward tier to pledge its minimum. Fee is included on the same transaction.
              Unlocked tiers reveal their reward content.
            </p>
            <VDonateRewardTierList
              tiers={tiers}
              selectedTierId={tierId}
              onSelectAndPledge={(tier) => void handleTierPledge(tier)}
              busy={busy}
              compact
              isLive={isLive && Boolean(state.isConnected)}
              unlockedTierIds={unlockedTierIds}
            />
          </div>
        ) : null}

        <div id="vdonate-supporters" className={`${crowdkasCardClass} space-y-3`}>
          <DAppSectionHeader
            title="Backers"
            className="mb-0"
            right={
              <span className="text-xs font-semibold tabular-nums text-zinc-500 dark:text-zinc-400">
                {backers} {backers === 1 ? 'backer' : 'backers'}
              </span>
            }
          />
          {activePledges.length === 0 ? (
            <p className="kx-body">No pledges yet. Be the first to back this campaign.</p>
          ) : (
            <ul className="space-y-2 text-sm max-h-64 overflow-y-auto">
              {activePledges.map((p, index) => {
                const explorer = getAddressExplorerUrl({ kind: 'kaspa-l1', address: p.backer });
                const tier = findCrowdfundTier(campaign.tiers, p.tierId);
                return (
                  <li
                    key={p.id}
                    className="flex justify-between gap-2 border-b border-zinc-100 dark:border-zinc-800 pb-2"
                  >
                    <div className="min-w-0 flex items-start gap-2">
                      <span className="shrink-0 text-[11px] font-bold tabular-nums text-zinc-400 dark:text-zinc-500 w-6">
                        #{index + 1}
                      </span>
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
