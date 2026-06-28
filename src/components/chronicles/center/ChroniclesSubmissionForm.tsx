'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useKaspaWallet } from '@/lib/kaspa/context';
import { KxTabStrip } from '@/components/ui/KxTabStrip';
import { KxSegmentToggle } from '@/components/ui/KxSegmentToggle';
import { useDAppListingPayment } from '@/hooks/useDAppListingPayment';
import { useKREXBalance } from '@/hooks/useKREXBalance';
import { STORE_PAYMENT_CURRENCIES, kasToKrexAmount, type StorePaymentCurrency } from '@/lib/store/currencies';
import {
  CHRONICLES_CONTENT_KIND_LABELS,
  saveCommunitySubmission,
  submissionFeeKas,
  type ChroniclesContentKind,
} from '@/lib/chronicles/communitySubmissions';
import type { CharacterKind, ChronicleTimeline, VehicleKind } from '@/lib/chronicles/types';
import { chroniclesCenterTabHref } from '@/lib/chronicles/centerTabs';
import { DAppSectionHeader } from '@/components/dapps/layout/DAppSectionHeader';

const CONTENT_KINDS: ChroniclesContentKind[] = ['chapter', 'article', 'character', 'location', 'vehicle'];

export function ChroniclesSubmissionForm({ onSubmitted }: { onSubmitted?: () => void }) {
  const router = useRouter();
  const { state } = useKaspaWallet();
  const { payActionFee, isProcessing, error: payError } = useDAppListingPayment();
  const { balance: krexBalance } = useKREXBalance();

  const [kind, setKind] = useState<ChroniclesContentKind>('chapter');
  const [currency, setCurrency] = useState<StorePaymentCurrency>('KAS');
  const [title, setTitle] = useState('');
  const [summary, setSummary] = useState('');
  const [bodyMarkdown, setBodyMarkdown] = useState('');
  const [featuredImageUrl, setFeaturedImageUrl] = useState('');
  const [chapterNumber, setChapterNumber] = useState('');
  const [timeline, setTimeline] = useState<ChronicleTimeline>('current');
  const [characterKind, setCharacterKind] = useState<CharacterKind>('person');
  const [vehicleKind, setVehicleKind] = useState<VehicleKind>('vehicle');
  const [tags, setTags] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  const feeKas = useMemo(() => submissionFeeKas(kind), [kind]);
  const feeKrex = useMemo(() => kasToKrexAmount(feeKas), [feeKas]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);
    if (!state.isConnected || !state.address) {
      setFormError('Connect your Kaspa wallet to submit community lore.');
      return;
    }
    if (!title.trim() || !summary.trim() || !bodyMarkdown.trim()) {
      setFormError('Title, summary, and body are required.');
      return;
    }

    try {
      const txHash = await payActionFee(currency, feeKas);
      saveCommunitySubmission({
        kind,
        title: title.trim(),
        summary: summary.trim(),
        bodyMarkdown: bodyMarkdown.trim(),
        authorAddress: state.address,
        feeAmountKas: feeKas,
        paymentCurrency: currency,
        feeTxHash: txHash,
        featuredImageUrl: featuredImageUrl.trim() || undefined,
        chapterNumber: kind === 'chapter' && chapterNumber ? Number(chapterNumber) : undefined,
        timeline: kind === 'chapter' ? timeline : undefined,
        characterKind: kind === 'character' ? characterKind : undefined,
        vehicleKind: kind === 'vehicle' ? vehicleKind : undefined,
        tags: tags
          .split(/[,#]/)
          .map((t) => t.trim())
          .filter(Boolean)
          .slice(0, 12),
      });
      onSubmitted?.();
      router.push(chroniclesCenterTabHref('submissions'));
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'Submission failed.');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      <DAppSectionHeader
        title="Submit community lore"
        hint="Paid submissions are stored locally in your browser and marked with a Community badge in listings."
      />

      <div className="k-form-group">
        <label className="k-label">Content type</label>
        <KxTabStrip
          value={kind}
          onChange={setKind}
          scrollable
          ariaLabel="Content type"
          options={CONTENT_KINDS.map((k) => ({
            value: k,
            label: CHRONICLES_CONTENT_KIND_LABELS[k],
          }))}
        />
      </div>

      <div className="rounded-2xl border border-violet-500/20 bg-violet-500/5 dark:bg-violet-950/20 p-4 sm:p-5">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm font-bold text-zinc-900 dark:text-zinc-100">Submission fee</p>
            <p className="text-xs text-zinc-500 mt-1">
              {feeKas} KAS or {feeKrex.toLocaleString()} KREX
            </p>
          </div>
          <KxSegmentToggle
            value={currency}
            onChange={setCurrency}
            options={STORE_PAYMENT_CURRENCIES.map((c) => ({ value: c, label: c }))}
            ariaLabel="Payment currency"
          />
        </div>
        {currency === 'KREX' ? (
          <p className="text-xs text-zinc-500 mt-2">KREX balance: {krexBalance.toLocaleString()}</p>
        ) : null}
      </div>

      <div className="grid gap-6 sm:grid-cols-2">
        <div className="k-form-group sm:col-span-2">
          <label className="k-label" htmlFor="ch-title">
            Title
          </label>
          <input id="ch-title" className="k-input" value={title} onChange={(e) => setTitle(e.target.value)} required />
        </div>
        <div className="k-form-group sm:col-span-2">
          <label className="k-label" htmlFor="ch-summary">
            Summary / teaser
          </label>
          <textarea id="ch-summary" className="k-input min-h-[80px]" value={summary} onChange={(e) => setSummary(e.target.value)} required />
        </div>
        <div className="k-form-group sm:col-span-2">
          <label className="k-label" htmlFor="ch-body">
            Body (Markdown)
          </label>
          <textarea id="ch-body" className="k-input min-h-[220px] font-mono text-sm" value={bodyMarkdown} onChange={(e) => setBodyMarkdown(e.target.value)} required />
        </div>
        <div className="k-form-group sm:col-span-2">
          <label className="k-label" htmlFor="ch-image">
            Featured image URL (optional)
          </label>
          <input id="ch-image" type="url" className="k-input" value={featuredImageUrl} onChange={(e) => setFeaturedImageUrl(e.target.value)} placeholder="https://" />
        </div>
        {kind === 'chapter' ? (
          <>
            <div className="k-form-group">
              <label className="k-label" htmlFor="ch-num">
                Chapter number
              </label>
              <input id="ch-num" type="number" min={1} className="k-input" value={chapterNumber} onChange={(e) => setChapterNumber(e.target.value)} />
            </div>
            <div className="k-form-group">
              <label className="k-label">Timeline</label>
              <KxTabStrip
                value={timeline}
                onChange={setTimeline}
                ariaLabel="Timeline"
                options={[
                  { value: 'past', label: 'Past' },
                  { value: 'current', label: 'Current' },
                  { value: 'future', label: 'Future' },
                ]}
              />
            </div>
          </>
        ) : null}
        {kind === 'character' ? (
          <div className="k-form-group sm:col-span-2">
            <label className="k-label">Character kind</label>
            <KxTabStrip
              value={characterKind}
              onChange={setCharacterKind}
              scrollable
              ariaLabel="Character kind"
              options={[
                { value: 'person', label: 'Person' },
                { value: 'ai', label: 'AI' },
                { value: 'faction', label: 'Faction' },
                { value: 'organization', label: 'Org' },
                { value: 'unknown', label: 'Unknown' },
              ]}
            />
          </div>
        ) : null}
        {kind === 'vehicle' ? (
          <div className="k-form-group sm:col-span-2">
            <label className="k-label">Tech kind</label>
            <KxTabStrip
              value={vehicleKind}
              onChange={setVehicleKind}
              scrollable
              ariaLabel="Vehicle kind"
              options={[
                { value: 'vehicle', label: 'Vehicle' },
                { value: 'tool', label: 'Tool' },
                { value: 'weapon', label: 'Weapon' },
                { value: 'device', label: 'Device' },
              ]}
            />
          </div>
        ) : null}
        <div className="k-form-group sm:col-span-2">
          <label className="k-label" htmlFor="ch-tags">
            Tags (comma-separated)
          </label>
          <input id="ch-tags" className="k-input" value={tags} onChange={(e) => setTags(e.target.value)} placeholder="lore, fan-fiction, kaspaland" />
        </div>
      </div>

      {formError || payError ? (
        <p className="text-sm text-red-600 dark:text-red-400">{formError ?? payError}</p>
      ) : null}

      <div className="flex flex-wrap gap-3">
        <button type="submit" className="k-control-btn !border-violet-500/40 !text-violet-900 dark:!text-violet-100" disabled={isProcessing}>
          {isProcessing ? 'Processing payment…' : `Pay ${feeKas} KAS equivalent & submit`}
        </button>
      </div>
    </form>
  );
}
