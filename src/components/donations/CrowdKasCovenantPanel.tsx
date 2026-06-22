'use client';

import { useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import {
  CovenantWidgetShell,
  CovenantHeader,
  CovenantTabs,
  CovenantFieldLabel,
  CovenantError,
  CovenantHowItWorks,
  covenantInputClass,
  covenantPanelClass,
  covenantPrimaryBtnClass,
} from '@/components/dapps/covenant/CovenantWidgetUi';

type TabId = 'create' | 'about';

export type CrowdKasCovenantPanelProps = {
  /** embedded = inside CrowdKAS studio (no outer shell padding) */
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

  const primaryBtn =
    variant === 'embed'
      ? 'w-full py-2.5 rounded-lg bg-emerald-600 text-white font-medium hover:bg-emerald-700 transition-colors disabled:opacity-50'
      : covenantPrimaryBtnClass;

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
      {variant === 'widget' ? (
        <CovenantHeader
          title="Covenant Crowdfund"
          subtitle="Raise KAS with a goal and deadline. All-or-nothing rules enforced by L1 covenants (simulated here)."
        />
      ) : (
        <div className="space-y-2 mb-2">
          <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
            L1 Covenant crowdfund
          </p>
          <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
            Launch a Kaspa L1 goal-based raise with refund paths. Simulator only for now: campaigns appear in CrowdKAS
            on this browser.
          </p>
        </div>
      )}

      <CovenantTabs
        tabs={[
          { id: 'create' as const, label: 'Launch campaign' },
          { id: 'about' as const, label: 'How it works' },
        ]}
        active={tab}
        onChange={setTab}
      />

      {error && <CovenantError message={error} />}

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

      {!state.isConnected ? (
        <p className="text-sm text-zinc-500 dark:text-zinc-400 py-4 text-center">
          Connect your Kaspa wallet to launch an L1 covenant campaign.
        </p>
      ) : null}

      {state.isConnected && tab === 'create' && (
        <div className={covenantPanelClass}>
          <div>
            <CovenantFieldLabel
              label="Campaign title"
              htmlFor="ck-crowdfund-title"
              tooltip="Shown on the CrowdKAS listing and campaign page."
            />
            <input
              id="ck-crowdfund-title"
              className={covenantInputClass}
              placeholder="e.g. Community art drop"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
            />
          </div>
          <div>
            <CovenantFieldLabel
              label={`Funding goal (KAS, min ${minKas})`}
              htmlFor="ck-crowdfund-goal"
              tooltip="Campaign succeeds only if this amount is pledged before the deadline."
            />
            <input
              id="ck-crowdfund-goal"
              type="number"
              min={minKas}
              step="0.01"
              className={covenantInputClass}
              value={goalKas}
              onChange={(e) => setGoalKas(e.target.value)}
            />
          </div>
          <div>
            <CovenantFieldLabel
              label="Deadline"
              htmlFor="ck-crowdfund-deadline"
              tooltip="No new pledges after this date. Goal must be met by then for the creator to claim."
            />
            <input
              id="ck-crowdfund-deadline"
              type="datetime-local"
              className={covenantInputClass}
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
          <div>
            <CovenantFieldLabel
              label="Description (optional)"
              htmlFor="ck-crowdfund-memo"
              tooltip="Tell backers what you are raising for."
            />
            <input
              id="ck-crowdfund-memo"
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
            className={primaryBtn}
          >
            {busy ? 'Creating...' : 'Create L1 covenant campaign'}
          </button>
        </div>
      )}

      {tab === 'about' && (
        <CovenantHowItWorks>
          <p>
            L1 covenant crowdfunds in CrowdKAS use all-or-nothing rules: if the goal is met before the deadline, the
            creator claims pooled KAS. If not, backers can refund.
          </p>
          <ul className="list-disc pl-5 space-y-2">
            <li>
              <strong>L2 CrowdKAS</strong>: escrow on Igra with IPFS metadata and modules.
            </li>
            <li>
              <strong>L1 Covenant</strong> (this tab): Kaspa-native goal raises, simulator until covenant wallets ship.
            </li>
            <li>Both live in one CrowdKAS hub so creators can pick the path that fits.</li>
          </ul>
        </CovenantHowItWorks>
      )}
    </>
  );

  if (variant === 'widget') {
    return <CovenantWidgetShell>{body}</CovenantWidgetShell>;
  }

  return <div className="space-y-5">{body}</div>;
}
