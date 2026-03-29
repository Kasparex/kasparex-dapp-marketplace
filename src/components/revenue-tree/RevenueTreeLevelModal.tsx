'use client';

import { useState, useMemo } from 'react';
import { useChainId } from 'wagmi';
import { RevenueTreeLevel as RevenueTreeLevelType, RevenueTreeContentType } from '@/lib/revenue-tree/types';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import Link from 'next/link';

interface RevenueTreeLevelModalProps {
  level: RevenueTreeLevelType;
  isOpen: boolean;
  onClose: () => void;
  isCurrentUser?: boolean;
  contentType: RevenueTreeContentType;
  contentSlug: string;
}

// Generates stable random wallets based on level and index
function generateMockUsers(level: number, count: number): string[] {
    const users: string[] = [];
    for (let i = 0; i < count; i++) {
        let address = "0x";
        for (let j = 0; j < 40; j++) {
            address += Math.floor(Math.abs(Math.sin((level * 10000) + (i * 100) + j)) * 16).toString(16);
        }
        users.push(address);
    }
    return users;
}

function formatWalletDisplay(walletAddress: string): string {
    if (!walletAddress || walletAddress.length < 10) return walletAddress;
    return `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`;
}

const LEVEL_REQUIREMENTS = [
    "100 KAS/30d (or 10 KAS w/ KREX)",
    "200 KAS/30d (or 20 KAS w/ KREX)",
    "500 KAS/30d (or 50 KAS w/ KREX)",
    "1,000 KAS/30d (or 100 KAS w/ KREX)",
    "2,000 KAS/30d (or 200 KAS w/ KREX)",
];

export function RevenueTreeLevelModal({
  level,
  isOpen,
  onClose,
  isCurrentUser = false,
  contentType,
  contentSlug,
}: RevenueTreeLevelModalProps) {
  const chainId = useChainId();
  const nativeSymbol = getNativeCurrencySymbol(chainId);
  const [copied, setCopied] = useState(false);

  const displayCount = Math.min(level.userCount || 0, 100);
  const mockUsers = useMemo(() => generateMockUsers(level.level, displayCount), [level.level, displayCount]);
  const reqTxt = LEVEL_REQUIREMENTS[level.level - 1] || "-";

  if (!isOpen) return null;

  const handleCopyAddress = async () => {
    try {
      await navigator.clipboard.writeText(level.walletAddress);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error('Failed to copy:', err);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div
        className="bg-white dark:bg-zinc-900 rounded-2xl max-w-4xl w-full flex flex-col max-h-[90vh] shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-5 border-b border-zinc-100 dark:border-zinc-800 flex justify-between items-center bg-zinc-50/50 dark:bg-zinc-900/50">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl font-bold text-lg bg-[#02abb8] text-white shadow-lg shadow-[#02abb8]/20">
              L{level.level}
            </div>
            <div className="flex-1 flex flex-col min-w-0">
                <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
                    <h3 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-tight leading-none">
                        Level {level.level} Details
                    </h3>
                    <div className="flex items-center gap-2">
                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest whitespace-nowrap">Requirements:</span>
                        <span className="text-xs font-bold text-[#02abb8] bg-[#02abb8]/10 px-2.5 py-1 rounded-full whitespace-nowrap">{reqTxt}</span>
                    </div>
                </div>
            </div>
          </div>
          <button 
            onClick={onClose} 
            className="text-zinc-400 hover:text-zinc-900 dark:hover:text-white p-2 rounded-xl hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-all"
          >
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Info Strip */}
        <div className="grid grid-cols-2 md:grid-cols-4 border-b border-zinc-100 dark:border-zinc-800 bg-white dark:bg-zinc-950">
            <div className="p-4 border-r border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Percentage Share</span>
                <span className="text-lg font-bold text-zinc-900 dark:text-zinc-100">{level.sharePercentage}%</span>
            </div>
            <div className="p-4 border-r border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Referred Users</span>
                <span className="text-lg font-bold text-purple-600 dark:text-purple-400 tabular-nums">{level.userCount.toLocaleString()}</span>
            </div>
            <div className="p-4 border-r border-zinc-100 dark:border-zinc-800">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Status</span>
                <div className="flex items-center gap-2 mt-1">
                    <div className={`w-2 h-2 rounded-full ${level.isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300 dark:bg-zinc-700'}`} />
                    <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300">{level.isActive ? 'Qualifying' : 'Genesis Redirect'}</span>
                </div>
            </div>
            <div className="p-4">
                <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest block mb-1">Occupying Wallet</span>
                <div className="flex items-center gap-2 group cursor-pointer" onClick={handleCopyAddress}>
                    <span className="text-xs font-mono font-bold text-zinc-900 dark:text-zinc-100 truncate">{formatWalletDisplay(level.walletAddress)}</span>
                    <button className="text-zinc-400 group-hover:text-[#02abb8] transition-colors">
                        {copied ? '✓' : (
                            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                            </svg>
                        )}
                    </button>
                </div>
            </div>
        </div>

        {/* Directory (Table) */}
        <div className="flex-1 overflow-hidden flex flex-col min-h-0 bg-zinc-50 dark:bg-zinc-900/30">
            <div className="px-6 py-4 flex items-center justify-between shrink-0 bg-white dark:bg-zinc-950 border-b border-zinc-100 dark:border-zinc-800 z-10">
                <h4 className="text-sm font-bold text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    Referred Users Directory
                </h4>
                {level.userCount > 100 && (
                    <span className="text-[10px] font-bold text-zinc-400 uppercase">First 100 entries</span>
                )}
            </div>
            
            <div className="flex-1 overflow-y-auto px-6 pb-6">
                {mockUsers.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-zinc-950 rounded-2xl border border-dashed border-zinc-200 dark:border-zinc-800 mt-6">
                        <div className="w-12 h-12 rounded-full bg-zinc-50 dark:bg-zinc-900 flex items-center justify-center text-zinc-300 mb-4 font-bold">?</div>
                        <p className="text-xs font-bold text-zinc-400 uppercase tracking-widest">No active users at this depth</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-zinc-950 rounded-2xl border border-zinc-100 dark:border-zinc-800 shadow-sm overflow-hidden">
                        <table className="w-full text-left">
                            <thead className="bg-zinc-50 dark:bg-zinc-900/50 border-b border-zinc-100 dark:border-zinc-800 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                                <tr>
                                    <th className="py-4 px-6">User Wallet</th>
                                    <th className="py-4 px-6 text-right">Referral Tree</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-zinc-50 dark:divide-zinc-800/50">
                                {mockUsers.map((address, idx) => (
                                    <tr key={idx} className="group hover:bg-[#02abb8]/5 transition-colors">
                                        <td className="py-4 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-lg bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center text-[10px] font-bold text-zinc-400 group-hover:bg-[#02abb8]/20 group-hover:text-[#02abb8] transition-colors">
                                                    {idx + 1}
                                                </div>
                                                <span className="text-sm font-mono font-bold text-zinc-700 dark:text-zinc-300">
                                                    {address}
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 px-6 text-right">
                                            <Link 
                                                href={`/tree/${address}`}
                                                className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white text-xs font-bold uppercase tracking-wider hover:bg-[#02abb8] hover:text-white transition-all"
                                                onClick={onClose}
                                            >
                                                Open Tree
                                                <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M14 5l7 7m0 0l-7 7m7-7H3" />
                                                </svg>
                                            </Link>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )}
            </div>
        </div>
      </div>
    </div>
  );
}
