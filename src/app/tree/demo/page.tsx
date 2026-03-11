'use client';

import { useState, useMemo } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeSidebar } from '@/components/revenue-tree/RevenueTreeSidebar';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';
import { useAccount, useChainId } from 'wagmi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { RevenueTreeLevelModal } from '@/components/revenue-tree/RevenueTreeLevelModal';
import { RevenueTreeFlowStory } from '@/components/revenue-tree/RevenueTreeFlowStory';


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
  const [averageSpend, setAverageSpend] = useState<string>('100');
  const [levelUsers, setLevelUsers] = useState<number[]>([0, 0, 0, 0, 0]);
  const [storyLog, setStoryLog] = useState<{msg: string, type: 'info' | 'success' | 'money'}[]>([
      { msg: 'System initialized. Alice (You) is currently in Genesis mode.', type: 'info' }
  ]);
  
  const [activeModal, setActiveModal] = useState<string | null>(null);
  const [selectedLevelDetails, setSelectedLevelDetails] = useState<{ 
      level: number, 
      usersCount: number, 
      sharePct: number, 
      isActive: boolean 
  } | null>(null);

  const steps = [
    {
      number: 1,
      title: 'Phase 1: Activation',
      description: 'Alice (You) is inactive. Referrals would go to Genesis. Activate to become the root of your tree.',
      action: isMockActivated ? 'Alice Active' : 'Activate Alice',
      completed: isMockActivated,
    },
    {
      number: 2,
      title: 'Phase 2: Network Seeding',
      description: 'Your link is ready. Alice refers Bob and Dave. They both appear on your Level 1 (L1).',
      action: levelUsers[0] > 0 ? 'Referrals Added' : 'Invite Bob & Dave',
      completed: levelUsers[0] > 0,
      disabled: !isMockActivated,
    },
    {
      number: 3,
      title: 'Phase 3: Revenue Flow',
      description: 'Bob spends 100 KAS. Because Alice is active, she receives 2% (2 KAS) natively.',
      action: currentStep > 3 ? 'Commission Earned' : 'Bob Pays 100 KAS',
      completed: currentStep > 3,
      disabled: levelUsers[0] === 0,
    },
    {
      number: 4,
      title: 'Phase 4: Network Depth',
      description: 'Bob refers Charlie and Dave refers Eve. Your network now spans 2 levels deep and 2 users wide.',
      action: currentStep > 4 ? 'Depth Increased' : 'Grow to Level 2',
      completed: currentStep > 4,
      disabled: currentStep < 4,
    },
    {
      number: 5,
      title: 'Phase 5: Full 5-Level Scale',
      description: 'The tree scales to Henry at Level 5. Observe how revenue propagates through the entire chain back to Alice.',
      action: levelUsers[4] > 0 ? 'Fully Scaled' : 'Simulate L5 payment',
      completed: levelUsers[4] > 0,
      disabled: currentStep < 5,
    },
  ];

  const addLog = (msg: string, type: 'info' | 'success' | 'money') => {
      setStoryLog(prev => [{ msg, type }, ...prev].slice(0, 5));
  };

  const handleStepAction = (stepNumber: number) => {
    if (stepNumber === 1) {
      setIsMockActivated(true);
      setHasReferralLink(true);
      addLog('Alice activated! She is now L1 root.', 'success');
      setCurrentStep(2);
    } else if (stepNumber === 2) {
      setLevelUsers([2, 0, 0, 0, 0]);
      addLog('Bob and Dave joined Alice\'s network as direct referrals.', 'info');
      setCurrentStep(3);
    } else if (stepNumber === 3) {
      addLog('Bob spent 100 KAS. Alice earned 2 KAS!', 'money');
      setCurrentStep(4);
    } else if (stepNumber === 4) {
      setLevelUsers([2, 2, 0, 0, 0]);
      addLog('Charlie and Eve join. Alice now has nodes at Level 2.', 'info');
      setCurrentStep(5);
    } else if (stepNumber === 5) {
      setLevelUsers([2, 2, 1, 1, 1]);
      addLog('Henry joined at Level 5! Simulating deep revenue propagation...', 'success');
      addLog('Henry paid 100 KAS. Alice earns 45% (45 KAS) from L5!', 'money');
      setCurrentStep(6);
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

  // Calculate earnings based on scenario or manual input
  // In demo mode, we might want to override manual input logic with story logic for consistency

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <RevenueTreeSidebar
            totalRevenue={isMockActivated ? (levelUsers[0] > 0 ? 45.50 : 0) : 0}
            activeTrees={isMockActivated ? 1 : 0}
            totalDownline={levelUsers.reduce((a, b) => a + b, 0)}
          />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8 lg:pl-6">
          <div className="space-y-6">
            {/* Header */}
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-zinc-900 dark:text-zinc-100 mb-2">
                Revenue Tree Guide & Demo
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-sm sm:text-base">
                Experience the logic of our native revenue distribution system. Follow the interactive steps to activate your tree and simulate growth.
              </p>
            </div>

            {/* Interactive Wizard */}
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-5 gap-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`p-6 rounded-2xl border-2 transition-all duration-300 relative overflow-hidden ${
                    currentStep === step.number
                      ? 'border-[#02abb8] bg-[#02abb8]/5 shadow-[0_0_20px_rgba(2,171,184,0.1)]'
                      : step.completed
                        ? 'border-emerald-500/20 bg-emerald-500/5'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-60'
                  }`}
                >
                  {currentStep === step.number && (
                      <div className="absolute top-0 right-0 p-1">
                          <div className="w-2 h-2 rounded-full bg-[#02abb8] animate-ping" />
                      </div>
                  )}
                  <div className="flex flex-col h-full">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-sm shrink-0 ${
                        step.completed ? 'bg-emerald-500 text-white' : 'bg-[#02abb8] text-white'
                      }`}>
                        {step.completed ? '✓' : step.number}
                      </div>
                      <h3 className="font-bold text-zinc-900 dark:text-white leading-tight uppercase tracking-tight">{step.title}</h3>
                    </div>
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mb-6 flex-1 leading-relaxed">
                      {step.description}
                    </p>
                    <button
                      onClick={() => handleStepAction(step.number)}
                      disabled={step.disabled || step.completed}
                      className={`w-full py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${
                        step.completed
                          ? 'bg-emerald-500/10 text-emerald-600 cursor-default'
                          : step.disabled
                            ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed'
                            : 'bg-[#02abb8] hover:bg-[#0299a6] text-white shadow-lg shadow-[#02abb8]/20 active:scale-95'
                      }`}
                    >
                      {step.action}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {/* Story Visualization & Log */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <div className="lg:col-span-2">
                    <RevenueTreeFlowStory currentStep={currentStep} />
                </div>
                <div className="bg-zinc-50 dark:bg-zinc-950 rounded-2xl border border-zinc-200 dark:border-zinc-800 flex flex-col overflow-hidden">
                    <div className="p-4 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900">
                        <h4 className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Network Event Log</h4>
                    </div>
                    <div className="flex-1 p-4 space-y-3 overflow-y-auto max-h-[480px]">
                        {storyLog.map((log, i) => (
                            <div key={i} className={`text-xs p-2.5 rounded-xl border animate-in fade-in slide-in-from-right-4 duration-300 ${
                                log.type === 'money' ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-600' :
                                log.type === 'success' ? 'bg-[#02abb8]/10 border-[#02abb8]/20 text-[#02abb8]' :
                                'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700 text-zinc-500'
                            }`}>
                                <div className="flex items-start gap-2">
                                    <span className="mt-0.5">{log.type === 'money' ? '💰' : log.type === 'success' ? '✨' : '📝'}</span>
                                    <p className="font-bold leading-relaxed">{log.msg}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="p-4 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-zinc-400 uppercase text-center italic tracking-tight">
                            Real-time smart contract events simulated
                        </p>
                    </div>
                </div>
            </div>

            {/* Dashboard Content */}
            <div className="space-y-6">
              
              {/* Activation Progress Bar (Simulated) */}
              <div className="p-6 bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 shadow-sm">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-[11px] font-black text-zinc-500 dark:text-zinc-400 uppercase tracking-widest">
                    Activation Progress (Simulated)
                  </span>
                  <div className="flex items-baseline gap-1">
                      <span className="text-xl font-black text-zinc-900 dark:text-white tabular-nums">
                        {isMockActivated ? '100.00' : '20.00'}
                      </span>
                      <span className="text-[10px] font-bold text-zinc-400 uppercase">{symbol}</span>
                  </div>
                </div>
                <div className="w-full bg-zinc-100 dark:bg-zinc-800 rounded-full h-1.5 overflow-hidden">
                  <div
                    className={`h-full transition-all duration-1000 rounded-full ${isMockActivated ? 'bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.4)]' : 'bg-[#02abb8]'}`}
                    style={{ width: isMockActivated ? '100%' : '20%' }}
                  />
                </div>
                <div className="flex items-center justify-between mt-3">
                    <p className="text-[10px] font-bold text-zinc-400 dark:text-zinc-500 uppercase tracking-tight">
                        {isMockActivated ? '✓ Global Referral active' : 'Requires 100 volume to unlock.'}
                    </p>
                    <div className="flex items-center gap-1.5">
                        <div className={`w-1.5 h-1.5 rounded-full ${isMockActivated ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300'}`} />
                        <span className="text-[10px] font-black text-zinc-500 uppercase tracking-widest">
                            {isMockActivated ? 'Active' : 'Genesis'}
                        </span>
                    </div>
                </div>
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
              <div className="rounded-xl border border-[#02abb8]/30 dark:border-[#02abb8]/20 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden relative">
                <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-[#02abb8]/5 to-transparent">
                   <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                        <div>
                            <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                Revenue Tree Calculation Simulator
                            </h2>
                            <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-lg">
                                Experience the logic of our native revenue distribution system. Follow the interactive steps to activate your tree and simulate growth.
                            </p>
                        </div>
                        <div className="flex items-center gap-3">
                            <label className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">Avg Spend:</label>
                            <div className="relative">
                                <input 
                                    type="number" 
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
                   <table className="w-full text-left min-w-[700px]">
                        <thead>
                            <tr className="border-b border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400">
                                <th className="pb-3 pl-4 sm:pl-6 font-medium">
                                    <div className="flex items-center">
                                        Level <InfoIcon onClick={() => setActiveModal('level')} />
                                    </div>
                                </th>
                                <th className="pb-3 font-medium text-center">Share %</th>
                                <th className="pb-3 font-medium">Requirements / Maintenance</th>
                                <th className="pb-3 font-medium text-center">Referred Users</th>
                                <th className="pb-3 pr-4 sm:pr-6 font-medium text-right">Potential Payout</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                            {LEVEL_SHARES.map((pct, idx) => {
                                const level = idx + 1;
                                const users = levelUsers[idx];
                                const perUser = (spendAmount * pct) / 100;
                                const levelEarnings = perUser * users;
                                const requirementsTxt = LEVEL_REQUIREMENTS[idx];
                                const isActive = isMockActivated;

                                totalEarnings += levelEarnings;
                                totalUsers += users;

                                return (
                                    <tr 
                                        key={level} 
                                        className="text-sm hover:bg-[#02abb8]/5 dark:hover:bg-[#02abb8]/10 transition-colors cursor-pointer"
                                        onClick={() => setSelectedLevelDetails({
                                            level, usersCount: users, sharePct: pct, isActive
                                        })}
                                    >
                                        <td className="py-4 pl-4 sm:pl-6">
                                            <div className="flex items-center gap-2">
                                                <div className="flex items-center justify-center w-8 h-8 rounded-full font-black text-xs bg-[#02abb8]/10 text-[#02abb8] shrink-0">
                                                    L{level}
                                                </div>
                                                <span className={`text-[10px] uppercase font-bold tracking-wider flex items-center gap-1 px-2 py-0.5 rounded-full whitespace-nowrap ${isActive ? 'bg-emerald-500/10 text-emerald-500' : 'bg-zinc-500/10 text-zinc-500'}`}>
                                                    <span className={`w-1.5 h-1.5 rounded-full shrink-0 ${isActive ? 'bg-emerald-500' : 'bg-zinc-500'}`}></span> <span className="hidden sm:inline">{isActive ? 'Active' : 'Genesis'}</span>
                                                </span>
                                            </div>
                                        </td>
                                        <td className="py-4 text-center font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</td>
                                        <td className="py-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">{requirementsTxt}</td>
                                        <td className="py-4 px-4" onClick={(e) => e.stopPropagation()}>
                                            <div className="flex items-center justify-center">
                                                <input
                                                    type="number"
                                                    min="0"
                                                    value={users || ''}
                                                    onChange={(e) => handleUserChange(idx, e.target.value)}
                                                    placeholder="0"
                                                    className="w-20 rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 py-1.5 text-xs text-zinc-900 dark:text-white focus:border-[#02abb8] focus:ring-1 focus:ring-[#02abb8] outline-none text-center"
                                                />
                                            </div>
                                        </td>
                                        <td className="py-4 text-right pr-4 sm:pr-6">
                                            <div className={`font-bold tabular-nums ${isActive && levelEarnings > 0 ? 'text-[#02abb8]' : 'text-zinc-400'}`}>
                                                +{levelEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
                                            </div>
                                        </td>
                                    </tr>
                                );
                            })}
                        </tbody>
                        <tfoot>
                            <tr className="border-t-2 border-zinc-200 dark:border-zinc-700">
                                <td colSpan={3} className="pt-6 pl-4 sm:pl-6 font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Global Simulation Output:</td>
                                <td className="pt-6 text-center">
                                    <div className="inline-flex flex-col items-center">
                                        <span className="text-sm font-black text-zinc-900 dark:text-white uppercase">{totalUsers.toLocaleString()} Users</span>
                                        <span className="text-[10px] font-bold text-zinc-400 uppercase whitespace-nowrap">Downline Reach</span>
                                    </div>
                                </td>
                                <td className="pt-6 pr-4 sm:pr-6 text-right">
                                    <div className="flex flex-col items-end">
                                        <span className="text-2xl font-black text-[#02abb8] tabular-nums">+{totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}</span>
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
        <RevenueTreeLevelModal 
            isOpen={!!selectedLevelDetails}
            onClose={() => setSelectedLevelDetails(null)}
            level={{
                level: selectedLevelDetails.level,
                walletAddress: '0xDemoWalletNode',
                sharePercentage: selectedLevelDetails.sharePct,
                userCount: selectedLevelDetails.usersCount,
                isActive: selectedLevelDetails.isActive
            }}
            contentType="dapp"
            contentSlug="demo"
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
