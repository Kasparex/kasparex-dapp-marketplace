'use client';

import Link from 'next/link';
import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';

export default function PartnershipsPage() {
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
                            Partnerships
                        </h1>
                        <p className="text-xl text-zinc-600 dark:text-zinc-400 max-w-2xl mx-auto">
                            Collaborate with Kasparex Hub to grow the Kaspa ecosystem together. We&apos;re looking for innovative dApps, artists, and developers.
                        </p>
                    </div>

                    <div className="grid gap-8 mb-16">
                        <div className="p-8 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900/50 shadow-sm">
                            <h2 className="text-2xl font-bold text-zinc-900 dark:text-zinc-100 mb-6">Why Partner with Kasparex?</h2>
                            <div className="grid sm:grid-cols-2 gap-6">
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-[#02abb8]/10 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Ecosystem Growth</h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Leverage our platform to reach thousands of active Kaspa users.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-[#02abb8]/10 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Tokenization Support</h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Get expert help in launching your own dApp token on the Kaspa network.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-[#02abb8]/10 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l11 4-5 2zm0 0l5 5M7.188 2.239l.777 2.897M5.136 7.965l-2.898-.777M13.95 4.05l-2.122 2.122m-5.657 5.656l-2.12 2.122" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Cross-Promotion</h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Benefit from our marketing channels and shared loyalty programs.</p>
                                    </div>
                                </div>
                                <div className="flex gap-4">
                                    <div className="flex-shrink-0 w-10 h-10 bg-[#02abb8]/10 rounded-lg flex items-center justify-center">
                                        <svg className="w-5 h-5 text-[#02abb8]" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                                        </svg>
                                    </div>
                                    <div>
                                        <h3 className="font-bold text-zinc-900 dark:text-zinc-100 mb-1">Tech Integration</h3>
                                        <p className="text-sm text-zinc-600 dark:text-zinc-400">Access our robust API and infrastructure for seamless dApp deployment.</p>
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="bg-[#02abb8] rounded-2xl p-8 text-white shadow-xl shadow-[#02abb8]/20 text-center">
                            <h2 className="text-2xl font-bold mb-4">Ready to Build with Us?</h2>
                            <p className="mb-8 text-[#e0fbfc]">
                                Whether you&apos;re an established project or just starting out, we&apos;d love to hear from you. Let&apos;s discuss how we can work together.
                            </p>
                            <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
                                <a
                                    href="mailto:partnerships@kasparex.com"
                                    className="w-full sm:w-auto px-8 py-3 bg-white text-[#02abb8] font-bold rounded-xl hover:bg-zinc-50 transition-colors"
                                >
                                    Contact us via Email
                                </a>
                                <a
                                    href="https://t.me/KasparexHub"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                    className="w-full sm:w-auto px-8 py-3 bg-zinc-900/20 text-white font-bold rounded-xl border border-white/30 hover:bg-zinc-900/30 transition-colors"
                                >
                                    Message on Telegram
                                </a>
                            </div>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
