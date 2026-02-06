'use client';

import { Header } from '@/components/Header';
import { Footer } from '@/components/Footer';
import { MagazineEditor } from '@/components/magazines/editor/MagazineEditor';
import Link from 'next/link';

export default function MagazineEditorPage() {
    return (
        <div className="flex flex-col min-h-screen bg-zinc-50 dark:bg-zinc-950">
            <Header />

            <main className="flex-1 max-w-7xl mx-auto w-full p-4 sm:p-6 lg:p-12">
                <nav className="flex items-center gap-2 text-sm text-zinc-500 mb-8 font-medium">
                    <Link href="/magazines" className="hover:text-cyan-500 transition-colors">Magazines</Link>
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="text-zinc-900 dark:text-zinc-100">Issue Editor</span>
                </nav>

                <div className="mb-12">
                    <h1 className="text-4xl font-black text-zinc-900 dark:text-zinc-100 mb-4">
                        Collaborative <span className="text-cyan-500">Editor</span>
                    </h1>
                    <p className="text-zinc-600 dark:text-zinc-400 max-w-2xl">
                        Create modular, high-quality magazine issues with your team. Every block of content is tracked, and revenue shares are calculated automatically for on-chain distribution.
                    </p>
                </div>

                <MagazineEditor />

                <div className="mt-12 bg-white dark:bg-zinc-900 p-8 rounded-3xl border border-zinc-200 dark:border-zinc-800">
                    <h2 className="text-xl font-bold text-zinc-900 dark:text-zinc-100 mb-4">Editor Features</h2>
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
                        <div className="space-y-2">
                            <h3 className="text-sm font-black text-cyan-500 uppercase tracking-widest">Modular Design</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">Blocks can be reordered, reused, and styled independently. Perfect for rich editorial layouts.</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-black text-emerald-500 uppercase tracking-widest">Revenue Sharing</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">Built-in contributor tracking ensures transparent sales distribution for all creators.</p>
                        </div>
                        <div className="space-y-2">
                            <h3 className="text-sm font-black text-purple-500 uppercase tracking-widest">Cross-Ecosystem</h3>
                            <p className="text-xs text-zinc-500 leading-relaxed">Embed this editor directly into vBlog or other community tools for a unified publishing experience.</p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
