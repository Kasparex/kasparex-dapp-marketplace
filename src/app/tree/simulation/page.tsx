'use client';

import { useState } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeSidebar } from '@/components/revenue-tree/RevenueTreeSidebar';
import { useAccount, useChainId } from 'wagmi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';
import { DEFAULT_REVENUE_WALLETS } from '@/lib/revenue-tree/utils';

type Perspective = 'buyer' | 'referrer';

export default function RevenueTreeSimulationPage() {
  const { address } = useAccount();
  const chainId = useChainId();
  const symbol = getNativeCurrencySymbol(chainId);
  
  const [perspective, setPerspective] = useState<Perspective>('referrer');
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActivated, setIsActivated] = useState(false);
  const [isBobReferred, setIsBobReferred] = useState(false);

  // Define steps for the story
  const steps = [
    { title: 'Selection', desc: 'Product discovery' },
    { title: 'Activation', desc: 'Secure your spot' },
    { title: 'Referral', desc: 'Connect Bob' },
    { title: 'Purchase', desc: 'The transaction' },
    { title: 'Rewards', desc: 'Split verification' },
  ];

  const handleNext = () => {
    if (step < 5) {
      setIsProcessing(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsProcessing(false);
      }, 500);
    }
  };

  const handleReset = () => {
    setStep(1);
    setIsActivated(false);
    setIsBobReferred(false);
  };

  const handleActivate = () => {
    setIsProcessing(true);
    setTimeout(() => {
      setIsActivated(true);
      setIsProcessing(false);
    }, 800);
  };

  const handleReferBob = () => {
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
                Experience the Revenue Tree logic step-by-step.
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
                
                {/* Step 1: Product Selection */}
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md">
                    <div className="w-20 h-20 bg-[#02abb8]/10 rounded-2xl flex items-center justify-center text-[#02abb8] mx-auto mb-6">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 uppercase tracking-tight">The Target Product</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                      To earn rewards, you first need a product for your referrals to buy. Let&apos;s use <strong>Studio Premium</strong> as an example.
                    </p>
                    <div className="bg-zinc-50 dark:bg-zinc-900 p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 mb-10">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-zinc-500 font-bold uppercase text-[10px]">Product</span>
                        <span className="text-zinc-900 dark:text-white font-black">Studio Premium</span>
                      </div>
                      <div className="flex items-center justify-between">
                        <span className="text-zinc-500 font-bold uppercase text-[10px]">Price</span>
                        <span className="text-xl font-black text-[#02abb8]">100 {symbol}</span>
                      </div>
                    </div>
                    <button onClick={handleNext} className="k-cta-primary w-full py-4 text-sm tracking-[0.2em]">
                      NEXT: CHECK MY NETWORK
                    </button>
                  </div>
                )}

                {/* Step 2: Activation */}
                {step === 2 && (
                  <div className="animate-in fade-in duration-500 max-w-xl w-full">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">Step 1: Account Activation</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-sm leading-relaxed">
                      You (<strong>Mark</strong>) are currently checking your tree. If you are not activated, all your potential commissions will fall back to <strong>Genesis Wallets</strong>.
                    </p>

                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border-2 border-dashed border-zinc-200 dark:border-zinc-800 mb-8">
                       <div className="flex items-center justify-between mb-6">
                          <div className="text-left">
                             <p className="text-[10px] font-black text-zinc-500 uppercase tracking-widest mb-1">Your Status</p>
                             <div className={`text-sm font-black uppercase ${isActivated ? 'text-emerald-500' : 'text-amber-500'}`}>
                                {isActivated ? '✓ ACTIVE NETWORK NODE' : '⚠ INACTIVE (GENESIS MODE)'}
                             </div>
                          </div>
                          {!isActivated && (
                             <button 
                               onClick={handleActivate}
                               disabled={isProcessing}
                               className="bg-emerald-500 hover:bg-emerald-600 text-white px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all shadow-lg shadow-emerald-500/20"
                             >
                                {isProcessing ? 'ACTIVATING...' : 'ACTIVATE NOW'}
                             </button>
                          )}
                       </div>

                       <div className="grid grid-cols-5 gap-2">
                          {[1, 2, 3, 4, 5].map((lv) => (
                             <div key={lv} className="flex flex-col items-center">
                                <div className={`w-8 h-8 rounded-full flex items-center justify-center text-[10px] font-black ${
                                  lv === 1 && isActivated ? 'bg-emerald-500 text-white' : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400'
                                }`}>
                                   {lv === 1 && isActivated ? 'M' : 'G'}
                                </div>
                                <span className="mt-1 text-[7px] font-bold text-zinc-500 uppercase">
                                   {lv === 1 && isActivated ? 'Mark' : 'Genesis'}
                                </span>
                             </div>
                          ))}
                       </div>
                    </div>

                    <button 
                      onClick={handleNext} 
                      disabled={!isActivated}
                      className={`w-full py-4 text-sm tracking-[0.2em] transition-all ${
                        isActivated ? 'k-cta-primary' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                       {isActivated ? 'PROCEED TO REFERRAL' : 'PLEASE ACTIVATE FIRST'}
                    </button>
                  </div>
                )}

                {/* Step 3: Referral */}
                {step === 3 && (
                  <div className="animate-in fade-in duration-500 max-w-xl w-full">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">Step 2: Connect Bob</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-sm leading-relaxed">
                      Now that your tree is live, you need to refer your first user. Once <strong>Bob</strong> joins via your link, he becomes your direct <strong>L1 referral</strong>.
                    </p>

                    <div className="bg-emerald-500/5 border border-emerald-500/20 rounded-2xl p-8 mb-10 relative overflow-hidden">
                       <div className="flex flex-col items-center justify-center">
                          <div className="flex items-center gap-12 mb-6">
                             <div className="flex flex-col items-center gap-2">
                                <div className="w-14 h-14 rounded-2xl bg-emerald-500 text-white flex items-center justify-center shadow-xl shadow-emerald-500/20">
                                   <span className="text-xl font-black">M</span>
                                </div>
                                <span className="text-[10px] font-black text-emerald-500 uppercase tracking-widest">Mark (You)</span>
                             </div>

                             <div className="flex flex-col items-center justify-center pt-2">
                                <div className={`w-12 h-px ${isBobReferred ? 'bg-emerald-500' : 'bg-zinc-200 dark:bg-zinc-800'} relative`}>
                                   {isBobReferred && <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[8px] bg-white dark:bg-zinc-950 px-1 font-black text-emerald-500">L1</div>}
                                </div>
                             </div>

                             <div className="flex flex-col items-center gap-2">
                                <div className={`w-14 h-14 rounded-2xl flex items-center justify-center transition-all ${
                                  isBobReferred ? 'bg-[#02abb8] text-white shadow-xl shadow-[#02abb8]/20' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-300 border-2 border-dashed border-zinc-200 dark:border-zinc-800'
                                }`}>
                                   <span className="text-xl font-black">{isBobReferred ? 'B' : '?'}</span>
                                </div>
                                <span className={`text-[10px] font-black uppercase tracking-widest ${isBobReferred ? 'text-[#02abb8]' : 'text-zinc-400'}`}>
                                   {isBobReferred ? 'Bob (Referred)' : 'Unknown'}
                                </span>
                             </div>
                          </div>

                          {!isBobReferred ? (
                             <button 
                               onClick={handleReferBob}
                               disabled={isProcessing}
                               className="k-cta-primary px-8 py-3 text-xs font-black tracking-widest"
                             >
                                {isProcessing ? 'GENERATING LINK...' : 'INVITE BOB'}
                             </button>
                          ) : (
                             <div className="animate-bounce-slow text-emerald-500 text-[10px] font-black uppercase tracking-tighter">
                                Connection Established!
                             </div>
                          )}
                       </div>
                    </div>

                    <button 
                      onClick={handleNext} 
                      disabled={!isBobReferred}
                      className={`w-full py-4 text-sm tracking-[0.2em] transition-all ${
                        isBobReferred ? 'k-cta-primary' : 'bg-zinc-100 dark:bg-zinc-900 text-zinc-400 cursor-not-allowed border border-zinc-200 dark:border-zinc-800'
                      }`}
                    >
                       {isBobReferred ? 'START PURCHASE SIMULATION' : 'AWAITING REFERRAL'}
                    </button>
                  </div>
                )}

                {/* Step 4: Purchase */}
                {step === 4 && (
                  <div className="animate-in fade-in zoom-in-95 duration-500 max-w-md">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                      <div className="absolute inset-0 bg-[#02abb8]/20 rounded-full animate-ping" />
                      <div className="relative w-24 h-24 bg-[#02abb8] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#02abb8]/30">
                        <span className="text-2xl font-black">100</span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 uppercase tracking-tight">On-Chain Transaction</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed text-sm">
                       <strong>Bob</strong> is now triggering the 100 KAS payment. The Smart Contract is looking up Bob&apos;s upline (Mark) to distribute the rewards instantly.
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                       <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-[#02abb8] animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                       </div>
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Bob sending 100 KAS...</p>
                    </div>
                    <button onClick={handleNext} disabled={isProcessing} className="mt-10 k-cta-primary w-full py-4 text-sm tracking-[0.2em]">
                      {isProcessing ? 'PROCESSING...' : 'TRIGGER REVENUE SPLIT'}
                    </button>
                  </div>
                )}

                {/* Step 5: Reward Distribution & Result */}
                {step === 5 && (
                  <div className="animate-in scale-in-center duration-500 w-full max-w-2xl px-4">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">Revenue Distribution</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-sm">
                      Smart contract distributed the 100 {symbol} natively across your active tree.
                    </p>
                    
                    <div className="space-y-2 mb-8">
                       <SimulationRow 
                          label="L1 Referrer (Mark - You)" 
                          value="2.00" 
                          pct="2%" 
                          color="text-emerald-500 font-black" 
                          highlight={true}
                          address={address}
                        />
                       <SimulationRow 
                          label="L2 Referrer (Alex)" 
                          value="5.00" 
                          pct="5%" 
                          color="text-zinc-500" 
                          address="0xAlexWallet_MarkUpline"
                        />
                       <SimulationRow 
                          label="L3 Referrer (Dave)" 
                          value="10.00" 
                          pct="10%" 
                          color="text-zinc-500" 
                          address="0xDaveWallet_L2Upline"
                        />
                       <SimulationRow 
                          label="L4 Referrer (Genesis)" 
                          value="20.00" 
                          pct="20%" 
                          color="text-zinc-400" 
                          address={DEFAULT_REVENUE_WALLETS.LEVEL_4}
                        />
                       <SimulationRow 
                          label="L5 Referrer (Genesis)" 
                          value="45.00" 
                          pct="45%" 
                          color="text-zinc-300" 
                          address={DEFAULT_REVENUE_WALLETS.LEVEL_5}
                        />
                       <SimulationRow 
                          label="Platform Infrastructure" 
                          value="18.00" 
                          pct="18%" 
                          color="text-[#02abb8]" 
                          address={DEFAULT_REVENUE_WALLETS.PLATFORM}
                        />
                    </div>

                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl mb-12 text-left">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">✓</div>
                          <div>
                             <h4 className="text-zinc-900 dark:text-white font-black text-sm uppercase mb-1">Success</h4>
                             <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                Mark (You) earned <strong>2.00 KAS</strong> from Bob&apos;s purchase. Alex and Dave also received their L2 and L3 shares instantly.
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={handleReset} className="flex-1 k-cta-secondary py-4 text-xs font-black uppercase tracking-widest">
                        RESTART STORY
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
                 <span>Identity: Mark</span>
              </div>
            </div>
          </div>
        </main>
      </div>

      <Footer />
    </div>
  );
}

function SimulationRow({ label, value, pct, color, highlight, address }: { label: string, value: string, pct: string, color: string, highlight?: boolean, address?: string }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
      highlight ? 'bg-emerald-500/10 border-emerald-500 ring-2 ring-emerald-500/20' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
    }`}>
      <div className="flex items-center gap-3 min-w-0">
        <span className={`text-[10px] font-black uppercase ${color} shrink-0`}>{pct}</span>
        <div className="flex flex-col min-w-0">
           <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200 truncate">{label}</span>
           {address && <span className="text-[8px] font-mono text-zinc-400 truncate opacity-60">{address}</span>}
        </div>
      </div>
      <span className="text-sm font-black text-zinc-900 dark:text-white shrink-0 ml-4">{value} KAS</span>
    </div>
  );
}
