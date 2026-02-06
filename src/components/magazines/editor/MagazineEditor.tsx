'use client';

import { useState } from 'react';
import { ContributorRole, ContributorShare } from '@/lib/magazines/types';

interface EditorBlock {
    id: string;
    type: 'text' | 'image' | 'video' | 'header';
    content: string;
}

export function MagazineEditor() {
    const [blocks, setBlocks] = useState<EditorBlock[]>([
        { id: '1', type: 'header', content: 'New Magazine Issue' },
        { id: '2', type: 'text', content: 'Start writing your collaborative masterpiece here...' },
    ]);
    const [contributors, setContributors] = useState<ContributorShare[]>([
        { address: 'kaspa:your-address', role: 'Author', sharePercentage: 100 }
    ]);

    const addBlock = (type: EditorBlock['type']) => {
        const newBlock: EditorBlock = {
            id: Date.now().toString(),
            type,
            content: type === 'header' ? 'New Section' : '',
        };
        setBlocks([...blocks, newBlock]);
    };

    const updateBlock = (id: string, content: string) => {
        setBlocks(blocks.map(b => b.id === id ? { ...b, content } : b));
    };

    const removeBlock = (id: string) => {
        if (blocks.length > 1) {
            setBlocks(blocks.filter(b => b.id !== id));
        }
    };

    const addContributor = () => {
        const newContributor: ContributorShare = {
            address: '',
            role: 'Writer',
            sharePercentage: 0,
        };
        setContributors([...contributors, newContributor]);
    };

    const updateContributor = (index: number, updates: Partial<ContributorShare>) => {
        const newContributors = [...contributors];
        newContributors[index] = { ...newContributors[index], ...updates };
        setContributors(newContributors);
    };

    const totalShare = contributors.reduce((sum, c) => sum + (Number(c.sharePercentage) || 0), 0);

    return (
        <div className="flex flex-col lg:flex-row gap-8 bg-white dark:bg-zinc-950 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 shadow-2xl">
            {/* Main Editor Area */}
            <div className="flex-1 space-y-6">
                <div className="flex items-center justify-between mb-8">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100">Editor Module</h2>
                    <div className="flex items-center gap-2">
                        <button
                            onClick={() => addBlock('text')}
                            className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold hover:bg-cyan-500 hover:text-white transition-all"
                        >
                            + Text
                        </button>
                        <button
                            onClick={() => addBlock('image')}
                            className="px-3 py-1.5 bg-zinc-100 dark:bg-zinc-800 text-zinc-600 dark:text-zinc-400 rounded-lg text-xs font-bold hover:bg-cyan-500 hover:text-white transition-all"
                        >
                            + Image
                        </button>
                        <button
                            className="px-4 py-1.5 bg-cyan-500 text-white rounded-lg text-xs font-bold hover:bg-cyan-600 transition-all shadow-lg shadow-cyan-500/20"
                        >
                            Publish Issue
                        </button>
                    </div>
                </div>

                <div className="space-y-4">
                    {blocks.map((block) => (
                        <div key={block.id} className="group relative flex gap-4 p-4 rounded-xl border border-dashed border-zinc-200 dark:border-zinc-800 hover:border-cyan-500/50 transition-colors">
                            <div className="flex-1">
                                {block.type === 'header' ? (
                                    <input
                                        type="text"
                                        value={block.content}
                                        onChange={(e) => updateBlock(block.id, e.target.value)}
                                        className="w-full text-2xl font-black bg-transparent border-none focus:ring-0 text-zinc-900 dark:text-zinc-100"
                                        placeholder="Section Title"
                                    />
                                ) : (
                                    <textarea
                                        value={block.content}
                                        onChange={(e) => updateBlock(block.id, e.target.value)}
                                        className="w-full min-h-[100px] bg-transparent border-none focus:ring-0 text-zinc-600 dark:text-zinc-400 resize-none leading-relaxed"
                                        placeholder="Type your content here..."
                                    />
                                )}
                            </div>
                            <button
                                onClick={() => removeBlock(block.id)}
                                className="opacity-0 group-hover:opacity-100 px-2 text-zinc-400 hover:text-red-500 transition-all"
                            >
                                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                            </button>
                        </div>
                    ))}
                </div>
            </div>

            {/* Sidebar: Contributors & Revenue Share */}
            <div className="w-full lg:w-80 space-y-8 border-l border-zinc-100 dark:border-zinc-800 lg:pl-8">
                <div>
                    <h3 className="text-xs font-black text-zinc-500 uppercase tracking-widest mb-4">Contributors & Shares</h3>
                    <div className="space-y-3">
                        {contributors.map((c, i) => (
                            <div key={i} className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 space-y-3">
                                <input
                                    type="text"
                                    placeholder="Kaspa Address"
                                    value={c.address}
                                    onChange={(e) => updateContributor(i, { address: e.target.value })}
                                    className="w-full text-[10px] font-mono bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1"
                                />
                                <div className="flex items-center gap-2">
                                    <select
                                        value={c.role}
                                        onChange={(e) => updateContributor(i, { role: e.target.value as ContributorRole })}
                                        className="flex-1 text-[10px] font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1"
                                    >
                                        <option>Author</option>
                                        <option>Writer</option>
                                        <option>Designer</option>
                                        <option>Editor</option>
                                    </select>
                                    <div className="flex items-center gap-1 w-16">
                                        <input
                                            type="number"
                                            value={c.sharePercentage}
                                            onChange={(e) => updateContributor(i, { sharePercentage: Number(e.target.value) })}
                                            className="w-full text-[10px] font-bold bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded px-2 py-1 text-right"
                                        />
                                        <span className="text-[10px]">%</span>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={addContributor}
                        className="w-full mt-4 py-2 border border-dashed border-zinc-300 dark:border-zinc-700 rounded-xl text-xs font-bold text-zinc-500 hover:border-cyan-500 hover:text-cyan-500 transition-all"
                    >
                        + Add Contributor
                    </button>

                    <div className="mt-6 pt-4 border-t border-zinc-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between text-xs font-black">
                            <span className="text-zinc-500">Total Share</span>
                            <span className={totalShare === 100 ? 'text-green-500' : 'text-red-500'}>
                                {totalShare}%
                            </span>
                        </div>
                        {totalShare !== 100 && (
                            <p className="text-[9px] text-red-400 mt-1">Total share must equal 100% before publishing.</p>
                        )}
                    </div>
                </div>

                <div className="p-4 bg-cyan-500/5 rounded-2xl border border-cyan-500/10">
                    <h4 className="text-[10px] font-black text-cyan-500 uppercase tracking-widest mb-1">Collaborative Economy</h4>
                    <p className="text-[10px] text-zinc-500 leading-normal">
                        Sales revenue will be automatically split on-chain based on these percentages. Each contributor receives KAS directly to their wallet.
                    </p>
                </div>
            </div>
        </div>
    );
}
