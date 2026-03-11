'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { RevenueTreeSidebar } from '@/components/revenue-tree/RevenueTreeSidebar';
import { REVENUE_SHARE_PERCENTAGES } from '@/lib/revenue-tree/types';
import { useAccount, useChainId } from 'wagmi';
import { getNativeCurrencySymbol } from '@/lib/wagmi';

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

  // Demo Interactive State
  const [averageSpend, setAverageSpend] = useState<string>('100');
  const [levelUsers, setLevelUsers] = useState<number[]>([5, 25, 125, 625, 3125]);
  const [activeModal, setActiveModal] = useState<string | null>(null);

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
      
      {/* Container with Sidebar Layout */}
      <div className="flex-1 flex flex-col lg:flex-row max-w-[1600px] w-full mx-auto">
        
        {/* Sidebar */}
        <div className="hidden lg:block flex-shrink-0 w-72 pt-8 pl-4">
          <div className="sticky top-24">
            <RevenueTreeSidebar
              totalRevenue={0}
              activeTrees={0}
              totalDownline={0}
            />
          </div>
        </div>

        {/* Mobile sidebar placeholder (handled inside UnifiedSidebar usually, but rendered directly here for now) */}
        <div className="lg:hidden p-4 border-b border-zinc-200 dark:border-zinc-800">
           <RevenueTreeSidebar
              totalRevenue={0}
              activeTrees={0}
              totalDownline={0}
            />
        </div>

        <main className="flex-1 p-4 sm:p-6 lg:px-12 lg:py-12 min-w-0">
          <div className="max-w-5xl mx-auto">
            {/* Header */}
            <div className="mb-8">
              <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-3">
                Interactive Revenue Tree Demo
              </h1>
              <p className="text-lg text-zinc-600 dark:text-zinc-400">
                Simulate your earning potential by experimenting with referral metrics and visualizing the 5-layer system.
              </p>
            </div>

            <div className="space-y-8">

              {/* Your Revenue Tree Box (Replaced with Interactive Simulator) */}
              <div className="rounded-xl border border-[#02abb8]/30 dark:border-[#02abb8]/20 bg-white dark:bg-zinc-900 shadow-sm overflow-hidden relative">

                  {/* Modals */}
                  <InfoModal
                      isOpen={activeModal === 'level'}
                      onClose={() => setActiveModal(null)}
                      title="Level"
                      content="The level of separation between you and the referred user. Level 1 means you directly referred them. Level 2 means your Level 1 referral invited them, and so on."
                  />
                  <InfoModal
                      isOpen={activeModal === 'share'}
                      onClose={() => setActiveModal(null)}
                      title="Share %"
                      content="The precise percentage of the transaction volume that you receive as a direct payout when users on this level spend inside a qualified dApp."
                  />
                  <InfoModal
                      isOpen={activeModal === 'requirements'}
                      onClose={() => setActiveModal(null)}
                      title="Level Requirements"
                      content="The maintenance criteria required to earn from this specific level every rolling 30 days. You can achieve this by either spending the required KAS amount, OR holding 10,000,000 KREX to receive a 90% discount on the required KAS volume."
                  />
                  <InfoModal
                      isOpen={activeModal === 'earningsPer'}
                      onClose={() => setActiveModal(null)}
                      title="Earnings per User"
                      content="The estimated amount you earn from a single user on this specific level, assuming they spend the 'Avg Spend' amount."
                  />
                  <InfoModal
                      isOpen={activeModal === 'referred'}
                      onClose={() => setActiveModal(null)}
                      title="Referred Users"
                      content="Adjust the total number of active users residing at this depth in your referral network to simulate network growth."
                  />
                  <InfoModal
                      isOpen={activeModal === 'potential'}
                      onClose={() => setActiveModal(null)}
                      title="Potential Earnings"
                      content="The total cumulative earnings generated by all users on this specific level (Earnings per User multiplied by Referred Users)."
                  />

                  <div className="p-4 sm:p-6 border-b border-zinc-200 dark:border-zinc-700 bg-gradient-to-r from-[#02abb8]/5 to-transparent">
                      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                          <div>
                              <h2 className="text-xl font-bold text-zinc-900 dark:text-white flex items-center gap-2">
                                  Your Demo Revenue Tree
                              </h2>
                              <p className="text-xs sm:text-sm text-zinc-600 dark:text-zinc-400 mt-1 max-w-lg">
                                  Change the average spend and active user metrics vertically across the 5 levels to see real-time updates of how Kasparex distributes revenue natively.
                              </p>
                          </div>

                          <div className="flex items-center gap-2 shrink-0">
                              <label htmlFor="simulateAmount" className="text-sm font-semibold text-zinc-700 dark:text-zinc-300">
                                  Avg User Spend:
                              </label>
                              <div className="relative">
                                  <input
                                      id="simulateAmount"
                                      type="number"
                                      min="0"
                                      step="1"
                                      value={averageSpend}
                                      onChange={(e) => setAverageSpend(e.target.value)}
                                      className="w-24 sm:w-32 rounded-lg border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 py-2 text-sm text-zinc-900 dark:text-white font-mono focus:border-[#02abb8] focus:ring-1 focus:ring-[#02abb8] outline-none transition-all"
                                  />
                                  <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                                      <span className="text-zinc-500 dark:text-zinc-400 text-sm font-semibold">{symbol}</span>
                                  </div>
                              </div>
                          </div>
                      </div>
                  </div>

                  <div className="p-4 sm:p-6 bg-zinc-50/50 dark:bg-zinc-900/50 overflow-x-auto">
                      <table className="w-full text-left min-w-[700px]">
                          <thead>
                              <tr className="border-b border-zinc-200 dark:border-zinc-700 text-sm text-zinc-500 dark:text-zinc-400">
                                  <th className="pb-3 font-medium">
                                      <div className="flex items-center">
                                          Level <InfoIcon onClick={() => setActiveModal('level')} />
                                      </div>
                                  </th>
                                  <th className="pb-3 font-medium">
                                      <div className="flex items-center">
                                          Share % <InfoIcon onClick={() => setActiveModal('share')} />
                                      </div>
                                  </th>
                                  <th className="pb-3 font-medium">
                                      <div className="flex items-center">
                                          Requirements <InfoIcon onClick={() => setActiveModal('requirements')} />
                                      </div>
                                  </th>
                                  <th className="pb-3 font-medium">
                                      <div className="flex items-center">
                                          Earnings per User <InfoIcon onClick={() => setActiveModal('earningsPer')} />
                                      </div>
                                  </th>
                                  <th className="pb-3 font-medium w-36">
                                      <div className="flex items-center">
                                          Referred Users <InfoIcon onClick={() => setActiveModal('referred')} />
                                      </div>
                                  </th>
                                  <th className="pb-3 font-medium text-right">
                                      <div className="flex items-center justify-end">
                                          Potential Earnings <InfoIcon onClick={() => setActiveModal('potential')} />
                                      </div>
                                  </th>
                              </tr>
                          </thead>
                          <tbody className="divide-y divide-zinc-200 dark:divide-zinc-800">
                              {LEVEL_SHARES.map((pct, idx) => {
                                  const level = idx + 1;
                                  const users = levelUsers[idx];
                                  const perUser = (spendAmount * pct) / 100;
                                  const levelEarnings = perUser * users;
                                  const requirementsTxt = LEVEL_REQUIREMENTS[idx];

                                  totalEarnings += levelEarnings;
                                  totalUsers += users;

                                  return (
                                      <tr key={level} className="text-sm hover:bg-[#02abb8]/5 dark:hover:bg-[#02abb8]/10 transition-colors">
                                          <td className="py-4 pl-2">
                                              <div className="flex items-center gap-2">
                                                  <div className="flex items-center justify-center w-8 h-8 rounded-full font-black text-xs bg-[#02abb8]/10 text-[#02abb8]">
                                                      L{level}
                                                  </div>
                                              </div>
                                          </td>
                                          <td className="py-4 font-semibold text-zinc-900 dark:text-zinc-100">{pct}%</td>
                                          <td className="py-4 text-xs font-medium text-zinc-600 dark:text-zinc-400">{requirementsTxt}</td>
                                          <td className="py-4 font-mono text-zinc-600 dark:text-zinc-400">
                                              {perUser.toLocaleString(undefined, { maximumFractionDigits: 4 })} {symbol}
                                          </td>
                                          <td className="py-4">
                                              <input
                                                  type="number"
                                                  min="0"
                                                  value={users || ''}
                                                  onChange={(e) => handleUserChange(idx, e.target.value)}
                                                  placeholder="0"
                                                  className="w-full rounded-md border border-zinc-300 dark:border-zinc-600 bg-white dark:bg-zinc-950 px-3 py-1.5 text-sm font-mono text-zinc-900 dark:text-white focus:border-[#02abb8] focus:ring-1 focus:ring-[#02abb8] outline-none"
                                              />
                                          </td>
                                          <td className="py-4 text-right pr-2">
                                              <div className="font-bold text-[#02abb8]">
                                                  +{levelEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
                                              </div>
                                          </td>
                                      </tr>
                                  );
                              })}
                          </tbody>
                          <tfoot>
                              <tr className="border-t-2 border-zinc-200 dark:border-zinc-700 bg-zinc-100/50 dark:bg-zinc-800/30">
                                  <td colSpan={4} className="py-4 pl-4 font-bold text-zinc-900 dark:text-white text-right pr-4">Total Network Simulation:</td>
                                  <td className="py-4 font-bold text-zinc-900 dark:text-white">
                                    <div className="flex items-center gap-2">
                                      <svg className="w-5 h-5 text-zinc-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5V4H2v16h5m10 0v-5a2 2 0 00-2-2h-6a2 2 0 00-2 2v5m10 0H7" />
                                      </svg>
                                      {totalUsers.toLocaleString()} Users
                                    </div>
                                  </td>
                                  <td className="py-4 text-right pr-4 font-black text-xl text-[#02abb8]">
                                      +{totalEarnings.toLocaleString(undefined, { maximumFractionDigits: 2 })} {symbol}
                                  </td>
                              </tr>
                          </tfoot>
                      </table>
                  </div>
              </div>

              {/* Steps or Guide */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-12">
                <div className="bg-gradient-to-br from-green-500/10 to-[#02abb8]/10 rounded-2xl border border-green-500/20 p-8 shadow-sm">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-4">
                    Activation & Eligibility
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm leading-relaxed">
                    To begin placing nodes into your network structurally and receiving your shares, you must initially trigger specific thresholds: spending natively inside compatible ecosystem dApps. Subsequent volume triggers maintenance criteria for deeper network levels. Using KREX tokens provides up to a 90% discount on volume requirements.
                  </p>
                  {userWalletAddress ? (
                    <Link href="/revenue-tree/dashboard">
                      <button className="px-5 py-2.5 bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 rounded-lg text-sm font-bold uppercase tracking-wide hover:opacity-90 transition-opacity">
                        Check Eligibility
                      </button>
                    </Link>
                  ) : (
                    <button disabled className="px-5 py-2.5 bg-zinc-200 dark:bg-zinc-800 text-zinc-500 dark:text-zinc-400 rounded-lg text-sm font-bold uppercase tracking-wide cursor-not-allowed">
                       Connect Wallet to Validate
                    </button>
                  )}
                </div>

                <div className="bg-white dark:bg-zinc-900 rounded-2xl border border-zinc-200 dark:border-zinc-800 p-8 shadow-sm">
                  <h3 className="text-xl font-black text-zinc-900 dark:text-zinc-100 mb-4">
                    Track Flow Graphically
                  </h3>
                  <p className="text-zinc-600 dark:text-zinc-400 mb-4 text-sm leading-relaxed">
                    You can inspect where your funds natively push up directly on-chain using the Tree Flow visualizer. Input any address or use demo wallets to view real-time graphical charts dictating structural positions, parent branches, Genesis integrations, and overall shares.
                  </p>
                  <Link href="/revenue-tree/flow">
                    <button className="px-5 py-2.5 bg-gradient-to-r from-[#02abb8] to-purple-500 hover:from-[#0299a6] hover:to-purple-600 text-white rounded-lg text-sm font-bold uppercase tracking-wide transition-all">
                      View Flow Visualizer
                    </button>
                  </Link>
                </div>
              </div>

            </div>
          </div>
        </main>
      </div>
      <Footer />
    </div>
  );
}

