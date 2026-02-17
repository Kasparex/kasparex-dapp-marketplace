'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateMockRevenueTree } from '@/lib/revenue-tree/mockData';
import { RevenueTreeData } from '@/lib/revenue-tree/types';
import { useAccount } from 'wagmi';

export default function RevenueTreeDemoPage() {
  const { address: userWalletAddress } = useAccount();
  const [currentStep, setCurrentStep] = useState(1);
  const [demoTree, setDemoTree] = useState<RevenueTreeData | null>(null);

  // Initialize demo tree
  useEffect(() => {
    if (userWalletAddress && !demoTree && currentStep === 1) {
      setDemoTree(generateMockRevenueTree('demo-payment', 'demo-payment', userWalletAddress, false));
    }
  }, [userWalletAddress, currentStep, demoTree]);

  const steps = [
    {
      number: 1,
      title: 'Activate Your Revenue Tree',
      description: 'Use a dApp or purchase content (minimum 100 KAS) to activate your Revenue Tree. This places you at Level 01.',
      action: 'Pay 100 KAS',
      completed: currentStep > 1,
    },
    {
      number: 2,
      title: 'Get Your Referral Link',
      description: 'Once activated, you receive a unique referral link. Copy and share this link with others.',
      action: 'Copy Link',
      completed: currentStep > 2,
    },
    {
      number: 3,
      title: 'Someone Uses Your Link',
      description: 'When someone uses your referral link and pays 100 KAS, revenue is automatically distributed. You move to Level 02 in their tree.',
      action: 'Simulate Referral',
      completed: currentStep > 3,
    },
    {
      number: 4,
      title: 'Tree Growth',
      description: 'Your tree grows both horizontally (many referrals) and vertically (5 levels deep). Track your earnings in the dashboard.',
      action: 'View Dashboard',
      completed: currentStep > 4,
    },
  ];

  const handleStepAction = (stepNumber: number) => {
    if (stepNumber === 1) {
      // Simulate payment
      if (userWalletAddress) {
        setDemoTree(generateMockRevenueTree('demo-payment', 'demo-payment', userWalletAddress, true));
      }
      setCurrentStep(2);
    } else if (stepNumber === 2) {
      // Copy link
      if (demoTree) {
        navigator.clipboard.writeText(demoTree.referralLink);
        setCurrentStep(3);
      }
    } else if (stepNumber === 3) {
      // Simulate referral
      setCurrentStep(4);
    } else if (stepNumber === 4) {
      // View dashboard
      window.location.href = '/revenue-tree/dashboard';
    }
  };

  return (
    <div className="flex flex-col min-h-screen">
      <Header />
      <main className="flex-1 p-4 sm:p-6 lg:px-16 lg:py-12">
        <div className="max-w-7xl mx-auto">
          {/* Header */}
          <div className="mb-8">
            <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-3">
              Revenue Tree Demo
            </h1>
            <p className="text-lg text-zinc-600 dark:text-zinc-400">
              Learn how the Revenue Tree System works with this interactive step-by-step demo
            </p>
          </div>

          {/* Demo Steps */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 mb-8">
            {/* Steps List */}
            <div className="space-y-4">
              {steps.map((step) => (
                <div
                  key={step.number}
                  className={`p-6 rounded-xl border-2 transition-all ${
                    currentStep === step.number
                      ? 'border-[#02abb8] bg-[#02abb8]/5 dark:bg-[#02abb8]/10'
                      : step.completed
                        ? 'border-green-500/50 bg-green-500/5 dark:bg-green-500/10'
                        : 'border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900'
                  }`}
                >
                  <div className="flex items-start gap-4">
                    <div
                      className={`flex-shrink-0 w-12 h-12 rounded-full flex items-center justify-center font-black text-lg ${
                        step.completed
                          ? 'bg-green-500 text-white'
                          : currentStep === step.number
                            ? 'bg-[#02abb8] text-white'
                            : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400'
                      }`}
                    >
                      {step.completed ? (
                        <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        step.number
                      )}
                    </div>
                    <div className="flex-1">
                      <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-2">
                        {step.title}
                      </h3>
                      <p className="text-sm text-zinc-600 dark:text-zinc-400 mb-4 leading-relaxed">
                        {step.description}
                      </p>
                      <button
                        onClick={() => handleStepAction(step.number)}
                        disabled={currentStep < step.number}
                        className={`px-4 py-2 rounded-lg font-bold text-sm uppercase tracking-wider transition-all ${
                          currentStep === step.number
                            ? 'bg-[#02abb8] hover:bg-[#0299a6] text-white'
                            : step.completed
                              ? 'bg-green-500/20 text-green-600 dark:text-green-400 cursor-default'
                              : 'bg-zinc-200 dark:bg-zinc-800 text-zinc-400 dark:text-zinc-500 cursor-not-allowed'
                        }`}
                      >
                        {step.action}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Revenue Tree Visualization */}
            <div className="lg:sticky lg:top-8 h-fit">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-6">
                  Your Revenue Tree
                </h3>
                {demoTree && userWalletAddress ? (
                  <RevenueTree data={demoTree} userWalletAddress={userWalletAddress} />
                ) : (
                  <div className="text-center py-12">
                    <div className="text-zinc-400 dark:text-zinc-600 mb-4">
                      <svg className="w-16 h-16 mx-auto" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <p className="text-zinc-500 dark:text-zinc-400 font-bold mb-2">
                      Connect your wallet to start
                    </p>
                    <p className="text-sm text-zinc-400 dark:text-zinc-500">
                      Follow the steps on the left to activate your Revenue Tree
                    </p>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Example dApp Demo */}
          <div className="mt-12 bg-gradient-to-br from-[#02abb8]/10 to-purple-500/10 rounded-2xl border border-[#02abb8]/20 p-8">
            <h2 className="text-2xl font-black text-zinc-900 dark:text-zinc-100 mb-4">
              Try It With a Demo dApp
            </h2>
            <p className="text-zinc-600 dark:text-zinc-400 mb-6">
              Experience the Revenue Tree system with our interactive demo dApp. Activate your tree, get your referral link, and see how revenue flows through the network.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="text-3xl font-black text-[#02abb8] mb-2">100 KAS</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Activation Fee</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="text-3xl font-black text-green-600 dark:text-green-400 mb-2">5 Levels</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Revenue Sharing</div>
              </div>
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <div className="text-3xl font-black text-purple-600 dark:text-purple-400 mb-2">Unlimited</div>
                <div className="text-sm text-zinc-600 dark:text-zinc-400">Referrals</div>
              </div>
            </div>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}
