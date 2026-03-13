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

  const steps = [
    { title: 'Selection', desc: 'Choose a service to purchase' },
    { title: 'Payment', desc: 'Trigger a native KAS transaction' },
    { title: 'Distribution', desc: 'Observe the smart contract splitting the volume' },
    { title: 'Confirmation', desc: 'Review the final results for all participants' },
  ];

  const handleNext = () => {
    if (step < 4) {
      setIsProcessing(true);
      setTimeout(() => {
        setStep(step + 1);
        setIsProcessing(false);
      }, 800);
    }
  };

  const handleReset = () => {
    setStep(1);
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
              <div className="flex items-center justify-between p-6 border-b border-zinc-100 dark:border-zinc-900 bg-zinc-50/50 dark:bg-zinc-900/50">
                {steps.map((s, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-xs ${
                      step > i + 1 
                        ? 'bg-emerald-500 text-white' 
                        : step === i + 1 
                          ? 'bg-[#02abb8] text-white animate-pulse' 
                          : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500'
                    }`}>
                      {step > i + 1 ? '✓' : i + 1}
                    </div>
                    <div className="hidden sm:block">
                      <p className={`text-[10px] font-black uppercase tracking-wider ${
                        step === i + 1 ? 'text-[#02abb8]' : 'text-zinc-400'
                      }`}>{s.title}</p>
                    </div>
                    {i < steps.length - 1 && (
                      <div className="hidden md:block w-12 h-px bg-zinc-200 dark:border-zinc-800 ml-4" />
                    )}
                  </div>
                ))}
              </div>

              {/* Simulation Stage */}
              <div className="p-8 min-h-[400px] flex flex-col items-center justify-center text-center">
                
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
                      {perspective === 'buyer' ? 'PROCEED TO PAYMENT' : 'WATCH BOB PAY'}
                    </button>
                  </div>
                )}

                {step === 2 && (
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
                        : 'Bob triggers the 100 KAS payment. You are his direct L1 referrer, meaning you are next in the split logic.'}
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

                {step === 3 && (
                  <div className="animate-in scale-in-center duration-500 w-full max-w-2xl px-4">
                    <h2 className="text-2xl font-black text-zinc-900 dark:text-white mb-4 uppercase tracking-tight">Native Split Logic</h2>
                    <p className="text-zinc-600 dark:text-zinc-400 mb-10 text-sm">
                      Smart contract splits the 100 {symbol} into 7 native components.
                    </p>
                    
                    <div className="space-y-3">
                       <SimulationRow label="L1 Referrer (You)" value="2.00" pct="2%" color="text-purple-500" highlight={perspective === 'referrer'} />
                       <SimulationRow label="L2 Referrer (Alice)" value="5.00" pct="5%" color="text-emerald-500" />
                       <SimulationRow label="L3 Referrer (Dave)" value="10.00" pct="10%" color="text-zinc-500" />
                       <SimulationRow label="L4 Referrer (Genesis)" value="20.00" pct="20%" color="text-zinc-400" />
                       <SimulationRow label="L5 Referrer (Genesis)" value="45.00" pct="45%" color="text-zinc-300" />
                       <SimulationRow label="Platform Infrastructure" value="18.00" pct="18%" color="text-[#02abb8]" highlight={perspective === 'buyer'} />
                    </div>

                    <button onClick={handleNext} className="mt-12 k-cta-primary w-full py-4 text-sm tracking-[0.2em]">
                      SHOW FINAL BALANCES
                    </button>
                  </div>
                )}

                {step === 4 && (
                  <div className="animate-in fade-in duration-700 max-w-xl w-full">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-10 text-left">
                       <ResultCard 
                          title="Buyer Result" 
                          main={`${symbol} -100.00`} 
                          desc="Access Granted to Kasparex Studio Premium" 
                          active={perspective === 'buyer'}
                        />
                       <ResultCard 
                          title="Referrer (You)" 
                          main={`${symbol} +2.00`} 
                          desc="Native L1 commission received instantly" 
                          active={perspective === 'referrer'}
                        />
                    </div>
                    
                    <div className="bg-emerald-500/10 border border-emerald-500/20 p-6 rounded-2xl mb-12 text-left">
                       <div className="flex items-start gap-4">
                          <div className="w-10 h-10 rounded-xl bg-emerald-500 text-white flex items-center justify-center shrink-0">✓</div>
                          <div>
                             <h4 className="text-zinc-900 dark:text-white font-black text-sm uppercase mb-1">Success</h4>
                             <p className="text-xs text-zinc-600 dark:text-zinc-400 leading-relaxed font-medium">
                                The simulation is complete. On a real network, these funds are sent directly to the wallets, verifiable on the blockchain explorer.
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
                 <span>Step {step} of 4</span>
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

function SimulationRow({ label, value, pct, color, highlight }: { label: string, value: string, pct: string, color: string, highlight?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl border transition-all ${
      highlight ? 'bg-[#02abb8]/10 border-[#02abb8] ring-1 ring-[#02abb8]/50' : 'bg-zinc-50 dark:bg-zinc-900 border-zinc-100 dark:border-zinc-800'
    }`}>
      <div className="flex items-center gap-3">
        <span className={`text-[10px] font-black uppercase ${color}`}>{pct}</span>
        <span className="text-xs font-bold text-zinc-900 dark:text-zinc-200">{label}</span>
      </div>
      <span className="text-sm font-black text-zinc-900 dark:text-white">{value} KAS</span>
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
