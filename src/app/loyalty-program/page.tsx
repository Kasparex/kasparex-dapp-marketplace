'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function LoyaltyProgramPage() {
    return (
        <div className="flex flex-col min-h-screen">
            <Header />

            <main className="flex-1 p-4 sm:p-6 lg:p-8">
                <div className="max-w-4xl mx-auto py-12">
                    <Link
                        href="/"
                        className="inline-flex items-center gap-2 mb-8 px-4 py-2 text-sm font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 rounded-lg transition-colors"
                    >
                        <svg
                            className="w-4 h-4"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                        >
                            <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth={2}
                                d="M10 19l-7-7m0 0l7-7m-7 7h18"
                            />
                        </svg>
                        Back to Home
                    </Link>

                    <div className="text-center mb-16">
                        <h1 className="text-4xl sm:text-5xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">
                            Loyalty Program
                        </h1>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Earn rewards for your participation in the Kasparex ecosystem. Every interaction brings you closer to exclusive perks.
                        </p>
                    </div>

                    <div className="grid md:grid-cols-3 gap-6 mb-16">
                        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-amber-100 dark:bg-amber-900/30 rounded-full flex items-center justify-center mb-4 text-amber-600 dark:text-amber-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">XP Points</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Earn Experience Points for every interaction with our verified dApps.</p>
                        </div>
                        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-full flex items-center justify-center mb-4 text-purple-600 dark:text-purple-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Rewards</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Redeem your XP for KREX tokens, exclusive NFTs, and other ecosystem perks.</p>
                        </div>
                        <div className="p-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 flex flex-col items-center text-center">
                            <div className="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center mb-4 text-blue-600 dark:text-blue-400">
                                <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A3.323 3.323 0 0010.65 15c-5.202 0-9.419 4.217-9.419 9.419 0 .244.198.441.442.441h18.654a.442.442 0 00.442-.441c0-5.202-4.217-9.419-9.419-9.419a3.323 3.323 0 00-1.74-5.618z" />
                                </svg>
                            </div>
                            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 mb-2">Ranking</h3>
                            <p className="text-sm text-zinc-600 dark:text-zinc-400">Climb the leaderboard to unlock higher reward tiers and multipliers.</p>
                        </div>
                    </div>

                    <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50 dark:bg-zinc-900">
                        <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">How it Works</h2>
                        <div className="space-y-6 text-zinc-600 dark:text-zinc-400">
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#02abb8] text-white flex items-center justify-center font-bold">1</span>
                                <div>
                                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Interact with dApps</h4>
                                    <p>Every time you use a dApp listed on Kasparex Hub, our system tracks the volume and frequency of your transactions.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#02abb8] text-white flex items-center justify-center font-bold">2</span>
                                <div>
                                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Earn Daily Points</h4>
                                    <p>Points are calculated daily based on your activity. Frequent users get streak bonuses and loyalty multipliers.</p>
                                </div>
                            </div>
                            <div className="flex gap-4">
                                <span className="flex-shrink-0 w-8 h-8 rounded-full bg-[#02abb8] text-white flex items-center justify-center font-bold">3</span>
                                <div>
                                    <h4 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Level Up</h4>
                                    <p>As you accumulate points, you level up your profile. Higher levels grant permanent fee discounts and better referral rates.</p>
                                </div>
                            </div>
                        </div>
                    </div>

                    <div className="mt-12 text-center">
                        <Link
                            href="/points"
                            className="inline-flex items-center justify-center px-8 py-4 bg-[#02abb8] text-white font-bold rounded-xl hover:bg-[#02abb8]/90 transition-all shadow-lg shadow-[#02abb8]/20 hover:scale-[1.02]"
                        >
                            View My Stats & Points
                        </Link>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
