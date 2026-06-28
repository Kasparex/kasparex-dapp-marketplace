'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeSidebar } from '@/components/revenue-tree/RevenueTreeSidebar';
import { useAccount, useChainId } from 'wagmi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { DEFAULT_REVENUE_WALLETS } from '@/lib/revenue-tree/utils';

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

export default function RevenueTreeSimulationPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const symbol = getNativeCurrencySymbol(chainId);
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [isBobReferred, setIsBobReferred] = useState(false);
  const [activeTip, setActiveTip] = useState<{ title: string, content: string } | null>(null);
  
  const ACTIVATION_THRESHOLD = 100;
  const isActivated = userVolume >= ACTIVATION_THRESHOLD;

  const upline = [
    { name: 'Mark (You)', level: 1, share: 2, active: isActivated, wallet: address || '0xMarkWallet' },
    { name: 'Alex', level: 2, share: 5, active: false, wallet: '0xAlexWallet' },
    { name: 'Dave', level: 3, share: 10, active: true, wallet: '0xDaveWallet' },
    { name: 'Chris', level: 4, share: 20, active: false, wallet: '0xChrisWallet' },
    { name: 'Genesis', level: 5, share: 45, active: true, wallet: DEFAULT_REVENUE_WALLETS.LEVEL_5 },
  ];

  const steps = [
    { title: 'Status', desc: 'Identify eligibility' },
    { title: 'Activation', desc: 'Unlock your tree' },
    { title: 'Network', desc: 'Refer your friends' },
    { title: 'Payment', desc: 'On-chain execution' },
    { title: 'Rewards', desc: 'Split verification' },
  ];

  const tips = {
    status: {
      title: "Volume Status",
      content: "Your system status is determined by your lifetime spend on the platform. Until you hit the threshold, your referral link is inactive and generates no rewards for you."
    },
    activation: {
      title: "Threshold Logic",
      content: "To combat sybil attacks and ensure quality, the system requires a one-time activation volume. This can be reached by purchasing any supported dApp product."
    },
    hierarchy: {
      title: "Hierarchical Split",
      content: "When a user pays, the contract traverses 5 levels deep. Each level receives a preset share. If a level is inactive, that share is claimed by Genesis to support platform stability."
    },
    split: {
      title: "Native Distribution",
      content: "Unlike traditional affiliate systems, the Revenue Tree splits native KAS instantly and automatically at the moment of transaction. There are no 'withdraw' buttons needed."
    }
  };

  const handleNext = () => {
    if (step < 5) {
      setIsProcessing(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsProcessing(false);
      }, 500);
    }
  };

  const simulateActivationPurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setUserVolume(100);
      setIsProcessing(false);
    }, 800);
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
          <div className="max-w-5xl mx-auto">
            <div className="mb-10">
              <h1 className="text-4xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">
                System Simulation
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400 text-lg">
                Understand the Revenue Tree protocol through an interactive walkthrough.
              </p>
            </div>

            <div className="bg-white dark:bg-zinc-950 rounded-[2.5rem] border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
              <div className="flex items-center justify-between p-8 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {steps.map((s, i) => (
                  <button 
                    key={i} 
                    onClick={() => !isProcessing && setStep(i + 1)}
                    className="flex items-center gap-4 shrink-0 group transition-all"
                  >
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center font-bold text-sm ${
                      step > i + 1 
                        ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' 
                        : step === i + 1 
                          ? 'bg-[#02abb8] text-white shadow-lg shadow-[#02abb8]/20 ring-4 ring-[#02abb8]/10' 
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 group-hover:bg-zinc-300 dark:group-hover:bg-zinc-700'
                    }`}>
                      {step > i + 1 ? '✓' : i + 1}
                    </div>
                    <div className="text-left pr-4">
                      <p className={`text-xs font-bold uppercase tracking-widest ${
                        step === i + 1 ? 'text-[#02abb8]' : 'text-zinc-400'
                      }`}>{s.title}</p>
                      <p className="text-[10px] text-zinc-500 dark:text-zinc-500 font-medium">{s.desc}</p>
                    </div>
                  </button>
                ))}
              </div>

              <div className="p-10 min-h-[550px] flex flex-col items-center justify-center text-center">
                
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-2xl w-full">
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight flex items-center justify-center">
                      Network Status <InfoIcon onClick={() => setActiveTip(tips.status)} />
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-base leading-relaxed">
                      Every user wallet is tracked by the protocol. You are currently acting as <strong>Mark</strong>. Eligibility for referral rewards requires account activation.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12 text-left">
                       <div className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em] mb-4">Total Volume Contributed</p>
                          <div className="flex items-baseline gap-2 mb-6">
                             <span className="text-4xl font-bold text-zinc-900 dark:text-white tabular-nums">{userVolume}</span>
                             <span className="text-base font-bold text-zinc-400 uppercase">{symbol}</span>
                          </div>
                          <div className="w-full bg-zinc-100 dark:bg-zinc-800 h-2 rounded-full overflow-hidden">
                             <div className="h-full bg-amber-500 transition-all duration-1000" style={{ width: `${(userVolume / ACTIVATION_THRESHOLD) * 100}%` }} />
                          </div>
                          <p className="mt-4 text-xs font-bold text-zinc-500 uppercase tracking-tight text-right">
                             Target: {ACTIVATION_THRESHOLD} {symbol}
                          </p>
                       </div>

                       <div className="p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm">
                          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-[0.1em] mb-4">Link Status</p>
                          <div className="flex items-center gap-3 mb-6">
                             <div className={`w-3 h-3 rounded-full ${isActivated ? 'bg-emerald-500 shadow-[0_0_12px_rgba(16,185,129,0.5)]' : 'bg-amber-500 animate-pulse'}`} />
                             <span className={`text-lg font-bold uppercase ${isActivated ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {isActivated ? 'Active affiliate' : 'Inactive mode'}
                             </span>
                          </div>
                          <p className="text-xs text-zinc-500 font-medium leading-relaxed">
                             While inactive, rewards generated from your direct referrals will bypass you and support the protocol Genesis Treasury.
                          </p>
                       </div>
                    </div>

                    <button onClick={handleNext} className="k-cta-primary w-full py-5 text-base font-bold tracking-[0.2em] rounded-2xl">
                       START ACTIVATION STORY
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-in fade-in duration-500 max-w-2xl w-full">
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight flex items-center justify-center">
                      Activation Flow <InfoIcon onClick={() => setActiveTip(tips.activation)} />
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-12 text-base">
                      Achieve a one-time lifetime volume of 100 {symbol} to verify your account.
                    </p>

                    <div className="bg-zinc-50 dark:bg-zinc-900/50 rounded-[2rem] border-2 border-dashed border-zinc-200 dark:border-zinc-800 p-10 mb-12 shadow-inner">
                       {!isActivated ? (
                          <div className="flex flex-col items-center">
                             <div className="w-24 h-24 rounded-3xl bg-white dark:bg-zinc-800 flex items-center justify-center mb-8 text-zinc-300 dark:text-zinc-600 shadow-sm">
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                             </div>
                             <p className="text-base font-bold text-zinc-500 mb-10 uppercase tracking-[0.2em]">
                                Your tree is currently locked
                             </p>
                             <button 
                               onClick={simulateActivationPurchase}
                               disabled={isProcessing}
                               className="bg-[#02abb8] hover:bg-[#0299a6] text-white px-12 py-4 rounded-2xl font-bold text-sm uppercase tracking-[0.2em] transition-all shadow-xl shadow-[#02abb8]/30 active:scale-95"
                             >
                                {isProcessing ? 'CALCULATING...' : `ACTIVATE WITH 100 ${symbol}`}
                             </button>
                          </div>
                       ) : (
                          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                             <div className="w-24 h-24 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-8 shadow-2xl shadow-emerald-500/40 border-4 border-white dark:border-zinc-900">
                                <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                             </div>
                             <h4 className="text-2xl font-bold text-emerald-500 uppercase tracking-tight mb-3">Protocol Active</h4>
                             <p className="text-sm text-zinc-500 font-bold uppercase tracking-[0.1em] mb-10">
                                Your slot is successfully registered
                             </p>
                             
                             <div className="flex gap-4 w-full justify-center mb-6">
                                {upline.map((lv) => (
                                   <div key={lv.level} className="flex flex-col items-center gap-2">
                                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-bold text-xs transition-all ${lv.level === 1 ? 'bg-emerald-500 text-white shadow-lg' : 'bg-white dark:bg-zinc-800 text-zinc-300'}`}>
                                         {lv.level === 1 ? 'M' : 'G'}
                                      </div>
                                      <span className="text-[9px] font-bold text-zinc-400 dark:text-zinc-600 uppercase tracking-widest">Level {lv.level}</span>
                                   </div>
                                ))}
                             </div>
                          </div>
                       )}
                    </div>

                    <button 
                      onClick={handleNext} 
                      disabled={!isActivated}
                      className={`w-full py-5 text-base font-bold tracking-[0.2em] rounded-2xl transition-all ${
                        isActivated ? 'k-cta-primary' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed'
                      }`}
                    >
                       BUILD YOUR NETWORK
                    </button>
                  </div>
                )}

                {step === 3 && (
                  <div className="animate-in fade-in duration-500 max-w-3xl w-full">
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight flex items-center justify-center">
                      Network Growth <InfoIcon onClick={() => setActiveTip(tips.hierarchy)} />
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-12 text-base">
                      Refer <strong>Bob</strong> to connect him to your hierarchy. The protocol checks activity at every level.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-12">
                       {upline.map((node) => (
                          <div key={node.level} className={`p-6 rounded-3xl border-2 transition-all flex flex-col items-center ${
                            node.active 
                              ? 'bg-emerald-500/5 border-emerald-500/20 shadow-sm' 
                              : 'bg-zinc-50 dark:bg-zinc-900/50 border-zinc-200 dark:border-zinc-800'
                          }`}>
                            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-sm mb-4 ${
                              node.active ? 'bg-emerald-500 text-white shadow-lg shadow-emerald-500/20' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                            }`}>
                                {node.name.charAt(0)}
                            </div>
                            <h5 className="text-[11px] font-bold text-zinc-900 dark:text-white uppercase mb-1 tracking-wider whitespace-nowrap">
                                L{node.level} {node.name}
                            </h5>
                            <p className={`text-[9px] font-bold uppercase tracking-widest ${node.active ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                {node.active ? 'Active' : 'Genesis'}
                            </p>
                            <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800 w-full text-center">
                                <span className="text-sm font-bold text-zinc-900 dark:text-white">{node.share}%</span>
                            </div>
                          </div>
                       ))}
                    </div>

                    {!isBobReferred ? (
                       <button 
                         onClick={() => { setIsProcessing(true); setTimeout(() => { setIsBobReferred(true); setIsProcessing(false); }, 800); }}
                         disabled={isProcessing}
                         className="k-cta-primary w-full py-5 text-base font-bold tracking-[0.2em] rounded-2xl"
                       >
                          {isProcessing ? 'GENERATING LINK...' : 'INVITE BOB AS YOUR L1'}
                       </button>
                    ) : (
                       <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                          <div className="bg-emerald-500/10 text-emerald-500 px-8 py-3 rounded-full font-bold text-xs uppercase tracking-[0.2em] mb-10 flex items-center gap-3">
                             <div className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                             Connection Verified
                          </div>
                          <button onClick={handleNext} className="k-cta-primary w-full py-5 text-base font-bold tracking-[0.2em] rounded-2xl">
                             SIMULATE ON-CHAIN PURCHASE
                          </button>
                       </div>
                    )}
                  </div>
                )}

                {step === 4 && (
                  <div className="animate-in fade-in zoom-in-95 duration-500 max-w-2xl w-full">
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-6 tracking-tight flex items-center justify-center">
                      On-Chain Split <InfoIcon onClick={() => setActiveTip(tips.split)} />
                    </h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-12 text-base">
                       Bob makes a 100 {symbol} purchase. The smart contract executes the split protocol instantly.
                    </p>

                    <div className="space-y-3 mb-12">
                       {upline.map((node) => {
                          const value = (100 * node.share) / 100;
                          return (
                             <div key={node.level} className={`flex items-center justify-between p-5 rounded-2xl border transition-all ${
                               node.active ? 'bg-emerald-500/5 border-emerald-500/20' : 'bg-transparent border-zinc-100 dark:border-zinc-800'
                             }`}>
                                <div className="flex items-center gap-4 text-left">
                                   <div className={`w-8 h-8 rounded-lg flex items-center justify-center font-bold text-xs ${node.active ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                      {node.active ? '✓' : 'G'}
                                   </div>
                                   <div>
                                      <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase leading-none mb-1">
                                         {node.active ? node.name : 'Genesis Wallet'}
                                      </p>
                                      <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest leading-none">
                                         L{node.level} Share ({node.share}%)
                                      </p>
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className={`text-lg font-bold tabular-nums ${node.active ? 'text-emerald-500' : 'text-zinc-400'}`}>
                                      +{value.toFixed(2)} {symbol}
                                   </p>
                                </div>
                             </div>
                          );
                       })}
                       <div className="flex items-center justify-between p-5 rounded-2xl border border-zinc-100 dark:border-zinc-800 bg-transparent">
                           <div className="flex items-center gap-4 text-left">
                               <div className="w-8 h-8 rounded-lg bg-[#02abb8]/10 flex items-center justify-center text-[#02abb8] font-bold text-xs">S</div>
                               <div>
                                  <p className="text-sm font-bold text-zinc-900 dark:text-white uppercase leading-none mb-1">Platform Treasury</p>
                                  <p className="text-[10px] font-medium text-zinc-500 uppercase tracking-widest leading-none">Infrastructure Share (18%)</p>
                               </div>
                           </div>
                           <div className="text-right">
                               <p className="text-lg font-bold text-[#02abb8] tabular-nums">+18.00 {symbol}</p>
                           </div>
                       </div>
                    </div>

                    <button onClick={handleNext} className="k-cta-primary w-full py-5 text-base font-bold tracking-[0.2em] rounded-2xl">
                       VIEW FINAL REWARDS
                    </button>
                  </div>
                )}

                {step === 5 && (
                  <div className="animate-in fade-in duration-700 max-w-2xl w-full">
                    <div className="w-24 h-24 bg-emerald-500 text-white rounded-[2rem] flex items-center justify-center mx-auto mb-10 shadow-3xl shadow-emerald-500/30 border-4 border-white dark:border-zinc-900 transition-transform hover:scale-105 duration-500">
                       <svg className="w-12 h-12" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-3xl font-bold text-zinc-900 dark:text-white mb-3 tracking-tight">Walkthrough Complete</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-12 text-base leading-relaxed">
                       You received your rewards instantly because your tree was active at the moment of transaction.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 mb-12 text-left">
                       <div className="p-8 rounded-[2rem] bg-[#02abb8]/5 border-2 border-[#02abb8] shadow-xl shadow-[#02abb8]/5">
                          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Net Earnings (Mark)</p>
                          <p className="text-4xl font-bold text-[#02abb8] mb-2">+2.00 {symbol}</p>
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">Instant referral reward</p>
                       </div>
                       <div className="p-8 rounded-[2rem] bg-zinc-50 dark:bg-zinc-900/50 border border-zinc-200 dark:border-zinc-800">
                          <p className="text-[11px] font-bold text-zinc-500 uppercase tracking-widest mb-6">Network Reward (Dave)</p>
                          <p className="text-4xl font-bold text-zinc-600 dark:text-zinc-300 mb-2">+10.00 {symbol}</p>
                          <p className="text-xs font-medium text-zinc-500 uppercase tracking-tighter">L3 Active referral reward</p>
                       </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/10 p-8 rounded-3xl mb-12 text-left">
                        <div className="flex items-start gap-5">
                           <div className="w-12 h-12 rounded-2xl bg-amber-500/10 text-amber-600 flex items-center justify-center shrink-0">
                              <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                           </div>
                           <div>
                              <h4 className="text-amber-700 dark:text-amber-500 font-bold text-base uppercase mb-1">Transparency Note</h4>
                              <p className="kx-body">
                                 Alex (L2) was inactive, so his <strong>5% share</strong> was redirected to the protocol reserve. Activation is key to network growth.
                              </p>
                           </div>
                        </div>
                    </div>

                    <div className="flex gap-6">
                      <button onClick={() => setStep(1)} className="flex-1 k-cta-secondary py-5 text-sm font-bold uppercase tracking-widest rounded-2xl">
                        RESTART STORY
                      </button>
                      <button onClick={() => window.location.href = '/tree/dashboard'} className="flex-1 k-cta-primary py-5 text-sm font-bold uppercase tracking-widest rounded-2xl">
                        GO TO DASHBOARD
                      </button>
                    </div>
                  </div>
                )}

              </div>

              <div className="p-6 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-xs font-bold text-zinc-400 uppercase tracking-[0.2em] px-10">
                 <span>Screen {step} / 5</span>
                 <span>Protocol Demo • Account: Mark</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
