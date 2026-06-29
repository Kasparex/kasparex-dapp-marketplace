'use client';

import { useState, useEffect } from 'react';
import { getAllMagazines, getIssuesForMagazine } from '@/lib/magazines/data';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';
import { KxFormDropdown } from '@/components/ui/KxFormDropdown';
import { KX_IN_FORM_PREMIUM_UNLOCK_BTN_CLASS } from '@/components/ui/KxInFormPremiumRow';

interface VBlogMagazineIntegrationProps {
  linkedMagazineId?: string;
  linkedIssueNumber?: number;
  onChange: (magazineId?: string, issueNumber?: number) => void;
  disabled?: boolean;
  locked?: boolean;
  unlockPriceLabel?: string;
  isUnlocking?: boolean;
  onUnlock?: () => void;
}

export function VBlogMagazineIntegration({
  linkedMagazineId,
  linkedIssueNumber,
  onChange,
  disabled = false,
  locked = false,
  unlockPriceLabel,
  isUnlocking = false,
  onUnlock,
}: VBlogMagazineIntegrationProps) {
  const [magazines, setMagazines] = useState<Magazine[]>([]);
  const [issues, setIssues] = useState<MagazineIssue[]>([]);
  const [selectedMagId, setSelectedMagId] = useState<string>(linkedMagazineId || '');
  const [selectedIssueNum, setSelectedIssueNum] = useState<number>(linkedIssueNumber || 0);

  useEffect(() => {
    setMagazines(getAllMagazines());
  }, []);

  useEffect(() => {
    setSelectedMagId(linkedMagazineId || '');
    setSelectedIssueNum(linkedIssueNumber || 0);
  }, [linkedMagazineId, linkedIssueNumber]);

  useEffect(() => {
    if (selectedMagId) {
      setIssues(getIssuesForMagazine(selectedMagId));
    } else {
      setIssues([]);
    }
  }, [selectedMagId]);

  const fieldsDisabled = disabled || locked;

  const handleMagChange = (id: string) => {
    setSelectedMagId(id);
    setSelectedIssueNum(0);
    onChange(id || undefined, undefined);
  };

  const handleIssueChange = (value: string) => {
    const num = parseInt(value, 10);
    setSelectedIssueNum(num);
    onChange(selectedMagId, num || undefined);
  };

  const issueOptions = [
    ...issues.map((i) => ({
      value: String(i.issueNumber),
      label: `Issue #${i.issueNumber}: ${i.title}`,
    })),
    { value: String(issues.length + 1), label: `Upcoming: Issue #${issues.length + 1}` },
  ];

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
        </div>
        <h4 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
          Magazine Integration
        </h4>
      </div>

      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        Connect this article to a curated magazine issue. This assigns you as a contributor and enables automated revenue-sharing from magazine sales.
      </p>

      {locked ? (
        <div className="rounded-xl border border-amber-500/25 bg-amber-500/10 px-4 py-3 flex flex-wrap items-center justify-between gap-3">
          <p className="text-sm text-amber-800 dark:text-amber-300">
            Unlock the Magazine Integration module to enable article-to-issue linking.
          </p>
          {onUnlock ? (
            <button
              type="button"
              disabled={isUnlocking}
              onClick={onUnlock}
              className={KX_IN_FORM_PREMIUM_UNLOCK_BTN_CLASS}
            >
              {isUnlocking ? 'Unlocking...' : `Unlock${unlockPriceLabel ? ` (${unlockPriceLabel})` : ''}`}
            </button>
          ) : null}
        </div>
      ) : null}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-1">
        <div>
          <label className="k-label">Target Magazine</label>
          <KxFormDropdown
            ariaLabel="Target magazine"
            value={selectedMagId}
            onChange={handleMagChange}
            disabled={fieldsDisabled}
            placeholder="-- No Magazine --"
            options={[
              { value: '', label: '-- No Magazine --' },
              ...magazines.map((m) => ({ value: m.id, label: m.name })),
            ]}
          />
        </div>

        <div>
          <label className="k-label">Issue Number</label>
          <KxFormDropdown
            ariaLabel="Issue number"
            value={selectedIssueNum ? String(selectedIssueNum) : ''}
            onChange={handleIssueChange}
            disabled={fieldsDisabled || !selectedMagId}
            placeholder="-- Select Issue --"
            options={[{ value: '', label: '-- Select Issue --' }, ...issueOptions]}
          />
        </div>
      </div>

      {selectedMagId && selectedIssueNum > 0 && !locked ? (
        <div className="p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
          <div className="flex items-center gap-2 text-sm font-bold text-emerald-600 dark:text-emerald-400">
            <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
            </svg>
            Article linked to magazine
          </div>
        </div>
      ) : null}
    </div>
  );
}
