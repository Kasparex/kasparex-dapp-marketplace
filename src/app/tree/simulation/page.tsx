'use client';

import { useState, useMemo } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeSidebar } from '@/components/revenue-tree/RevenueTreeSidebar';
import { useAccount, useChainId } from 'wagmi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { DEFAULT_REVENUE_WALLETS } from '@/lib/revenue-tree/utils';

type Perspective = 'referrer';

export default function RevenueTreeSimulationPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const symbol = getNativeCurrencySymbol(chainId);
  
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [userVolume, setUserVolume] = useState(0);
  const [isBobReferred, setIsBobReferred] = useState(false);
  
  // Activation Threshold
  const ACTIVATION_THRESHOLD = 100;
  const isActivated = userVolume >= ACTIVATION_THRESHOLD;

  // Upline data for simulation
  const upline = [
    { name: 'Mark (You)', level: 1, share: 2, active: isActivated, wallet: address || '0xMarkWallet' },
    { name: 'Alex', level: 2, share: 5, active: false, wallet: '0xAlexWallet' }, // Alex is inactive
    { name: 'Dave', level: 3, share: 10, active: true, wallet: '0xDaveWallet' }, // Dave is active
    { name: 'Chris', level: 4, share: 20, active: false, wallet: '0xChrisWallet' }, // Chris is inactive
    { name: 'Genesis', level: 5, share: 45, active: true, wallet: DEFAULT_REVENUE_WALLETS.LEVEL_5 },
  ];

  const steps = [
    { title: 'Status', desc: 'Check your volume' },
    { title: 'Activation', desc: 'Unlock your tree' },
    { title: 'Network', desc: 'Refer Bob' },
    { title: 'Payment', desc: '100 KAS split' },
    { title: 'Rewards', desc: 'View earnings' },
  ];

  const handleNext = () => {
    if (step < 5) {
      setIsProcessing(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsProcessing(false);
      }, 600);
    }
  };

  const handleReset = () => {
    setStep(1);
    setUserVolume(0);
    setIsBobReferred(false);
  };

  const simulateActivationPurchase = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setUserVolume(100);
      setIsProcessing(false);
    }, 1000);
  };

  const simulateBobReferral = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsBobReferred(true);
      setIsProcessing(false);
    }, 800);
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      
      <div className="flex-1 flex flex-col lg:flex-row">
        <div className="hidden lg:block flex-shrink-0">
          <RevenueTreeSidebar 
            totalRevenue={0}
            activeTrees={0}
            totalDownline={0}
          />
        </div>

        <main className="flex-1 min-w-0 p-4 sm:p-6 lg:p-8">
          <div className="max-w-5xl mx-auto">
            <div className="mb-8">
              <h1 className="text-3xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">
                System Simulation
              </h1>
              <p className="text-zinc-600 dark:text-zinc-400">
                Official Revenue Tree demonstration: From activation to reward distribution.
              </p>
            </div>

            {/* Wizard Container */}
            <div className="bg-white dark:bg-zinc-950 rounded-3xl border border-zinc-200 dark:border-zinc-800 overflow-hidden shadow-2xl">
              {/* Stepper Header */}
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto whitespace-nowrap scrollbar-hide">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3 shrink-0">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      step > i + 1 
                        ? 'bg-emerald-500 text-white' 
                        : step === i + 1 
                          ? 'bg-[#02abb8] text-white animate-pulse' 
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}>
                      {step > i + 1 ? '✓' : i + 1}
                    </div>
                    <div>
                      <p className={`text-[10px] font-black uppercase tracking-wider ${
                        step === i + 1 ? 'text-[#02abb8]' : 'text-zinc-400'
                      }`}>{s.title}</p>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="w-8 h-px bg-zinc-200 dark:border-zinc-800 mx-2" />
                    )}
                  </div>
                ))}
              </div>

              {/* Simulation Stage */}
              <div className="p-8 min-h-[500px] flex flex-col items-center justify-center text-center">
                
                {/* Step 1: Initial Status */}
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-xl w-full">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">Current Network Status</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-sm leading-relaxed">
                      You are <strong>Mark</strong>. To start earning from your referral tree, you must first reach the <strong>Activation Threshold</strong>.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10 text-left">
                       <div className="p-6 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Your Lifetime Volume</p>
                          <div className="flex items-baseline gap-2">
                             <span className="text-3xl font-black text-zinc-900 dark:text-white">{userVolume}</span>
                             <span className="text-xs font-bold text-zinc-400 uppercase">{symbol}</span>
                          </div>
                          <div className="mt-4 w-full bg-zinc-200 dark:bg-zinc-800 h-1.5 rounded-full overflow-hidden">
                             <div className="h-full bg-amber-500" style={{ width: `${(userVolume / ACTIVATION_THRESHOLD) * 100}%` }} />
                          </div>
                          <p className="mt-2 text-[10px] font-bold text-zinc-500 uppercase tracking-tighter text-right">
                             Target: {ACTIVATION_THRESHOLD} {symbol}
                          </p>
                       </div>

                       <div className="p-6 rounded-2xl border-2 border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50">
                          <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Affiliate Link Status</p>
                          <div className="flex items-center gap-2 mb-4">
                             <div className="w-2 h-2 rounded-full bg-amber-500 animate-pulse" />
                             <span className="text-sm font-black text-amber-500 uppercase">INACTIVE (GENESIS MODE)</span>
                          </div>
                          <p className="text-[10px] text-zinc-500 font-medium leading-relaxed">
                             In this mode, any volume generated by people you refer will be distributed to <strong>Genesis Wallets</strong> instead of you.
                          </p>
                       </div>
                    </div>

                    <div className="p-4 bg-emerald-500/5 border border-emerald-500/10 rounded-xl mb-10">
                       <p className="text-xs font-bold text-emerald-600 dark:text-emerald-400">
                          Tip: Buy a product for 100 {symbol} to activate your tree instantly.
                       </p>
                    </div>

                    <button 
                      onClick={handleNext} 
                      className="k-cta-primary w-full py-4 text-sm tracking-[0.2em]"
                    >
                       PROCEED TO ACTIVATION
                    </button>
                  </div>
                )}

                {/* Step 2: Activation Process */}
                {step === 2 && (
                  <div className="animate-in fade-in duration-500 max-w-xl w-full">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">Tree Activation</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-sm leading-relaxed">
                      Reach 100 {symbol} in lifetime volume to unlock your personal Revenue Tree.
                    </p>

                    <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 mb-10 shadow-inner">
                       {!isActivated ? (
                          <div className="flex flex-col items-center">
                             <div className="w-20 h-20 rounded-full bg-zinc-100 dark:bg-zinc-800 flex items-center justify-center mb-6 text-zinc-400">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                             </div>
                             <p className="text-sm font-bold text-zinc-500 mb-8 uppercase tracking-widest text-center">
                                Your link is currently locked.<br/>All rewards go to Genesis.
                             </p>
                             <button 
                               onClick={simulateActivationPurchase}
                               disabled={isProcessing}
                               className="bg-[#02abb8] hover:bg-[#0299a6] text-white px-10 py-3 rounded-xl font-black text-xs uppercase tracking-[0.2em] shadow-lg shadow-[#02abb8]/20"
                             >
                                {isProcessing ? 'PROCESSING...' : `PAY 100 ${symbol}`}
                             </button>
                          </div>
                       ) : (
                          <div className="flex flex-col items-center animate-in zoom-in-95 duration-500">
                             <div className="w-20 h-20 rounded-full bg-emerald-500 text-white flex items-center justify-center mb-6 shadow-xl shadow-emerald-500/30">
                                <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                             </div>
                             <h4 className="text-xl font-black text-emerald-500 uppercase tracking-tight mb-2">System Activated</h4>
                             <p className="text-xs text-zinc-500 font-bold uppercase tracking-widest mb-8">
                                Referral Link: unlocked.tree/Mark
                             </p>
                             
                             <div className="grid grid-cols-5 gap-2 w-full max-w-xs mb-4">
                                {upline.map((lv) => (
                                   <div key={lv.level} className="flex flex-col items-center">
                                      <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${lv.level === 1 ? 'bg-emerald-500 text-white' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'}`}>
                                         {lv.level === 1 ? 'M' : 'G'}
                                      </div>
                                   </div>
                                ))}
                             </div>
                             <p className="text-[10px] text-zinc-400 font-bold uppercase">L1 Slot now points to Your Wallet</p>
                          </div>
                       )}
                    </div>

                    <button 
                      onClick={handleNext} 
                      disabled={!isActivated}
                      className={`w-full py-4 text-sm tracking-[0.2em] transition-all ${
                        isActivated ? 'k-cta-primary' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                       NEXT: GROW YOUR NETWORK
                    </button>
                  </div>
                )}

                {/* Step 3: Referral & Other Users */}
                {step === 3 && (
                  <div className="animate-in fade-in duration-500 max-w-2xl w-full">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">Building the Hierarchy</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-sm leading-relaxed">
                      You refer <strong>Bob</strong>. Now let&apos;s look at your upline chain (5 levels). Each person must be active to receive their split.
                    </p>

                    <div className="space-y-3 mb-12">
                       {upline.map((node) => (
                          <div key={node.level} className={`flex items-center justify-between p-4 rounded-2xl border-2 transition-all ${
                            node.active 
                              ? 'bg-emerald-500/5 border-emerald-500/20' 
                              : 'bg-amber-500/5 border-amber-500/10'
                          }`}>
                             <div className="flex items-center gap-4">
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center font-black text-xs ${
                                  node.active ? 'bg-emerald-500 text-white' : 'bg-amber-500 text-white'
                                }`}>
                                   {node.name.charAt(0)}
                                </div>
                                <div className="text-left">
                                   <h5 className="text-sm font-black text-zinc-900 dark:text-white uppercase leading-none mb-1">
                                      Level {node.level}: {node.name}
                                   </h5>
                                   <p className={`text-[10px] font-bold uppercase tracking-widest ${node.active ? 'text-emerald-500' : 'text-amber-500'}`}>
                                      {node.active ? '✓ ACTIVE' : '⚠ INACTIVE (GENESIS FALLBACK)'}
                                   </p>
                                </div>
                             </div>
                             <div className="text-right">
                                <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest leading-none mb-1">Share</p>
                                <p className="text-sm font-black text-zinc-900 dark:text-white">{node.share}%</p>
                             </div>
                          </div>
                       ))}
                    </div>

                    {!isBobReferred ? (
                       <button 
                         onClick={simulateBobReferral}
                         disabled={isProcessing}
                         className="k-cta-primary w-full py-4 text-sm tracking-[0.2em]"
                       >
                          {isProcessing ? 'INVITING...' : 'GENERATE LINK & REFER BOB'}
                       </button>
                    ) : (
                       <div className="flex flex-col items-center">
                          <div className="inline-flex items-center gap-3 px-6 py-2 bg-[#02abb8]/10 text-[#02abb8] rounded-full mb-8">
                             <div className="w-2 h-2 rounded-full bg-[#02abb8] animate-ping" />
                             <span className="text-[10px] font-black uppercase tracking-[0.2em]">Bob Connected to Mark</span>
                          </div>
                          <button onClick={handleNext} className="k-cta-primary w-full py-4 text-sm tracking-[0.2em]">
                             PROCEED TO PURCHASE
                          </button>
                       </div>
                    )}
                  </div>
                )}

                {/* Step 4: The 100 KAS Purchase */}
                {step === 4 && (
                  <div className="animate-in fade-in zoom-in-95 duration-500 max-w-xl w-full">
                    <div className="w-20 h-20 bg-zinc-900 dark:bg-zinc-800 rounded-2xl flex items-center justify-center mx-auto mb-8 shadow-2xl relative">
                       <div className="absolute -top-2 -right-2 bg-[#02abb8] text-white px-2 py-0.5 rounded-full text-[8px] font-black uppercase">BOB</div>
                       <span className="text-3xl font-black text-[#02abb8]">100</span>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">On-Chain Native Split</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-sm leading-relaxed">
                       Bob pays 100 {symbol}. Watch how the system splits the volume across the active levels and redirects inactive shares to Genesis.
                    </p>

                    <div className="space-y-2 mb-10">
                       {upline.map((node) => {
                          const value = (100 * node.share) / 100;
                          return (
                             <div key={node.level} className={`flex items-center justify-between p-3 rounded-xl border-l-4 transition-all ${
                               node.active ? 'bg-emerald-500/5 border-l-emerald-500' : 'bg-zinc-50 dark:bg-zinc-900 border-l-amber-500'
                             }`}>
                                <div className="flex items-center gap-3 text-left">
                                   <span className="text-[10px] font-black text-zinc-400">L{node.level}</span>
                                   <div>
                                      <p className="text-xs font-black text-zinc-900 dark:text-white uppercase leading-none">
                                         {node.active ? node.name : 'GENESIS WALLET'}
                                      </p>
                                      {!node.active && <p className="text-[8px] font-bold text-amber-500 uppercase mt-1">Fallback: {node.name} is Inactive</p>}
                                   </div>
                                </div>
                                <div className="text-right">
                                   <p className={`text-sm font-black ${node.active ? 'text-emerald-500' : 'text-zinc-900 dark:text-white'}`}>
                                      +{value.toFixed(2)} {symbol}
                                   </p>
                                   <p className="text-[8px] font-bold text-zinc-400 uppercase">{node.share}% Split</p>
                                </div>
                             </div>
                          );
                       })}
                       <div className="flex items-center justify-between p-3 rounded-xl border-l-4 bg-zinc-50 dark:bg-zinc-900 border-l-[#02abb8]">
                           <div className="flex items-center gap-3 text-left">
                               <span className="text-[10px] font-black text-zinc-400">SYS</span>
                               <div>
                                  <p className="text-xs font-black text-[#02abb8] uppercase leading-none">Platform Infrastructure</p>
                               </div>
                           </div>
                           <div className="text-right">
                               <p className="text-sm font-black text-[#02abb8]">+18.00 {symbol}</p>
                               <p className="text-[8px] font-bold text-zinc-400 uppercase">18% Split</p>
                           </div>
                       </div>
                    </div>

                    <button onClick={handleNext} className="k-cta-primary w-full py-4 text-sm tracking-[0.2em]">
                       VERIFY FINAL EARNINGS
                    </button>
                  </div>
                )}

                {/* Step 5: Final Result */}
                {step === 5 && (
                  <div className="animate-in fade-in duration-700 max-w-xl w-full">
                    <div className="w-20 h-20 bg-emerald-500 text-white rounded-full flex items-center justify-center mx-auto mb-8 shadow-xl shadow-emerald-500/20">
                       <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-2 uppercase tracking-tight">Earning Successful</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-sm leading-relaxed">
                       The simulation is complete. You (Mark) received your L1 reward because you were <strong>Active</strong>.
                    </p>

                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
                       <div className="p-6 rounded-2xl bg-[#02abb8]/5 border-2 border-[#02abb8] shadow-lg shadow-[#02abb8]/5">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">You (Mark) Earned</p>
                          <p className="text-3xl font-black text-[#02abb8] mb-1">+2.00 {symbol}</p>
                          <p className="text-[10px] font-bold text-zinc-500 leading-tight">Instant native payout from Bob&apos;s transaction.</p>
                       </div>
                       <div className="p-6 rounded-2xl bg-zinc-50 dark:bg-zinc-900 border-2 border-zinc-200 dark:border-zinc-800 opacity-60">
                          <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest mb-4">Dave (L3 Earned)</p>
                          <p className="text-3xl font-black text-zinc-600 dark:text-zinc-400 mb-1">+10.00 {symbol}</p>
                          <p className="text-[10px] font-bold text-zinc-500 leading-tight">Dave was active, so he received his 10%.</p>
                       </div>
                    </div>

                    <div className="bg-amber-500/5 border border-amber-500/20 p-6 rounded-2xl mb-12 text-left">
                        <div className="flex items-start gap-4">
                           <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0">!</div>
                           <div>
                              <h4 className="text-amber-600 dark:text-amber-500 font-black text-sm uppercase mb-1">Observation</h4>
                              <p className="text-[11px] text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                 <strong>Alex (L2)</strong> missed his <strong>5.00 {symbol}</strong> because he was <strong>Inactive</strong>. That volume was automatically claimed by the platform Genesis Wallet.
                              </p>
                           </div>
                        </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={handleReset} className="flex-1 k-cta-secondary py-4 text-xs font-black uppercase tracking-widest">
                        RESTART SIMULATION
                      </button>
                      <button onClick={() => window.location.href = '/tree/dashboard'} className="flex-1 k-cta-primary py-4 text-xs font-black uppercase tracking-widest">
                        MY DASHBOARD
                      </button>
                    </div>
                  </div>
                )}

              </div>

              {/* Step Info Bar */}
              <div className="p-4 bg-zinc-50 dark:bg-zinc-900/50 border-t border-zinc-100 dark:border-zinc-900 flex items-center justify-between text-[10px] font-bold text-zinc-400 uppercase tracking-widest px-8">
                 <span>Step {step} of 5</span>
                 <span>Identity: Mark (You)</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}
