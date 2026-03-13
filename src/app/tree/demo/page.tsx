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

interface TipModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  content: string;
}

function TipModal({ isOpen, onClose, title, content }: TipModalProps) {
  if (!isOpen) return null;
  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm" onClick={onClose}>
      <div className="bg-white dark:bg-zinc-900 rounded-2xl max-w-md w-full p-8 shadow-2xl border border-zinc-200 dark:border-zinc-800 animate-in fade-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
        <div className="flex justify-between items-center mb-6">
          <h3 className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">{title}</h3>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors">
            <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        <p className="text-zinc-600 dark:text-zinc-400 leading-relaxed text-base">
          {content}
        </p>
        <button
          onClick={onClose}
          className="mt-8 w-full py-4 bg-[#02abb8] hover:bg-[#0299a6] text-white rounded-xl font-bold uppercase tracking-widest text-sm transition-all shadow-lg shadow-[#02abb8]/20"
        >
          I Understand
        </button>
      </div>
    </div>
  );
}

function InfoIcon({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={(e) => { e.stopPropagation(); onClick(); }}
      className="inline-flex items-center justify-center w-5 h-5 ml-2 text-zinc-400 hover:text-[#02abb8] bg-zinc-100 hover:bg-[#02abb8]/10 dark:bg-zinc-800 dark:hover:bg-[#02abb8]/20 rounded-full transition-colors"
    >
      <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
      </svg>
    </button>
  );
}

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

export default function RevenueTreeDemoPage() {
  const { address: userWalletAddress } = useAccount();
  const chainId = useChainId();
  const symbol = getNativeCurrencySymbol(chainId);

  // Demo Simulation State
  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isMockActivated, setIsMockActivated] = useState(false);
  const [hasReferralLink, setHasReferralLink] = useState(false);
  const [averageSpend, setAverageSpend] = useState<string>('100');
  const [levelUsers, setLevelUsers] = useState<number[]>([0, 0, 0, 0, 0]);
  const [activeTip, setActiveTip] = useState<{ title: string, content: string } | null>(null);
  const [storyLog, setStoryLog] = useState<{msg: string, type: 'info' | 'success' | 'money'}[]>([
      { msg: 'System initialized. Alice (You) is currently in Genesis mode.', type: 'info' }
  ]);
  
  const [selectedLevelDetails, setSelectedLevelDetails] = useState<{ 
      level: number, 
      usersCount: number, 
      sharePct: number, 
      isActive: boolean 
  } | null>(null);

  const steps = [
    {
      number: 1,
      title: 'Activation',
      desc: 'Unlock your tree',
      completed: isMockActivated,
    },
    {
      number: 2,
      title: 'Network',
      desc: 'Seed your tree',
      completed: levelUsers[0] > 0,
    },
    {
      number: 3,
      title: 'Revenue',
      desc: 'Simulate flow',
      completed: currentStep > 3,
    },
    {
      number: 4,
      title: 'Growth',
      desc: 'Expand depth',
      completed: currentStep > 4,
    },
    {
      number: 5,
      title: 'Scale',
      desc: 'Full 5 levels',
      completed: currentStep > 5,
    },
  ];

  const tips = {
    protocol: {
      title: "Live Flow Protocol",
      content: "This module simulates real-time activity within the Revenue Tree. You can observe how nodes are created and connected natively as users perform actions."
    },
    seeding: {
      title: "Network Seeding",
      content: "Initial network growth starts with Level 1. Direct referrals are the foundation of your future levels. As your referrals invite others, your tree expands vertically."
    },
    payout: {
      title: "Active Verification",
      content: "In a live environment, every level's activity status is checked at the transaction moment. If you fall below maintenance requirements, your share is claimed by the treasury."
    }
  };

  const addLog = (msg: string, type: 'info' | 'success' | 'money') => {
      setStoryLog(prev => [{ msg, type }, ...prev].slice(0, 5));
  };

  const handleStepAction = (stepNumber: number) => {
    setIsProcessing(true);
    setTimeout(() => {
        if (stepNumber === 1) {
          setIsMockActivated(true);
          setHasReferralLink(true);
          addLog('Alice activated! Permanent links to Genesis Wallets 1-5 created.', 'success');
          setCurrentStep(2);
        } else if (stepNumber === 2) {
          setLevelUsers([2, 0, 0, 0, 0]);
          addLog('Bob and Dave joined Alice\'s network as direct referrals.', 'info');
          setCurrentStep(3);
        } else if (stepNumber === 3) {
          addLog('Bob spent 100 KAS. Alice earned 2 KAS!', 'money');
          setCurrentStep(4);
        } else if (stepNumber === 4) {
          setLevelUsers([2, 5, 0, 0, 0]);
          addLog('Charlie and Eve join. Alice now has 5 nodes at Level 2.', 'info');
          setCurrentStep(5);
        } else if (stepNumber === 5) {
          setLevelUsers([2, 5, 12, 45, 150]);
          addLog('Henry joins at L5! Deep network propagation triggered.', 'success');
          addLog('Henry paid 100 KAS. Alice receives 45 KAS (45% Share)!', 'money');
          setCurrentStep(6);
        }
        setIsProcessing(false);
    }, 600);
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
      <TipModal 
        isOpen={!!activeTip} 
        onClose={() => setActiveTip(null)} 
        title={activeTip?.title || ''} 
        content={activeTip?.content || ''} 
      />
      
      <div className="flex-1 flex flex-col lg:flex-row">
        
        {/* Sidebar */}
        <div className="hidden lg:block flex-shrink-0">
          <RevenueTreeSidebar
            totalRevenue={isMockActivated ? (levelUsers[0] > 0 ? 45.50 : 0) : 0}
            activeTrees={isMockActivated ? 1 : 0}
            totalDownline={levelUsers.reduce((a, b) => a + b, 0)}
          />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            {/* Header */}
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight flex items-center">
                Live Flow Simulation <InfoIcon onClick={() => setActiveTip(tips.protocol)} />
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                Walk through the lifecycle of a growing protocol network. Observe activation, referral scaling, and multi-level revenue propagation.
              </p>
            </div>

            {/* Dashboard Container */}
            <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl mb-12">
              
              {/* Interactive Stepper */}
              <div className="flex items-center justify-between p-8 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {steps.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => !isProcessing && setCurrentStep(s.number)}
                    className="flex items-center gap-4 shrink-0 group transition-all"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      s.completed 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : currentStep === s.number 
                          ? 'bg-[#02abb8] text-white shadow-lg shadow-[#02abb8]/20 ring-4 ring-[#02abb8]/10' 
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700'
                    }`}>
                      {s.completed ? '✓' : s.number}
                    </div>
                    <div className="text-left pr-6">
                      <p className={`text-xs font-bold uppercase tracking-widest ${
                        currentStep === s.number ? 'text-[#02abb8]' : 'text-zinc-400'
                      }`}>{s.title}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-10">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10 min-h-[500px]">
                    {/* Story Visual & Control */}
                    <div className="xl:col-span-2 space-y-8">
                        {/* Interactive Phase Card */}
                        <div className="p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800 relative overflow-hidden group">
                           <div className="flex flex-col sm:flex-row items-center justify-between gap-6 mb-8 text-center sm:text-left">
                               <div className="flex-1">
                                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#02abb8]/10 text-[#02abb8] rounded-full mb-4">
                                       <span className="text-[10px] font-bold uppercase tracking-[0.2em]">Phase {currentStep} Active</span>
                                   </div>
                                   <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{steps[currentStep-1]?.title || 'Final Review'}</h3>
                                   <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed max-w-lg">
                                       {currentStep === 1 && "Alice activates for the first time. A brand new tree is created, linking her to the Genesis Structure."}
                                       {currentStep === 2 && "Alice shares her link. Bob and Dave connect as Level 1 direct referrals."}
                                       {currentStep === 3 && "Bob generates protocol volume. Watch those rewards navigate the active tree to Alice's wallet."}
                                       {currentStep === 4 && "The network expands vertically. Bob refers Charlie and Dave refers Eve, creating Level 2 depth."}
                                       {currentStep === 5 && "The hierarchy reaches maximum depth (L5). Alice receives her 45% share from the deepest connection!"}
                                       {currentStep > 5 && "Live Flow complete. You've witnessed the full architectural scale of the Revenue Tree system."}
                                   </p>
                               </div>
                               <div className="shrink-0">
                                   <button 
                                      onClick={() => handleStepAction(currentStep)}
                                      disabled={isProcessing || currentStep > 5}
                                      className={`px-10 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm transition-all ${
                                        isProcessing || currentStep > 5 
                                          ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                                          : 'bg-[#02abb8] hover:bg-[#0299a6] text-white shadow-xl shadow-[#02abb8]/20 hover:scale-105 active:scale-95'
                                      }`}
                                   >
                                       {isProcessing ? 'EXECUTING...' : currentStep > 5 ? 'COMPLETED' : 'EXECUTE ACTION'}
                                   </button>
                               </div>
                           </div>
                           
                           {/* Step Progression Visual */}
                           <RevenueTreeFlowStory currentStep={currentStep} />
                        </div>

                        {/* Activation & Link Summary Grid */}
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                            <div className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm">
                                <div className="flex items-center justify-between mb-2">
                                    <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest leading-none">Protocol Activation</p>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tabular-nums">{isMockActivated ? '100%' : '20%'} Loaded</span>
                                </div>
                                <div className="w-full bg-zinc-100 dark:bg-zinc-900 rounded-full h-2 mb-4 overflow-hidden">
                                    <div className={`h-full transition-all duration-1000 ${isMockActivated ? 'bg-emerald-500' : 'bg-[#02abb8]'}`} style={{ width: isMockActivated ? '100%' : '20%' }} />
                                </div>
                                <div className="flex items-center gap-2">
                                     <div className={`w-2 h-2 rounded-full ${isMockActivated ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]' : 'bg-zinc-300'}`} />
                                     <span className="text-xs font-bold text-zinc-500 uppercase tracking-wider">{isMockActivated ? 'Active affiliate' : 'Genesis Mode'}</span>
                                </div>
                            </div>

                            <div className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm relative overflow-hidden">
                                {hasReferralLink ? (
                                    <>
                                        <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-4 leading-none">Your System Link</p>
                                        <div className="p-3 bg-zinc-50 dark:bg-zinc-900 rounded-xl border border-zinc-100 dark:border-zinc-800 flex items-center gap-3">
                                            <span className="text-xs font-mono text-zinc-400 truncate flex-1">krex.tree/Alice_Wallet_ID</span>
                                            <div className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                                        </div>
                                    </>
                                ) : (
                                    <div className="flex items-center justify-center h-full opacity-30 grayscale">
                                        <p className="text-xs font-bold uppercase tracking-[0.2em] text-zinc-400">Locked until active</p>
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Event Log Side panel */}
                    <div className="xl:col-span-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/30 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Protocol Intelligence</h4>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-bold">Online</span>
                        </div>
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto">
                            {storyLog.map((log, i) => (
                                <div key={i} className={`p-5 rounded-2xl border animate-in fade-in slide-in-from-right-8 duration-500 ${
                                    log.type === 'money' ? 'bg-emerald-500/5 border-emerald-500/10 text-emerald-600' :
                                    log.type === 'success' ? 'bg-[#02abb8]/5 border-[#02abb8]/10 text-[#02abb8]' :
                                    'bg-white dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800 text-zinc-500 shadow-sm'
                                }`}>
                                    <div className="flex items-start gap-3">
                                        <div className={`mt-0.5 w-6 h-6 rounded-lg flex items-center justify-center text-sm ${
                                             log.type === 'money' ? 'bg-emerald-500 text-white shadow-lg' : 
                                             log.type === 'success' ? 'bg-[#02abb8] text-white shadow-lg' : 
                                             'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                        }`}>
                                            {log.type === 'money' ? '$' : log.type === 'success' ? '✓' : '•'}
                                        </div>
                                        <div>
                                            <p className="text-sm font-bold leading-relaxed">{log.msg}</p>
                                            <p className="text-[9px] font-bold text-zinc-400 uppercase mt-2 tracking-widest">Calculated natively</p>
                                        </div>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="p-6 bg-white dark:bg-zinc-900 border-t border-zinc-200 dark:border-zinc-800">
                            <p className="text-xs text-zinc-500 font-medium text-center leading-relaxed">
                                Watching protocol events for <br/><strong>Alice@LocalNode</strong>
                            </p>
                        </div>
                    </div>
                </div>
              </div>
              
              {/* Stepper Footer */}
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] px-10">
                 <span>Phase {currentStep} Sequence</span>
                 <span>Global Ledger active</span>
              </div>
            </div>

            {/* Simulation Table Control */}
            <div className="rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 shadow-sm overflow-hidden relative mb-12">
            <div className="p-10 border-b border-zinc-100 dark:border-zinc-900 bg-gradient-to-r from-[#02abb8]/5 to-transparent">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-8">
                    <div>
                        <h2 className="text-3xl font-bold text-zinc-900 dark:text-white flex items-center gap-3">
                            Growth Calculator <InfoIcon onClick={() => setActiveTip(tips.seeding)} />
                        </h2>
                        <p className="text-zinc-600 dark:text-zinc-400 text-lg mt-2 font-medium max-w-2xl leading-relaxed">
                            Fine-tune the network variables to observe the potential volume propagation through the 5-layer hierarchy.
                        </p>
                    </div>
                    <div className="bg-white dark:bg-zinc-900 p-6 rounded-3xl border border-zinc-200 dark:border-zinc-800 flex items-center gap-4 shrink-0 shadow-sm">
                        <label className="text-sm font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-widest">Avg Spend:</label>
                        <div className="relative">
                            <input 
                                type="number" 
                                value={averageSpend} 
                                onChange={(e) => setAverageSpend(e.target.value)}
                                className="w-32 rounded-2xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-950 px-5 py-3 text-lg text-zinc-900 dark:text-white font-bold tracking-tight focus:border-[#02abb8] focus:ring-1 focus:ring-[#02abb8] outline-none text-center tabular-nums" 
                            />
                            <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
                                <span className="text-zinc-400 dark:text-zinc-500 text-xs font-bold">{symbol}</span>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            <div className="p-10 bg-zinc-50/30 dark:bg-zinc-900/30 overflow-x-auto">
                <table className="w-full text-left min-w-[800px]">
                    <thead>
                        <tr className="border-b border-zinc-200 dark:border-zinc-800 text-xs text-zinc-400 dark:text-zinc-500 uppercase tracking-[0.2em]">
                            <th className="pb-6 pl-6 font-bold">Network Depth</th>
                            <th className="pb-6 font-bold text-center">Protocol Share</th>
                            <th className="pb-6 font-bold">Maintenance Criteria</th>
                            <th className="pb-6 font-bold text-center">Active Users</th>
                            <th className="pb-6 pr-6 font-bold text-right">Yield Capacity</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800/50">
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
                                    className="text-base hover:bg-white dark:hover:bg-zinc-900 transition-all duration-300 cursor-pointer group"
                                    onClick={() => setSelectedLevelDetails({
                                        level, usersCount: users, sharePct: pct, isActive
                                    })}
                                >
                                    <td className="py-6 pl-6">
                                        <div className="flex items-center gap-4">
                                            <div className="flex items-center justify-center w-10 h-10 rounded-2xl font-bold text-sm bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white group-hover:bg-[#02abb8] group-hover:text-white transition-colors">
                                                L{level}
                                            </div>
                                            <div className="flex flex-col">
                                                <span className="text-sm font-bold text-zinc-900 dark:text-white">Level {level} Layer</span>
                                                <span className={`text-[9px] uppercase font-bold tracking-widest mt-1 ${isActive ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                                    {isActive ? 'Protocol active' : 'Genesis fallback'}
                                                </span>
                                            </div>
                                        </div>
                                    </td>
                                    <td className="py-6 text-center">
                                        <span className="text-lg font-bold text-zinc-900 dark:text-white tabular-nums">{pct}%</span>
                                    </td>
                                    <td className="py-6 text-sm font-medium text-zinc-500 dark:text-zinc-400 max-w-[200px] leading-relaxed">
                                        {requirementsTxt}
                                    </td>
                                    <td className="py-6 px-6" onClick={(e) => e.stopPropagation()}>
                                        <div className="flex items-center justify-center">
                                            <input
                                                type="number"
                                                min="0"
                                                value={users || ''}
                                                onChange={(e) => handleUserChange(idx, e.target.value)}
                                                placeholder="0"
                                                className="w-24 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 px-4 py-3 text-sm text-zinc-900 dark:text-white font-bold focus:border-[#02abb8] focus:ring-1 focus:ring-[#02abb8] outline-none text-center tabular-nums shadow-sm"
                                            />
                                        </div>
                                    </td>
                                    <td className="py-6 text-right pr-6">
                                        <div className={`text-lg font-bold tabular-nums ${isActive && levelEarnings > 0 ? 'text-[#02abb8]' : 'text-zinc-400'}`}>
                                            +{levelEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
                                        </div>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                    <tfoot>
                        <tr className="border-t border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/20">
                            <td colSpan={3} className="py-8 pl-8">
                                <div className="flex flex-col">
                                    <span className="text-xl font-bold text-zinc-900 dark:text-white uppercase tracking-tight">Projected Global Yield Capacity</span>
                                    <span className="text-xs font-bold text-zinc-500 mt-2 uppercase tracking-widest">Calculated per 30 days of active volume</span>
                                </div>
                            </td>
                            <td className="py-8 text-center px-6">
                                <div className="inline-flex flex-col items-center">
                                    <span className="text-2xl font-bold text-zinc-900 dark:text-white tabular-nums">{totalUsers.toLocaleString()}</span>
                                    <span className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest mt-1">Network Users</span>
                                </div>
                            </td>
                            <td className="py-8 pr-8 text-right">
                                <div className="flex flex-col items-end">
                                    <span className="text-4xl font-bold text-[#02abb8] tabular-nums tracking-tighter">+{totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}</span>
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mt-2">{symbol} Rewards Pool</span>
                                </div>
                            </td>
                        </tr>
                    </tfoot>
                </table>
            </div>
            </div>

            {/* Educational Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                 <div className="group bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-10 hover:border-[#02abb8]/30 transition-all duration-500 shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-[#02abb8]/10 flex items-center justify-center text-[#02abb8] mb-8 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Vertical Distribution</h3>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                        Unlike traditional marketing engines, Revenue Tree shares are distributed vertically across the chain natively. No extraction fees, no central bottlenecks.
                    </p>
                 </div>
                 
                 <div className="group bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-10 hover:border-purple-500/30 transition-all duration-500 shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-8 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Maintenance Efficiency</h3>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                        Smart contracts automate the maintenance checks. Users holding 10M KREX receive deep discounting on monthly volume requirements.
                    </p>
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
                walletAddress: '0xAlice_Simulation_Node',
                sharePercentage: selectedLevelDetails.sharePct,
                userCount: selectedLevelDetails.usersCount,
                isActive: selectedLevelDetails.isActive
            }}
            contentType="dapp"
            contentSlug="demo"
        />
      )}
    </div>
  );
}
