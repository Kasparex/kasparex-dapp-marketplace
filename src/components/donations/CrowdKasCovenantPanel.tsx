'use client';

import { forwardRef, useEffect, useImperativeHandle, useMemo, useState } from 'react';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { useCovenantCrowdfund } from '@/hooks/useCovenantCrowdfund';
import { COVENANT_LAB_CONFIG } from '@/lib/covenant';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { Tooltip } from '@/components/ui/Tooltip';
import { CROWDKAS_FORM_PANEL_CLASS } from '@/components/donations/crowdkasFormTheme';
import { VDONATE_PRODUCT_NAME, VDONATE_SHORT_NAME } from '@/lib/donations/brand';
import { CrowdKasShell, CrowdKasError, CrowdKasPrototypeNotice } from '@/components/donations/CrowdKasUi';
import { CrowdKasCampaignMediaField } from '@/components/donations/CrowdKasCampaignMediaField';
import { DonationCategoryField } from '@/components/donations/DonationCategoryField';
import { CrowdKasModulesPanel } from '@/components/donations/CrowdKasModulesPanel';
import { normalizeTags } from '@/lib/donations/categories';
import {
  defaultCrowdKasPayoutSplitRows,
  type CrowdKasModulesConfig,
} from '@/lib/donations/crowdkasModules';
import type { DonationPaidModuleId } from '@/lib/donations/modules';
import { CROWDKAS_CONTENT_LIMITS, getCrowdKasCharacterCount } from '@/lib/donations/limits';
import type { CrowdKasPricingDraft } from '@/lib/donations/pricing';
import {
  validateL1CovenantCreateForm,
  type CrowdKasFormValidation,
} from '@/lib/donations/formValidation';

const COVENANT_HOW_IT_WORKS = (
  <div className="max-w-xs space-y-2 text-sm leading-snug">
    <p>L1 covenant campaigns use the same {VDONATE_SHORT_NAME} pages as L2 escrow campaigns. Funding runs on Kaspa L1 covenant rules instead of Igra smart contracts.</p>
    <p>
      <strong>L2 {VDONATE_SHORT_NAME}</strong>: escrow on Igra, IPFS metadata, optional modules.
    </p>
    <p>
      <strong>L1 covenant</strong>: Kaspa-native goal raises with refund paths when the goal is not met by the deadline.
    </p>
  </div>
);

export type CrowdKasCovenantPanelHandle = {
  submit: () => Promise<void>;
  validate: () => CrowdKasFormValidation;
  canSubmit: boolean;
};

export type CrowdKasCovenantPanelProps = {
  variant?: 'widget' | 'embed';
  /** Studio dashboard: vBlog-style panels, no inner submit button. */
  studioMode?: boolean;
  modules?: CrowdKasModulesConfig;
  onModulesChange?: (next: CrowdKasModulesConfig) => void;
  onPricingInputsChange?: (inputs: {
    payoutSplitRecipientCount: number;
    pendingPaidModules: DonationPaidModuleId[];
  }) => void;
  onPricingDraftChange?: (draft: CrowdKasPricingDraft) => void;
};

export const CrowdKasCovenantPanel = forwardRef<CrowdKasCovenantPanelHandle, CrowdKasCovenantPanelProps>(
  function CrowdKasCovenantPanel(
    { variant = 'embed', studioMode = false, modules: modulesProp, onModulesChange, onPricingInputsChange, onPricingDraftChange },
    ref,
  ) {
    const { state } = useKaspaWallet();
    const { error, createCampaign, runtimeMode, effectiveMode } = useCovenantCrowdfund();
    const [title, setTitle] = useState('');
    const [shortDescription, setShortDescription] = useState('');
    const [mainContent, setMainContent] = useState('');
    const [goalKas, setGoalKas] = useState('5');
    const [deadline, setDeadline] = useState('');
    const [category, setCategory] = useState('');
    const [tagInput, setTagInput] = useState('');
    const [tags, setTags] = useState<string[]>([]);
    const [imageSource, setImageSource] = useState<'url' | 'file'>('file');
    const [imageUrl, setImageUrl] = useState('');
    const [imageCid, setImageCid] = useState<string | null>(null);
    const [imageFileName, setImageFileName] = useState<string | null>(null);
    const [internalModules, setInternalModules] = useState<CrowdKasModulesConfig>({});
    const [busy, setBusy] = useState(false);
    const [createdId, setCreatedId] = useState<string | null>(null);
    const minKas = Number(COVENANT_LAB_CONFIG.minLockSompi) / 1e8;

    const modules = modulesProp ?? internalModules;
    const setModules = onModulesChange ?? setInternalModules;

    const payoutSplitRecipientCount = useMemo(() => {
      if (!modules.payoutSplitEnabled) return 0;
      return (modules.payoutSplitRecipients ?? defaultCrowdKasPayoutSplitRows()).length;
    }, [modules.payoutSplitEnabled, modules.payoutSplitRecipients]);

    useEffect(() => {
      onPricingInputsChange?.({
        payoutSplitRecipientCount,
        pendingPaidModules: modules.pendingPaidModules ?? [],
      });
      onPricingDraftChange?.({
        title,
        description: shortDescription,
        mainContent,
        category: category || undefined,
        tags,
        imageUrl: imageSource === 'url' ? imageUrl.trim() : undefined,
        imageHash: imageSource === 'file' && imageCid ? imageCid : undefined,
        targetKas: goalKas,
        endDate: deadline,
        modules,
      });
    }, [
      category,
      deadline,
      goalKas,
      imageCid,
      imageSource,
      imageUrl,
      mainContent,
      modules,
      onPricingDraftChange,
      onPricingInputsChange,
      payoutSplitRecipientCount,
      shortDescription,
      tags,
      title,
    ]);

    const canSubmit = Boolean(state.isConnected && title.trim() && deadline && !busy);

    const addTag = () => {
      if (!tagInput.trim()) return;
      setTags((prev) => normalizeTags([...prev, tagInput]));
      setTagInput('');
    };

    const removeTag = (tag: string) => {
      setTags((prev) => prev.filter((t) => t !== tag));
    };

    const validateForm = (): CrowdKasFormValidation =>
      validateL1CovenantCreateForm({
        title,
        shortDescription,
        mainContent,
        goalKas,
        deadline,
        minGoalKas: minKas,
        kaspaConnected: state.isConnected,
        modules,
        creatorKaspaAddress: state.address,
      });

    const handleCreate = async () => {
      const validation = validateForm();
      if (!validation.ok) {
        throw new Error(validation.error ?? 'Complete required fields before paying.');
      }
      setBusy(true);
      try {
        const campaign = await createCampaign({
          title,
          memo: shortDescription,
          goalKas: parseFloat(goalKas),
          deadline: new Date(deadline),
        });
        setCreatedId(campaign.id);
        setTitle('');
        setShortDescription('');
        setMainContent('');
        setTags([]);
        setCategory('');
        setImageUrl('');
        setImageCid(null);
        setImageFileName(null);
        setModules({});
      } finally {
        setBusy(false);
      }
    };

    useImperativeHandle(ref, () => ({
      submit: handleCreate,
      validate: validateForm,
      canSubmit,
    }));

    const createFields = (
      <div className="space-y-6">
        <CrowdKasCampaignMediaField
          source={imageSource}
          onSourceChange={setImageSource}
          url={imageUrl}
          onUrlChange={setImageUrl}
          cid={imageCid}
          onCidChange={setImageCid}
          fileName={imageFileName}
          onFileNameChange={setImageFileName}
        />
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <KxFormFieldLabel htmlFor="ck-crowdfund-title">
              Campaign title <span className="text-red-500">*</span>
            </KxFormFieldLabel>
            <span
              className={`text-xs ${
                getCrowdKasCharacterCount(title) > CROWDKAS_CONTENT_LIMITS.title.max
                  ? 'text-red-500'
                  : 'text-zinc-500'
              }`}
            >
              {getCrowdKasCharacterCount(title)} / {CROWDKAS_CONTENT_LIMITS.title.max}
            </span>
          </div>
          <input
            id="ck-crowdfund-title"
            className="k-input text-base"
            placeholder="e.g. Community art drop"
            value={title}
            maxLength={CROWDKAS_CONTENT_LIMITS.title.max}
            onChange={(e) => setTitle(e.target.value)}
          />
        </div>
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <KxFormFieldLabel>Short Description</KxFormFieldLabel>
            <span
              className={`text-xs ${
                getCrowdKasCharacterCount(shortDescription) > CROWDKAS_CONTENT_LIMITS.description.max
                  ? 'text-red-500'
                  : 'text-zinc-500'
              }`}
            >
              {getCrowdKasCharacterCount(shortDescription)} / {CROWDKAS_CONTENT_LIMITS.description.max}
            </span>
          </div>
          <textarea
            id="ck-crowdfund-short-description"
            className="k-input text-base w-full resize-y min-h-[4.5rem]"
            placeholder="Brief summary for cards and listings"
            value={shortDescription}
            maxLength={CROWDKAS_CONTENT_LIMITS.description.max}
            onChange={(e) => setShortDescription(e.target.value)}
          />
        </div>
        <div>
          <KxFormFieldLabel>Main Content</KxFormFieldLabel>
          <KxRichTextEditor
            value={mainContent}
            onChange={setMainContent}
            minRows={14}
            placeholder="Primary campaign story and details"
          />
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <KxFormFieldLabel>Category</KxFormFieldLabel>
            <DonationCategoryField value={category} onChange={setCategory} />
          </div>
          <div>
            <KxFormFieldLabel>Tags (optional)</KxFormFieldLabel>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), addTag())}
                className="k-input flex-1"
                placeholder="e.g. wallet, nft"
              />
              <button type="button" onClick={addTag} className="k-control-btn shrink-0">
                Add
              </button>
            </div>
            {tags.length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {tags.map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => removeTag(t)}
                    className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-zinc-700 dark:text-zinc-200 hover:border-red-400"
                    title="Remove tag"
                  >
                    #{t} ×
                  </button>
                ))}
              </div>
            ) : null}
          </div>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Tooltip content="The campaign succeeds only if this amount is pledged before the deadline.">
              <KxFormFieldLabel htmlFor="ck-crowdfund-goal">
                Funding goal (KAS, min {minKas}) <span className="text-red-500">*</span>
              </KxFormFieldLabel>
            </Tooltip>
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
            <Tooltip content="No pledges after this date. The goal must be met by then for the creator to claim.">
              <KxFormFieldLabel htmlFor="ck-crowdfund-deadline">
                Deadline <span className="text-red-500">*</span>
              </KxFormFieldLabel>
            </Tooltip>
            <input
              id="ck-crowdfund-deadline"
              type="datetime-local"
              className="k-input text-base"
              value={deadline}
              onChange={(e) => setDeadline(e.target.value)}
            />
          </div>
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
              {VDONATE_PRODUCT_NAME} on Kaspa L1 covenants. Use this L1 path or L2 escrow from the main hub.
            </p>
            <p className="text-xs text-zinc-600 dark:text-zinc-400">Runtime: {effectiveMode ?? runtimeMode}</p>
          </div>
        ) : null}

        {!studioMode ? <CrowdKasPrototypeNotice /> : null}

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

        {!state.isConnected ? null : studioMode ? (
          <div className="flex flex-col gap-6 min-w-0">
            <div className={`${CROWDKAS_FORM_PANEL_CLASS} space-y-6`}>
              <div>
                <DAppSectionHeader title="Main content" className="mb-3" />
                <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4 tracking-tight">
                  Create L1 covenant campaign
                </h3>
                <p className="kx-body">
                  Set your goal and deadline on Kaspa L1. Supporters pledge through covenant rules with refund paths.{' '}
                  <Tooltip content={COVENANT_HOW_IT_WORKS}>
                    <span className="text-emerald-700 dark:text-emerald-400 underline decoration-dotted cursor-help font-medium">
                      How it works
                    </span>
                  </Tooltip>
                </p>
                <div className="my-6 rounded-xl border border-amber-300/60 dark:border-amber-500/40 bg-amber-50/90 dark:bg-amber-950/30 p-4 text-sm text-amber-950 dark:text-amber-100">
                  L1 covenant full logic will be available once covenants are live, integrated, and ready on Kaspa. Until
                  then, simulator mode lets you draft campaigns and preview pricing.
                </div>
              </div>
              {createFields}
            </div>
            <div id="crowdkas-dashboard-modules" className={`${CROWDKAS_FORM_PANEL_CLASS} scroll-mt-24 py-10 sm:py-12`}>
              <CrowdKasModulesPanel modules={modules} onChange={setModules} showL1PayoutSplit />
            </div>
          </div>
        ) : (
          <div className={CROWDKAS_FORM_PANEL_CLASS}>
            <p className="kx-body mb-4">
              <Tooltip content={COVENANT_HOW_IT_WORKS}>
                <span className="text-emerald-700 dark:text-emerald-400 underline decoration-dotted cursor-help font-medium">
                  How it works
                </span>
              </Tooltip>
            </p>
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
        )}
      </>
    );

    if (variant === 'widget') {
      return <CrowdKasShell>{body}</CrowdKasShell>;
    }

    return studioMode ? <div className="flex flex-col gap-6 min-w-0">{body}</div> : <CrowdKasShell>{body}</CrowdKasShell>;
  },
);
