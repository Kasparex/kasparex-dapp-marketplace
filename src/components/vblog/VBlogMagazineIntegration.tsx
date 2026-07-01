'use client';

import { useState, useEffect, useMemo } from 'react';
import { getAllMagazines, getIssuesForMagazine } from '@/lib/magazines/data';
import { getMagazineIssueHref } from '@/lib/magazines/routes';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';
import { KxFormDropdown } from '@/components/ui/KxFormDropdown';
import Link from 'next/link';

interface VBlogMagazineIntegrationProps {
  linkedMagazineId?: string;
  linkedIssueNumber?: number;
  onChange: (magazineId?: string, issueNumber?: number) => void;
  disabled?: boolean;
  embedded?: boolean;
}

function buildMagazineIntegrationGuide(args: {
  magazine: Magazine | null;
  issueNumber: number;
  publishedIssue: MagazineIssue | null;
}): { nextSteps: string; earningsHint: string; issueHref: string | null } {
  const { magazine, issueNumber, publishedIssue } = args;
  const issueHref = magazine ? getMagazineIssueHref(magazine.id, issueNumber) : null;

  const nextSteps =
    'After you publish, your article appears in the magazine editor submission queue for this issue. The editor reviews linked articles, adds accepted ones to the issue, then publishes.';

  if (!magazine) {
    return {
      nextSteps,
      earningsHint:
        'If your article is accepted, you can earn a contributor share from each issue sale. The editor sets shares when the issue is published (often 20% to 95% of the issue price).',
      issueHref: null,
    };
  }

  if (!publishedIssue) {
    return {
      nextSteps,
      earningsHint: `Issue #${issueNumber} is not published yet. If accepted, you may receive a vBlog Author share from future sales. Editors typically assign 20% to 95% of the issue price per contributor row.`,
      issueHref,
    };
  }

  const contributor =
    publishedIssue.contributors.find((c) => c.role === 'vBlog Author') ??
    publishedIssue.contributors.find((c) => c.role === 'Author' || c.role === 'Writer');
  const sharePct = contributor?.sharePercentage ?? 30;
  const examplePerSale = ((publishedIssue.priceKAS * sharePct) / 100).toFixed(2);

  return {
    nextSteps,
    earningsHint: `Published Issue #${issueNumber} is priced at ${publishedIssue.priceKAS} KAS. With a ${sharePct}% contributor share, you could earn about ${examplePerSale} KAS per sale if your article is included.`,
    issueHref,
  };
}

export function VBlogMagazineIntegration({
  linkedMagazineId,
  linkedIssueNumber,
  onChange,
  disabled = false,
  embedded = false,
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

  const selectedMagazine = useMemo(
    () => magazines.find((m) => m.id === selectedMagId) ?? null,
    [magazines, selectedMagId],
  );

  const publishedIssue = useMemo(
    () => issues.find((i) => i.issueNumber === selectedIssueNum) ?? null,
    [issues, selectedIssueNum],
  );

  const guide = useMemo(
    () =>
      buildMagazineIntegrationGuide({
        magazine: selectedMagazine,
        issueNumber: selectedIssueNum,
        publishedIssue,
      }),
    [selectedMagazine, selectedIssueNum, publishedIssue],
  );

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

  const fields = (
    <>
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="k-label">Target Magazine</label>
          <KxFormDropdown
            ariaLabel="Target magazine"
            value={selectedMagId}
            onChange={handleMagChange}
            disabled={disabled}
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
            disabled={disabled || !selectedMagId}
            placeholder="-- Select Issue --"
            options={[{ value: '', label: '-- Select Issue --' }, ...issueOptions]}
          />
        </div>
      </div>

      {selectedMagId && selectedIssueNum > 0 ? (
        <div className="space-y-3">
          <div className="p-3 bg-[#02abb8]/10 rounded-xl border border-[#02abb8]/25">
            <div className="flex items-center gap-2 text-sm font-bold text-[#02abb8] dark:text-[#66dfe8]">
              <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                  clipRule="evenodd"
                />
              </svg>
              Article linked to magazine
            </div>
          </div>

          <div className="p-3 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 space-y-1.5">
            <p className="text-[10px] font-black uppercase tracking-widest text-zinc-500">What happens next</p>
            <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-snug">{guide.nextSteps}</p>
            <p className="text-sm text-emerald-700 dark:text-emerald-400 leading-snug font-medium">{guide.earningsHint}</p>
            {guide.issueHref ? (
              <Link
                href={guide.issueHref}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-block text-sm font-bold text-[#02abb8] hover:underline"
              >
                View magazine {publishedIssue ? 'issue' : 'page'}
              </Link>
            ) : null}
          </div>
        </div>
      ) : null}
    </>
  );

  if (embedded) {
    return <div className="space-y-3">{fields}</div>;
  }

  return (
    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
      <div className="flex items-center gap-2">
        <div className="w-8 h-8 rounded-full bg-[#02abb8]/10 flex items-center justify-center">
          <svg className="w-4 h-4 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10"
            />
          </svg>
        </div>
        <h4 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
          Magazine Integration
        </h4>
      </div>
      <p className="text-sm text-zinc-600 dark:text-zinc-400 leading-relaxed">
        Submit this article to a Kasparex Magazine issue. The editor curates submissions and sets revenue shares when the issue is published.
      </p>
      {fields}
    </div>
  );
}
