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
  
  const [perspective, setPerspective] = useState<Perspective>('buyer');
  const [step, setStep] = useState(1);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isActivated, setIsActivated] = useState(false);

  const steps = [
    { title: 'Selection', desc: 'Choose a service to purchase' },
    { title: 'Network Status', desc: 'Genesis vs Active Tree setup' },
    { title: 'Payment', desc: 'Trigger a native KAS transaction' },
    { title: 'Distribution', desc: 'Smart contract split logic' },
    { title: 'Confirmation', desc: 'Review final results' },
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
    setIsActivated(false);
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
                Experience the Revenue Tree logic from both sides of the transaction.
              </p>
            </div>

            {/* Perspective Switcher */}
            <div className="flex bg-zinc-100 dark:bg-zinc-900 p-1 rounded-2xl mb-8 w-fit border border-zinc-200 dark:border-zinc-800">
              <button
                onClick={() => { setPerspective('buyer'); handleReset(); }}
                className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  perspective === 'buyer' 
                    ? 'bg-white dark:bg-zinc-800 text-[#02abb8] shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Buyer View
              </button>
              <button
                onClick={() => { setPerspective('referrer'); handleReset(); }}
                className={`px-6 py-2.5 rounded-xl text-sm font-black uppercase tracking-widest transition-all ${
                  perspective === 'referrer' 
                    ? 'bg-white dark:bg-zinc-800 text-purple-500 shadow-sm' 
                    : 'text-zinc-500 hover:text-zinc-700 dark:hover:text-zinc-300'
                }`}
              >
                Referrer View
              </button>
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
              <div className="p-8 min-h-[480px] flex flex-col items-center justify-center text-center">
                
                {step === 1 && (
                  <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-md">
                    <div className="w-20 h-20 bg-[#02abb8]/10 rounded-2xl flex items-center justify-center text-[#02abb8] mx-auto mb-6">
                      <svg className="w-10 h-10" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 uppercase tracking-tight"> dApp Product</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                      Imagine you are {perspective === 'buyer' ? 'purchasing a Premium Subscription for Kasparex Studio' : 'the referrer for Bob, who is about to buy a Kasparex Studio license'}.
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
                      {perspective === 'buyer' ? 'PROCEED TO SYSTEM STATUS' : 'PROCEED TO NETWORK STATUS'}
                    </button>
                  </div>
                )}

                {step === 2 && (
                  <div className="animate-in fade-in duration-500 max-w-xl w-full">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">Active vs Genesis Tree</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-sm leading-relaxed">
                      Before revenue can flow to a custom upline, the tree must be <strong>Activated</strong>. If a user has no referrer or isn&apos;t active, volume falls back to <strong>Genesis Wallets</strong>.
                    </p>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-10">
                       <button 
                         onClick={() => setIsActivated(false)}
                         className={`p-6 rounded-2xl border-2 text-left transition-all ${!isActivated ? 'border-[#02abb8] bg-[#02abb8]/5' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-60'}`}
                       >
                          <div className="flex items-center gap-3 mb-4">
                             <div className="w-8 h-8 rounded-lg bg-zinc-200 dark:bg-zinc-800 flex items-center justify-center text-zinc-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" /></svg>
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-zinc-500">Genesis Mode</span>
                          </div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Inactive Tree</h4>
                          <p className="text-[10px] text-zinc-500 font-medium">All shares will be distributed to platform Genesis Wallets.</p>
                       </button>

                       <button 
                         onClick={() => setIsActivated(true)}
                         className={`p-6 rounded-2xl border-2 text-left transition-all ${isActivated ? 'border-emerald-500 bg-emerald-500/5 shadow-[0_0_20px_rgba(16,185,129,0.1)]' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 opacity-60'}`}
                       >
                          <div className="flex items-center gap-3 mb-4">
                             <div className="w-8 h-8 rounded-lg bg-emerald-500/10 flex items-center justify-center text-emerald-500">
                                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                             </div>
                             <span className="text-[10px] font-black uppercase tracking-widest text-emerald-500">Network Active</span>
                          </div>
                          <h4 className="text-sm font-bold text-zinc-900 dark:text-white mb-1">Live Referral Tree</h4>
                          <p className="text-[10px] text-zinc-500 font-medium whitespace-nowrap">Mark (You) refers Bob. Alex is Mark&apos;s upline.</p>
                       </button>
                    </div>

                    <button onClick={handleNext} className="k-cta-primary w-full py-4 text-sm tracking-[0.2em]">
                       {isActivated ? 'PROCEED AS ACTIVE NETWORK' : 'PROCEED AS GENESIS MODE'}
                    </button>
                    {!isActivated && perspective === 'referrer' && (
                       <p className="mt-4 text-[10px] text-amber-500 font-black uppercase tracking-tighter">* In Genesis Mode, You won&apos;t receive Bob&apos;s commission!</p>
                    )}
                  </div>
                )}

                {step === 3 && (
                  <div className="animate-in fade-in zoom-in-95 duration-500 max-w-md">
                    <div className="relative w-24 h-24 mx-auto mb-8">
                      <div className="absolute inset-0 bg-[#02abb8]/20 rounded-full animate-ping" />
                      <div className="relative w-24 h-24 bg-[#02abb8] rounded-full flex items-center justify-center text-white shadow-xl shadow-[#02abb8]/30">
                        <span className="text-2xl font-black">100</span>
                      </div>
                    </div>
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-3 uppercase tracking-tight">On-Chain Transaction</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8 leading-relaxed">
                      {perspective === 'buyer' 
                        ? 'Your wallet signs the transaction for 100 KAS. The smart contract captures the value.' 
                        : 'Bob triggers the 100 KAS payment. The system checks his connection to You (Mark).'}
                    </p>
                    <div className="flex flex-col gap-2 w-full">
                       <div className="h-2 bg-zinc-100 dark:bg-zinc-900 rounded-full overflow-hidden">
                          <div className="h-full bg-[#02abb8] animate-[loading_2s_ease-in-out_infinite]" style={{ width: '40%' }} />
                       </div>
                       <p className="text-[10px] font-black text-zinc-400 uppercase tracking-widest">Awaiting Block Confirmation...</p>
                    </div>
                    <button onClick={handleNext} disabled={isProcessing} className="mt-10 k-cta-primary w-full py-4 text-sm tracking-[0.2em]">
                      {isProcessing ? 'PROCESSING...' : 'DISTRIBUTE VOLUME'}
                    </button>
                  </div>
                )}

                {step === 4 && (
                  <div className="animate-in scale-in-center duration-500 w-full max-w-2xl px-4">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">Native Split Logic</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-8 text-sm">
                      Smart contract splits the 100 {symbol} based on the {isActivated ? 'Live Referral Tree' : 'Genesis Default'} logic.
                    </p>
                    
                    <div className="space-y-2 mb-10">
                       <SimulationRow 
                          label={isActivated ? 'L1 Referrer (Mark - You)' : 'L1 Referrer (Genesis)'} 
                          value="2.00" 
                          pct="2%" 
                          color={isActivated ? 'text-emerald-500' : 'text-zinc-400'} 
                          highlight={perspective === 'referrer' && isActivated}
                          address={isActivated ? address : DEFAULT_REVENUE_WALLETS.LEVEL_1}
                        />
                       <SimulationRow 
                          label={isActivated ? 'L2 Referrer (Alex)' : 'L2 Referrer (Genesis)'} 
                          value="5.00" 
                          pct="5%" 
                          color={isActivated ? 'text-emerald-500' : 'text-zinc-400'} 
                          address={isActivated ? '0xAlexWalletNode' : DEFAULT_REVENUE_WALLETS.LEVEL_2}
                        />
                       <SimulationRow 
                          label={isActivated ? 'L3 Referrer (Dave)' : 'L3 Referrer (Genesis)'} 
                          value="10.00" 
                          pct="10%" 
                          color={isActivated ? 'text-zinc-500' : 'text-zinc-400'} 
                          address={isActivated ? '0xDaveWalletNode' : DEFAULT_REVENUE_WALLETS.LEVEL_3}
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
                          highlight={perspective === 'buyer'}
                          address={DEFAULT_REVENUE_WALLETS.PLATFORM}
                        />
                    </div>

                    <div className="bg-zinc-50 dark:bg-zinc-900 rounded-2xl p-6 border border-zinc-200 dark:border-zinc-800 text-left">
                       <div className="flex items-center gap-2 mb-4">
                          <div className={`w-2 h-2 rounded-full ${isActivated ? 'bg-emerald-500' : 'bg-amber-500'}`} />
                          <h5 className="text-[10px] font-black uppercase text-zinc-500 tracking-widest">Tree Box Slot View</h5>
                       </div>
                       <div className="grid grid-cols-5 gap-3">
                          {[1, 2, 3, 4, 5].map((lv) => (
                             <div key={lv} className={`flex flex-col items-center p-3 rounded-xl border ${
                                lv === 1 && isActivated ? 'bg-emerald-500/10 border-emerald-500/40 border-2' : 'bg-white dark:bg-zinc-950 border-zinc-200 dark:border-zinc-800'
                             }`}>
                                <span className="text-[8px] font-black text-zinc-400 mb-2 uppercase">L{lv} Slot</span>
                                <div className={`w-10 h-10 rounded-full flex items-center justify-center text-xs font-black ${
                                  lv === 1 && isActivated ? 'bg-emerald-500 text-white shadow-lg' : 'bg-zinc-100 dark:bg-zinc-800 text-zinc-400'
                                }`}>
                                   {lv === 1 && isActivated ? 'M' : lv === 2 && isActivated ? 'A' : lv === 3 && isActivated ? 'D' : 'G'}
                                </div>
                                <span className="mt-2 text-[8px] font-bold text-zinc-500 truncate w-full text-center">
                                   {lv === 1 && isActivated ? 'Mark' : lv === 2 && isActivated ? 'Alex' : lv === 3 && isActivated ? 'Dave' : 'Genesis'}
                                </span>
                             </div>
                          ))}
                       </div>
                    </div>

                    <button onClick={handleNext} className="mt-12 k-cta-primary w-full py-4 text-sm tracking-[0.2em]">
                      SHOW FINAL BALANCES
                    </button>
                  </div>
                )}

                {step === 5 && (
                  <div className="animate-in fade-in duration-700 max-w-xl w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
                       <ResultCard 
                          title="Buyer Result" 
                          main={`${symbol} -100.00`} 
                          desc="Access Granted to Kasparex Studio Premium" 
                          active={perspective === 'buyer'}
                        />
                       <ResultCard 
                          title={perspective === 'referrer' ? 'Referrer (You)' : 'Referrer (Mark)'} 
                          main={`${symbol} ${isActivated ? '+2.00' : '0.00'}`} 
                          desc={isActivated ? 'Native L1 commission received instantly' : 'Commission went to Genesis because of inactivity'} 
                          active={perspective === 'referrer'}
                        />
                    </div>
                    
                    <div className={`${isActivated ? 'bg-emerald-500/10 border-emerald-500/20' : 'bg-amber-500/10 border-amber-500/20'} border p-6 rounded-2xl mb-12 text-left`}>
                       <div className="flex items-start gap-4">
                          <div className={`w-10 h-10 rounded-xl ${isActivated ? 'bg-emerald-500' : 'bg-amber-500'} text-white flex items-center justify-center shrink-0`}>
                             {isActivated ? '✓' : '!'}
                          </div>
                          <div>
                             <h4 className={`font-black text-sm uppercase mb-1 ${isActivated ? 'text-zinc-900 dark:text-white' : 'text-amber-600'}`}>
                                {isActivated ? 'Success' : 'Genesis Coverage'}
                             </h4>
                             <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                {isActivated 
                                  ? 'The simulation is complete. Funds were sent directly to the wallets, including Your commission.' 
                                  : 'The simulation shows that without an active tree, the platform remains stable by sending volume to Genesis wallets.'}
                             </p>
                          </div>
                       </div>
                    </div>

                    <div className="flex gap-4">
                      <button onClick={handleReset} className="flex-1 k-cta-secondary py-4 text-xs font-black uppercase tracking-widest">
                        RESTART DEMO
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
                 <span>Perspective: {perspective}</span>
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
      highlight ? 'bg-emerald-500/10 border-emerald-500 ring-1 ring-emerald-500/50' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
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

function ResultCard({ title, main, desc, active }: { title: string, main: string, desc: string, active?: boolean }) {
  return (
    <div className={`p-6 rounded-2xl border-2 transition-all ${
      active ? 'border-[#02abb8] bg-[#02abb8]/5' : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 opacity-60'
    }`}>
      <h5 className="text-[10px] font-black text-zinc-400 uppercase tracking-[0.2em] mb-4">{title}</h5>
      <p className={`text-2xl font-black mb-2 ${active ? 'text-[#02abb8]' : 'text-zinc-600 dark:text-zinc-400'}`}>{main}</p>
      <p className="text-[11px] font-bold text-zinc-500 leading-tight">{desc}</p>
    </div>
  );
}
