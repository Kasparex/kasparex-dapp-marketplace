'use client';

import type { Dispatch, SetStateAction } from 'react';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { CrowdKasCampaignMediaField } from '@/components/donations/CrowdKasCampaignMediaField';
import { CrowdKasModulesPanel } from '@/components/donations/CrowdKasModulesPanel';
import { DonationCategoryField } from '@/components/donations/DonationCategoryField';
import { CROWDKAS_FORM_PANEL_CLASS } from '@/components/donations/crowdkasFormTheme';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import type { CrowdKasModulesConfig } from '@/lib/donations/crowdkasModules';
import { CROWDKAS_CONTENT_LIMITS, getCrowdKasCharacterCount } from '@/lib/donations/limits';
import { formatEther } from 'viem';

export type CrowdKasEditFormState = {
  title: string;
  description: string;
  category?: string;
  tags?: string[];
  goals?: string[];
  socialLinks?: {
    website?: string;
    twitter?: string;
    discord?: string;
  };
  l1TipGiftEnabled: boolean;
  l1TipGiftType: 'text' | 'url' | 'ipfs';
  l1TipGiftLabel: string;
  l1TipGiftValue: string;
};

export type CrowdKasEditOnChainLock = {
  targetWei: bigint;
  deadline: bigint;
  l1Address: string;
};

export function CrowdKasEditCampaignForm<T extends CrowdKasEditFormState>({
  form,
  onFormChange,
  onChainLock,
  tagInput,
  onTagInputChange,
  onAddTag,
  onRemoveTag,
  goalInput,
  onGoalInputChange,
  onAddGoal,
  onRemoveGoal,
  imageSource,
  onImageSourceChange,
  imageUrl,
  onImageUrlChange,
  imageCid,
  onImageCidChange,
  imageFileName,
  onImageFileNameChange,
  modulesConfig,
  onModulesConfigChange,
  editingV2CampaignId,
  l1TipsUnlockedV2,
  paidModulesUnlocked,
  editErrorMsg,
  updateErrorMsg,
  isSubmitting,
  onSave,
  onCancel,
  hideActions = false,
}: {
  form: T;
  onFormChange: Dispatch<SetStateAction<T>>;
  onChainLock: CrowdKasEditOnChainLock | null;
  tagInput: string;
  onTagInputChange: (value: string) => void;
  onAddTag: () => void;
  onRemoveTag: (tag: string) => void;
  goalInput: string;
  onGoalInputChange: (value: string) => void;
  onAddGoal: () => void;
  onRemoveGoal: (index: number) => void;
  imageSource: 'url' | 'file';
  onImageSourceChange: (next: 'url' | 'file') => void;
  imageUrl: string;
  onImageUrlChange: (next: string) => void;
  imageCid: string | null;
  onImageCidChange: (next: string | null) => void;
  imageFileName: string | null;
  onImageFileNameChange: (next: string | null) => void;
  modulesConfig: CrowdKasModulesConfig;
  onModulesConfigChange: (next: CrowdKasModulesConfig) => void;
  editingV2CampaignId: bigint | null;
  l1TipsUnlockedV2: boolean;
  paidModulesUnlocked?: { featured?: boolean; l1Tips?: boolean };
  editErrorMsg: string | null;
  updateErrorMsg: string | null;
  isSubmitting: boolean;
  onSave: () => void;
  onCancel: () => void;
  hideActions?: boolean;
}) {
  return (
    <div className={`${CROWDKAS_FORM_PANEL_CLASS} space-y-6`}>
      <div>
        <DAppSectionHeader title="Edit campaign" className="mb-3" />
        <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Update presentation content
        </h3>
        <p className="kx-body mt-2">
          Title, description, media, tags, and modules can be updated. Funding goal, deadline, and payment settings are
          locked after creation.
        </p>
      </div>

      {onChainLock ? (
        <div className="rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900/50 p-4 space-y-2">
          <p className="text-[10px] font-black uppercase tracking-[0.2em] text-zinc-500">Locked campaign settings</p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Target: <span className="font-semibold">{formatEther(onChainLock.targetWei)} iKAS</span>
          </p>
          <p className="text-sm text-zinc-700 dark:text-zinc-300">
            Deadline:{' '}
            <span className="font-semibold">{new Date(Number(onChainLock.deadline) * 1000).toLocaleString()}</span>
          </p>
          {onChainLock.l1Address ? (
            <p className="text-sm text-zinc-700 dark:text-zinc-300 break-all">
              L1 tip address: <span className="font-mono font-semibold">{onChainLock.l1Address}</span>
            </p>
          ) : null}
        </div>
      ) : null}

      <div className="space-y-6">
        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <KxFormFieldLabel>
              Title <span className="text-red-500">*</span>
            </KxFormFieldLabel>
            <span className="text-xs text-zinc-500">
              {getCrowdKasCharacterCount(form.title)} / {CROWDKAS_CONTENT_LIMITS.title.max}
            </span>
          </div>
          <input
            type="text"
            value={form.title}
            maxLength={CROWDKAS_CONTENT_LIMITS.title.max}
            onChange={(e) => onFormChange((f) => ({ ...f, title: e.target.value }))}
            className="k-input text-base"
          />
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <KxFormFieldLabel>Category</KxFormFieldLabel>
            <DonationCategoryField
              value={form.category ?? ''}
              onChange={(category) => onFormChange((f) => ({ ...f, category: category || undefined }))}
            />
          </div>
          <div>
            <KxFormFieldLabel>Tags (optional)</KxFormFieldLabel>
            <div className="flex gap-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => onTagInputChange(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddTag())}
                className="k-input flex-1"
                placeholder="Add tag…"
              />
              <button type="button" onClick={onAddTag} className="k-control-btn shrink-0">
                Add
              </button>
            </div>
            {(form.tags ?? []).length > 0 ? (
              <div className="flex flex-wrap gap-2 mt-2">
                {(form.tags ?? []).map((t) => (
                  <button
                    key={t}
                    type="button"
                    onClick={() => onRemoveTag(t)}
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

        <div>
          <div className="flex items-center justify-between gap-2 mb-2">
            <KxFormFieldLabel>Short Description</KxFormFieldLabel>
            <span className="text-xs text-zinc-500">
              {getCrowdKasCharacterCount(form.description.replace(/<[^>]*>/g, ''))} /{' '}
              {CROWDKAS_CONTENT_LIMITS.description.max}
            </span>
          </div>
          <textarea
            value={form.description}
            onChange={(e) => onFormChange((f) => ({ ...f, description: e.target.value }))}
            placeholder="Brief summary for cards and listings"
            maxLength={CROWDKAS_CONTENT_LIMITS.description.max}
            rows={3}
            className="k-input text-base w-full resize-y min-h-[4.5rem]"
          />
        </div>

        <div>
          <KxFormFieldLabel>Main Content</KxFormFieldLabel>
          <KxRichTextEditor
            value={form.mainContent ?? ''}
            onChange={(value) => onFormChange((f) => ({ ...f, mainContent: value }))}
            minRows={14}
            placeholder="Primary campaign story and details"
          />
        </div>

        <CrowdKasCampaignMediaField
          source={imageSource}
          onSourceChange={onImageSourceChange}
          url={imageUrl}
          onUrlChange={onImageUrlChange}
          cid={imageCid}
          onCidChange={onImageCidChange}
          fileName={imageFileName}
          onFileNameChange={onImageFileNameChange}
        />

        <div>
          <KxFormFieldLabel>Goals (optional)</KxFormFieldLabel>
          <div className="flex gap-2 mb-2">
            <input
              type="text"
              value={goalInput}
              onChange={(e) => onGoalInputChange(e.target.value)}
              onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), onAddGoal())}
              className="k-input flex-1"
              placeholder="Add goal"
            />
            <button type="button" onClick={onAddGoal} className="k-control-btn shrink-0">
              Add
            </button>
          </div>
          <ul className="space-y-1">
            {(form.goals || []).map((g, i) => (
              <li key={i} className="flex items-center gap-2 text-sm">
                <span className="text-zinc-700 dark:text-zinc-300">{g}</span>
                <button type="button" onClick={() => onRemoveGoal(i)} className="text-red-600 dark:text-red-400 text-xs">
                  Remove
                </button>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <KxFormFieldLabel>Social links (optional)</KxFormFieldLabel>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <input
              type="text"
              value={form.socialLinks?.website ?? ''}
              onChange={(e) =>
                onFormChange((f) => ({
                  ...f,
                  socialLinks: { ...f.socialLinks, website: e.target.value || undefined },
                }))
              }
              className="k-input"
              placeholder="Website"
            />
            <input
              type="text"
              value={form.socialLinks?.twitter ?? ''}
              onChange={(e) =>
                onFormChange((f) => ({
                  ...f,
                  socialLinks: { ...f.socialLinks, twitter: e.target.value || undefined },
                }))
              }
              className="k-input"
              placeholder="Twitter"
            />
            <input
              type="text"
              value={form.socialLinks?.discord ?? ''}
              onChange={(e) =>
                onFormChange((f) => ({
                  ...f,
                  socialLinks: { ...f.socialLinks, discord: e.target.value || undefined },
                }))
              }
              className="k-input"
              placeholder="Discord"
            />
          </div>
        </div>

        {editingV2CampaignId != null && !l1TipsUnlockedV2 ? (
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            <strong>L1 tip jar:</strong> enable the paid module below to allow optional L1 tips on your campaign page.
          </p>
        ) : null}

        {editingV2CampaignId != null && l1TipsUnlockedV2 ? (
          <div className="rounded-lg border border-zinc-200 dark:border-zinc-700 p-3 space-y-2">
            <label className="flex items-center gap-2 text-sm font-medium text-zinc-700 dark:text-zinc-300">
              <input
                type="checkbox"
                checked={form.l1TipGiftEnabled}
                onChange={(e) => onFormChange((f) => ({ ...f, l1TipGiftEnabled: e.target.checked }))}
                className="rounded border-zinc-300"
              />
              Offer a thank-you gift for L1 tippers (text, URL, or IPFS)
            </label>
            {form.l1TipGiftEnabled ? (
              <div className="space-y-2 pt-1">
                <select
                  value={form.l1TipGiftType}
                  onChange={(e) =>
                    onFormChange((f) => ({ ...f, l1TipGiftType: e.target.value as 'text' | 'url' | 'ipfs' }))
                  }
                  className="k-input w-full text-sm"
                >
                  <option value="text">Text</option>
                  <option value="url">URL</option>
                  <option value="ipfs">IPFS CID</option>
                </select>
                <input
                  type="text"
                  value={form.l1TipGiftLabel}
                  onChange={(e) => onFormChange((f) => ({ ...f, l1TipGiftLabel: e.target.value }))}
                  className="k-input w-full text-sm"
                  placeholder="Short label (e.g. Wallpaper pack)"
                />
                <textarea
                  value={form.l1TipGiftValue}
                  onChange={(e) => onFormChange((f) => ({ ...f, l1TipGiftValue: e.target.value }))}
                  rows={2}
                  className="k-input w-full text-sm min-h-[80px]"
                  placeholder={
                    form.l1TipGiftType === 'text' ? 'Message…' : form.l1TipGiftType === 'url' ? 'https://…' : 'bafy…'
                  }
                />
              </div>
            ) : null}
          </div>
        ) : null}

        <div id="crowdkas-dashboard-modules" className="scroll-mt-24">
          <CrowdKasModulesPanel
            modules={modulesConfig}
            onChange={onModulesConfigChange}
            paidModulesUnlocked={paidModulesUnlocked}
          />
        </div>

        {editErrorMsg && hideActions ? null : editErrorMsg ? (
          <p className="text-sm text-red-600 dark:text-red-400">{editErrorMsg}</p>
        ) : null}
        {updateErrorMsg && hideActions ? null : updateErrorMsg ? (
          <p className="text-sm text-red-600 dark:text-red-400">{updateErrorMsg}</p>
        ) : null}

        {hideActions ? (
          <div className="flex gap-2">
            <button type="button" onClick={onCancel} className="k-control-btn">
              Cancel
            </button>
          </div>
        ) : (
          <div className="flex gap-2">
            <button
              type="button"
              onClick={onSave}
              disabled={isSubmitting}
              className="k-control-btn !bg-emerald-600 !text-white hover:!bg-emerald-700 disabled:opacity-50"
            >
              {isSubmitting ? 'Updating…' : 'Save changes'}
            </button>
            <button type="button" onClick={onCancel} className="k-control-btn">
              Cancel
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
