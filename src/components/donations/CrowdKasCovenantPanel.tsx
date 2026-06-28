'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import {
  CrowdKasShell,
  CrowdKasFieldLabel,
  CrowdKasError,
  CrowdKasTabs,
  CrowdKasPrototypeNotice,
  crowdkasInputClass,
  crowdkasPanelClass,
  crowdkasPrimaryBtnClass,
} from '@/components/donations/CrowdKasUi';

type TabId = 'create' | 'about';

export type CrowdKasCovenantPanelProps = {
  variant?: 'widget' | 'embed';
  defaultTab?: TabId;
};

export function CrowdKasCovenantPanel({ variant = 'embed', defaultTab = 'create' }: CrowdKasCovenantPanelProps) {
  const { state } = useKaspaWallet();
  const { error, createCampaign } = useCovenantCrowdfund();
  const [tab, setTab] = useState<TabId>(defaultTab);
  const [title, setTitle] = useState('');
  const [memo, setMemo] = useState('');
  const [goalKas, setGoalKas] = useState('5');
  const [deadline, setDeadline] = useState('');
  const [busy, setBusy] = useState(false);
  const [createdId, setCreatedId] = useState<string | null>(null);
  const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

  const handleCreate = async () => {
    if (!deadline) return;
    setBusy(true);
    try {
      const campaign = await createCampaign({
        title,
        memo,
        goalKas: parseFloat(goalKas),
        deadline: new Date(deadline),
      });
      setCreatedId(campaign.id);
      setTitle('');
      setMemo('');
    } finally {
      setBusy(false);
    }
  };

  const body = (
  <>
      <div className="space-y-2 mb-1">
        <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
          L1 covenant campaign
        </p>
        <p className="kx-body">
          Same CrowdKAS experience as L2 campaigns, powered by Kaspa L1 covenant rules (simulator on this device for now).
        </p>
      </div>

      <CrowdKasPrototypeNotice />

      <CrowdKasTabs
        tabs={[
          { id: 'create' as const, label: 'Launch campaign' },
          { id: 'about' as const, label: 'How it works' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {error && <CrowdKasError message={error} />}

      {createdId && (
        <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-sm space-y-2">
          <p className="font-medium text-emerald-800 dark:text-emerald-200">Campaign created.</p>
          <a
            href={`/donations/covenant/${createdId}`}
            className="text-emerald-700 dark:text-emerald-300 underline font-medium"
          >
            Open campaign page →
          </a>
        </div>
      )}

      {!state.isConnected ? null : tab === 'create' && (
        <div className={crowdkasPanelClass}>
          <div>
            <CrowdKasFieldLabel
              label="Campaign title"
              htmlFor="ck-crowdfund-title"
              tooltip="Shown on the CrowdKAS listing and campaign page, same as L2 campaign titles."
            />
            <input
              id="ck-crowdfund-title"
              className={crowdkasInputClass}
              placeholder="e.g. Community art drop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <CrowdKasFieldLabel
              label={`Funding goal (KAS, min ${minKas})`}
              htmlFor="ck-crowdfund-goal"
              tooltip="The campaign succeeds only if this amount is pledged before the deadline."
            />
            <input
              id="ck-crowdfund-goal"
              type="number"
              min={minKas}
              step="0.01"
              className={crowdkasInputClass}
              value={goalKas}
              onChange={(e) => setGoalKas(e.target.value)}
            />
          </div>
          <div>
            <CrowdKasFieldLabel
              label="Deadline"
              htmlFor="ck-crowdfund-deadline"
              tooltip="No pledges after this date. The goal must be met by then for the creator to claim."
            />
            <input
              id="ck-crowdfund-deadline"
              type="datetime-local"
              className={crowdkasInputClass}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div>
            <CrowdKasFieldLabel
              label="Description (optional)"
              htmlFor="ck-crowdfund-memo"
              tooltip="Appears in the Story section on your campaign page."
            />
            <textarea
              id="ck-crowdfund-memo"
              rows={3}
              className={crowdkasInputClass}
              placeholder="What are you raising for?"
              value={memo}
              onChange={(e) => setMemo(e.target.value)}
            />
          </div>
          <button
            type="button"
            disabled={busy || !title || !deadline}
            onClick={() => void handleCreate()}
            className={crowdkasPrimaryBtnClass}
          >
            {busy ? 'Creating...' : 'Create L1 covenant campaign'}
          </button>
        </div>
      )}

      {tab === 'about' && (
        <div className="space-y-4 kx-body text-zinc-700 dark:text-zinc-300">
          <p>
            L1 covenant campaigns use the same CrowdKAS pages as L2 escrow campaigns. The difference is funding rules on
            Kaspa L1 instead of Igra smart contracts.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>L2 CrowdKAS</strong>: escrow on Igra, IPFS metadata, optional modules.
            </li>
            <li>
              <strong>L1 Covenant</strong>: Kaspa-native goal raises with refund paths (simulator today).
            </li>
          </ul>
        </div>
      )}
    </>
  );

  if (variant === 'widget') {
    return <CrowdKasShell>{body}</CrowdKasShell>;
  }

  return <CrowdKasShell>{body}</CrowdKasShell>;
}
