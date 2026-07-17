'use client';

import { useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import {
  CovenantFieldLabel,
  CovenantError,
  CovenantTabPanel,
  CovenantCreateShell,
  covenantInputClass,
} from '@/components/dapps/covenant/CovenantWidgetUi';
import { CovenantCrowdfundBrowseCard } from '@/components/dapps/covenant/CovenantCrowdfundBrowseCard';
import { KpxCovenantDisconnected, KpxCovenantShell } from '@/components/dapps/covenant/KpxCovenantShell';
import { KpxCovenantMetadataView } from '@/components/dapps/covenant/KpxCovenantMetadataView';
import { useCovenantWidgetRail } from '@/hooks/useCovenantWidgetRail';
import { useKpxCovenantDeployFee, useKpxCovenantClaimFee } from '@/hooks/useKpxCovenantDeployFee';
import { crowdfundMetadataInstances } from '@/lib/covenant/kpxCovenantMetadata';
import { CovenantInstanceDetailModal } from '@/components/dapps/covenant/CovenantInstanceDetailModal';
import { CovenantDatetimeField } from '@/components/dapps/covenant/CovenantDatetimeField';
import {
  useDAppWidgetSection,
  useNavigateDAppWidgetTab,
  useRegisterWidgetTabLabel,
} from '@/lib/dapps/DAppWidgetTabContext';

type TabId = 'browse' | 'create' | 'metadata';
type BusyKey = null | 'create' | `pledge:${string}` | `claim:${string}` | `refund:${string}`;

export function CovenantCrowdfundWidget() {
  const { state } = useKaspaWallet();
  const { allCampaigns, loading, error, createCampaign, pledge, claimFunds, refund, refresh, runtimeMode, effectiveMode } =
    useCovenantCrowdfund();
  const { pricing, krexTier, krexBalance } = useKpxCovenantDeployFee('crowdfund');
  const { pricing: claimPricing } = useKpxCovenantClaimFee('crowdfund');
  const tab = useDAppWidgetSection('browse') as TabId;
  const navigateTab = useNavigateDAppWidgetTab();
  useRegisterWidgetTabLabel('browse', `Campaigns (${allCampaigns.length})`, [allCampaigns.length]);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [goalKas, setGoalKas] = useState('5');
  const [deadline, setDeadline] = useState('');
  const [pledgeAmounts, setPledgeAmounts] = useState<Record<string, string>>({});
  const [busyKey, setBusyKey] = useState<BusyKey>(null);
  const [detailCampaignId, setDetailCampaignId] = useState<string | null>(null);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;
  const metadataInstances = useMemo(() => crowdfundMetadataInstances(allCampaigns), [allCampaigns]);
  const detailInstance = useMemo(
    () => metadataInstances.find((i) => i.id === detailCampaignId) ?? null,
    [metadataInstances, detailCampaignId],
  );
  const busy = busyKey != null;

  const handleCreate = async () => {
    if (!deadline) return;
    setBusyKey('create');
    try {
      await createCampaign({
        title,
        memo,
        goalKas: parseFloat(goalKas),
        deadline: new Date(deadline),
      });
      navigateTab('browse');
    } finally {
      setBusyKey(null);
    }
  };

  const handlePledge = async (campaignId: string, amountKas: number) => {
    setBusyKey(`pledge:${campaignId}`);
    try {
      await pledge(campaignId, amountKas);
      setPledgeAmounts((p) => ({ ...p, [campaignId]: '' }));
    } finally {
      setBusyKey(null);
    }
  };

  const handleClaim = async (campaignId: string) => {
    setBusyKey(`claim:${campaignId}`);
    try {
      await claimFunds(campaignId);
    } finally {
      setBusyKey(null);
    }
  };

  const handleRefund = async (campaignId: string, pledgeId: string) => {
    setBusyKey(`refund:${pledgeId}`);
    try {
      await refund(campaignId, pledgeId);
    } finally {
      setBusyKey(null);
    }
  };

  useCovenantWidgetRail(pricing, krexBalance, {
    lockAmountKas: tab === 'create' ? parseFloat(goalKas) || 0 : undefined,
    enabled: tab === 'create',
    flowAlwaysVisible: true,
    flowBusy: busy,
    flowPreset:
      tab === 'browse' || (typeof busyKey === 'string' && busyKey.startsWith('claim:'))
        ? 'covenantClaim'
        : 'covenantCreate',
    flowFeeWaived:
      tab === 'browse' || (typeof busyKey === 'string' && busyKey.startsWith('claim:'))
        ? claimPricing.waived
        : pricing.waived,
    primaryAction: (
      <button
        type="button"
        disabled={busy || !title || !deadline}
        onClick={() => void handleCreate()}
        className="w-full k-control-btn !border-[#02abb8] !bg-[#02abb8] !text-white hover:!bg-[#028a94] disabled:cursor-not-allowed disabled:opacity-50"
      >
        {busyKey === 'create'
          ? 'Launching campaign...'
          : pricing.waived
            ? 'Launch campaign'
            : `Pay ${pricing.feeKas.toFixed(2)} KAS fee & launch`}
      </button>
    ),
    deps: [tab, busyKey, title, deadline, pricing, claimPricing, goalKas, memo],
  });

  if (!state.isConnected) {
    return <KpxCovenantDisconnected template="crowdfund" />;
  }

  return (
    <KpxCovenantShell template="crowdfund" runtimeMode={runtimeMode} effectiveMode={effectiveMode}>

      {error && <CovenantError message={error} />}

      {tab === 'create' && (
        <CovenantCreateShell template="crowdfund" heading="Launch campaign">
          <div className="k-form-group !mb-0">
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

          <div className="k-form-group !mb-0">
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

          <div className="k-form-group !mb-0">
            <CovenantDatetimeField
              id="crowdfund-deadline"
              label="Deadline"
              tooltip="After this date, no new pledges are accepted. The goal must be met by then for the creator to claim."
              value={deadline}
              onChange={setDeadline}
            />
          </div>

          <div className="k-form-group !mb-0">
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
        </CovenantCreateShell>
      )}

      {tab === 'browse' && (
        <CovenantTabPanel
          title="Campaigns"
          heading="Browse campaigns"
          description="Active and completed crowdfunds. Pledge KAS or claim refunds when rules allow."
        >
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
            allCampaigns.map((c) => (
              <div key={c.id} className="space-y-2">
                <button
                  type="button"
                  className="text-[11px] text-[#02abb8] hover:underline"
                  onClick={() => setDetailCampaignId(c.id)}
                >
                  View campaign details
                </button>
                <CovenantCrowdfundBrowseCard
                  campaign={c}
                  minKas={minKas}
                  walletAddress={state.address}
                  pledgeAmount={pledgeAmounts[c.id] ?? ''}
                  onPledgeAmountChange={(value) =>
                    setPledgeAmounts((p) => ({ ...p, [c.id]: value }))
                  }
                  onPledge={() => void handlePledge(c.id, parseFloat(pledgeAmounts[c.id] || '0'))}
                  onClaim={() => void handleClaim(c.id)}
                  claimFeeLabel={
                    busyKey === `claim:${c.id}`
                      ? 'Claiming...'
                      : claimPricing.waived
                        ? 'Claim raised funds'
                        : `Claim · pay ${claimPricing.feeKas.toFixed(2)} KAS fee`
                  }
                  krexTier={krexTier}
                  onRefund={(pledgeId) => void handleRefund(c.id, pledgeId)}
                  busy={busy}
                  pledgeBusy={busyKey === `pledge:${c.id}`}
                />
              </div>
            ))
          )}
        </div>
        </CovenantTabPanel>
      )}

      {tab === 'metadata' && (
        <CovenantTabPanel
          title="Metadata"
          heading="On-chain references"
          description="Covenant IDs, payload templates, and explorer links for your campaigns."
        >
        <KpxCovenantMetadataView
          template="crowdfund"
          runtimeMode={runtimeMode}
          effectiveMode={effectiveMode}
          instances={metadataInstances}
        />
        </CovenantTabPanel>
      )}

      {detailInstance ? (
        <CovenantInstanceDetailModal
          instance={detailInstance}
          onClose={() => setDetailCampaignId(null)}
        />
      ) : null}
    </KpxCovenantShell>
  );
}
