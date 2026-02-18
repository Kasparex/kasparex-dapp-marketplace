'use client';

import { useState, useEffect } from 'react';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTree } from '@/components/revenue-tree/RevenueTree';
import { generateMockRevenueTree } from '@/lib/revenue-tree/mockData';
import { RevenueTreeData, RevenueTreeLevel, REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';
import { useAccount, useChainId } from 'wagmi';

type QuickStats = {
  referrals: number;
  averageKasPerReferral: number;
  totalKasVolume: number;
  estimatedMonthlyRevenue: number;
  estimatedYearlyRevenue: number;
};

const REQUIRED_ACTIVATION_KAS = 100;

function rotateLevelsForActivation(tree: RevenueTreeData, userWalletAddress: string): RevenueTreeData {
  // Sort existing levels ascending (1 → 5)
  const sorted = [...tree.levels].sort((a, b) => a.level - b.level);
  const previousWallets = sorted.map((l) => l.walletAddress);

  const shareForLevel: Record<number, number> = {
    1: REVENUE_SHARE_PERCENTAGES.LEVEL_01,
    2: REVENUE_SHARE_PERCENTAGES.LEVEL_02,
    3: REVENUE_SHARE_PERCENTAGES.LEVEL_03,
    4: REVENUE_SHARE_PERCENTAGES.LEVEL_04,
    5: REVENUE_SHARE_PERCENTAGES.LEVEL_05,
  };

  const newLevels: RevenueTreeLevel[] = [];

  // Level 1: current user
  newLevels.push({
    level: 1,
    walletAddress: userWalletAddress,
    userCount: 0,
    sharePercentage: shareForLevel[1],
  });

  // Levels 2–5: shift existing wallets up by one level (drop old level 5)
  for (let level = 2; level <= 5; level++) {
    const prevIndex = level - 2; // new L2 gets old L1, etc.
    const prevWallet = previousWallets[prevIndex] ?? previousWallets[previousWallets.length - 1];
    newLevels.push({
      level,
      walletAddress: prevWallet,
      userCount: 0,
      sharePercentage: shareForLevel[level],
    });
  }

  return {
    ...tree,
    levels: newLevels,
    isActive: true,
    userWalletAddress,
    activatedAt: new Date().toISOString(),
  };
}

function simulateQuickStats(tree: RevenueTreeData): QuickStats {
  const baseReferrals = tree.revenueTreesCount > 0 ? tree.revenueTreesCount : 5;
  const referrals = baseReferrals + Math.floor(Math.random() * 6); // +0–5
  const averageKasPerReferral = 100 * (0.5 + Math.random()); // 50–150 KAS
  const totalKasVolume = referrals * averageKasPerReferral;

  const userLevel = tree.levels.find((l) => l.level === 1);
  const userShare = userLevel ? userLevel.sharePercentage : REVENUE_SHARE_PERCENTAGES.LEVEL_01;

  // Assume 6–12 full revenue cycles per year
  const cyclesPerYear = 6 + Math.random() * 6;
  const estimatedYearlyRevenue = (totalKasVolume * (userShare / 100)) * cyclesPerYear;
  const estimatedMonthlyRevenue = estimatedYearlyRevenue / 12;

  return {
    referrals,
    averageKasPerReferral,
    totalKasVolume,
    estimatedMonthlyRevenue,
    estimatedYearlyRevenue,
  };
}

export default function RevenueTreeDemoPage() {
  const { address: userWalletAddress } = useAccount();
  const chainId = useChainId();
  const [currentStep, setCurrentStep] = useState(1);
  const [demoTree, setDemoTree] = useState<RevenueTreeData | null>(null);
  const [activationAmount, setActivationAmount] = useState(0);
  const [quickStats, setQuickStats] = useState<QuickStats | null>(null);
  const [testReferralAddress, setTestReferralAddress] = useState('');

  // Initialize demo tree
  useEffect(() => {
    if (userWalletAddress && !demoTree && currentStep === 1) {
      const initialTree = generateMockRevenueTree('demo-payment', 'demo-payment', userWalletAddress, chainId, false);
      setDemoTree(initialTree);
      setQuickStats(simulateQuickStats(initialTree));
    }
  }, [userWalletAddress, currentStep, demoTree, chainId]);

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
      // Simulate payment to reach 100 KAS and rotate the tree
      if (userWalletAddress && demoTree) {
        const rotated = rotateLevelsForActivation(demoTree, userWalletAddress);
        setDemoTree(rotated);
        setActivationAmount(REQUIRED_ACTIVATION_KAS);
        setQuickStats(simulateQuickStats(rotated));
      }
      setCurrentStep(2);
    } else if (stepNumber === 2) {
      // Copy link (activated referral link)
      if (demoTree) {
        navigator.clipboard.writeText(demoTree.referralLink);
        setCurrentStep(3);
      }
    } else if (stepNumber === 3) {
      // Simulate referral using a (possibly) custom referral address
      if (demoTree) {
        const baseUrl = typeof window !== 'undefined' ? window.location.origin : '';
        const refAddress = (testReferralAddress || userWalletAddress || '').trim();
        const newReferralLink = refAddress
          ? `${baseUrl}/dapps/${demoTree.dappSlug}?ref=${refAddress}`
          : demoTree.referralLink;
        const updated = { ...demoTree, referralLink: newReferralLink };
        setDemoTree(updated);
        setQuickStats(simulateQuickStats(updated));
      }
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

            {/* Revenue Tree Visualization + Quick Stats */}
            <div className="lg:sticky lg:top-8 h-fit space-y-4">
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6">
                <h3 className="text-lg font-black text-zinc-900 dark:text-zinc-100 mb-4">
                  Your Revenue Tree
                </h3>

                {/* Activation Progress (Demo-controlled) */}
                {userWalletAddress && (
                  <div className="mb-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-xs font-bold text-zinc-700 dark:text-zinc-300 uppercase tracking-wider">
                        Activation Progress
                      </span>
                      <span className="text-xs font-bold text-zinc-600 dark:text-zinc-400">
                        {activationAmount.toFixed(2)} / {REQUIRED_ACTIVATION_KAS} KAS
                      </span>
                    </div>
                    <div className="w-full bg-zinc-200 dark:bg-zinc-700 rounded-full h-2.5 overflow-hidden">
                      <div
                        className="bg-gradient-to-r from-[#02abb8] to-emerald-500 h-full transition-all duration-500 rounded-full"
                        style={{ width: `${Math.min((activationAmount / REQUIRED_ACTIVATION_KAS) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                )}

                {demoTree && userWalletAddress ? (
                  <RevenueTree
                    data={demoTree}
                    userWalletAddress={userWalletAddress}
                    activationAmount={activationAmount}
                  />
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

              {/* Quick Stats + Test Referral Link */}
              <div className="bg-white dark:bg-zinc-900 rounded-xl border border-zinc-200 dark:border-zinc-800 p-6 space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 dark:text-zinc-100 uppercase tracking-widest mb-1">
                  Quick Stats
                </h3>
                {quickStats ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Estimated Monthly Revenue</div>
                      <div className="text-lg font-black text-[#02abb8]">
                        {quickStats.estimatedMonthlyRevenue.toFixed(2)} KAS
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Estimated Yearly Revenue</div>
                      <div className="text-lg font-black text-emerald-500">
                        {quickStats.estimatedYearlyRevenue.toFixed(2)} KAS
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Active Referrals</div>
                      <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {quickStats.referrals}
                      </div>
                    </div>
                    <div>
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Avg. KAS per Referral</div>
                      <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {quickStats.averageKasPerReferral.toFixed(2)} KAS
                      </div>
                    </div>
                    <div className="sm:col-span-2">
                      <div className="text-xs text-zinc-500 dark:text-zinc-400 mb-1">Total Volume (All Levels)</div>
                      <div className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                        {quickStats.totalKasVolume.toFixed(2)} KAS
                      </div>
                    </div>
                  </div>
                ) : (
                  <p className="text-sm text-zinc-500 dark:text-zinc-400">
                    Connect your wallet and start the demo to see potential revenue estimates.
                  </p>
                )}

                {/* Test Referral Link Input */}
                <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 space-y-2">
                  <label className="block text-xs font-semibold text-zinc-600 dark:text-zinc-300 uppercase tracking-wider">
                    Test Referral Address
                  </label>
                  <input
                    type="text"
                    value={testReferralAddress}
                    onChange={(e) => setTestReferralAddress(e.target.value)}
                    placeholder="0x... (optional – simulate different referral links)"
                    className="w-full px-3 py-2 text-xs rounded-lg border border-zinc-200 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-[#02abb8]"
                  />
                  <p className="text-[11px] text-zinc-500 dark:text-zinc-400">
                    Use this to simulate your referral link rotating through different wallets as the tree grows.
                  </p>
                </div>
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
