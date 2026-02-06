'use client';

import { useState, useEffect } from 'react';
import { getAllMagazines, getIssuesForMagazine } from '@/lib/magazines/data';
import { Magazine, MagazineIssue } from '@/lib/magazines/types';

interface VBlogMagazineIntegrationProps {
    linkedMagazineId?: string;
    linkedIssueNumber?: number;
    onChange: (magazineId?: string, issueNumber?: number) => void;
    disabled?: boolean;
}

export function VBlogMagazineIntegration({
    linkedMagazineId,
    linkedIssueNumber,
    onChange,
    disabled = false
}: VBlogMagazineIntegrationProps) {
    const [magazines, setMagazines] = useState<Magazine[]>([]);
    const [issues, setIssues] = useState<MagazineIssue[]>([]);
    const [selectedMagId, setSelectedMagId] = useState<string>(linkedMagazineId || '');
    const [selectedIssueNum, setSelectedIssueNum] = useState<number>(linkedIssueNumber || 0);

    useEffect(() => {
        const mags = getAllMagazines();
        setMagazines(mags);
    }, []);

    useEffect(() => {
        if (selectedMagId) {
            const magIssues = getIssuesForMagazine(selectedMagId);
            setIssues(magIssues);
        } else {
            setIssues([]);
        }
    }, [selectedMagId]);

    const handleMagChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const id = e.target.value;
        setSelectedMagId(id);
        setSelectedIssueNum(0);
        onChange(id || undefined, undefined);
    };

    const handleIssueChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const num = parseInt(e.target.value);
        setSelectedIssueNum(num);
        onChange(selectedMagId, num || undefined);
    };

    return (
        <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 space-y-4">
            <div className="flex items-center gap-2 mb-2">
                <div className="w-8 h-8 rounded-full bg-cyan-500/10 flex items-center justify-center">
                    <svg className="w-4 h-4 text-cyan-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                    </svg>
                </div>
                <h4 className="text-sm font-black uppercase tracking-widest text-zinc-900 dark:text-zinc-100">
                    Magazine Integration
                </h4>
            </div>

            <p className="text-xs text-zinc-500 dark:text-zinc-400 leading-relaxed">
                Connect this article to a curated magazine issue. This assigns you as a contributor and enables automated revenue-sharing from magazine sales.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
                <div>
                    <label className="k-label text-xs">Target Magazine</label>
                    <select
                        value={selectedMagId}
                        onChange={handleMagChange}
                        disabled={disabled}
                        className="k-select text-sm p-2"
                    >
                        <option value="">-- No Magazine --</option>
                        {magazines.map(m => (
                            <option key={m.id} value={m.id}>{m.name}</option>
                        ))}
                    </select>
                </div>

                <div>
                    <label className="k-label text-xs">Issue Number</label>
                    <select
                        value={selectedIssueNum || ''}
                        onChange={handleIssueChange}
                        disabled={disabled || !selectedMagId}
                        className="k-select text-sm p-2"
                    >
                        <option value="">-- Select Issue --</option>
                        {issues.map(i => (
                            <option key={i.id} value={i.issueNumber}>
                                Issue #{i.issueNumber}: {i.title}
                            </option>
                        ))}
                        <option value={issues.length + 1}>Upcoming: Issue #{issues.length + 1}</option>
                    </select>
                </div>
            </div>

            {selectedMagId && selectedIssueNum > 0 && (
                <div className="mt-4 p-3 bg-emerald-500/10 rounded-xl border border-emerald-500/20">
                    <div className="flex items-center gap-2 text-xs font-bold text-emerald-600 dark:text-emerald-400">
                        <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                        Article Linked to Magazine
                    </div>
                </div>
            )}
        </div>
    );
}
