'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeSidebar } from '@/components/revenue-tree/RevenueTreeSidebar';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';
import { useAccount, useChainId } from 'wagmi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { LevelDetailsModal } from '@/components/revenue-tree/LevelDetailsModal';

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

export default function RevenueTreeDemoPage() {
  const { address: userWalletAddress } = useAccount();
  const chainId = useChainId();
  const symbol = getNativeCurrencySymbol(chainId);

  // Demo Simulation State
  const [currentStep, setCurrentStep] = useState(1);
  const [isMockActivated, setIsMockActivated] = useState(false);
  const [hasReferralLink, setHasReferralLink] = useState(false);
  const [mockEarnings, setMockEarnings] = useState(0);
  const [averageSpend, setAverageSpend] = useState<string>('100');
  const [levelUsers, setLevelUsers] = useState<number[]>([0, 0, 0, 0, 0]);
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedLevelDetails, setSelectedLevelDetails] = useState<{ 
      level: number, 
      usersCount: number, 
      sharePct: number, 
      requirementsTxt: string, 
      earningsPerUser: number, 
      totalEarnings: number,
      isActive: boolean 
  } | null>(null);

  const steps = [
    {
      number: 1,
      title: 'Activate Your Revenue Tree',
      description: 'Spend 100 KAS (or 10 KAS if you hold 10M KREX) to activate your tree. This creates your profile on-chain.',
      action: isMockActivated ? 'Activated' : 'Click to Activate',
      completed: isMockActivated,
    },
    {
      number: 2,
      title: 'Get Your Referral Link',
      description: 'Once activated, your unique global referral link becomes active. You can share it to invite others.',
      action: hasReferralLink ? 'Link Ready' : 'Generate Link',
      completed: hasReferralLink,
      disabled: !isMockActivated,
    },
    {
      number: 3,
      title: 'Refer & Seed Network',
      description: 'Simulate referring 5 friends. They will appear on your Level 1 (L1) and earn you 2% of their spend.',
      action: levelUsers[0] > 0 ? 'Referrals Added' : 'Invite 5 Users',
      completed: levelUsers[0] > 0,
      disabled: !hasReferralLink,
    },
    {
      number: 4,
      title: 'Simulate Growth',
      description: 'Watch your tree scale as your referrals invite others. Meet maintenance criteria to unlock all 5 levels.',
      action: levelUsers[4] > 0 ? 'Tree Scaled' : 'Scale 5 Levels',
      completed: levelUsers[4] > 0,
      disabled: levelUsers[0] === 0,
    },
  ];

  const handleStepAction = (stepNumber: number) => {
    if (stepNumber === 1) {
      setIsMockActivated(true);
      if (currentStep === 1) setCurrentStep(2);
    } else if (stepNumber === 2) {
      setHasReferralLink(true);
      if (currentStep === 2) setCurrentStep(3);
    } else if (stepNumber === 3) {
      setLevelUsers([5, 0, 0, 0, 0]);
      if (currentStep === 3) setCurrentStep(4);
    } else if (stepNumber === 4) {
      setLevelUsers([5, 25, 125, 625, 3125]);
      setCurrentStep(5);
    }
  };

  const handleUserChange = (index: number, value: string) => {
    const newUsers = [...levelUsers];
    newUsers[index] = parseInt(value) || 0;
    setLevelUsers(newUsers);
  };

  const spendAmount = parseFloat(averageSpend) || 0;
  let totalEarnings = 0;
  let totalUsers = 0;

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 flex flex-col lg:flex-row w-full mx-auto">
        
        {/* Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <RevenueTreeSidebar
            totalRevenue={isMockActivated ? (levelUsers[0] > 0 ? 45.50 : 0) : 0}
            activeTrees={isMockActivated ? 1 : 0}
            totalDownline={levelUsers.reduce((a, b) => a + b, 0)}
          />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="space-y-8">
            {/* Header */}
            <div>
              <h1 className="text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                Interactive Revenue Tree Demo
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base max-w-2xl">
                Experience the logic of our native revenue distribution system. Follow the interactive steps to activate your tree and simulate growth.
              </p>
            </div>

            {/* Interactive Wizard */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`p-5 rounded-2xl border-2 transition-all duration-300 ${
                    currentStep === step.number
                      ? 'border-[#02abb8] bg-[#02abb8]/5 shadow-[0_0_20px_rgba(2,171,184,0.1)]'
                      : step.completed
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-60'
                  }`}
                >
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-3">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                        step.completed ? 'bg-emerald-500 text-white' : 'bg-[#02abb8] text-white'
                      }`}>
                        {step.completed ? '✓' : step.number}
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-white leading-tight">{step.title}</h3>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-4 flex-1">
                      {step.description}
                    </p>
                    <button
                      onClick={() => handleStepAction(step.number)}
                      disabled={step.disabled || step.completed}
                      className={`w-full py-2 rounded-xl text-xs font-black uppercase tracking-wider transition-all ${
                        step.completed
                          ? 'bg-emerald-500/10 text-emerald-600 cursor-default'
                          : step.disabled
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            : 'bg-[#02abb8] hover:bg-[#0299a6] text-white shadow-lg shadow-[#02abb8]/20'
                      }`}
                    >
                      {step.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Dashboard Content */}
            <div className="space-y-6">
              
              {/* Activation Progress Bar (Simulated) */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-800/50 rounded-2xl border border-zinc-200 dark:border-zinc-800">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                    Activation Progress (Simulated)
                  </span>
                  <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                    {isMockActivated ? '100.00 / 100.00 KAS' : '20.00 / 100.00 KAS'}
                  </span>
                </div>
                <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-700 rounded-full ${isMockActivated ? 'bg-emerald-500 shadow-[0_0_10px_rgba(16,185,129,0.5)]' : 'bg-[#02abb8]'}`}
                    style={{ width: isMockActivated ? '100%' : '20%' }}
                  />
                </div>
                <p className="text-[10px] text-zinc-500 dark:text-zinc-400 mt-2 italic font-medium">
                  {isMockActivated ? '✓ Your Revenue Tree is active on-chain.' : 'Spend 80.00 KAS more to activate your tree and generate your referral link.'}
                </p>
              </div>

              {/* Referral Link Box (Simulated) */}
              {hasReferralLink && (
                 <div className="p-4 bg-gradient-to-br from-[#02abb8]/10 to-purple-500/10 rounded-2xl border border-[#02abb8]/20 animate-in fade-in slide-in-from-top-4 duration-500">
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h3 className="text-sm font-black text-zinc-900 dark:text-white uppercase tracking-wider">Your Referral Link</h3>
                            <p className="text-xs text-zinc-500 dark:text-zinc-400">Share this link to earn 2% from all Level 1 referred users natively.</p>
                        </div>
                        <div className="flex items-center gap-2 bg-white dark:bg-zinc-950 px-3 py-2 rounded-xl border border-zinc-200 dark:border-zinc-800 flex-1 max-w-md">
                            <span className="text-xs font-mono text-zinc-500 truncate select-all">https://kasparex.com/tree?ref=0xDemo...User</span>
                            <button className="ml-auto text-[#02abb8] hover:text-[#0299a6] transition-colors">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                                </svg>
                            </button>
                        </div>
                    </div>
                </div>
              )}

              {/* Simulation Table Control */}
              <div className="rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden">
                <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-900/50">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div className="flex items-center gap-2">
                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                            <h2 className="text-lg font-black text-zinc-900 dark:text-white uppercase tracking-tight">Revenue Stream Simulator</h2>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-xs font-black text-zinc-500 uppercase tracking-widest">Avg Spend:</label>
                            <div className="flex items-center bg-white dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 rounded-xl px-3 py-1.5 shadow-sm">
                                <input 
                                    type="number" 
                                    value={averageSpend} 
                                    onChange={(e) => setAverageSpend(e.target.value)}
                                    className="w-16 bg-transparent outline-none text-sm font-black text-[#02abb8] tabular-nums" 
                                />
                                <span className="text-xs font-bold text-zinc-400 ml-1">{symbol}</span>
                            </div>
                        </div>
                   </div>
                </div>

                <div className="overflow-x-auto">
                   <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-700 text-[10px] uppercase font-black tracking-widest text-zinc-400">
                                <th className="py-4 px-6">Level</th>
                                <th className="py-4 px-4 text-center">Share</th>
                                <th className="py-4 px-4">Requirements / Maintenance</th>
                                <th className="py-4 px-4 text-center">Referred Users</th>
                                <th className="py-4 px-6 text-right">Potential Payout</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/50">
                            {LEVEL_SHARES.map((pct, idx) => {
                                const level = idx + 1;
                                const users = levelUsers[idx];
                                const perUser = (spendAmount * pct) / 100;
                                const levelEarnings = perUser * users;
                                const requirementsTxt = LEVEL_REQUIREMENTS[idx];
                                const isActive = isMockActivated; // In demo, activate all levels if tree is active

                                totalEarnings += levelEarnings;
                                totalUsers += users;

                                return (
                                    <tr 
                                        key={level} 
                                        className="hover:bg-[#02abb8]/5 transition-all cursor-pointer group"
                                        onClick={() => setSelectedLevelDetails({
                                            level, usersCount: users, sharePct: pct, requirementsTxt, earningsPerUser: perUser, totalEarnings: levelEarnings, isActive
                                        })}
                                    >
                                        <td className="py-5 px-6">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-[#02abb8]/10 flex items-center justify-center font-black text-xs text-[#02abb8] group-hover:scale-110 transition-transform">
                                                    L{level}
                                                </div>
                                                <div 
                                                    className={`w-2 h-2 rounded-full shrink-0 ${isActive ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300 dark:bg-zinc-700'}`}
                                                    title={isActive ? 'Active' : 'Inactive (Genesis receives)'}
                                                />
                                            </div>
                                        </td>
                                        <td className="py-5 px-4 text-center">
                                            <span className="text-sm font-black text-zinc-900 dark:text-zinc-100">{pct}%</span>
                                        </td>
                                        <td className="py-5 px-4">
                                            <div className="flex flex-col">
                                                <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">{requirementsTxt}</span>
                                                {!isActive && <span className="text-[9px] font-black text-zinc-400 dark:text-zinc-600 uppercase mt-0.5">Redirecting to Genesis</span>}
                                            </div>
                                        </td>
                                        <td className="py-5 px-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={users || ''}
                                                    onChange={(e) => handleUserChange(idx, e.target.value)}
                                                    placeholder="0"
                                                    className="w-20 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs font-black text-zinc-900 dark:text-white focus:border-[#02abb8] outline-none text-center shadow-sm"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-5 px-6 text-right">
                                            <div className={`text-sm font-black tabular-nums transition-colors ${isActive && levelEarnings > 0 ? 'text-[#02abb8]' : 'text-zinc-400'}`}>
                                                +{levelEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="bg-zinc-900 dark:bg-zinc-950 text-white border-t-2 border-[#02abb8]/30">
                                <td colSpan={3} className="py-6 px-6 text-right font-black uppercase tracking-widest text-[10px] text-zinc-500">Global Simulation Output:</td>
                                <td className="py-6 px-4 text-center">
                                    <div className="inline-flex items-center gap-2 bg-[#02abb8]/20 px-3 py-1.5 rounded-full border border-[#02abb8]/30">
                                        <span className="text-xs font-black text-[#02abb8]">{totalUsers.toLocaleString()} Nodes</span>
                                    </div>
                                </td>
                                <td className="py-6 px-6 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-emerald-400 tabular-nums">+{totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}</span>
                                        <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest">per 30 days</span>
                                    </div>
                                </td>
                            </tr>
                        </tfoot>
                   </table>
                </div>
              </div>

              {/* Educational Cards */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <div className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 hover:border-[#02abb8]/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-[#02abb8]/10 flex items-center justify-center text-[#02abb8] mb-6 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-3">Native Distribution</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Unlike traditional cashback, Revenue Tree shares are distributed natively in the base currency (KAS) triggered directly by smart contract events. No middleman, no points, just real volume.
                    </p>
                 </div>
                 
                 <div className="group bg-white dark:bg-zinc-900 rounded-3xl border border-zinc-200 dark:border-zinc-800 p-8 hover:border-purple-500/50 transition-all duration-300">
                    <div className="w-12 h-12 rounded-2xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-6 group-hover:scale-110 transition-transform">
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h3 className="text-xl font-black text-zinc-900 dark:text-white mb-3">KREX Utility</h3>
                    <p className="text-sm text-zinc-500 dark:text-zinc-400 leading-relaxed">
                        Holding 10,000,000 KREX tokens (or holding a KREX Badge) empowers your wallet with a &quot;Maintenance Multiplier&quot;, reducing your monthly volume requirement by 90% across all 5 levels.
                    </p>
                 </div>
              </div>

            </div>
          </div>
        </main>
      </div>

      <Footer />

      {selectedLevelDetails && (
        <LevelDetailsModal 
            isOpen={!!selectedLevelDetails}
            onClose={() => setSelectedLevelDetails(null)}
            level={selectedLevelDetails.level}
            usersCount={selectedLevelDetails.usersCount}
            sharePct={selectedLevelDetails.sharePct}
            requirementsTxt={selectedLevelDetails.requirementsTxt}
            symbol={symbol}
            earningsPerUser={selectedLevelDetails.earningsPerUser}
            totalEarnings={selectedLevelDetails.totalEarnings}
        />
      )}

      <InfoModal
          isOpen={activeModal === 'level'}
          onClose={() => setActiveModal(null)}
          title="Level Depth"
          content="Your relationship to the user in the tree. L1 is a direct referral. L2 is their referral, and so on."
      />
      {/* Add more info modals as needed */}
    </div>
  );
}
