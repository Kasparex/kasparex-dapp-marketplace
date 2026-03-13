'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeSidebar } from '@/components/revenue-tree/RevenueTreeSidebar';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';
import { useAccount, useChainId } from 'wagmi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { RevenueTreeLevelModal } from '@/components/revenue-tree/RevenueTreeLevelModal';

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

interface Referral {
  name: string;
  wallet: string;
  referrer: string;
  volume: number;
}

const LEVEL_SHARES = [
    REVENUE_SHARE_PERCENTAGES.LEVEL_01,
    REVENUE_SHARE_PERCENTAGES.LEVEL_02,
    REVENUE_SHARE_PERCENTAGES.LEVEL_03,
    REVENUE_SHARE_PERCENTAGES.LEVEL_04,
    REVENUE_SHARE_PERCENTAGES.LEVEL_05,
];

export default function RevenueTreeDemoPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const symbol = getNativeCurrencySymbol(chainId);

  const [currentStep, setCurrentStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [activeTip, setActiveTip] = useState<{ title: string, content: string } | null>(null);
  const [expandedLevels, setExpandedLevels] = useState<number[]>([1]);
  
  const [referrals, setReferrals] = useState<{ [key: number]: Referral[] }>({
    1: [], 2: [], 3: [], 4: [], 5: []
  });

  const [eventLog, setEventLog] = useState<{msg: string, type: 'info' | 'success' | 'money'}[]>([
      { msg: 'System initialized. Mark (You) is currently in Genesis mode.', type: 'info' }
  ]);

  const toggleLevel = (level: number) => {
    setExpandedLevels(prev => 
      prev.includes(level) ? prev.filter(l => l !== level) : [...prev, level]
    );
  };

  const addLog = (msg: string, type: 'info' | 'success' | 'money') => {
    setEventLog(prev => [{ msg, type }, ...prev].slice(0, 5));
  };

  const handleStepAction = (step: number) => {
    setIsProcessing(true);
    setTimeout(() => {
      if (step === 1) {
        setIsActivated(true);
        addLog('Mark activated! Referral link now connects to Genesis Structure.', 'success');
        setCurrentStep(2);
      } else if (step === 2) {
        setReferrals(prev => ({
          ...prev,
          1: [
            { name: 'Chris', wallet: '0xChr...4419', referrer: 'Mark', volume: 0 },
            { name: 'Daniel', wallet: '0xDan...8821', referrer: 'Mark', volume: 0 }
          ]
        }));
        setExpandedLevels([1]);
        addLog('Chris and Daniel joined as direct referrals.', 'info');
        setCurrentStep(3);
      } else if (step === 3) {
        setReferrals(prev => ({
          ...prev,
          1: prev[1].map(r => r.name === 'Chris' ? { ...r, volume: 100 } : r)
        }));
        addLog('Chris spent 100 KAS. Mark received 2 KAS instantly.', 'money');
        setCurrentStep(4);
      } else if (step === 4) {
        setReferrals(prev => ({
          ...prev,
          2: [
            { name: 'Edward', wallet: '0xEdw...1290', referrer: 'Chris', volume: 0 },
            { name: 'Frank', wallet: '0xFra...7732', referrer: 'Daniel', volume: 0 }
          ]
        }));
        setExpandedLevels([1, 2]);
        addLog('Edward and Frank join Level 2 of your tree.', 'info');
        setCurrentStep(5);
      } else if (step === 5) {
        setReferrals(prev => ({
          ...prev,
          3: Array(5).fill(0).map((_, i) => ({ name: `User_${i+1}`, wallet: `0xGen...${i}`, referrer: 'Edward', volume: 0 })),
          4: Array(15).fill(0).map((_, i) => ({ name: `User_${i+10}`, wallet: `0xGen...${i+10}`, referrer: 'User_1', volume: 0 })),
          5: [{ name: 'Henry', wallet: '0xHen...9900', referrer: 'User_10', volume: 100 }]
        }));
        setExpandedLevels([1, 2, 5]);
        addLog('Tree scaled to Level 5. Henry made a purchase.', 'success');
        addLog('Henry paid 100 KAS. Mark receives 45 KAS!', 'money');
        setCurrentStep(6);
      }
      setIsProcessing(false);
    }, 600);
  };

  const steps = [
    { title: 'Activation', desc: 'Secure your slot', num: 1 },
    { title: 'Level 1', desc: 'Direct referrals', num: 2 },
    { title: 'Revenue', desc: 'Flow simulation', num: 3 },
    { title: 'Depth', desc: 'Vertical growth', num: 4 },
    { title: 'Scale', desc: 'Maximum reach', num: 5 },
  ];

  const tips = {
    tree: {
      title: "Tree Structure",
      content: "The Revenue Tree is a 5-level deep hierarchical system. Every purchase made by a user in your tree triggers an instant native split to the 5 direct upline referrers."
    },
    instant: {
      title: "Instant Splits",
      content: "Smart contracts handle the distribution at the moment of the transaction. There is no central pool or delay; funds move from the buyer to the referrers' wallets natively."
    }
  };

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
        <div className="hidden lg:block flex-shrink-0">
          <RevenueTreeSidebar totalRevenue={0} activeTrees={0} totalDownline={0} />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-10">
          <div className="max-w-6xl mx-auto">
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight flex items-center">
                Live Flow Simulation <InfoIcon onClick={() => setActiveTip(tips.tree)} />
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                Simulate the real-time growth of your referral tree managed by smart contracts.
              </p>
            </div>

            {/* Stepper Wizard */}
            <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl mb-12">
              <div className="flex items-center justify-between p-8 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {steps.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => !isProcessing && setCurrentStep(s.num)}
                    className="flex items-center gap-4 shrink-0 group transition-all"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      currentStep > s.num 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : currentStep === s.num 
                          ? 'bg-[#02abb8] text-white shadow-lg shadow-[#02abb8]/20 ring-4 ring-[#02abb8]/10' 
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700'
                    }`}>
                      {currentStep > s.num ? '✓' : s.num}
                    </div>
                    <div className="text-left pr-8">
                      <p className={`text-xs font-bold uppercase tracking-widest ${
                        currentStep === s.num ? 'text-[#02abb8]' : 'text-zinc-400'
                      }`}>{s.title}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-10">
                <div className="grid grid-cols-1 xl:grid-cols-3 gap-10">
                    <div className="xl:col-span-2 space-y-8">
                        {/* Control Card */}
                        <div className="p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                           <div className="flex flex-col sm:flex-row items-center justify-between gap-6">
                               <div className="flex-1 text-center sm:text-left">
                                   <div className="inline-flex items-center gap-2 px-3 py-1 bg-[#02abb8]/10 text-[#02abb8] rounded-full mb-4">
                                       <span className="text-[10px] font-bold uppercase tracking-[0.2em]">{currentStep > 5 ? 'Simulation Finished' : `Phase ${currentStep} Active`}</span>
                                   </div>
                                   <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-2">{steps[currentStep-1]?.title || 'Flow Review'}</h3>
                                   <p className="text-zinc-600 dark:text-zinc-400 text-base leading-relaxed max-w-lg">
                                      {currentStep === 1 && "Mark must activate his account to start receiving shares from his downline."}
                                      {currentStep === 2 && "Mark refers Chris and Daniel. They are now linked to Mark's wallet as Level 1 referrals."}
                                      {currentStep === 3 && "Chris makes a purchase. Smart contracts split the volume instantly to Mark."}
                                      {currentStep === 4 && "The hierarchy deepens. Chris refers Edward, and Daniel refers Frank."}
                                      {currentStep === 5 && "The network reaches Level 5. Henry joins and his purchase rewards the entire chain."}
                                      {currentStep > 5 && "You've witnessed the full architectural capability of the Revenue Tree system."}
                                   </p>
                               </div>
                               <button 
                                  onClick={() => handleStepAction(currentStep)}
                                  disabled={isProcessing || currentStep > 5}
                                  className={`px-10 py-5 rounded-2xl font-bold uppercase tracking-[0.2em] text-sm transition-all ${
                                    isProcessing || currentStep > 5 
                                      ? 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400 cursor-not-allowed' 
                                      : 'bg-[#02abb8] hover:bg-[#0299a6] text-white shadow-xl shadow-[#02abb8]/20 active:scale-95'
                                  }`}
                               >
                                   {isProcessing ? 'PROCESSING...' : currentStep > 5 ? 'COMPLETED' : 'EXECUTE STEP'}
                               </button>
                           </div>
                        </div>

                        {/* Collapsible Tree Table */}
                        <div className="rounded-[2rem] border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 overflow-hidden shadow-sm">
                            <div className="p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between">
                                <h4 className="text-sm font-bold text-zinc-900 dark:text-white uppercase tracking-wider">My Referral Tree</h4>
                                <div className="flex items-center gap-2">
                                    <span className={`w-2 h-2 rounded-full ${isActivated ? 'bg-emerald-500' : 'bg-red-500'}`} />
                                    <span className="text-[10px] font-bold text-zinc-500 uppercase">{isActivated ? 'Tree Active' : 'Genesis Mode'}</span>
                                </div>
                            </div>
                            <div className="divide-y divide-zinc-100 dark:divide-zinc-900">
                                {LEVEL_SHARES.map((pct, idx) => {
                                    const level = idx + 1;
                                    const isExpanded = expandedLevels.includes(level);
                                    const levelRefs = referrals[level] || [];
                                    
                                    return (
                                        <div key={level} className="group">
                                            <button 
                                                onClick={() => toggleLevel(level)}
                                                className={`w-full flex items-center justify-between p-6 hover:bg-zinc-50 dark:hover:bg-zinc-900/50 transition-colors ${isExpanded ? 'bg-zinc-50/50 dark:bg-zinc-900/30' : ''}`}
                                            >
                                                <div className="flex items-center gap-5">
                                                    <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs ${isExpanded ? 'bg-[#02abb8] text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-500'}`}>
                                                        L{level}
                                                    </div>
                                                    <div className="text-left">
                                                        <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase">Level {level} Referrals</p>
                                                        <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">{pct}% Revenue Share</p>
                                                    </div>
                                                </div>
                                                <div className="flex items-center gap-6">
                                                    <div className="text-right">
                                                        <p className="text-sm font-bold text-zinc-900 dark:text-white">{levelRefs.length} Users</p>
                                                        <p className="text-[9px] font-bold text-zinc-400 uppercase">Registered</p>
                                                    </div>
                                                    <div className={`w-6 h-6 rounded-full border border-zinc-200 dark:border-zinc-800 flex items-center justify-center transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`}>
                                                        <svg className="w-3 h-3 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M19 9l-7 7-7-7" /></svg>
                                                    </div>
                                                </div>
                                            </button>
                                            
                                            {isExpanded && (
                                                <div className="p-6 pt-0 bg-white dark:bg-zinc-950 animate-in slide-in-from-top-2 duration-300">
                                                    {levelRefs.length > 0 ? (
                                                        <div className="space-y-3 mt-4">
                                                            {levelRefs.map((ref, i) => (
                                                                <div key={i} className="flex items-center justify-between p-4 rounded-2xl bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-100 dark:border-zinc-800">
                                                                    <div className="flex items-center gap-4">
                                                                        <div className="w-8 h-8 rounded-full bg-white dark:bg-zinc-800 flex items-center justify-center text-xs font-bold text-[#02abb8] border border-zinc-100 dark:border-zinc-700 shadow-sm">
                                                                            {ref.name.charAt(0)}
                                                                        </div>
                                                                        <div>
                                                                            <p className="text-sm font-bold text-zinc-900 dark:text-white">{ref.name}</p>
                                                                            <p className="text-[10px] font-mono text-zinc-400">{ref.wallet}</p>
                                                                        </div>
                                                                    </div>
                                                                    <div className="text-right">
                                                                        <p className="text-xs font-bold text-zinc-400 mb-1 uppercase tracking-tighter">Referrer</p>
                                                                        <p className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase">{ref.referrer}</p>
                                                                    </div>
                                                                </div>
                                                            ))}
                                                        </div>
                                                    ) : (
                                                        <div className="py-10 text-center opacity-40">
                                                            <p className="text-xs font-bold uppercase tracking-widest text-zinc-400">No referrals found at this level yet</p>
                                                        </div>
                                                    )}
                                                </div>
                                            )}
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                    </div>

                    <div className="xl:col-span-1 flex flex-col h-full bg-zinc-50 dark:bg-zinc-900/30 rounded-[2rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden">
                        <div className="p-6 border-b border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 flex items-center justify-between">
                            <h4 className="text-xs font-bold text-zinc-900 dark:text-white uppercase tracking-widest">Smart Contract Events</h4>
                            <span className="text-[10px] px-2 py-0.5 bg-emerald-500/10 text-emerald-600 rounded-full font-bold">Live</span>
                        </div>
                        <div className="flex-1 p-6 space-y-4 overflow-y-auto max-h-[600px]">
                            {eventLog.map((log, i) => (
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
                                Monitoring shared revenue system records for <br/><strong>Mark (You)</strong>
                            </p>
                        </div>
                    </div>
                </div>
              </div>
              
              <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] px-10">
                 <span>Screen {currentStep} Sequence</span>
                 <span>Decentralized Ledger active</span>
              </div>
            </div>

            {/* Scale-out visualization logic card */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
                 <div className="group bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-10 hover:border-[#02abb8]/30 transition-all duration-500 shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-[#02abb8]/10 flex items-center justify-center text-[#02abb8] mb-8 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Vertical Propagation</h3>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                        Shares are distributed vertically across the chain by the smart contracts. This allows for deep residual income without a central bottleneck.
                    </p>
                 </div>
                 
                 <div className="group bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 p-10 hover:border-purple-500/30 transition-all duration-500 shadow-sm">
                    <div className="w-16 h-16 rounded-3xl bg-purple-500/10 flex items-center justify-center text-purple-500 mb-8 group-hover:scale-110 transition-transform duration-500">
                        <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                        </svg>
                    </div>
                    <h3 className="text-2xl font-bold text-zinc-900 dark:text-white mb-4">Contract Efficiency</h3>
                    <p className="text-lg text-zinc-500 dark:text-zinc-400 leading-relaxed font-medium">
                        The shared revenue system relies on efficient ledger checks to verify activation status at the moment of payment, ensuring fair distribution.
                    </p>
                 </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
