'use client';

import { forwardRef, useImperativeHandle, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { CROWDKAS_FORM_PANEL_CLASS } from '@/components/donations/crowdkasFormTheme';
import {
  CrowdKasShell,
  CrowdKasError,
  CrowdKasTabs,
  CrowdKasPrototypeNotice,
} from '@/components/donations/CrowdKasUi';

type TabId = 'create' | 'about';

export type CrowdKasCovenantPanelHandle = {
  submit: () => Promise<void>;
  canSubmit: boolean;
};

export type CrowdKasCovenantPanelProps = {
  variant?: 'widget' | 'embed';
  defaultTab?: TabId;
  /** Studio dashboard: vBlog-style panels, no inner submit button. */
  studioMode?: boolean;
};

export const CrowdKasCovenantPanel = forwardRef<CrowdKasCovenantPanelHandle, CrowdKasCovenantPanelProps>(
  function CrowdKasCovenantPanel({ variant = 'embed', defaultTab = 'create', studioMode = false }, ref) {
    const { state } = useKaspaWallet();
    const { error, createCampaign, runtimeMode, effectiveMode } = useCovenantCrowdfund();
    const [tab, setTab] = useState<TabId>(defaultTab);
    const [title, setTitle] = useState('');
    const [memo, setMemo] = useState('');
    const [goalKas, setGoalKas] = useState('5');
    const [deadline, setDeadline] = useState('');
    const [busy, setBusy] = useState(false);
    const [createdId, setCreatedId] = useState<string | null>(null);
    const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

    const canSubmit = Boolean(state.isConnected && title.trim() && deadline && !busy);

    const handleCreate = async () => {
      if (!deadline || !title.trim()) return;
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

    useImperativeHandle(ref, () => ({
      submit: handleCreate,
      canSubmit,
    }));

    const createFields = (
      <div className="space-y-6">
        <div>
          <KxFormFieldLabel htmlFor="ck-crowdfund-title">
            Campaign title <span className="text-red-500">*</span>
          </KxFormFieldLabel>
          <input
            id="ck-crowdfund-title"
            className="k-input text-base"
            placeholder="e.g. Community art drop"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <KxFormFieldLabel htmlFor="ck-crowdfund-goal">
            Funding goal (KAS, min {minKas}) <span className="text-red-500">*</span>
          </KxFormFieldLabel>
          <input
            id="ck-crowdfund-goal"
            type="number"
            min={minKas}
            step="0.01"
            className="k-input text-base"
            value={goalKas}
            onChange={(e) => setGoalKas(e.target.value)}
          />
        </div>
        <div>
          <KxFormFieldLabel htmlFor="ck-crowdfund-deadline">
            Deadline <span className="text-red-500">*</span>
          </KxFormFieldLabel>
          <input
            id="ck-crowdfund-deadline"
            type="datetime-local"
            className="k-input text-base"
            value={deadline}
            onChange={(e) => setDeadline(e.target.value)}
          />
        </div>
        <div>
          <KxFormFieldLabel htmlFor="ck-crowdfund-memo">Description (optional)</KxFormFieldLabel>
          <KxRichTextEditor
            value={memo}
            onChange={setMemo}
            minRows={5}
            placeholder="What are you raising for?"
          />
        </div>
      </div>
    );

    const body = (
      <>
        {!studioMode ? (
          <div className="space-y-2 mb-1">
            <p className="text-xs font-bold uppercase tracking-widest text-emerald-700 dark:text-emerald-400">
              L1 covenant campaign
            </p>
            <p className="kx-body">
              CrowdKAS on Kaspa L1 covenants. Hybrid Hub: use this L1 path or L2 CrowdKAS modules from the main donations hub.
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Runtime: {effectiveMode ?? runtimeMode}</p>
          </div>
        ) : null}

        {!studioMode ? <CrowdKasPrototypeNotice /> : null}

        {!studioMode ? (
          <CrowdKasTabs
            tabs={[
              { id: 'create' as const, label: 'Launch campaign' },
              { id: 'about' as const, label: 'How it works' },
            ]}
            active={tab}
            onChange={setTab}
          />
        ) : null}

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

        {!state.isConnected ? null : studioMode || tab === 'create' ? (
          studioMode ? (
            <div className={`${CROWDKAS_FORM_PANEL_CLASS} space-y-6`}>
              <div>
                <DAppSectionHeader title="Main content" className="mb-3" />
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
                  Create L1 covenant campaign
                </h3>
                <p className="kx-body">
                  Set your goal and deadline on Kaspa L1. Supporters pledge through covenant rules with refund paths.
                </p>
              </div>
              {createFields}
            </div>
          ) : (
            <div className={CROWDKAS_FORM_PANEL_CLASS}>
              {createFields}
              <button
                type="button"
                disabled={!canSubmit}
                onClick={() => void handleCreate()}
                className="w-full k-control-btn !bg-emerald-600 !text-white hover:!bg-emerald-700 disabled:opacity-50 mt-6"
              >
                {busy ? 'Creating...' : 'Create L1 covenant campaign'}
              </button>
            </div>
          )
        ) : null}

        {!studioMode && tab === 'about' && (
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

    return studioMode ? <div className="flex flex-col gap-6 min-w-0">{body}</div> : <CrowdKasShell>{body}</CrowdKasShell>;
  },
);
