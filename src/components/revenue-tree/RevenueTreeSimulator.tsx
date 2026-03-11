'use client';

import { useState } from 'react';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { useChainId } from 'wagmi';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';
import { RevenueTreeLevelModal } from './RevenueTreeLevelModal';
import { useRevenueTree } from '@/hooks/useRevenueTree';
import { ReferralLinkBox } from './ReferralLinkBox';

const LEVEL_SHARES = [
    REVENUE_SHARE_PERCENTAGES.LEVEL_01,
    REVENUE_SHARE_PERCENTAGES.LEVEL_02,
    REVENUE_SHARE_PERCENTAGES.LEVEL_03,
    REVENUE_SHARE_PERCENTAGES.LEVEL_04,
    REVENUE_SHARE_PERCENTAGES.LEVEL_05,
];

const LEVEL_REQUIREMENTS = [
    "100 KAS/30d (or 10 KAS w/ KREX)",
    "200 KAS/30d (or 20 KAS w/ KREX)",
    "500 KAS/30d (or 50 KAS w/ KREX)",
    "1,000 KAS/30d (or 100 KAS w/ KREX)",
    "2,000 KAS/30d (or 200 KAS w/ KREX)",
];

interface InfoModalProps {
    isOpen: boolean;
    onClose: () => void;
    title: string;
    content: string;
}

function InfoModal({ isOpen, onClose, title, content }: InfoModalProps) {
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm" onClick={onClose}>
            <div
                className="bg-white dark:bg-zinc-900 rounded-xl max-w-sm w-full p-6 shadow-xl border border-zinc-200 dark:border-zinc-700 animate-in fade-in zoom-in-95 duration-200"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-bold text-zinc-900 dark:text-white">{title}</h3>
                    <button onClick={onClose} className="text-zinc-500 hover:text-zinc-700 dark:text-zinc-400 dark:hover:text-zinc-200 transition-colors">
                        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                        </svg>
                    </button>
                </div>
                <p className="text-sm text-zinc-600 dark:text-zinc-300 leading-relaxed">
                    {content}
                </p>
                <button
                    onClick={onClose}
                    className="mt-6 w-full py-2 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 text-zinc-900 dark:text-white rounded-lg font-medium transition-colors"
                >
                    Got it
                </button>
            </div>
        </div>
    );
}

function InfoIcon({ onClick }: { onClick: () => void }) {
    return (
        <button
            type="button"
            onClick={onClick}
            className="inline-flex items-center justify-center w-4 h-4 ml-1.5 text-zinc-400 hover:text-[#02abb8] bg-zinc-100 hover:bg-[#02abb8]/10 dark:bg-zinc-800 dark:hover:bg-[#02abb8]/20 rounded-full transition-colors"
            title="More information"
        >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
        </button>
    );
}

export function RevenueTreeSimulator() {
    const chainId = useChainId();
    const symbol = getNativeCurrencySymbol(chainId);
    const { tree } = useRevenueTree();

    // State for the calculator
    const [averageSpend, setAverageSpend] = useState<string>('100');
    const [levelUsers, setLevelUsers] = useState<number[]>([10, 50, 100, 250, 500]);

    // Modal state
    const [activeModal, setActiveModal] = useState<string | null>(null);
    const [selectedLevelDetails, setSelectedLevelDetails] = useState<{ 
        level: number, 
        usersCount: number, 
        sharePct: number, 
        isActive: boolean,
        walletAddress?: string
    } | null>(null);

    const handleUserChange = (index: number, value: string) => {
        const newUsers = [...levelUsers];
        newUsers[index] = parseInt(value) || 0;
        setLevelUsers(newUsers);
    };

    const spendAmount = parseFloat(averageSpend) || 0;

    let totalEarnings = 0;
    let totalUsers = 0;

    return (
        <div className="rounded-xl border border-[#02abb8]/30 dark:border-[#02abb8]/20 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden relative">

            {/* Modals */}
            <InfoModal
                isOpen={activeModal === 'level'}
                onClose={() => setActiveModal(null)}
                title="Level"
                content="The level of separation between you and the referred user. Level 1 means you directly referred them. Level 2 means your Level 1 referral invited them, and so on."
            />
            <InfoModal
                isOpen={activeModal === 'share'}
                onClose={() => setActiveModal(null)}
                title="Share %"
                content="The precise percentage of the transaction volume that you receive as a direct payout when users on this level spend inside a qualified dApp."
            />
            <InfoModal
                isOpen={activeModal === 'earningsPer'}
                onClose={() => setActiveModal(null)}
                title="Earnings per User"
                content="The estimated amount you earn from a single user on this specific level, assuming they spend the 'Avg Spend' amount."
            />
            <InfoModal
                isOpen={activeModal === 'referred'}
                onClose={() => setActiveModal(null)}
                title="Referred Users"
                content="The total number of active users residing at this depth in your referral network."
            />
            <InfoModal
                isOpen={activeModal === 'potential'}
                onClose={() => setActiveModal(null)}
                title="Potential Earnings"
                content="The total cumulative earnings generated by all users on this specific level (Earnings per User multiplied by Referred Users)."
            />
            <InfoModal
                isOpen={activeModal === 'requirements'}
                onClose={() => setActiveModal(null)}
                title="Level Requirements"
                content="The maintenance criteria required to earn from this specific level every rolling 30 days. You can achieve this by either spending the required KAS amount, OR holding 10,000,000 KREX to receive a 90% discount on the required KAS volume."
            />

            {selectedLevelDetails && (
                <RevenueTreeLevelModal 
                    isOpen={!!selectedLevelDetails}
                    onClose={() => setSelectedLevelDetails(null)}
                    level={{
                        level: selectedLevelDetails.level,
                        walletAddress: selectedLevelDetails.walletAddress || '0xStructuralNode',
                        sharePercentage: selectedLevelDetails.sharePct,
                        userCount: selectedLevelDetails.usersCount,
                        isActive: selectedLevelDetails.isActive
                    }}
                    contentType="dapp"
                    contentSlug="simulator"
                />
            )}

            <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-[#02abb8]/5 to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                        <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                            Revenue Tree Calculator
                        </h2>
                        <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-lg">
                            Simulate your potential earnings by estimating the number of active users in your downline and their average dApp spend.
                        </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                        <label htmlFor="simulateAmount" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                            Avg Spend:
                        </label>
                        <div className="relative">
                            <input
                                id="simulateAmount"
                                type="number"
                                min="0"
                                step="1"
                                value={averageSpend}
                                onChange={(e) => setAverageSpend(e.target.value)}
                                className="w-24 sm:w-32 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white font-mono focus:border-[#02abb8] focus:ring-1 focus:ring-[#02abb8] outline-none"
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                <span className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold">{symbol}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="py-4 sm:py-6 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto">
                <table className="w-full text-left min-w-[500px]">
                    <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400">
                            <th className="pb-3 pl-4 sm:pl-6 font-medium">
                                <div className="flex items-center">
                                    Level <InfoIcon onClick={() => setActiveModal('level')} />
                                </div>
                            </th>
                            <th className="pb-3 font-medium">
                                <div className="flex items-center">
                                    Share % <InfoIcon onClick={() => setActiveModal('share')} />
                                </div>
                            </th>
                            <th className="pb-3 font-medium">
                                <div className="flex items-center">
                                    Requirements <InfoIcon onClick={() => setActiveModal('requirements')} />
                                </div>
                            </th>
                            <th className="pb-3 font-medium">
                                <div className="flex items-center">
                                    Earnings per User <InfoIcon onClick={() => setActiveModal('earningsPer')} />
                                </div>
                            </th>
                            <th className="pb-3 font-medium w-32">
                                <div className="flex items-center">
                                    Referred Users <InfoIcon onClick={() => setActiveModal('referred')} />
                                </div>
                            </th>
                            <th className="pb-3 pr-4 sm:pr-6 font-medium text-right">
                                <div className="flex items-center justify-end">
                                    Potential Earnings <InfoIcon onClick={() => setActiveModal('potential')} />
                                </div>
                            </th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                        {LEVEL_SHARES.map((pct, idx) => {
                            const level = idx + 1;
                            const users = levelUsers[idx];
                            const perUser = (spendAmount * pct) / 100;
                            const levelEarnings = perUser * users;
                            const requirementsTxt = LEVEL_REQUIREMENTS[idx];

                            totalEarnings += levelEarnings;
                            totalUsers += users;

                            return (
                                <tr 
                                    key={level} 
                                    className="text-sm cursor-pointer hover:bg-[#02abb8]/5 dark:hover:bg-[#02abb8]/10 transition-colors group"
                                    onClick={() => setSelectedLevelDetails({
                                        level, 
                                        usersCount: users, 
                                        sharePct: pct, 
                                        isActive: true 
                                    })}
                                >
                                    <td className="py-4 pl-4 sm:pl-6">
                                        <div className="flex items-center gap-2">
                                            <div className="flex items-center justify-center w-8 h-8 rounded-full font-black text-xs bg-[#02abb8]/10 text-[#02abb8] shrink-0">
                                                L{level}
                                            </div>
                                            <span className="text-[10px] uppercase font-bold text-emerald-500 tracking-wider flex items-center gap-1 bg-emerald-500/10 px-2 py-0.5 rounded-full whitespace-nowrap">
                                                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span> <span className="hidden sm:inline">Active</span>
                                            </span>
                                        </div>
                                    </td>
                                    <td className="py-4 font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</td>
                                    <td className="py-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">{requirementsTxt}</td>
                                    <td className="py-4 font-mono text-zinc-600 dark:text-zinc-400">
                                        {perUser.toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}
                                    </td>
                                    <td className="py-4" onClick={(e) => e.stopPropagation()}>
                                        <input
                                            type="number"
                                            min="0"
                                            value={users || ''}
                                            onChange={(e) => handleUserChange(idx, e.target.value)}
                                            placeholder="0"
                                            className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 py-1.5 text-sm text-zinc-900 dark:text-white focus:border-[#02abb8] focus:ring-1 focus:ring-[#02abb8] outline-none"
                                        />
                                    </td>
                                    <td className="py-4 text-right pr-4 sm:pr-6">
                                        <div className="font-bold text-[#02abb8]">
                                            +{levelEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                            <td colSpan={4} className="pt-4 pl-4 sm:pl-6 font-bold text-zinc-900 dark:text-white">Total Estimated Network:</td>
                            <td className="pt-4 font-bold text-zinc-900 dark:text-white">{totalUsers.toLocaleString()} Users</td>
                            <td className="pt-4 pr-4 sm:pr-6 text-right font-black text-xl text-[#02abb8]">
                                +{totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>

            {/* Referral Link Box */}
            <div className="p-4 sm:p-6 border-t border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900">
                <ReferralLinkBox 
                    referralLink={tree?.referralLink || ''} 
                    isActive={!!tree?.activatedAt} 
                    contentType="dapp" 
                />
            </div>
        </div>
    );
}
