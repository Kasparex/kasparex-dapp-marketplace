'use client';

import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';
import { CrowdKasCampaignMediaField } from '@/components/donations/CrowdKasCampaignMediaField';
import { DonationCategoryField } from '@/components/donations/DonationCategoryField';
import { VDonateTiersEditor } from '@/components/donations/VDonateTiersEditor';
import { CROWDKAS_FORM_PANEL_CLASS } from '@/components/donations/crowdkasFormTheme';
import { KxFormFieldLabel } from '@/components/ui/KxFormFieldLabel';
import { KxRichTextEditor } from '@/components/ui/KxRichTextEditor';
import type { CrowdfundCampaign, CrowdfundCampaignPatch, CrowdfundFaqItem, CrowdfundTier } from '@/lib/covenant/crowdfund-types';
import { CROWDKAS_CONTENT_LIMITS, getCrowdKasCharacterCount } from '@/lib/donations/limits';
import { HubFaqAccordion } from '@/components/hub/HubFaqAccordion';

export type CovenantEditDraft = {
  title: string;
  memo: string;
  mainContent: string;
  category: string;
  tags: string[];
  imageSource: 'url' | 'file';
  imageUrl: string;
  imageCid: string | null;
  imageFileName: string | null;
  tiers: CrowdfundTier[];
  faq: CrowdfundFaqItem[];
};

export function covenantCampaignToEditDraft(campaign: CrowdfundCampaign): CovenantEditDraft {
  return {
    title: campaign.title ?? '',
    memo: campaign.memo ?? '',
    mainContent: campaign.mainContent ?? '',
    category: campaign.category ?? '',
    tags: campaign.tags ?? [],
    imageSource: campaign.imageHash ? 'file' : 'url',
    imageUrl: campaign.imageUrl ?? '',
    imageCid: campaign.imageHash ?? null,
    imageFileName: null,
    tiers: campaign.tiers ?? [],
    faq: campaign.faq ?? [],
  };
}

export function covenantEditDraftToPatch(draft: CovenantEditDraft): CrowdfundCampaignPatch {
  return {
    title: draft.title.trim(),
    memo: draft.memo.trim(),
    mainContent: draft.mainContent.trim() || undefined,
    category: draft.category.trim() || undefined,
    tags: draft.tags.length ? draft.tags : undefined,
    imageUrl: draft.imageSource === 'url' ? draft.imageUrl.trim() || undefined : undefined,
    imageHash: draft.imageSource === 'file' ? draft.imageCid?.trim() || undefined : undefined,
    tiers: draft.tiers,
    faq: draft.faq,
  };
}

/** Full off-chain L1 campaign presentation editor (goal/deadline stay locked). */
export function CrowdKasCovenantEditForm({
  draft,
  onChange,
}: {
  draft: CovenantEditDraft;
  onChange: (next: CovenantEditDraft) => void;
}) {
  const [tagInput, setTagInput] = useStateLocal('');
  const [faqQ, setFaqQ] = useStateLocal('');
  const [faqA, setFaqA] = useStateLocal('');

  const addTag = () => {
    const t = tagInput.trim().replace(/^#/, '');
    if (!t || draft.tags.includes(t)) return;
    onChange({ ...draft, tags: [...draft.tags, t] });
    setTagInput('');
  };

  const addFaq = () => {
    if (!faqQ.trim() || !faqA.trim()) return;
    onChange({
      ...draft,
      faq: [
        ...draft.faq,
        { id: `faq_${Date.now()}`, question: faqQ.trim(), answer: faqA.trim() },
      ],
    });
    setFaqQ('');
    setFaqA('');
  };

  return (
    <div id="crowdkas-edit-campaign" className={`${CROWDKAS_FORM_PANEL_CLASS} scroll-mt-24 space-y-6`}>
      <div>
        <DAppSectionHeader title="Edit L1 campaign" className="mb-3" />
        <h3 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 tracking-tight">
          Update covenant presentation
        </h3>
        <p className="kx-body mt-2">
          Edit story, media, tiers, and FAQ. Goal, deadline, and pledges stay locked on-chain.
        </p>
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <KxFormFieldLabel>Title <span className="text-red-500">*</span></KxFormFieldLabel>
          <span className="text-xs text-zinc-500">
            {getCrowdKasCharacterCount(draft.title)} / {CROWDKAS_CONTENT_LIMITS.title.max}
          </span>
        </div>
        <input
          className="k-input text-base"
          value={draft.title}
          maxLength={CROWDKAS_CONTENT_LIMITS.title.max}
          onChange={(e) => onChange({ ...draft, title: e.target.value })}
        />
      </div>

      <div>
        <div className="flex items-center justify-between gap-2 mb-2">
          <KxFormFieldLabel>Short Description</KxFormFieldLabel>
          <span className="text-xs text-zinc-500">
            {getCrowdKasCharacterCount(draft.memo)} / {CROWDKAS_CONTENT_LIMITS.description.max}
          </span>
        </div>
        <textarea
          className="k-input text-base w-full resize-y min-h-[4.5rem]"
          value={draft.memo}
          maxLength={CROWDKAS_CONTENT_LIMITS.description.max}
          onChange={(e) => onChange({ ...draft, memo: e.target.value })}
          placeholder="Brief summary for cards and listings"
        />
      </div>

      <div>
        <KxFormFieldLabel>Main content</KxFormFieldLabel>
        <KxRichTextEditor
          value={draft.mainContent}
          onChange={(mainContent) => onChange({ ...draft, mainContent })}
          minRows={12}
          placeholder="Primary campaign story and details"
        />
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <KxFormFieldLabel>Category</KxFormFieldLabel>
          <DonationCategoryField
            value={draft.category}
            onChange={(category) => onChange({ ...draft, category })}
          />
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
          {draft.tags.length > 0 ? (
            <div className="flex flex-wrap gap-2 mt-2">
              {draft.tags.map((t) => (
                <button
                  key={t}
                  type="button"
                  onClick={() => onChange({ ...draft, tags: draft.tags.filter((x) => x !== t) })}
                  className="text-xs px-2 py-1 rounded-full bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700"
                >
                  #{t} ×
                </button>
              ))}
            </div>
          ) : null}
        </div>
      </div>

      <CrowdKasCampaignMediaField
        source={draft.imageSource}
        onSourceChange={(imageSource) => onChange({ ...draft, imageSource })}
        url={draft.imageUrl}
        onUrlChange={(imageUrl) => onChange({ ...draft, imageUrl })}
        cid={draft.imageCid}
        onCidChange={(imageCid) => onChange({ ...draft, imageCid })}
        fileName={draft.imageFileName}
        onFileNameChange={(imageFileName) => onChange({ ...draft, imageFileName })}
        label="Cover image"
      />

      <VDonateTiersEditor tiers={draft.tiers} onChange={(tiers) => onChange({ ...draft, tiers })} />

      <div className="space-y-3">
        <DAppSectionHeader title="FAQ" className="mb-0" />
        {draft.faq.length > 0 ? (
          <HubFaqAccordion items={draft.faq} />
        ) : (
          <p className="kx-body text-sm">No FAQ items yet.</p>
        )}
        <div className="space-y-2">
          <input
            className="k-input text-sm"
            placeholder="Question"
            value={faqQ}
            onChange={(e) => setFaqQ(e.target.value)}
          />
          <textarea
            className="k-input text-sm w-full min-h-[3.5rem] resize-y"
            placeholder="Answer"
            value={faqA}
            onChange={(e) => setFaqA(e.target.value)}
          />
          <button type="button" className="k-control-btn" onClick={addFaq}>
            Add FAQ item
          </button>
          {draft.faq.length > 0 ? (
            <button
              type="button"
              className="k-control-btn ml-2"
              onClick={() => onChange({ ...draft, faq: draft.faq.slice(0, -1) })}
            >
              Remove last
            </button>
          ) : null}
        </div>
      </div>
    </div>
  );
}

function useStateLocal(initial: string) {
  const [v, setV] = useState(initial);
  return [v, setV] as const;
}
